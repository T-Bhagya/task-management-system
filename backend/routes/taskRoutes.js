const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getAllTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  getComments,
  addComment
} = require('../controllers/taskController');

// All task routes require a valid JWT token
router.get('/', verifyToken, getAllTasks);
router.post('/', verifyToken, createTask);
router.get('/:id', verifyToken, getTaskById);
router.put('/:id', verifyToken, updateTask);
router.delete('/:id', verifyToken, deleteTask);
router.get('/:id/comments', verifyToken, getComments);
router.post('/:id/comments', verifyToken, addComment);

module.exports = router;
