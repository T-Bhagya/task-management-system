const prisma = require('../prismaClient');
const { sendProjectAssignedEmail, sendProjectMemberWelcomeEmail } = require('../utils/emailService');

// Helper to send in-app notification (dual-write Postgres + SQLite service)
async function sendNotificationHelper(userId, title, message, type) {
  try {
    await prisma.notification.create({
      data: { message, type: 'SYSTEM', user_id: parseInt(userId) }
    });
  } catch (err) {
    console.error('Failed to create local Postgres notification:', err.message);
  }
  try {
    await fetch('http://localhost:3003/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: String(userId), title, message, type })
    });
  } catch (err) {
    console.error('Failed to relay notification to real-time service:', err.message);
  }
}

// Get all projects with role-based filtering
exports.getAllProjects = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const currentWorkspaceId = role === 'ADMIN' ? userId : req.user.admin_id;
        let where = {};

        if (role === 'PROJECT_MANAGER' || role === 'ADMIN') {
            // Project Managers and Admins can see all projects in the workspace
            where = { created_by: currentWorkspaceId };
        } else if (role === 'COLLABORATOR') {
            where = {
                created_by: currentWorkspaceId,
                members: {
                    some: {
                        user_id: userId
                    }
                }
            };
        }

        const projects = await prisma.project.findMany({
            where,
            include: {
                creator: { select: { id: true, name: true, email: true } },
                manager: { select: { id: true, name: true, email: true } },
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } }
                    }
                },
                _count: {
                    select: { tasks: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        res.status(200).json(projects);
    } catch (error) {
        next(error);
    }
};

// Get project by ID with authorization checks
exports.getProjectById = async (req, res, next) => {
    try {
        const projectId = parseInt(req.params.id);
        const userId = req.user.id;
        const role = req.user.role;

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                creator: { select: { id: true, name: true, email: true } },
                manager: { select: { id: true, name: true, email: true } },
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } }
                    }
                },
                tasks: {
                    include: {
                        assignee: { select: { id: true, name: true, email: true } },
                        creator: { select: { id: true, name: true, email: true } }
                    }
                }
            }
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Workspace authorization check
        const currentWorkspaceId = role === 'ADMIN' ? userId : req.user.admin_id;
        if (project.created_by !== currentWorkspaceId) {
            return res.status(403).json({ message: 'Access denied. Project belongs to another workspace.' });
        }

        // Authorization check
        if (role === 'PROJECT_MANAGER' && project.manager_id !== userId) {
            // Can see the project details but cannot view its tasks
            project.tasks = [];
        } else if (role === 'COLLABORATOR') {
            const isMember = project.members.some(m => m.user_id === userId);
            if (!isMember) {
                return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
            }
        }

        res.status(200).json(project);
    } catch (error) {
        next(error);
    }
};

// Create project (Admins only)
exports.createProject = async (req, res, next) => {
    try {
        const { name, description, manager_id, member_ids } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Project name is required' });
        }
        if (!manager_id) {
            return res.status(400).json({ message: 'Project manager assignment is required' });
        }

        // Validate manager user role
        const managerUser = await prisma.user.findUnique({
            where: { id: parseInt(manager_id) }
        });
        if (!managerUser || managerUser.role !== 'PROJECT_MANAGER') {
            return res.status(400).json({ message: 'Assigned user must be a Project Manager' });
        }

        const creatorId = req.user.id;

        // Create the project
        const project = await prisma.project.create({
            data: {
                name,
                description,
                created_by: creatorId,
                manager_id: parseInt(manager_id)
            }
        });

        // Add members if provided
        if (member_ids && Array.isArray(member_ids)) {
            const memberData = member_ids.map(id => ({
                project_id: project.id,
                user_id: parseInt(id)
            }));
            if (memberData.length > 0) {
                await prisma.projectMember.createMany({
                    data: memberData,
                    skipDuplicates: true
                });
            }
        }

        // Fetch and return the fully populated project
        const fullProject = await prisma.project.findUnique({
            where: { id: project.id },
            include: {
                creator: { select: { id: true, name: true, email: true } },
                manager: { select: { id: true, name: true, email: true } },
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } }
                    }
                }
            }
        });

        // Notify the assigned Project Manager via email + in-app notification
        try {
            const adminUser = await prisma.user.findUnique({ where: { id: creatorId } });
            const adminName = adminUser ? adminUser.name : 'An administrator';
            await sendProjectAssignedEmail(
                managerUser.email,
                managerUser.name,
                name,
                description || '',
                adminName
            );
            await sendNotificationHelper(
                managerUser.id,
                'New Project Assigned',
                `You have been assigned as Project Manager for "${name}" by ${adminName}.`,
                'project_assigned'
            );
        } catch (notifErr) {
            console.error('Failed to notify PM about project assignment:', notifErr.message);
        }

        // Email each collaborator added to the project
        if (member_ids && Array.isArray(member_ids) && member_ids.length > 0) {
            try {
                const adderUser = await prisma.user.findUnique({ where: { id: creatorId } });
                const adderName = adderUser ? adderUser.name : 'An administrator';
                const memberUsers = await prisma.user.findMany({
                    where: { id: { in: member_ids.map(id => parseInt(id)) } }
                });
                for (const member of memberUsers) {
                    await sendProjectMemberWelcomeEmail(
                        member.email,
                        member.name,
                        name,
                        description || '',
                        adderName
                    );
                    await sendNotificationHelper(
                        member.id,
                        'Added to Project',
                        `${adderName} added you as a collaborator on project "${name}".`,
                        'project_member'
                    );
                }
            } catch (memberErr) {
                console.error('Failed to notify collaborators about project membership:', memberErr.message);
            }
        }

        res.status(201).json(fullProject);
    } catch (error) {
        next(error);
    }
};

// Update project details (Admins only)
exports.updateProject = async (req, res, next) => {
    try {
        const projectId = parseInt(req.params.id);
        const { name, description, manager_id, member_ids } = req.body;

        const existingProject = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!existingProject) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const data = {};
        if (name) data.name = name;
        if (description !== undefined) data.description = description;
        if (manager_id) {
            // Validate manager user role
            const managerUser = await prisma.user.findUnique({
                where: { id: parseInt(manager_id) }
            });
            if (!managerUser || managerUser.role !== 'PROJECT_MANAGER') {
                return res.status(400).json({ message: 'Assigned user must be a Project Manager' });
            }
            data.manager_id = parseInt(manager_id);
        }

        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data
        });

        // Update members if provided — capture existing members FIRST for diff
        let oldMemberIds = new Set();
        if (member_ids && Array.isArray(member_ids)) {
            const oldMembers = await prisma.projectMember.findMany({
                where: { project_id: projectId },
                select: { user_id: true }
            });
            oldMemberIds = new Set(oldMembers.map(m => m.user_id));

            // Remove existing members
            await prisma.projectMember.deleteMany({
                where: { project_id: projectId }
            });

            // Add new members
            const memberData = member_ids.map(id => ({
                project_id: projectId,
                user_id: parseInt(id)
            }));
            if (memberData.length > 0) {
                await prisma.projectMember.createMany({
                    data: memberData,
                    skipDuplicates: true
                });
            }
        }

        // If manager changed, notify the new PM
        if (manager_id && parseInt(manager_id) !== existingProject.manager_id) {
            try {
                const newManager = await prisma.user.findUnique({ where: { id: parseInt(manager_id) } });
                const adminUser = await prisma.user.findUnique({ where: { id: req.user.id } });
                const adminName = adminUser ? adminUser.name : 'An administrator';
                if (newManager) {
                    await sendProjectAssignedEmail(
                        newManager.email,
                        newManager.name,
                        existingProject.name,
                        existingProject.description || '',
                        adminName
                    );
                    await sendNotificationHelper(
                        newManager.id,
                        'New Project Assigned',
                        `You have been assigned as Project Manager for "${existingProject.name}" by ${adminName}.`,
                        'project_assigned'
                    );
                }
            } catch (notifErr) {
                console.error('Failed to notify new PM about project reassignment:', notifErr.message);
            }
        }

        // Email only newly added collaborators (diff against snapshot taken before update)
        if (member_ids && Array.isArray(member_ids) && member_ids.length > 0) {
            try {
                const newMemberIds = member_ids.map(id => parseInt(id));
                const trulyNewIds = newMemberIds.filter(id => !oldMemberIds.has(id));

                if (trulyNewIds.length > 0) {
                    const adderUser = await prisma.user.findUnique({ where: { id: req.user.id } });
                    const adderName = adderUser ? adderUser.name : 'An administrator';
                    const projectName = name || existingProject.name;
                    const projectDesc = description !== undefined ? description : (existingProject.description || '');
                    const newMemberUsers = await prisma.user.findMany({
                        where: { id: { in: trulyNewIds } }
                    });
                    for (const member of newMemberUsers) {
                        await sendProjectMemberWelcomeEmail(
                            member.email,
                            member.name,
                            projectName,
                            projectDesc,
                            adderName
                        );
                        await sendNotificationHelper(
                            member.id,
                            'Added to Project',
                            `${adderName} added you as a collaborator on project "${projectName}".`,
                            'project_member'
                        );
                    }
                }
            } catch (memberErr) {
                console.error('Failed to notify new collaborators about project membership:', memberErr.message);
            }
        }

        const fullProject = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                creator: { select: { id: true, name: true, email: true } },
                manager: { select: { id: true, name: true, email: true } },
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } }
                    }
                }
            }
        });

        res.status(200).json(fullProject);
    } catch (error) {
        next(error);
    }
};

// Delete project (Admins only)
exports.deleteProject = async (req, res, next) => {
    try {
        const projectId = parseInt(req.params.id);

        const existingProject = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!existingProject) {
            return res.status(404).json({ message: 'Project not found' });
        }

        await prisma.project.delete({
            where: { id: projectId }
        });

        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// Manage project members (Admin or PM of the project)
exports.addMembers = async (req, res, next) => {
    try {
        const projectId = parseInt(req.params.id);
        const { user_ids } = req.body; // Array of user IDs to add

        if (!user_ids || !Array.isArray(user_ids)) {
            return res.status(400).json({ message: 'user_ids array is required' });
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is Admin or the Manager of this project
        if (req.user.role !== 'ADMIN' && project.manager_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied. Only Admins or the Project Manager can add members.' });
        }

        const memberData = user_ids.map(id => ({
            project_id: projectId,
            user_id: parseInt(id)
        }));

        await prisma.projectMember.createMany({
            data: memberData,
            skipDuplicates: true
        });

        // Notify each added member in-app
        try {
            const adder = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true } });
            const adderName = adder ? adder.name : 'An administrator';
            for (const id of user_ids) {
                await sendNotificationHelper(
                    parseInt(id),
                    'Added to Project',
                    `${adderName} added you as a collaborator on project "${project.name}".`,
                    'project_member'
                );
            }
        } catch (notifErr) {
            console.error('Failed to send project member notifications:', notifErr.message);
        }

        const updatedProject = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } }
                    }
                }
            }
        });

        res.status(200).json(updatedProject);
    } catch (error) {
        next(error);
    }
};

exports.removeMember = async (req, res, next) => {
    try {
        const projectId = parseInt(req.params.id);
        const memberUserId = parseInt(req.params.userId);

        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is Admin or the Manager of this project
        if (req.user.role !== 'ADMIN' && project.manager_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied. Only Admins or the Project Manager can remove members.' });
        }

        await prisma.projectMember.delete({
            where: {
                project_id_user_id: {
                    project_id: projectId,
                    user_id: memberUserId
                }
            }
        });

        // Notify the removed member in-app
        try {
            const remover = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true } });
            const removerName = remover ? remover.name : 'An administrator';
            await sendNotificationHelper(
                memberUserId,
                'Removed from Project',
                `${removerName} removed you from project "${project.name}".`,
                'project_member'
            );
        } catch (notifErr) {
            console.error('Failed to send project member removal notification:', notifErr.message);
        }

        const updatedProject = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } }
                    }
                }
            }
        });

        res.status(200).json(updatedProject);
    } catch (error) {
        next(error);
    }
};
