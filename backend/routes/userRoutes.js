const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware'); // Import your bouncer

// Secure routes that require a valid JWT token
router.get('/', verifyToken, userController.getAllUsers);
router.get('/profile', verifyToken, userController.getProfile);
router.get('/notifications', verifyToken, userController.getNotifications);
router.put('/notifications/:id/read', verifyToken, userController.markNotificationAsRead);

module.exports = router;