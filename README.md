# 📅 Task Scheduling & Time-Blocking Planner

A full-stack web application that helps students plan their day intelligently by generating time-blocked schedules, managing tasks with deadlines and priorities, and automatically rescheduling when plans change.

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue.svg)](https://www.postgresql.org/)
[![Express](https://img.shields.io/badge/Express-5.0-lightgrey.svg)](https://expressjs.com/)

## 🎯 Features

### Core Features
- ✅ **Smart Plan Generation** - Automatically creates time-blocked schedules for your day
- ✅ **Task Management** - Add tasks with deadlines, priorities, and estimated time
- ✅ **Busy Blocks** - Define unavailable time slots (classes, meetings, gym)
- ✅ **Intelligent Scheduling Algorithm** - Prioritizes by deadline → priority → duration
- ✅ **Dynamic Rescheduling** - Automatically replans from current time when blocks are missed
- ✅ **Explainable AI** - Each scheduled block includes a reason for its placement

### Advanced Features
- 🔐 **Production-Grade Authentication**
  - Email verification with secure tokens
  - Password reset flow with expiring links
  - Refresh token rotation system
  - HTTP-only cookies for security
  - Rate limiting on sensitive endpoints
  - Bcrypt password hashing

- 📊 **Real-time Schedule Management**
  - Dual view modes: Timeline and Calendar
  - Interactive calendar with day/week/month views
  - Color-coded blocks by priority and status
  - Mark blocks as done/missed
  - Task completion tracking
  - Automatic task rescheduling
  - Visual schedule organized by date and time

- 🛡️ **Security Features**
  - JWT authentication
  - Session management
  - XSS protection
  - CORS configuration
  - Input validation
  - SQL injection prevention

## 🛠️ Tech Stack

### Frontend
- **React 18.3** - UI framework
- **React Router 7** - Navigation
- **React Big Calendar** - Calendar visualization
- **TailwindCSS 4** - Styling
- **Zustand** - State management
- **React Query** - Data fetching
- **React Hook Form** - Form handling
- **Axios** - HTTP client
- **date-fns** - Date formatting
- **Vite** - Build tool

### Backend
- **Node.js 20+** - Runtime
- **Express 5** - Web framework
- **PostgreSQL** - Database
- **node-postgres (pg)** - Database driver
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Nodemailer** - Email service

### Security & Middleware
- **Helmet** - Security headers
- **CORS** - Cross-origin requests
- **Express Rate Limit** - Rate limiting
- **Express Validator** - Input validation

## 📋 Prerequisites

- Node.js 20 or higher
- PostgreSQL 16 or higher
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd planning-project
```

### 2. Database Setup

Create a PostgreSQL database:
```sql
CREATE DATABASE planning_db;
```

Run the schema:
```bash
psql -U postgres -d planning_db -f app-backend/src/db/schema.sql
```

### 3. Backend Setup

```bash
cd app-backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Configure your `.env` file:
```env
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/planning_db
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Email Configuration (for verification & password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourapp.com
```

Start the backend server:
```bash
npm run dev
# or
npm start
```

Backend will run on `http://localhost:5000`

### 4. Frontend Setup

```bash
cd app-frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Configure your `.env` file:
```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000` (or next available port)

## 📚 API Documentation

### Base URL
```
http://localhost:5000
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "message": "Login Successful",
  "user": {
    "id": "1",
    "name": "John Doe",
    "email": "john@example.com",
    "email_verified": false
  },
  "accessToken": "eyJhbGc..."
}
```

#### Forgot Password
```http
POST /auth/forgotpassword
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Reset Password
```http
POST /auth/resetpassword
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass123!"
}
```

#### Refresh Token
```http
POST /auth/refresh
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <token>
```

### Tasks Endpoints

#### Create Task
```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Study Database Concepts",
  "notes": "Focus on normalization and joins",
  "estimated_minutes": 90,
  "deadline_at": "2026-01-26T18:00:00Z",
  "priority": 5
}
```

#### Get All Tasks
```http
GET /api/tasks
Authorization: Bearer <token>
```

#### Get Single Task
```http
GET /api/tasks/:id
Authorization: Bearer <token>
```

#### Update Task
```http
PATCH /api/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "priority": 4,
  "notes": "Updated notes",
  "status": "done"
}
```

#### Delete Task
```http
DELETE /api/tasks/:id
Authorization: Bearer <token>
```

### Busy Blocks Endpoints

#### Create Busy Block
```http
POST /api/busyblocks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "DBMS Lecture",
  "start_at": "2026-01-26T10:00:00Z",
  "end_at": "2026-01-26T11:30:00Z"
}
```

#### Get Busy Blocks
```http
GET /api/busyblocks?date=2026-01-26
Authorization: Bearer <token>
```

#### Delete Busy Block
```http
DELETE /api/busyblocks/:id
Authorization: Bearer <token>
```

### Plans Endpoints

#### Generate Plan
```http
POST /api/plans/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2026-01-26",
  "workStart": "09:00",
  "workEnd": "22:00"
}
```

**Response:**
```json
{
  "date": "2026-01-26",
  "planId": 1,
  "blocks": [
    {
      "id": "1",
      "task_id": "5",
      "start_at": "2026-01-26T09:00:00Z",
      "end_at": "2026-01-26T10:30:00Z",
      "status": "scheduled",
      "reason": "Scheduled: Deadline 26/1/2026"
    }
  ],
  "unscheduled": [],
  "busyBlocks": []
}
```

#### Get Plan
```http
GET /api/plans?date=2026-01-26
Authorization: Bearer <token>
```

#### Mark Block as Done
```http
POST /api/plans/blocks/:blockId/done
Authorization: Bearer <token>
Content-Type: application/json

{
  "markTaskDone": true
}
```

#### Mark Block as Missed (Auto-Reschedule)
```http
POST /api/plans/blocks/:blockId/missed
Authorization: Bearer <token>
Content-Type: application/json

{
  "reschedule": true
}
```

**Response:**
```json
{
  "message": "Block marked as missed and remaining day rescheduled",
  "taskId": "5",
  "rescheduled": true,
  "newBlocks": [
    {
      "id": "10",
      "task_id": "5",
      "start_at": "2026-01-26T12:30:00Z",
      "end_at": "2026-01-26T14:00:00Z",
      "reason": "Rescheduled: Deadline 26/1/2026"
    }
  ]
}
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token_hash TEXT,
  verification_token_expires TIMESTAMPTZ,
  reset_token_hash TEXT,
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Tasks Table
```sql
CREATE TABLE tasks (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  estimated_minutes INT NOT NULL CHECK (estimated_minutes > 0),
  deadline_at TIMESTAMPTZ,
  priority INT NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','done')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Busy Blocks Table
```sql
CREATE TABLE busy_blocks (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);
```

### Plans Table
```sql
CREATE TABLE plans (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  work_start TIME NOT NULL DEFAULT '09:00',
  work_end TIME NOT NULL DEFAULT '22:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, plan_date)
);
```

### Plan Blocks Table
```sql
CREATE TABLE plan_blocks (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  task_id BIGINT REFERENCES tasks(id) ON DELETE SET NULL,
  block_type TEXT NOT NULL DEFAULT 'task' CHECK (block_type IN ('task','break')),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','done','missed')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);
```

## 📁 Project Structure

```
planning-project/
├── app-backend/
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── tasks.controller.js
│   │   │   ├── busyBlocks.controller.js
│   │   │   ├── plans.controller.js
│   │   │   └── users.controller.js
│   │   ├── db/                # Database
│   │   │   ├── pool.js
│   │   │   └── schema.sql
│   │   ├── middleware/        # Express middleware
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   ├── rateLimiter.js
│   │   │   └── validateRequest.js
│   │   ├── routes/            # API routes
│   │   │   ├── auth.routes.js
│   │   │   ├── tasks.routes.js
│   │   │   ├── busyBlocks.routes.js
│   │   │   ├── plans.routes.js
│   │   │   └── users.routes.js
│   │   ├── services/          # Business logic
│   │   │   ├── plannerEngine.js     # Core scheduling algorithm
│   │   │   ├── timeUtils.js
│   │   │   ├── auth/
│   │   │   │   ├── emailVerification.js
│   │   │   │   ├── passwordReset.js
│   │   │   │   └── refreshToken.js
│   │   │   └── email/
│   │   │       ├── emailService.js
│   │   │       └── emailTemplates.js
│   │   ├── utils/             # Utilities
│   │   │   ├── jwt.js
│   │   │   └── password.js
│   │   ├── app.js
│   │   └── index.js
│   ├── package.json
│   └── .env
│
├── app-frontend/
│   ├── src/
│   │   ├── api/               # API client
│   │   │   ├── client.js
│   │   │   ├── authApi.js
│   │   │   ├── tasksApi.js
│   │   │   ├── busyBlocksApi.js
│   │   │   └── plansApi.js
│   │   ├── components/        # React components
│   │   │   ├── auth/
│   │   │   ├── blocks/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── planner/
│   │   │   │   └── CalendarView.jsx
│   │   │   ├── profile/
│   │   │   └── tasks/
│   │   ├── hooks/             # Custom hooks
│   │   ├── pages/             # Page components
│   │   │   ├── auth/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Tasks.jsx
│   │   │   ├── BusyBlocks.jsx
│   │   │   ├── Planner.jsx
│   │   │   └── Profile.jsx
│   │   ├── store/             # State management
│   │   ├── styles/            # Custom styles
│   │   │   └── calendar.css
│   │   ├── utils/             # Utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env
│
├── README.md
└── project-1.md               # Project planning document
```

## 🧮 Planning Algorithm

The core scheduling algorithm follows these steps:

### 1. **Build Free Slots**
- Start with work interval (e.g., 09:00 - 22:00)
- Subtract all busy blocks for the day
- Result: Array of available time slots

### 2. **Sort Tasks**
Priority order:
1. **Deadline** (nearest first, null last)
2. **Priority** (5 = urgent, 1 = low)
3. **Duration** (longer tasks first)

### 3. **Greedy Slot Allocation**
For each task in sorted order:
- Find first available slot that fits
- Create scheduled block
- Update remaining free slots
- If no slot fits → mark as unscheduled

### 4. **Rescheduling on Missed Block**
When a block is marked as "missed":
1. Mark block status as `missed`
2. Keep task as `todo` (can be rescheduled)
3. Delete all future scheduled blocks
4. Rebuild free slots from **current time** to work end
5. Re-run scheduling algorithm
6. Create new blocks with "Rescheduled" reason

## 🎨 Features in Action

### Task Priority Levels
- **5 - Urgent** (Red): Critical deadlines
- **4 - High** (Orange): Important tasks
- **3 - Normal** (Green): Regular tasks
- **2 - Medium** (Blue): Can be delayed
- **1 - Low** (Gray): Nice to have

### Task Status
- **todo** - Pending task
- **done** - Completed task

### Block Status
- **scheduled** - Planned block
- **done** - Completed block
- **missed** - Skipped block (triggers rescheduling)

## 🔒 Security Features

- **Password Security**: Bcrypt hashing with salt rounds
- **Token Security**: JWT with expiration and refresh tokens
- **Session Security**: HTTP-only cookies with secure flag
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Express Validator for request validation
- **SQL Injection**: Parameterized queries
- **XSS Protection**: Helmet security headers
- **CORS**: Configured for specific origins

## 🧪 Testing

### Test User Registration & Login
```bash
# Register
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test123!"}'

# Login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Test Plan Generation
```bash
# Create task
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Study","estimated_minutes":60,"priority":5}'

# Generate plan
curl -X POST http://localhost:5000/api/plans/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-01-26","workStart":"09:00","workEnd":"22:00"}'
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify connection
psql -U postgres -d planning_db -c "SELECT 1;"
```

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### Email Not Sending
- Check SMTP credentials in `.env`
- For Gmail, use App Password (not regular password)
- Enable "Less secure app access" if needed

## 📝 Environment Variables

### Backend (.env)
```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/planning_db
JWT_SECRET=your_jwt_secret_minimum_32_characters
JWT_REFRESH_SECRET=your_refresh_secret_minimum_32_characters
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourapp.com
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

## 🚀 Deployment

### Backend Deployment (Render/Railway/Fly.io)
1. Push code to GitHub
2. Connect repository to hosting service
3. Set environment variables
4. Deploy PostgreSQL database
5. Run database migrations
6. Deploy backend service

### Frontend Deployment (Vercel/Netlify)
1. Push code to GitHub
2. Connect repository to Vercel/Netlify
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Set environment variable: `VITE_API_URL`
6. Deploy

### Database Deployment
- **Supabase**: Free PostgreSQL with 500MB
- **Neon**: Serverless PostgreSQL
- **Railway**: PostgreSQL with free tier
- **ElephantSQL**: Managed PostgreSQL

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Your Name - [your-email@example.com](mailto:your-email@example.com)

## 🙏 Acknowledgments

- React Big Calendar for interactive calendar visualization
- date-fns for date formatting and manipulation
- TailwindCSS for beautiful UI components
- PostgreSQL for reliable data storage
- Express.js community for excellent middleware
- Heroicons for UI icons

## 📞 Support

For support, email your-email@example.com or open an issue in the repository.

---

**Built with ❤️ by [GBKR]**
