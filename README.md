# 🚀 SprintHub - Secure Role-Based Project Management

SprintHub is a modern, full-stack project management application designed for agile teams. It features a robust role-based access control (RBAC) system that separates administrative management from employee task execution, ensuring a secure and supervised workflow.

## 📸 Project Showcase

### Admin Command Center
The central hub for administrators to monitor workforce performance, global project health, and live task activity.
![Admin Panel](docs/images/admin_panel.png)

### Employee Dashboard
A personalized workspace for employees to track their assigned tasks and submit progress reports.
![Employee Dashboard](docs/images/dashboard.png)

---

## 🛠️ Tech Stack

### Backend (Node.js & Express)
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL) with custom Model abstraction.
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` password hashing.
- **Security**: Rate limiting, Helmet, CORS, and Case-Insensitive Role Authorization.
- **Documentation**: Swagger/OpenAPI 3.0.

### Frontend (React)
- **Framework**: React 18 with Vite.
- **Styling**: Tailwind CSS for a premium, responsive design.
- **Icons**: Lucide-React for modern iconography.
- **State Management**: React Context API (Auth Provider).
- **Routing**: React Router 6.

---

## ✨ Key Features

### 🔐 Advanced Authentication & RBAC
- **Strict Roles**: Dynamic "Admin" vs "Employee" roles.
- **Secure Hashing**: Passwords are never stored in plain text (Bcrypt).
- **Lazy Migration**: Automatic hash-upgrading for legacy accounts upon login.
- **Case-Insensitivity**: Authorization logic handles variations in role naming seamlessly.

### 📊 Admin Command Center
- **Workforce Intelligence**: Real-time tracking of active tasks and project counts per employee.
- **Live Activity Feed**: A chronological stream of status updates from the entire team.
- **System Health**: Visual indicators for task completion rates and mission-critical milestones.

### 📝 Task & Project Management
- **Admin-Only Controls**: Projects and tasks can only be created, edited, or deleted by Admins.
- **Employee Updates**: Employees have dedicated access to update their task status and post progress messages.
- **Rich Status Tracking**: Integrated status badges (Pending, In-Progress, Completed) with visual icons.

---

## 📖 API Documentation

SprintHub comes with built-in **Swagger UI** for easy API testing and integration.

- **URL**: `http://localhost:5000/api-docs` (when running locally)
- **Endpoints**:
  - `POST /api/v1/auth/register`: User registration.
  - `POST /api/v1/auth/login`: Secure login.
  - `GET /api/v1/projects`: List projects (Auth required).
  - `POST /api/v1/tasks`: Create tasks (Admin only).
  - `PATCH /api/v1/tasks/:id/status`: Update task progress.

---

## 📈 Scalability & Future Growth

SprintHub is designed with a **stateless architecture**, making it ready for high-scale environments:

1.  **Microservices Readiness**: The separation of project and task controllers allows for easy extraction into independent microservices as the load grows.
2.  **Caching Strategy**: Implementing Redis for the "Admin Panel" stats would significantly reduce database load for high-frequency dashboard refreshes.
3.  **Load Balancing**: Stateless JWT authentication allows for seamless horizontal scaling across multiple server instances behind a load balancer (e.g., Nginx or AWS ALB).
4.  **Database Partitioning**: As task counts reach millions, PostgreSQL partitioning by `projectId` can ensure sub-millisecond query performance.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- Supabase Account

### Setup
1. **Clone the Repo**
   ```bash
   git clone https://github.com/yourusername/SprintHub.git
   ```

2. **Backend Configuration**
   ```bash
   cd backend
   npm install
   # Create .env file with SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and JWT_SECRET
   npm run dev
   ```

3. **Frontend Configuration**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🛠️ Git Workflow & Troubleshooting

If you are having trouble committing your changes, follow these standard steps:

### 1. Check for Changes
Ensure you have actually saved your files and that Git sees the changes:
```bash
git status
```

### 2. Stage Your Changes
If you see untracked files, add them to the staging area:
```bash
git add .
```

### 3. Commit with a Message
```bash
git commit -m "feat: updated project documentation and security"
```

### 4. Common Issues
- **"Nothing to commit, working tree clean"**: This means all your changes are already committed or you haven't saved your files in the editor yet.
- **Large File Errors**: Ensure `node_modules` is included in your `.gitignore` (this project already handles this).
- **Authentication Issues**: If you can't push, ensure your GitHub CLI is logged in (`gh auth login`) or your SSH keys are set up.

---

## 📄 License
MIT License - Copyright (c) 2026 SprintHub Team
