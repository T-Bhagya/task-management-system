# TaskFlow - Task Management System

TaskFlow is a collaborative task management application built using React + Vite on the frontend and Node.js + Express + Prisma on the backend.

## Features
- **Kanban Board**: Drag and drop tasks across columns (To Do, In Progress, Completed).
- **Comments System**: Write and view comments on tasks in real-time.
- **Notifications**: Stay updated with task assignments and comment updates.
- **Role-Based Views**: Support for Admins, Project Managers, and Collaborators.
- **Secure Authentication**: JWT-based secure user log in and sign up.

## Quick Start

### 1. Database Setup
Ensure PostgreSQL is running, then add a `.env` file inside `backend/` with your connection string:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/taskflow_db"
JWT_SECRET="your-secret-key"
PORT=5000
```
Run Prisma migrations to initialize the database schema:
```bash
cd backend
npx prisma migrate dev --name init
node seed.js
```

### 2. Running the Backend
From the root folder:
```bash
npm run backend
```

### 3. Running the Frontend
From the root folder:
```bash
npm run frontend
```
The application will be available at `http://localhost:5173`.
