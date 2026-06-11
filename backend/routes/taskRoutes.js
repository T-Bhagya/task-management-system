const router = require('express').Router()
const {
  getAllTasks, createTask, getTaskById,
  updateTask, deleteTask, getComments, addComment
} = require('../controllers/taskController')

router.get('/', getAllTasks)
router.post('/', createTask)
router.get('/:id', getTaskById)
router.put('/:id', updateTask)
router.delete('/:id', deleteTask)
router.get('/:id/comments', getComments)
router.post('/:id/comments', addComment)

module.exports = router