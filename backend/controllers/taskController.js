const prisma = require('../prismaClient');

// Get all tasks
async function getAllTasks(req, res) {
  try {
    const { status, priority, assignedTo } = req.query;
    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assigned_to = parseInt(assignedTo);

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true, role: true } },
        creator: { select: { id: true, name: true, email: true, role: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } }
          }
        }
      }
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get tasks', error: err.message });
  }
}

// Create a new task
async function createTask(req, res) {
  try {
    const { title, description, assigned_to, due_date, priority } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const realUserId = req.user.id; // from authMiddleware verifyToken
    const task = await prisma.task.create({
      data: {
        title,
        description,
        assigned_to: assigned_to ? parseInt(assigned_to) : null,
        due_date: due_date ? new Date(due_date) : null,
        priority: priority || 'MEDIUM',
        created_by: realUserId
      }
    });

    // Automatically create a notification for the assignee
    if (task.assigned_to && task.assigned_to !== realUserId) {
      await prisma.notification.create({
        data: {
          message: `New task assigned to you: "${task.title}"`,
          type: 'ASSIGNMENT',
          user_id: task.assigned_to
        }
      }).catch(err => console.error('Failed to create assignment notification:', err.message));
    }

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create task', error: err.message });
  }
}

// Get task by ID
async function getTaskById(req, res) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        assignee: { select: { id: true, name: true, email: true, role: true } },
        creator: { select: { id: true, name: true, email: true, role: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } }
          }
        }
      }
    });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get task', error: err.message });
  }
}

// Update a task
async function updateTask(req, res) {
  try {
    const { title, description, assigned_to, due_date, priority, status } = req.body;
    const taskId = parseInt(req.params.id);

    // Fetch current task state to compare assignee
    const currentTask = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!currentTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(assigned_to !== undefined && { assigned_to: assigned_to ? parseInt(assigned_to) : null }),
        ...(due_date && { due_date: new Date(due_date) }),
        ...(priority && { priority }),
        ...(status && { status })
      }
    });

    // If assignee changed, notify the new assignee
    if (assigned_to && parseInt(assigned_to) !== currentTask.assigned_to && parseInt(assigned_to) !== req.user.id) {
      await prisma.notification.create({
        data: {
          message: `Task assigned to you: "${task.title}"`,
          type: 'ASSIGNMENT',
          user_id: parseInt(assigned_to)
        }
      }).catch(err => console.error('Notification error:', err.message));
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update task', error: err.message });
  }
}

// Delete a task
async function deleteTask(req, res) {
  try {
    const role = req.user.role;
    if (role !== 'ADMIN' && role !== 'PROJECT_MANAGER') {
      return res.status(403).json({ message: 'Only Admins and Project Managers can delete tasks' });
    }
    await prisma.task.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Task deleted successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete task', error: err.message });
  }
}

// Get comments for a task
async function getComments(req, res) {
  try {
    const comments = await prisma.comment.findMany({
      where: { task_id: parseInt(req.params.id) },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      }
    });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get comments', error: err.message });
  }
}

// Add a comment to a task
async function addComment(req, res) {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Comment message is required' });

    const comment = await prisma.comment.create({
      data: {
        message,
        task_id: parseInt(req.params.id),
        user_id: req.user.id
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    // Create notifications for creator and assignee
    const task = await prisma.task.findUnique({ where: { id: comment.task_id } });
    if (task) {
      // Notify creator
      if (task.created_by !== req.user.id) {
        await prisma.notification.create({
          data: {
            message: `New comment on task "${task.title}": "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`,
            type: 'COMMENT',
            user_id: task.created_by
          }
        }).catch(err => console.error('Notification error:', err.message));
      }
      // Notify assignee
      if (task.assigned_to && task.assigned_to !== req.user.id && task.assigned_to !== task.created_by) {
        await prisma.notification.create({
          data: {
            message: `New comment on task "${task.title}": "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`,
            type: 'COMMENT',
            user_id: task.assigned_to
          }
        }).catch(err => console.error('Notification error:', err.message));
      }
    }

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add comment', error: err.message });
  }
}

module.exports = {
  getAllTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  getComments,
  addComment
};
