const prisma = require('../prismaClient');

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
        const notifications = await prisma.notification.findMany({
            where: { user_id: req.user.id },
            orderBy: { created_at: 'desc' }
        });
        res.status(200).json(notifications);
    } catch (error) {
        next(error);
    }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res, next) => {
    try {
        const notificationId = parseInt(req.params.id);
        const updated = await prisma.notification.update({
            where: { id: notificationId },
            data: { is_read: true }
        });
        res.status(200).json(updated);
    } catch (error) {
        next(error);
    }
};