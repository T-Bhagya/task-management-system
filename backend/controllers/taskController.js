const prisma = require('../prismaClient')

async function getAllTasks(req, res) {
  try {
    const { status, priority, assignedTo } = req.query
    const where = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    if (assignedTo) where.assigned_to = parseInt(assignedTo)
    const tasks = await prisma.task.findMany({
      where,
      include: { assignee: true, creator: true, comments: true }
    })
    res.json(tasks)
  } catch (err) {
    res.status(500).json({ message: 'Failed to get tasks', error: err.message })
  }
}

async function createTask(req, res) {
  try {
    const { title, description, assigned_to, due_date, priority } = req.body
    if (!title) return res.status(400).json({ message: 'Title is required' })
    const task = await prisma.task.create({
      data: {
        title,
        description,
        assigned_to: assigned_to ? parseInt(assigned_to) : null,
        due_date: due_date ? new Date(due_date) : null,
        priority: priority || 'MEDIUM',
        created_by: 1
      }
    })
    res.status(201).json(task)
  } catch (err) {
    res.status(500).json({ message: 'Failed to create task', error: err.message })
  }
}

async function getTaskById(req, res) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { assignee: true, creator: true, comments: { include: { user: true } } }
    })
    if (!task) return res.status(404).json({ message: 'Task not found' })
    res.json(task)
  } catch (err) {
    res.status(500).json({ message: 'Failed to get task', error: err.message })
  }
}

async function updateTask(req, res) {
  try {
    const { title, description, assigned_to, due_date, priority, status } = req.body
    const task = await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(assigned_to !== undefined && { assigned_to: parseInt(assigned_to) }),
        ...(due_date && { due_date: new Date(due_date) }),
        ...(priority && { priority }),
        ...(status && { status })
      }
    })
    res.json(task)
  } catch (err) {
    res.status(500).json({ message: 'Failed to update task', error: err.message })
  }
}

async function deleteTask(req, res) {
  try {
    const role = req.user.role
    if (role !== 'ADMIN' && role !== 'PROJECT_MANAGER') {
      return res.status(403).json({ message: 'Only Admins and Project Managers can delete tasks' })
    }
    await prisma.task.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Task deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete task', error: err.message })
  }
}

async function getComments(req, res) {
  try {
    const comments = await prisma.comment.findMany({
      where: { task_id: parseInt(req.params.id) },
      include: { user: true }
    })
    res.json(comments)
  } catch (err) {
    res.status(500).json({ message: 'Failed to get comments', error: err.message })
  }
}

async function addComment(req, res) {
  try {
    const { message } = req.body
    if (!message) return res.status(400).json({ message: 'Comment message is required' })
    const comment = await prisma.comment.create({
      data: {
        message,
        task_id: parseInt(req.params.id),
        user_id: req.user.userId
      },
      include: { user: true }
    })
    res.status(201).json(comment)
  } catch (err) {
    res.status(500).json({ message: 'Failed to add comment', error: err.message })
  }
}

module.exports = { getAllTasks, createTask, getTaskById, updateTask, deleteTask, getComments, addComment }