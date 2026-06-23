const prisma = require('../prismaClient');

// Get all projects with role-based filtering
exports.getAllProjects = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        let where = {};

        if (role === 'PROJECT_MANAGER') {
            where = { manager_id: userId };
        } else if (role === 'COLLABORATOR') {
            where = {
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

        // Authorization check
        if (role === 'PROJECT_MANAGER' && project.manager_id !== userId) {
            return res.status(403).json({ message: 'Access denied. You do not manage this project.' });
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

        // Update members if provided
        if (member_ids && Array.isArray(member_ids)) {
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
