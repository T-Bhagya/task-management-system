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