const prisma = require('../prismaClient');
const { sendTemporaryPasswordEmail } = require('../utils/emailService');

// Get all users
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true } // Never send the password_hash!
        });
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
};

// Get the logged-in user's profile
exports.getProfile = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }, // Uses the ID verified by your bouncer!
            select: { id: true, name: true, email: true, role: true, created_at: true }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

// Get notifications for logged-in user
exports.getNotifications = async (req, res, next) => {
    try {
        // Forward/fetch from SQLite-based notification-service
        const response = await fetch(`http://localhost:3003/api/notifications/${req.user.id}`);
        if (!response.ok) {
            throw new Error(`Notification service returned HTTP ${response.status}`);
        }
        const result = await response.json();
        
        // Map SQLite fields (userId, read, createdAt) to PostgreSQL format (user_id, is_read, created_at) expected by the React frontend
        const mapped = result.data.map(n => ({
            id: n.id,
            user_id: parseInt(n.userId),
            title: n.title,
            message: n.message,
            type: n.type === 'task_assigned' ? 'ASSIGNMENT' : n.type === 'comment_added' ? 'COMMENT' : 'SYSTEM',
            is_read: n.read,
            created_at: n.createdAt
        }));
        
        res.status(200).json(mapped);
    } catch (error) {
        console.error('Failed to fetch from notification-service, falling back to local PG DB:', error.message);
        try {
            const notifications = await prisma.notification.findMany({
                where: { user_id: req.user.id },
                orderBy: { created_at: 'desc' }
            });
            res.status(200).json(notifications);
        } catch (dbError) {
            next(dbError);
        }
    }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res, next) => {
    try {
        const notificationId = req.params.id; // UUID string from SQLite or number from Postgres
        
        // Try calling notification-service first
        try {
            const response = await fetch(`http://localhost:3003/api/notifications/${notificationId}/read`, {
                method: 'PUT'
            });
            if (response.ok) {
                const result = await response.json();
                return res.status(200).json(result.data);
            }
        } catch (err) {
            console.error('Failed to mark read on notification-service:', err.message);
        }
        
        // Fallback/dual-write to PostgreSQL local DB
        const pgId = parseInt(notificationId);
        if (!isNaN(pgId)) {
            const updated = await prisma.notification.update({
                where: { id: pgId },
                data: { is_read: true }
            });
            return res.status(200).json(updated);
        }
        
        res.status(200).json({ success: true, message: "Read status synchronized." });
    } catch (error) {
        next(error);
    }
};

exports.createUser = async (req, res, next) => {
    try {
        const bcrypt = require('bcryptjs');
        
        // Authorization check: Only Admin can create users
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: "Only administrators can create team members." });
        }

        const { name, email } = req.body;
        if (!name || !email) {
            return res.status(400).json({ message: "Name and email are required." });
        }

        // Check if email already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ message: "Email is already registered." });
        }

        // Generate temporary password (e.g. Temp_XXXXXX)
        const tempPassword = 'Temp_' + Math.random().toString(36).substring(2, 10).toUpperCase();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);

        // Create the user
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password_hash: hashedPassword,
                role: 'COLLABORATOR',
                must_reset_password: true
            }
        });

        // Send welcome email (real or simulated)
        try {
            await sendTemporaryPasswordEmail(email, name, tempPassword);
        } catch (emailErr) {
            console.error('Failed to send welcome email:', emailErr.message);
        }

        res.status(201).json({
            message: "Collaborator created successfully!",
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            },
            tempPassword
        });
    } catch (error) {
        next(error);
    }
};

// Delete a collaborator (Admin only)
exports.deleteUser = async (req, res, next) => {
    try {
        // Authorization check: Only Admin can delete users
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: "Only administrators can delete team members." });
        }

        const targetId = parseInt(req.params.id);
        if (isNaN(targetId)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        // Prevent admin from deleting themselves
        if (targetId === req.user.id) {
            return res.status(400).json({ message: "You cannot delete your own account." });
        }

        // Find the user to delete
        const userToDelete = await prisma.user.findUnique({ where: { id: targetId } });
        if (!userToDelete) {
            return res.status(404).json({ message: "User not found." });
        }

        // Only allow deletion of COLLABORATORs
        if (userToDelete.role !== 'COLLABORATOR') {
            return res.status(403).json({ message: "Only collaborator accounts can be deleted." });
        }

        // Use a transaction to clear all foreign key relations before deleting
        await prisma.$transaction(async (tx) => {
            // 1. Delete this user's notifications
            await tx.notification.deleteMany({ where: { user_id: targetId } });

            // 2. Delete this user's comments
            await tx.comment.deleteMany({ where: { user_id: targetId } });

            // 3. Nullify tasks where this user is the assignee
            await tx.task.updateMany({
                where: { assigned_to: targetId },
                data: { assigned_to: null }
            });

            // 4. Nullify tasks where this user is the creator (reassign to admin)
            await tx.task.updateMany({
                where: { created_by: targetId },
                data: { created_by: req.user.id }
            });

            // 5. Now it is safe to delete the user
            await tx.user.delete({ where: { id: targetId } });
        });

        res.status(200).json({ message: `Collaborator "${userToDelete.name}" has been deleted successfully.` });
    } catch (error) {
        next(error);
    }
};