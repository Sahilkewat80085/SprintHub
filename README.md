# SprintHub 🚀

A production-style full-stack project management platform designed for developer teams, hackathon groups, engineering teams, and startups to manage projects, tasks, and team progress.

## 🎯 Project Overview

SprintHub demonstrates scalable backend architecture, secure authentication, role-based authorization, clean REST API design, and frontend integration with production-ready engineering practices.

### Key Features

- **🔐 Secure Authentication**: JWT-based auth with bcrypt password hashing
- **👥 Role-Based Authorization**: User and Admin roles with proper access control
- **📋 Project Management**: Create, update, delete projects with status tracking
- **✅ Task Management**: Comprehensive task management with assignment capabilities
- **📊 Dashboard Analytics**: Real-time statistics and progress tracking
- **🛡️ Security First**: Rate limiting, input sanitization, and security headers
- **📚 API Documentation**: Complete Swagger/OpenAPI documentation
- **🎨 Modern UI**: Clean, responsive React frontend with Tailwind CSS

## 🏗️ Architecture

### Backend Architecture

```
backend/
├── src/
│   ├── config/          # Database and server configuration
│   ├── controllers/      # Route handlers and business logic
│   ├── middleware/       # Authentication, validation, security
│   ├── models/          # MongoDB schemas and data models
│   ├── routes/          # API route definitions
│   ├── validators/       # Input validation rules
│   ├── utils/           # Utility functions and error handling
│   └── app.js           # Express app configuration
├── server.js            # Server entry point
├── package.json          # Dependencies and scripts
└── .env.example         # Environment variables template
```

### Frontend Architecture

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   ├── context/         # React context for state management
│   ├── pages/           # Page components
│   ├── services/        # API service layer
│   ├── hooks/           # Custom React hooks
│   ├── App.jsx          # Main app component
│   └── main.jsx         # App entry point
├── public/              # Static assets
├── package.json          # Dependencies and scripts
└── vite.config.js       # Vite configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16.0.0 or higher
- MongoDB 4.4 or higher
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SprintHub
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Setup Environment Variables**
   ```bash
   cd ../backend
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/sprinthub
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:3000
   ```

5. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running
   mongod
   ```

6. **Run the Application**
   
   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   
   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

7. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "role": "user"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

### Project Endpoints

#### Get All Projects
```http
GET /projects?page=1&limit=10&status=active&priority=high
Authorization: Bearer <token>
```

#### Create Project
```http
POST /projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "E-commerce Platform",
  "description": "Building a modern e-commerce platform",
  "priority": "high",
  "status": "active",
  "members": ["userId1", "userId2"]
}
```

#### Update Project
```http
PUT /projects/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Project Title",
  "status": "completed"
}
```

#### Delete Project
```http
DELETE /projects/:id
Authorization: Bearer <token>
```

### Task Endpoints

#### Get All Tasks
```http
GET /tasks?page=1&limit=10&status=pending&projectId=123
Authorization: Bearer <token>
```

#### Create Task
```http
POST /tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication",
  "status": "pending",
  "assignedTo": "userId",
  "projectId": "projectId"
}
```

#### Update Task Status
```http
PATCH /tasks/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed"
}
```

#### Delete Task
```http
DELETE /tasks/:id
Authorization: Bearer <token>
```

## 🔐 Security Implementation

### Authentication & Authorization

- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds (12)
- **Role-Based Access**: User and Admin roles
- **Token Expiration**: Configurable JWT expiration
- **Protected Routes**: Middleware for route protection

### Security Middleware

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Rate Limiting**: Prevent brute force attacks
- **Input Sanitization**: XSS and injection prevention
- **MongoDB Sanitization**: NoSQL injection protection
- **Parameter Pollution**: HPP middleware

### Validation

- **Express Validator**: Comprehensive input validation
- **Custom Validators**: Business logic validation
- **Sanitization**: Data cleaning and normalization
- **Error Handling**: Centralized error responses

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String (required, 2-50 chars),
  email: String (required, unique, email format),
  password: String (required, hashed, min 6 chars),
  role: String (enum: ['user', 'admin'], default: 'user'),
  createdAt: Date,
  updatedAt: Date
}
```

### Project Model
```javascript
{
  title: String (required, 3-100 chars),
  description: String (required, max 1000 chars),
  priority: String (enum: ['low', 'medium', 'high']),
  status: String (enum: ['planned', 'active', 'completed']),
  createdBy: ObjectId (ref: 'User', required),
  members: [ObjectId] (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

### Task Model
```javascript
{
  title: String (required, 3-100 chars),
  description: String (required, max 1000 chars),
  status: String (enum: ['pending', 'in-progress', 'completed']),
  assignedTo: ObjectId (ref: 'User'),
  projectId: ObjectId (ref: 'Project', required),
  createdBy: ObjectId (ref: 'User', required),
  createdAt: Date,
  updatedAt: Date
}
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test                 # Run all tests
npm run test:watch      # Run tests in watch mode
npm run lint            # Run ESLint
npm run lint:fix        # Fix linting issues
```

### Frontend Testing
```bash
cd frontend
npm test                 # Run all tests
npm run lint            # Run ESLint
npm run lint:fix        # Fix linting issues
```

## 🚀 Deployment

### Environment Variables

#### Backend (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
MONGODB_URI=mongodb://your-mongodb-connection-string

# JWT Configuration
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRE=7d

# Frontend Configuration
FRONTEND_URL=https://your-domain.com
API_URL=https://api.your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend (.env)
```env
VITE_API_URL=https://api.your-domain.com
```

### Production Deployment

#### Backend (Node.js)
```bash
cd backend
npm install --production
npm start
```

#### Frontend (Vite Build)
```bash
cd frontend
npm run build
# Deploy the 'dist' folder to your web server
```

### Docker Deployment

#### Dockerfile (Backend)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/sprinthub

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

## 📈 Scalability Notes

### Backend Scalability

- **Microservices Ready**: Modular architecture supports service separation
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: MongoDB connection management
- **Caching Ready**: Redis integration points
- **Load Balancing**: Stateless design for horizontal scaling

### Frontend Scalability

- **Component Architecture**: Reusable, maintainable components
- **State Management**: Context API for scalable state
- **Code Splitting**: Lazy loading for performance
- **API Layer**: Centralized API management

## 🛠️ Development Workflow

### Git Workflow
```bash
git checkout -b feature/new-feature
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
# Create pull request
```

### Code Quality
- ESLint for code linting
- Prettier for code formatting
- Git hooks for pre-commit checks
- Automated testing on CI/CD

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Email: support@sprinthub.com
- Documentation: http://localhost:5000/api-docs

## 🙏 Acknowledgments

- Express.js team for the excellent framework
- MongoDB for the robust database
- React team for the amazing UI library
- Tailwind CSS for the utility-first CSS framework
- OpenAPI/Swagger for API documentation standards

---

**Built with ❤️ by the SprintHub Team**
