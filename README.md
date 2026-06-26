# TaskFlow - Task Management System

TaskFlow is a state-of-the-art collaborative task management application built to help teams plan, organize, track, and complete tasks efficiently in real time. Designed for modern productivity, it features a fluid Kanban board interface, role-based workflows, robust security protocols, and instant real-time notification push services.

For complete requirements and compliance details, see the project [SRS.md](file:///c:/Users/Tharu/OneDrive%20-%20apiit.lk/Documents/UOK/Web%20-%20TMS/SRS.md).

---

## 🌟 Key Features

* **Interactive Kanban Board**: Dynamic drag-and-drop task tracking across *To Do*, *In Progress*, and *Completed* stages powered by fluid transitions.
* **Role-Based Access Control (RBAC)**: Distinct workspace capabilities and view permissions defined for **Administrators**, **Project Managers**, and **Collaborators**.
* **Real-Time Notification Service**: Microservice-based WebSocket architecture pushing instant alerts for task assignments, comment additions, and state updates.
* **Offline Notification Delivery**: Automatic client reconnection checks and delivery of pending notifications queued in the service database.
* **Secure Authentication**: Sealed JWT-based session tokens with strict password validation, password change tracking, and mandatory first-login password reset.
* **Forgot Password Flow**: Secure recovery with a 6-digit email verification code, built-in frequency throttling, and automated email dispatching.
* **Collaborative Commenting**: Real-time context comments linked directly to tasks for seamless team synchronization.

---

## 🛠️ Technologies Used

### Frontend Dashboard
* **React 18 & Vite**: Fast SPA generation and development environment.
* **Material UI (MUI)**: Premium UI components, responsive layout grid, and modern icon packages.
* **React Router DOM**: Client-side routing.
* **@hello-pangea/dnd**: Premium drag-and-drop interaction library for the Kanban board.
* **Socket.io Client**: Dedicated real-time WebSocket connection listener.

### Backend REST API
* **Node.js & Express**: High-performance backend routing structure.
* **Prisma ORM**: High-efficiency database schema querying and migrations.
* **PostgreSQL (Neon Cloud)**: Scalable relational database cloud engine.
* **Swagger UI / OpenAPI**: Interactive live API documentation engine.
* **Azure Communication Services**: Automated security email delivery handler.
* **Bcryptjs & JWT**: Industry-standard encryption hashing and session signing.

### Real-Time Notification Microservice
* **TypeScript & TS-Node**: Typed backend runtime.
* **Socket.io Server**: Real-time event transport layer.
* **Prisma & PostgreSQL**: Dedicated database storage for offline notification queuing.

### DevOps & Cloud Infrastructure
* **Docker & Multi-stage Containers**: Standardized local and staging environment builds.
* **GitHub Actions**: Fully automated CI/CD deployment pipelines.
* **Azure Container Registry (ACR) & Azure Container Apps**: Scalable serverless cloud hosting.

---

## 📂 Project Structure

* **[frontend/](file:///c:/Users/Tharu/OneDrive%20-%20apiit.lk/Documents/UOK/Web%20-%20TMS/frontend)**: React SPA client dashboard code.
* **[backend/](file:///c:/Users/Tharu/OneDrive%20-%20apiit.lk/Documents/UOK/Web%20-%20TMS/backend)**: REST API controllers, router, and database schema config.
* **[notification-service/](file:///c:/Users/Tharu/OneDrive%20-%20apiit.lk/Documents/UOK/Web%20-%20TMS/notification-service)**: Socket.io real-time and offline notifications microservice.

---

## ⚙️ Setup & Installation Instructions

### Prerequisites
* **Node.js** (v18 or higher)
* **npm** (v9 or higher)
* **PostgreSQL** instance (or a Neon Cloud connection string)

### 1. Database & Environment Configuration

## ⚙️ Database Configuration & Initialization

This project utilizes **Prisma ORM** coupled with a **PostgreSQL** instance (hosted on Neon Cloud) across multiple microservices. Follow these steps to configure and initialize your database environment.

### 1. Set Up Environment Connection Strings
Do not hardcode database credentials. Create a `.env` file in **both** the `backend/` and `notification-service/` directories, following this production-safe template:

```env
# Connection template for Prisma & Neon PostgreSQL
DATABASE_URL="postgresql://<username>:<password>@<host-pooler>.<region>.aws.neon.tech/<database_name>?sslmode=require"

### 2. Install Dependencies & Build Schemas

From the root directory of the project, run:
```bash
# Install dependencies for all services
npm install
cd backend && npm install
cd ../frontend && npm install
cd ../notification-service && npm install
cd ..
```

Run migrations and seed the main database from the backend folder:
```bash
cd backend
# Generate client and run schema migrations
npx prisma migrate dev --name init
# Seed initial users (including default Admin) and demo tasks
node seed.js
cd ..
```

Generate the Prisma client for the notification service:
```bash
cd notification-service
npx prisma generate
npx prisma migrate dev --name init
cd ..
```

### 3. Running the Application

You can start all three modules concurrently with a single command from the root directory:
```bash
npm run dev
```

This runs:
* **Frontend client** at `http://localhost:5173`
* **Backend REST API** at `http://localhost:5000`
* **Notification microservice** at `http://localhost:3003`

To run services individually:
* **Backend**: `npm run backend`
* **Frontend**: `npm run frontend`
* **Notifications**: `npm run notifications`

---

## 🔌 API Usage & Swagger Documentation

The backend REST API is fully documented using the OpenAPI Specification and integrates Swagger UI. 

* **Swagger UI URL (Local)**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
* **API Documentation Source Code**: [swagger.yaml](file:///c:/Users/Tharu/OneDrive%20-%20apiit.lk/Documents/UOK/Web%20-%20TMS/backend/swagger.yaml)

### Core Endpoints Overview

| Service | HTTP Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Authenticate user and issue JWT token | No |
| **Auth** | `POST` | `/api/auth/register` | Register a new user | No |
| **Auth** | `PUT` | `/api/auth/change-password` | Update current user password | Yes (JWT) |
| **Users** | `GET` | `/api/users` | List all system users (searchable/filterable) | Yes (Admin) |
| **Users** | `POST` | `/api/users` | Create user profile and send onboarding email | Yes (Admin) |
| **Users** | `GET` | `/api/users/profile` | Retrieve current authenticated user profile | Yes (JWT) |
| **Tasks** | `GET` | `/api/tasks` | Get all tasks scoped to user/role | Yes (JWT) |
| **Tasks** | `POST` | `/api/tasks` | Create a new project task | Yes (PM / Admin) |
| **Tasks** | `PUT` | `/api/tasks/{id}` | Update task status, assignee, or priority | Yes (JWT) |
| **Tasks** | `DELETE` | `/api/tasks/{id}` | Remove a task permanently | Yes (PM / Admin) |
| **Projects** | `GET` | `/api/projects` | List all projects | Yes (JWT) |
| **Projects** | `POST` | `/api/projects` | Create a project and assign a Project Manager | Yes (Admin / PM) |

---

## 👥 Team Member Contributions

| Member | Primary Role | Key Accomplishments & Deliverables |
| :--- | :--- | :--- |
| **Thilini Bhagya** *(Group Leader)* | Full-Stack Integration & Security | <ul><li>Authored and structured the system Software Requirements Specification ([SRS.md](file:///c:/Users/Tharu/OneDrive%20-%20apiit.lk/Documents/UOK/Web%20-%20TMS/SRS.md)).</li><li>Designed and implemented the secure **Forgot Password flow** using 6-digit email verification codes and once-a-month frequency limits.</li><li>Optimized the task board with workspace isolation, custom Project Manager roles, and collaborator-specific Kanban features.</li><li>Managed project builds, merged pull requests, and resolved version control conflicts.</li></ul> |
| **Tharushi** | DevOps & Cloud Architect | <ul><li>Containerized the entire platform (Frontend, Backend, and Notification service) using multi-stage **Docker** files.</li><li>Designed automated **GitHub Actions CI/CD pipelines** for build validation and image delivery.</li><li>Deployed systems on **Azure Container Apps** and configured Azure Container Registries, ingress routing, target ports, and network secrets.</li><li>Configured PostgreSQL production staging databases.</li><li>Integrated interactive API documents via Swagger UI.</li></ul> |
| **Nipuni Uppala** | Database & Backend Developer | <ul><li>Architected the relational **database schema** (Users, Projects, Tasks, Comments, and Notifications) and generated the project ER diagram.</li><li>Configured **Prisma ORM** engines, initialized migrations, and successfully integrated the backend with the **Neon PostgreSQL Cloud** database.</li><li>Developed clean backend REST API endpoints for comment systems and task management.</li><li>Configured token validation routes by injecting security middleware (`authMiddleware`).</li></ul> |
| **Nadeesha Kavindi** | Frontend & User Experience | <ul><li>Built the advanced **User Management UI** featuring role-based user tables, deactivation rules, and profile details modal popups.</li><li>Implemented custom password validation logic, secure change password routes, and forced resets on initial user login.</li><li>Structured Project Manager views allowing PMs to assign tasks, define priorities, set deadlines, and manage team members.</li><li>Designed layouts for authentication pages using premium modern illustrations.</li></ul> |
| **Muhammad Aadhil** | Real-Time Systems Engineer | <ul><li>Created the real-time **Notification Microservice** using **Socket.io** to push events instantly.</li><li>Developed a persistent **Offline Notification storage queue** using Prisma and SQLite/PostgreSQL.</li><li>Implemented event-trigger endpoints enabling other backend controllers to notify users dynamically about status changes and comments.</li></ul> |
