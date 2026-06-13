const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { verifyToken } = require('../middleware/authMiddleware');


router.post('/', verifyToken, taskController.createTask);
router.get('/', verifyToken, taskController.getTasks);
router.put('/:id', verifyToken, taskController.updateTask);
router.delete('/:id', verifyToken, taskController.deleteTask);

module.exports = router;