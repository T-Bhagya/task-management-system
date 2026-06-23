const prisma = require('../prismaClient');

// Helper to dual-write notifications to Postgres and SQLite real-time service
async function sendNotificationHelper(userId, title, message, type) {
  // 1. Write to local PostgreSQL DB (for safety / fallback)
  let pgNotif = null;
  try {
    pgNotif = await prisma.notification.create({
      data: {
        message,
        type: type === 'task_assigned' ? 'ASSIGNMENT' : type === 'comment_added' ? 'COMMENT' : 'SYSTEM',
        user_id: parseInt(userId)
      }
    });
  } catch (err) {
    console.error('Failed to create local Postgres notification:', err.message);
  }

  // 2. Relay via Socket.io notification-service
  try {
    await fetch('http://localhost:3003/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: String(userId),
        title,
        message,
        type
      })
    });
  } catch (err) {
    console.error('Failed to relay notification to real-time service:', err.message);
  }

  return pgNotif;
}

// Get all tasks
async function getAllTasks(req, res) {
  try {
    const { status, priority, assignedTo, projectId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assigned_to = parseInt(assignedTo);
    if (projectId) where.project_id = parseInt(projectId);

    // Enforce role-based scoping if no specific project is requested
    const role = req.user.role;
    const userId = req.user.id;

    if (role === 'PROJECT_MANAGER' && !projectId) {
      where.project = { manager_id: userId };
    } else if (role === 'COLLABORATOR' && !projectId) {
      where.OR = [
        { assigned_to: userId },
        { project: { members: { some: { user_id: userId } } } }
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true, role: true } },
        creator: { select: { id: true, name: true, email: true, role: true } },
        project: { select: { id: true, name: true, manager_id: true } },
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
    const { title, description, assigned_to, due_date, priority, project_id } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });
    if (!project_id) return res.status(400).json({ message: 'Project ID is required' });

    const role = req.user.role;
    const userId = req.user.id;

    if (role === 'COLLABORATOR') {
      return res.status(403).json({ message: 'Only Admins and Project Managers can create tasks' });
    }

    const projectId = parseInt(project_id);
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (role === 'PROJECT_MANAGER' && project.manager_id !== userId) {
      return res.status(403).json({ message: 'Access denied. You do not manage this project.' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        assigned_to: assigned_to ? parseInt(assigned_to) : null,
        due_date: due_date ? new Date(due_date) : null,
        priority: priority || 'MEDIUM',
        created_by: userId,
        project_id: projectId
      }
    });

    // Automatically create a notification for the assignee
    if (task.assigned_to && task.assigned_to !== userId) {
      await sendNotificationHelper(
        task.assigned_to, 
        'New Task Assigned', 
        `New task assigned to you: "${task.title}"`, 
        'task_assigned'
      );
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
        project: {
          include: {
            members: true
          }
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } }
          }
        }
      }
    });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const role = req.user.role;
    const userId = req.user.id;

    if (role === 'PROJECT_MANAGER' && task.project && task.project.manager_id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    } else if (role === 'COLLABORATOR') {
      const isMember = task.project && task.project.members.some(m => m.user_id === userId);
      if (!isMember && task.assigned_to !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get task', error: err.message });
  }
}

// Update a task
async function updateTask(req, res) {
  try {
    const { title, description, assigned_to, due_date, priority, status, project_id } = req.body;
    const taskId = parseInt(req.params.id);
    const role = req.user.role;
    const userId = req.user.id;

    // Fetch current task state to compare assignee and check project management
    const currentTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!currentTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (role === 'COLLABORATOR') {
      // Collaborators can only update status
      if (title || description || assigned_to || due_date || priority || project_id) {
        return res.status(403).json({ message: 'Collaborators can only update task status' });
      }
      if (currentTask.assigned_to !== userId) {
        return res.status(403).json({ message: 'You can only update status of tasks assigned to you' });
      }
    } else if (role === 'PROJECT_MANAGER') {
      if (currentTask.project && currentTask.project.manager_id !== userId) {
        return res.status(403).json({ message: 'Access denied. You do not manage this project.' });
      }
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(assigned_to !== undefined && { assigned_to: assigned_to ? parseInt(assigned_to) : null }),
        ...(due_date && { due_date: new Date(due_date) }),
        ...(priority && { priority }),
        ...(status && { status }),
        ...(project_id && { project_id: parseInt(project_id) })
      }
    });

    // If assignee changed, notify the new assignee
    if (assigned_to && parseInt(assigned_to) !== currentTask.assigned_to && parseInt(assigned_to) !== req.user.id) {
      await sendNotificationHelper(
        parseInt(assigned_to), 
        'Task Assigned', 
        `Task assigned to you: "${task.title}"`, 
        'task_assigned'
      );
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
    const userId = req.user.id;
    const taskId = parseInt(req.params.id);

    const currentTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!currentTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (role === 'COLLABORATOR') {
      return res.status(403).json({ message: 'Only Admins and Project Managers can delete tasks' });
    } else if (role === 'PROJECT_MANAGER') {
      if (currentTask.project && currentTask.project.manager_id !== userId) {
        return res.status(403).json({ message: 'Access denied. You do not manage this project.' });
      }
    }

    await prisma.task.delete({ where: { id: taskId } });
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
      const summary = `${message.substring(0, 30)}${message.length > 30 ? '...' : ''}`;
      // Notify creator
      if (task.created_by !== req.user.id) {
        await sendNotificationHelper(
          task.created_by, 
          'New Comment Added', 
          `New comment on task "${task.title}": "${summary}"`, 
          'comment_added'
        );
      }
      // Notify assignee
      if (task.assigned_to && task.assigned_to !== req.user.id && task.assigned_to !== task.created_by) {
        await sendNotificationHelper(
          task.assigned_to, 
          'New Comment Added', 
          `New comment on task "${task.title}": "${summary}"`, 
          'comment_added'
        );
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
