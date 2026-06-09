const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const protect = require('../middleware/authMiddleware'); // Your bouncer!

// Why: We put 'protect' right here in the middle. 
// Before Express lets anyone reach userController.getAllUsers, they MUST pass the JWT check.
router.get('/', protect, userController.getAllUsers);

module.exports = router;