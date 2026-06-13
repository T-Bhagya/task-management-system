const express = require('express');
const router = express.Router();
// Why: Import the controller brain we just wrote
const authController = require('../controllers/authController');

// Why: Define the path. When a POST request hits "/login", hand it over to the controller logic.
router.post('/login', authController.login);
router.post('/register', authController.register);

// Why: Export this router so our main server.js file can use it.
module.exports = router;