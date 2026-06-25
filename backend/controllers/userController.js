const prisma = require('../prismaClient');
const { sendTemporaryPasswordEmail } = require('../utils/emailService');

// Get all users in the current workspace
exports.getAllUsers = async (req, res, next) => {
    try {
        const currentWorkspaceId = req.user.role === 'ADMIN' ? req.user.id : req.user.admin_id;
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { id: currentWorkspaceId },
                    { admin_id: currentWorkspaceId }
                ]
            },
            select: { id: true, name: true, email: true, role: true, is_active: true }
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

        const { name, email, role } = req.body;
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

        const userRole = (role === 'PROJECT_MANAGER' || role === 'COLLABORATOR' || role === 'ADMIN') ? role : 'COLLABORATOR';
        const newAdminId = userRole === 'ADMIN' ? null : req.user.id;

        // Create the user
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password_hash: hashedPassword,
                role: userRole,
                must_reset_password: true,
                admin_id: newAdminId
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

        // Prevent deleting other ADMINs
        if (userToDelete.role === 'ADMIN') {
            return res.status(403).json({ message: "Administrator accounts cannot be deleted." });
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

// Toggle a user's active status
exports.toggleUserStatus = async (req, res, next) => {
    try {
        const targetId = parseInt(req.params.id);
        const { is_active } = req.body;
        
        if (isNaN(targetId)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }
        if (typeof is_active !== 'boolean') {
            return res.status(400).json({ message: "is_active status must be a boolean." });
        }
        
        const userToToggle = await prisma.user.findUnique({ where: { id: targetId } });
        if (!userToToggle) {
            return res.status(404).json({ message: "User not found." });
        }
        
        if (req.user.id === targetId) {
            return res.status(400).json({ message: "You cannot change your own status." });
        }
        
        if (req.user.role === 'PROJECT_MANAGER' && userToToggle.role !== 'COLLABORATOR') {
            return res.status(403).json({ message: "Project Managers can only toggle status of Collaborators." });
        }
        
        if (req.user.role !== 'ADMIN' && req.user.role !== 'PROJECT_MANAGER') {
            return res.status(403).json({ message: "Only Administrators and Project Managers can toggle user status." });
        }
        
        if (userToToggle.role === 'ADMIN') {
            return res.status(403).json({ message: "Administrator accounts cannot be deactivated." });
        }
        
        const updatedUser = await prisma.user.update({
            where: { id: targetId },
            data: { is_active: is_active }
        });
        
        res.status(200).json({
            message: `User status updated successfully.`,
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                is_active: updatedUser.is_active
            }
        });
    } catch (error) {
        next(error);
    }
};

// Update user role (Promote to PM or Admin)
exports.updateUserRole = async (req, res, next) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: "Only administrators can change user roles." });
        }

        const targetId = parseInt(req.params.id);
        const { role } = req.body;

        if (isNaN(targetId)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        if (!role || !['COLLABORATOR', 'PROJECT_MANAGER', 'ADMIN'].includes(role)) {
            return res.status(400).json({ message: "Invalid role specified." });
        }

        const userToUpdate = await prisma.user.findUnique({ where: { id: targetId } });
        if (!userToUpdate) {
            return res.status(404).json({ message: "User not found." });
        }

        // Only allow updating users within the admin's workspace, or self
        if (userToUpdate.admin_id !== req.user.id && userToUpdate.id !== req.user.id) {
            return res.status(403).json({ message: "User does not belong to your workspace." });
        }

        const updateData = { role: role };
        // If they become an ADMIN, their admin_id is set to null so they have their own workspace
        if (role === 'ADMIN') {
            updateData.admin_id = null;
        }

        const updatedUser = await prisma.user.update({
            where: { id: targetId },
            data: updateData
        });

        res.status(200).json({
            message: `User role updated to ${role} successfully.`,
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role
            }
        });
    } catch (error) {
        next(error);
    }
};

// Update the logged-in user's profile
exports.updateProfile = async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Name is required." });
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: { name: name },
            select: { id: true, name: true, email: true, role: true, created_at: true }
        });

        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser
        });
    } catch (error) {
        next(error);
    }
};