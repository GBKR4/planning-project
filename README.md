# 📅 Task Scheduling & Time-Blocking Planner

A full-stack web application that helps students plan their day intelligently by generating time-blocked schedules, managing tasks with deadlines and priorities, and automatically rescheduling when plans change.

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue.svg)](https://www.postgresql.org/)
[![Express](https://img.shields.io/badge/Express-5.0-lightgrey.svg)](https://expressjs.com/)

## ✨ What's New - March 2026

🔔 **Multi-Channel Notification System** - Production-ready notification system with:
- Email notifications via Resend API
- In-app notification center with real-time updates
- Automated scheduler with smart timing (5 min before tasks)
- 8 notification types including task reminders, overdue alerts, and daily summaries
- Fully customizable user preferences
- Duplicate prevention and timezone-aware scheduling

📸 **User Profiles** - Upload profile photos, set time preferences, and customize your experience

🎨 **Enhanced UI** - Improved notification bell, dropdown menu, and user-friendly interfaces

[View Full Changelog](#-features) | [Quick Start](#-quick-start) | [API Docs](#-api-documentation)

---

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

- � **Multi-Channel Notification System**
  - Email notifications via Resend API
  - In-app notification center with real-time updates
  - Push notification framework (Web Push API ready)
  - Automated scheduler with cron jobs
  - Smart notification types:
    - Task starting reminders (5 min before)
    - Deadline approaching alerts
    - Overdue task warnings
    - Plan generation confirmations
    - Schedule conflict alerts
    - Daily summary digests
  - Customizable notification preferences
  - User-configurable reminder timing (default: 5 minutes)
  - Duplicate prevention (won't spam within 1 hour)
  - Timezone-aware scheduling (America/New_York)
  - Consistent notification timing (no random alerts)

- 📊 **Real-time Schedule Management**
  - Dual view modes: Timeline and Calendar
  - Interactive calendar with day/week/month views
  - Color-coded blocks by priority and status
  - Mark blocks as done/missed
  - Task completion tracking
  - Automatic task rescheduling
  - Visual schedule organized by date and time
  - Smart filtering (only shows relevant future blocks)

- 🛡️ **Security Features**
  - JWT authentication
  - Session management
  - XSS protection
  - CORS configuration
  - Input validation
  - SQL injection prevention
  - File upload validation (profile photos)

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
- **Nodemailer** - Email service (deprecated, migrated to Resend)
- **Resend** - Modern email API for transactional emails
- **node-cron** - Task scheduling and automation
- **web-push** - Web Push notifications (framework ready)
- **Multer** - File upload handling (profile photos)

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

### 3. Get API Keys

#### Resend API Key (for notifications)
1. Go to [resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day)
3. Create an API key
4. Copy the key (starts with `re_`)

#### VAPID Keys (for push notifications - optional)
```bash
cd app-backend
npx web-push generate-vapid-keys
```
Copy both public and private keys for your `.env` file

### 4. Backend Setup

```bash
cd app-backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Configure your `.env` file:
```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/planning_db

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here

# Email (for auth emails)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourapp.com

# Resend API (for notifications)
RESEND_API_KEY=re_your_resend_api_key_from_step_3

# Web Push (optional - for push notifications)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your-email@example.com
```

Start the backend server:
```bash
npm run dev
# or
npm start
```

Backend will run on `http://localhost:5000`

**Note**: The notification scheduler starts automatically when the backend runs. You'll see console messages every 5-15 minutes checking for notifications to send.

### 5. Frontend Setup

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

### Notifications Endpoints

#### Get All Notifications
```http
GET /api/notifications
Authorization: Bearer <token>
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "1",
      "user_id": "1",
      "type": "task_starting",
      "title": "🚀 Time to Start Task",
      "message": "Your task \"Review emails\" is scheduled to start in 5 minutes at 3:00 PM!",
      "is_read": false,
      "sent_via_email": true,
      "sent_via_push": false,
      "related_task_id": "5",
      "related_plan_id": "2",
      "created_at": "2026-03-04T14:55:00Z"
    }
  ],
  "unreadCount": 1
}
```

#### Mark Notification as Read
```http
PATCH /api/notifications/:id/read
Authorization: Bearer <token>
```

#### Mark All Notifications as Read
```http
POST /api/notifications/mark-all-read
Authorization: Bearer <token>
```

#### Delete Notification
```http
DELETE /api/notifications/:id
Authorization: Bearer <token>
```

#### Get Notification Preferences
```http
GET /api/notifications/preferences
Authorization: Bearer <token>
```

**Response:**
```json
{
  "preferences": {
    "id": "1",
    "user_id": "1",
    "email_enabled": true,
    "push_enabled": false,
    "task_reminders": true,
    "overdue_alerts": true,
    "plan_updates": true,
    "schedule_conflicts": true,
    "reminder_time_minutes": 5,
    "created_at": "2026-03-04T10:00:00Z",
    "updated_at": "2026-03-04T15:30:00Z"
  }
}
```

#### Update Notification Preferences
```http
PATCH /api/notifications/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "email_enabled": true,
  "push_enabled": false,
  "task_reminders": true,
  "reminder_time_minutes": 5
}
```

#### Subscribe to Push Notifications
```http
POST /api/notifications/subscribe
Authorization: Bearer <token>
Content-Type: application/json

{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "BN...",
      "auth": "Iu..."
    }
  }
}
```

### Users Endpoints

#### Get Current User Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "1",
    "name": "John Doe",
    "email": "john@example.com",
    "email_verified": true,
    "profile_photo_url": "/uploads/profiles/user-1-1234567890.jpg",
    "time_preference": "morning",
    "created_at": "2026-03-01T10:00:00Z"
  }
}
```

#### Update User Profile
```http
PATCH /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "time_preference": "evening"
}
```

#### Upload Profile Photo
```http
POST /api/users/profile-photo
Authorization: Bearer <token>
Content-Type: multipart/form-data

profilePhoto: <file>
```

**Response:**
```json
{
  "message": "Profile photo uploaded successfully",
  "profile_photo_url": "/uploads/profiles/user-1-1709567890.jpg"
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
  profile_photo_url TEXT,
  time_preference TEXT NOT NULL DEFAULT 'anytime' CHECK (time_preference IN ('morning','evening','anytime')),
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
  time_preference TEXT NOT NULL DEFAULT 'anytime' CHECK (time_preference IN ('morning','evening','anytime')),
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

### Notifications Table
```sql
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'task_reminder',
    'task_starting',
    'task_overdue',
    'plan_created',
    'schedule_conflict',
    'task_completed',
    'busy_block_added',
    'daily_summary'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  sent_via_email BOOLEAN NOT NULL DEFAULT FALSE,
  sent_via_push BOOLEAN NOT NULL DEFAULT FALSE,
  related_task_id BIGINT REFERENCES tasks(id) ON DELETE CASCADE,
  related_plan_id BIGINT REFERENCES plans(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Notification Preferences Table
```sql
CREATE TABLE notification_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  task_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  overdue_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  plan_updates BOOLEAN NOT NULL DEFAULT TRUE,
  schedule_conflicts BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_time_minutes INT NOT NULL DEFAULT 5 CHECK (reminder_time_minutes > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Push Subscriptions Table
```sql
CREATE TABLE push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
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
│   │   │   ├── email/
│   │   │   │   ├── emailService.js
│   │   │   │   └── emailTemplates.js
│   │   │   └── notifications/
│   │   │       ├── notificationService.js      # Core notification logic
│   │   │       ├── emailNotificationService.js # Email sending via Resend
│   │   │       ├── pushNotificationService.js  # Web Push notifications
│   │   │       └── notificationScheduler.js    # Automated cron jobs
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
│   │   │   ├── authApi.js
│   │   │   ├── tasksApi.js
│   │   │   ├── busyBlocksApi.js
│   │   │   ├── plansApi.js
│   │   │   ├── notificationsApi.js
│   │   │   └── usersApi.js
│   │   ├── components/        # React components
│   │   │   ├── auth/
│   │   │   ├── blocks/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── Layout.jsx
│   │   │   ├── notifications/
│   │   │   │   ├── NotificationBell.jsx
│   │   │   │   ├── NotificationDropdown.jsx
│   │   │   │   ├── NotificationItem.jsx
│   │   │   │   ├── NotificationPreferences.jsx
│   │   │   │   └── PushNotificationPrompt.jsx
│   │   │   ├── planner/
│   │   │   │   └── CalendarView.jsx
│   │   │   ├── profile/
│   │   │   └── tasks/
│   │   ├── hooks/             # Custom hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useTasks.js
│   │   │   ├── usePlans.js
│   │   │   ├── useNotifications.js
│   │   │   └── useBusyBlocks.js
│   │   ├── pages/             # Page components
│   │   │   ├── auth/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Tasks.jsx
│   │   │   ├── BusyBlocks.jsx
│   │   │   ├── Planner.jsx
│   │   │   ├── Notifications.jsx
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
└── README.md
```

## 🔔 Notification System

The application includes a comprehensive multi-channel notification system that keeps users informed about their schedule.

### Notification Types

1. **task_starting** - Sent 5 minutes before a scheduled task begins
2. **task_reminder** - Deadline approaching alerts
3. **task_overdue** - Overdue task warnings
4. **plan_created** - Confirmation when a new plan is generated
5. **schedule_conflict** - Alerts for scheduling conflicts
6. **task_completed** - Task completion confirmations
7. **busy_block_added** - Busy block creation notifications
8. **daily_summary** - End-of-day summary (8:00 PM)

### Automated Schedulerthon System

The notification scheduler runs continuously in the background using node-cron with four automated jobs:

1. **Task Starting Check** (every 5 minutes)
   - Checks for tasks starting within the reminder window (default: 5 minutes)
   - Sends notifications exactly 5 minutes before task starts
   - Timezone-aware: America/New_York

2. **Deadline Check** (every 15 minutes)
   - Monitors task deadlines approaching
   - Respects user's reminder time preference
   - Prevents duplicate notifications (1-hour window)

3. **Overdue Check** (every hour)
   - Identifies overdue tasks
   - Sends alerts for tasks past their deadline
   - Only for tasks still marked as 'todo'

4. **Daily Summary** (8:00 PM daily)
   - Sends end-of-day summary
   - Shows completed vs pending tasks
   - Provides productivity insights

### Notification Channels

#### 1. Email Notifications
- Powered by Resend API
- Professional HTML email templates
- Instant delivery
- Configurable per user

#### 2. In-App Notifications
- Real-time notification center
- Notification bell with unread count
- Dropdown with recent notifications
- Mark as read functionality
- Color-coded by type

#### 3. Push Notifications (Framework Ready)
- Web Push API integration
- Service worker support
- Browser permission handling
- VAPID keys configured
- Ready for production deployment

### Smart Features

- **Duplicate Prevention**: Won't send same notification within 1 hour
- **Consistent Timing**: Always 5 minutes before task starts (no random alerts)
- **User Preferences**: Fully customizable notification settings
- **Timezone Handling**: All notifications respect user timezone
- **Graceful Failures**: Notification errors don't break application flow
- **Intelligent Filtering**: Shows only relevant future blocks in schedule

### Configuration

Set these environment variables in `app-backend/.env`:

```env
# Resend Email API
RESEND_API_KEY=re_your_resend_api_key_here

# Web Push (VAPID Keys)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your-email@example.com
```

### How It Works

1. User generates a plan or task approaches deadline
2. Scheduler checks every 5-15 minutes (depending on job type)
3. Identifies tasks/events within notification window
4. Checks user preferences (email enabled? push enabled?)
5. Sends notification via enabled channels
6. Creates in-app notification record
7. Marks notification as sent to prevent duplicates

### Notification Flow Example

```
Task: "Review emails" scheduled at 3:00 PM

2:55 PM → Scheduler runs check
2:55 PM → Finds task starting in 5 minutes
2:55 PM → Checks user preferences (email: ✓, push: ✗)
2:55 PM → Sends email notification
2:55 PM → Creates in-app notification
2:55 PM → User receives email and sees notification bell
3:00 PM → Task starts on schedule
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

### Notifications Not Working
```bash
# Check backend logs for scheduler errors
cd app-backend
node src/index.js

# Look for these messages in console:
# "✅ Notification scheduler started successfully"
# "🔍 Checking for tasks about to start..."
# "📬 Found X tasks about to start"
```

**Common Issues:**
- **No Resend API Key**: Get one from [resend.com](https://resend.com)
- **Wrong timezone**: Scheduler uses America/New_York (check notificationScheduler.js)
- **No tasks in reminder window**: Tasks must start within 5 minutes to trigger
- **Preferences disabled**: Check user's notification preferences
- **Duplicate prevention**: System won't send same notification within 1 hour

**Test notifications manually:**
```bash
cd app-backend
# Check current notification settings
node -e "import('./src/db/pool.js').then(p => p.default.query('SELECT * FROM notification_preferences WHERE user_id=1').then(r => console.log(r.rows)))"
```

### Scheduler Not Running
- Check backend logs for cron job messages
- Verify node-cron is installed: `npm list node-cron`
- Ensure backend is running continuously (not just during requests)
- Check for syntax errors in notificationScheduler.js

## 📝 Environment Variables

### Backend (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/planning_db

# JWT Authentication
JWT_SECRET=your_jwt_secret_minimum_32_characters
JWT_REFRESH_SECRET=your_refresh_secret_minimum_32_characters

# Email Service (Legacy - for auth emails)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourapp.com

# Resend API (for notifications)
RESEND_API_KEY=re_your_resend_api_key_here

# Web Push Notifications (VAPID Keys)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your-email@example.com
```

**To generate VAPID keys:**
```bash
cd app-backend
npx web-push generate-vapid-keys
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

## � Acknowledgments

- **React Big Calendar** - Interactive calendar visualization
- **date-fns** - Date formatting and manipulation
- **TailwindCSS** - Beautiful UI components
- **PostgreSQL** - Reliable data storage
- **Express.js** - Robust web framework and middleware ecosystem
- **Heroicons** - Beautiful UI icons
- **Resend** - Modern email delivery API
- **node-cron** - Reliable task scheduling
- **web-push** - Web Push notification support
- **React Query** - Powerful data fetching and caching
- **Zustand** - Simple and efficient state management

## 💡 Key Features Highlights

### ✅ Production-Ready Authentication System
- Complete email verification flow
- Secure password reset with expiring tokens
- JWT-based authentication with refresh tokens
- HTTP-only cookies for maximum security

### ✅ Intelligent Scheduling Algorithm
- Priority-based task allocation
- Deadline-aware planning
- Automatic conflict resolution
- Smart rescheduling when plans change

### ✅ Multi-Channel Notification System
- Email notifications via Resend API
- In-app notification center
- Push notification framework (production-ready)
- Automated scheduler with 4 cron jobs
- Customizable preferences per user

### ✅ Modern Tech Stack
- React 18.3 with latest features
- Express 5 with async error handling
- PostgreSQL with optimized queries
- TailwindCSS 4 for styling
- TypeScript-ready architecture

## 📞 Support

For support, open an issue in the repository or contact the development team.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ for students who want to manage their time effectively**

*Last Updated: March 2026*
