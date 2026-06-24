const prisma = require('../prismaClient');
const { sendTaskStatusUpdateEmail, sendCommentMentionEmail, sendTaskAssignedEmail } = require('../utils/emailService');

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

    // Enforce role-based scoping
    const role = req.user.role;
    const userId = req.user.id;

    if (role === 'PROJECT_MANAGER') {
      if (projectId) {
        where.project = { id: parseInt(projectId), manager_id: userId };
      } else {
        where.project = { manager_id: userId };
      }
    } else if (role === 'COLLABORATOR') {
      if (projectId) {
        where.project = { id: parseInt(projectId), members: { some: { user_id: userId } } };
      } else {
        where.project = { members: { some: { user_id: userId } } };
      }
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
    const { title, description, assigned_to, due_date, priority, status, project_id } = req.body;
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
        status: status || 'TODO',
        created_by: userId,
        project_id: projectId
      }
    });

    // Notify assignee via in-app notification + email
    if (task.assigned_to && task.assigned_to !== userId) {
      await sendNotificationHelper(
        task.assigned_to,
        'New Task Assigned',
        `New task assigned to you: "${task.title}"`,
        'task_assigned'
      );
      // Send email to the assignee
      try {
        const assignee = await prisma.user.findUnique({ where: { id: task.assigned_to } });
        const assigner = await prisma.user.findUnique({ where: { id: userId } });
        const proj = await prisma.project.findUnique({ where: { id: projectId } });
        if (assignee) {
          await sendTaskAssignedEmail(
            assignee.email,
            assignee.name,
            task.title,
            proj ? proj.name : 'Unknown Project',
            task.priority,
            task.due_date,
            assigner ? assigner.name : 'A team member'
          );
        }
      } catch (emailErr) {
        console.error('Failed to send task assignment email:', emailErr.message);
      }
    }

    // Notify PM and other project members about the new task
    try {
      const creator = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      const creatorName = creator ? creator.name : 'A team member';
      
      const assigneeUser = task.assigned_to ? await prisma.user.findUnique({ where: { id: task.assigned_to }, select: { name: true } }) : null;
      const assigneeName = assigneeUser ? assigneeUser.name : 'Unassigned';
      
      const msg = task.assigned_to 
        ? `${creatorName} created and assigned task "${task.title}" to ${assigneeName} in project "${project.name}"`
        : `${creatorName} created task "${task.title}" (Unassigned) in project "${project.name}"`;

      const notificationRecipients = new Set();
      // Add PM
      if (project.manager_id) notificationRecipients.add(project.manager_id);
      
      // Add project members
      const members = await prisma.projectMember.findMany({ where: { project_id: projectId } });
      members.forEach(m => notificationRecipients.add(m.user_id));
      
      // Remove creator/assigner and assignee (since assignee gets a direct custom notification)
      notificationRecipients.delete(userId);
      if (task.assigned_to) notificationRecipients.delete(task.assigned_to);

      for (const targetId of notificationRecipients) {
        await sendNotificationHelper(
          targetId,
          'New Task Created',
          msg,
          'task_created'
        );
      }
    } catch (err) {
      console.error('Failed to send project member notifications for new task:', err.message);
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

    // 1. Role-based restrictions on general fields
    if (role === 'COLLABORATOR') {
      // Collaborators can ONLY update status
      if (title || description || assigned_to || due_date || priority || project_id) {
        return res.status(403).json({ message: 'Collaborators can only update task status' });
      }
    } else if (role === 'PROJECT_MANAGER') {
      // If PM is updating fields other than status, check if they manage the project
      if (title || description || assigned_to || due_date || priority || project_id) {
        if (currentTask.project && currentTask.project.manager_id !== userId) {
          return res.status(403).json({ message: 'Access denied. You do not manage this project.' });
        }
      }
    }

    // 2. Status update specific restrictions: only the assignee or an Admin can change the status (not even PM)
    if (status && status !== currentTask.status) {
      if (role !== 'ADMIN' && currentTask.assigned_to !== userId) {
        return res.status(403).json({ message: 'Access denied. Only the task assignee or an Admin can update the task status.' });
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

    // If assignee changed, notify the new assignee, old assignee, and project members
    if (assigned_to !== undefined && parseInt(assigned_to) !== currentTask.assigned_to) {
      // 1. Notify new assignee via in-app + email
      if (assigned_to && parseInt(assigned_to) !== req.user.id) {
        await sendNotificationHelper(
          parseInt(assigned_to),
          'Task Assigned',
          `Task assigned to you: "${task.title}"`,
          'task_assigned'
        );
        // Send email to new assignee
        try {
          const newAssignee = await prisma.user.findUnique({ where: { id: parseInt(assigned_to) } });
          const assigner = await prisma.user.findUnique({ where: { id: req.user.id } });
          const taskProject = currentTask.project || await prisma.project.findUnique({ where: { id: task.project_id } });
          if (newAssignee) {
            await sendTaskAssignedEmail(
              newAssignee.email,
              newAssignee.name,
              task.title,
              taskProject ? taskProject.name : 'Unknown Project',
              task.priority,
              task.due_date,
              assigner ? assigner.name : 'A team member'
            );
          }
        } catch (emailErr) {
          console.error('Failed to send task reassignment email:', emailErr.message);
        }
      }

      // 2. Notify old assignee via in-app
      if (currentTask.assigned_to && currentTask.assigned_to !== req.user.id) {
        await sendNotificationHelper(
          currentTask.assigned_to,
          'Task Reassigned',
          `Task "${task.title}" is no longer assigned to you`,
          'task_unassigned'
        );
      }

      // 3. Notify PM and other project members about the task reassignment
      try {
        const updater = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true } });
        const updaterName = updater ? updater.name : `User #${req.user.id}`;
        
        const newAssigneeUser = assigned_to ? await prisma.user.findUnique({ where: { id: parseInt(assigned_to) }, select: { name: true } }) : null;
        const newAssigneeName = newAssigneeUser ? newAssigneeUser.name : 'Unassigned';

        const msg = assigned_to 
          ? `${updaterName} reassigned task "${task.title}" to ${newAssigneeName}`
          : `${updaterName} unassigned task "${task.title}"`;

        const notificationRecipients = new Set();
        // Add PM
        if (currentTask.project && currentTask.project.manager_id) {
          notificationRecipients.add(currentTask.project.manager_id);
        }
        // Add project members
        if (task.project_id) {
          const members = await prisma.projectMember.findMany({ where: { project_id: task.project_id } });
          members.forEach(m => notificationRecipients.add(m.user_id));
        }
        // Remove updater, new assignee, and old assignee (since they get direct custom notifications)
        notificationRecipients.delete(req.user.id);
        if (assigned_to) notificationRecipients.delete(parseInt(assigned_to));
        if (currentTask.assigned_to) notificationRecipients.delete(currentTask.assigned_to);

        for (const targetId of notificationRecipients) {
          await sendNotificationHelper(
            targetId,
            'Task Reassigned',
            msg,
            'task_reassigned'
          );
        }
      } catch (err) {
        console.error('Failed to send project member notifications for task reassignment:', err.message);
      }
    }

    // If status changed, email all Admins + PM, and send in-app notifications to all involved members
    if (status && status !== currentTask.status) {
      try {
        const updater = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true } });
        const updaterName = updater ? updater.name : `User #${req.user.id}`;
        
        // Fetch all admins
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
        
        // Fetch project manager if task belongs to a project
        let pm = null;
        if (currentTask.project && currentTask.project.manager_id) {
          pm = await prisma.user.findUnique({ where: { id: currentTask.project.manager_id } });
        }
        
        // Send email to Admins and PM (excluding updater themselves)
        const emailRecipients = [...admins];
        if (pm && !admins.some(a => a.id === pm.id)) {
          emailRecipients.push(pm);
        }
        for (const recipient of emailRecipients) {
          if (recipient.id !== req.user.id) {
            await sendTaskStatusUpdateEmail(
              recipient.email,
              recipient.name,
              task.title,
              currentTask.status,
              task.status,
              updaterName
            );
          }
        }
        
        // Send in-app notifications to admins, PM, creator, assignee, and project members
        const inAppNotifyUserIds = new Set();
        
        // Add admins
        admins.forEach(a => inAppNotifyUserIds.add(a.id));
        
        // Add PM
        if (pm) inAppNotifyUserIds.add(pm.id);
        
        // Add task creator
        if (currentTask.created_by) inAppNotifyUserIds.add(currentTask.created_by);
        
        // Add task assignee
        if (currentTask.assigned_to) inAppNotifyUserIds.add(currentTask.assigned_to);
        
        // Add project members/collaborators if task belongs to a project
        if (currentTask.project_id) {
          const members = await prisma.projectMember.findMany({
            where: { project_id: currentTask.project_id }
          });
          members.forEach(m => inAppNotifyUserIds.add(m.user_id));
        }
        
        // Exclude the updater themselves
        inAppNotifyUserIds.delete(req.user.id);
        
        for (const targetUserId of inAppNotifyUserIds) {
          await sendNotificationHelper(
            targetUserId,
            'Task Status Updated',
            `${updaterName} changed "${task.title}" from ${currentTask.status} to ${task.status}`,
            'task_status_update'
          );
        }
      } catch (err) {
        console.error('Failed to send status update notifications:', err.message);
      }
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

    const deleter = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true } });
    const deleterName = deleter ? deleter.name : `User #${req.user.id}`;

    await prisma.task.delete({ where: { id: taskId } });

    // Send notifications after deletion
    try {
      const msg = currentTask.project
        ? `${deleterName} deleted task "${currentTask.title}" from project "${currentTask.project.name}"`
        : `${deleterName} deleted task "${currentTask.title}"`;

      const notificationRecipients = new Set();
      // Add PM
      if (currentTask.project && currentTask.project.manager_id) {
        notificationRecipients.add(currentTask.project.manager_id);
      }
      // Add assignee
      if (currentTask.assigned_to) {
        notificationRecipients.add(currentTask.assigned_to);
      }
      // Add creator
      if (currentTask.created_by) {
        notificationRecipients.add(currentTask.created_by);
      }
      // Add project members
      if (currentTask.project_id) {
        const members = await prisma.projectMember.findMany({ where: { project_id: currentTask.project_id } });
        members.forEach(m => notificationRecipients.add(m.user_id));
      }
      // Add admins
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      admins.forEach(a => notificationRecipients.add(a.id));

      // Remove deleter
      notificationRecipients.delete(req.user.id);

      for (const targetId of notificationRecipients) {
        await sendNotificationHelper(
          targetId,
          'Task Deleted',
          msg,
          'task_deleted'
        );
      }
    } catch (err) {
      console.error('Failed to send task deleted notifications:', err.message);
    }

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
      const commenterName = comment.user?.name || `User #${req.user.id}`;

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

      // --- @mention detection ---
      // Match patterns like @John or @John Smith (up to 3 words)
      const mentionRegex = /@([A-Za-z]+(?:\s[A-Za-z]+){0,2})/g;
      const mentions = [];
      let match;
      while ((match = mentionRegex.exec(message)) !== null) {
        mentions.push(match[1].trim().toLowerCase());
      }

      if (mentions.length > 0) {
        // Fetch all users and match by name
        const allUsers = await prisma.user.findMany({
          select: { id: true, name: true, email: true }
        });
        const alreadyNotified = new Set();
        for (const mention of mentions) {
          const matchedUser = allUsers.find(u => u.name.toLowerCase().startsWith(mention));
          if (matchedUser && matchedUser.id !== req.user.id && !alreadyNotified.has(matchedUser.id)) {
            alreadyNotified.add(matchedUser.id);
            // Send in-app notification
            await sendNotificationHelper(
              matchedUser.id,
              'You were mentioned in a comment',
              `${commenterName} mentioned you in a comment on "${task.title}": "${summary}"`,
              'comment_added'
            );
            // Send email
            try {
              await sendCommentMentionEmail(
                matchedUser.email,
                matchedUser.name,
                commenterName,
                task.title,
                message
              );
            } catch (emailErr) {
              console.error('Failed to send @mention email:', emailErr.message);
            }
          }
        }
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
