const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware'); // Import your bouncer

// Secure routes that require a valid JWT token
router.get('/', verifyToken, userController.getAllUsers);
router.post('/', verifyToken, userController.createUser);
router.delete('/:id', verifyToken, userController.deleteUser);
router.put('/:id/status', verifyToken, userController.toggleUserStatus);
router.put('/:id/role', verifyToken, userController.updateUserRole);
router.get('/profile', verifyToken, userController.getProfile);
router.put('/profile', verifyToken, userController.updateProfile);
router.get('/notifications', verifyToken, userController.getNotifications);
router.put('/notifications/:id/read', verifyToken, userController.markNotificationAsRead);

module.exports = router;