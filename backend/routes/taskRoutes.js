<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { verifyToken } = require('../middleware/authMiddleware');


router.post('/', verifyToken, taskController.createTask);
router.get('/', verifyToken, taskController.getTasks);
router.put('/:id', verifyToken, taskController.updateTask);
router.delete('/:id', verifyToken, taskController.deleteTask);

module.exports = router;
=======
const router = require('express').Router()
const authMiddleware = require('../middleware/authMiddleware')
const {
  getAllTasks, createTask, getTaskById,
  updateTask, deleteTask, getComments, addComment
} = require('../controllers/taskController')

router.get('/', authMiddleware, getAllTasks)
router.post('/', authMiddleware, createTask)
router.get('/:id', authMiddleware, getTaskById)
router.put('/:id', authMiddleware, updateTask)
router.delete('/:id', authMiddleware, deleteTask)
router.get('/:id/comments', authMiddleware, getComments)
router.post('/:id/comments', authMiddleware, addComment)

module.exports = router
>>>>>>> origin/person3/database
