const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Create a new task
exports.createTask = async (req, res, next) => {
    try {
        const { title, description, priority } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Title is required" });
        }

        const realUserId = req.user.id; 

        const newTask = await prisma.task.create({
            data: {
                title: title,
                description: description,
                priority: priority || 'MEDIUM', 
                status: 'TODO',                 
                created_by: realUserId,         // <-- Use the verified ID!
                updated_at: new Date()          
            }
        });

        res.status(201).json({ message: "Task created successfully!", task: newTask });
    } catch (error) {
        next(error);
    }
};

// Get all tasks
exports.getTasks = async (req, res, next) => {
    try {
        const tasks = await prisma.task.findMany({
            include: {
                User_Task_created_byToUser: { select: { name: true, email: true } }, // Fetches the creator's name
                User_Task_assigned_toToUser: { select: { name: true, email: true } } // Fetches the assignee's name
            }
        });

        res.status(200).json(tasks);
    } catch (error) {
        next(error);
    }
};
// Update a task
exports.updateTask = async (req, res, next) => {
    try {
        // Grab the ID from the URL (e.g., /api/tasks/1)
        const taskId = parseInt(req.params.id); 
        const { title, description, priority, status, assigned_to } = req.body;

        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                title: title,
                description: description,
                priority: priority,
                status: status,
                assigned_to: assigned_to,
                updated_at: new Date() // Always update the timestamp!
            }
        });

        res.status(200).json({ message: "Task updated successfully!", task: updatedTask });
    } catch (error) {
        next(error);
    }
};

// Delete a task
exports.deleteTask = async (req, res, next) => {
    try {
        const taskId = parseInt(req.params.id);

        await prisma.task.delete({
            where: { id: taskId }
        });

        res.status(200).json({ message: "Task deleted successfully!" });
    } catch (error) {
        next(error);
    }
};