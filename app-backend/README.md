# Planning Project API

A comprehensive task planning and scheduling API with AI-powered task scheduling, built with Node.js, Express, and PostgreSQL.

## Features

- ✅ **Complete Authentication System** - JWT tokens, email verification, password reset
- ✅ **AI Task Scheduling** - Intelligent algorithm for optimal task planning
- ✅ **Task Management** - Full CRUD operations with priority and deadlines
- ✅ **Daily Planning** - Generate optimized daily schedules
- ✅ **Busy Blocks** - Mark unavailable time slots (classes, meetings, etc.)
- ✅ **Email Service** - Verification and password reset emails via Resend API
- ✅ **Security** - Helmet, CORS, rate limiting, SQL injection prevention
- ✅ **Production Ready** - Comprehensive error handling and validation
- ✅ **Tested** - 99 integration tests across 6 suites (Jest + Supertest)

## Testing

The backend has a comprehensive integration test suite using **Jest** and **Supertest**.

### Run Tests
```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (re-runs on file changes)
npm run test:watch
```

### Test Suites (99 tests total)

| Suite | Tests | Coverage |
|---|---|---|
| `auth.test.js` | 14 | register, login, logout, profile, forgot-password |
| `tasks.test.js` | 17 | full CRUD, auth guards, ownership checks |
| `plans.test.js` | 18 | plan generation, mark-done, mark-missed, reschedule |
| `busyBlocks.test.js` | 9 | create, list, delete |
| `notifications.test.js` | 14 | preferences, mark read, VAPID public key |
| `users.test.js` | 12 | profile update, password change, admin operations |

### Technical Setup

- **Native ESM** — runs with `node --experimental-vm-modules`, no Babel transform
- **`jest.unstable_mockModule()`** — correct ESM mock pattern for mocking `pool.js` and `emailService.js`
- **No DB required** — all PostgreSQL calls are mocked; tests run fully offline
- Shared helper `tests/helpers.js` provides `makeToken(userId)` for JWT generation

---

## Tech Stack

- **Runtime:** Node.js 24+
- **Framework:** Express 5.2.1
- **Database:** PostgreSQL with pg 8.16.3
- **Authentication:** JWT with refresh token rotation
- **Email:** Resend API 6.7.0
- **Security:** Helmet, CORS, bcrypt, rate-limit
- **Testing:** Jest 30, Supertest 7
- **Development:** nodemon for hot reload

## Prerequisites

- Node.js >= 20
- PostgreSQL database
- Resend account (free tier: 100 emails/day)

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create/edit `.env` file with these settings:
```env
# Server
PORT=5000

# Database
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=planning-project
DB_PORT=5432

# JWT Secrets (change these in production!)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
ACCESS_TOKEN_SECRET=your_access_token_secret_key_change_this_in_production
REFRESH_TOKEN_SECRET=your_refresh_token_secret_key_change_this_in_production

# Token Expiration
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d
RESET_TOKEN_EXPIRES=1h
VERIFICATION_TOKEN_EXPIRES=24h

# Email Service (Resend API)
RESEND_API_KEY=your_resend_api_key_from_resend.com
EMAIL_FROM=onboarding@resend.dev

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# Security
SALT_LENGTH=10
```

### 3. Set Up Database
Create the database:
```bash
# Using PostgreSQL command line
psql -U postgres
CREATE DATABASE "planning-project";
\c planning-project
```

Run the schema:
```bash
psql -U postgres -d planning-project -f src/db/schema.sql
```

The schema creates 7 tables:
- `users` - User accounts with authentication fields
- `tasks` - User tasks with priorities and deadlines
- `plans` - Daily work schedules
- `plan_blocks` - Time blocks within plans
- `busy_blocks` - Unavailable time periods
- `refresh_tokens` - JWT refresh token storage
- `sessions` - Active user sessions


### 4. Get Resend API Key
1. Sign up at [resend.com](https://resend.com/signup) (free tier available)
2. Go to [API Keys](https://resend.com/api-keys)
3. Create a new API key
4. Copy and paste it into `.env` as `RESEND_API_KEY`

### 5. Run the Application

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication (7 endpoints)
- `POST /auth/register` - Register new user + send verification email
- `GET /auth/verifyemail?token=<token>` - Verify email address
- `POST /auth/resend-verification` - Resend verification email
- `POST /auth/login` - Login user (returns JWT tokens)
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `POST /auth/forgot-password` - Request password reset email
- `POST /auth/reset-password` - Reset password with token

### Users (4 endpoints)
- `GET /api/profile` - Get current user profile (protected)
- `GET /users` - Get all users (protected)
- `GET /users/:id` - Get user by ID (protected)
- `DELETE /users/:id` - Delete user (protected)

### Tasks (5 endpoints)
- `GET /tasks` - Get all user tasks (protected)
- `POST /tasks` - Create new task (protected)
- `GET /tasks/:id` - Get task by ID (protected)
- `PATCH /tasks/:id` - Update task (protected)
- `DELETE /tasks/:id` - Delete task (protected)

### Busy Blocks (3 endpoints)
- `GET /busy-blocks` - Get all busy blocks (protected)
- `POST /busy-blocks` - Create busy block (protected)
- `DELETE /busy-blocks/:id` - Delete busy block (protected)

### Plans (6 endpoints)
- `POST /plans` - Create daily plan (protected)
- `POST /plans/blocks` - Add block to plan (protected)
- `POST /plans/generate` - **Generate AI-optimized plan** (protected)
- `GET /plans?date=YYYY-MM-DD` - Get plan by date (protected)
- `GET /plans/all` - Get all user plans (protected)
- `DELETE /plans/:id` - Delete plan (protected)

### Health Check
- `GET /health` - Check API and database connectivity

**Total: 25 API endpoints**

## AI Task Scheduling

The planner engine uses an intelligent algorithm to schedule tasks:

1. **Priority-based**: Considers task priority (1-5)
2. **Deadline-aware**: Prioritizes tasks with upcoming deadlines
3. **Duration-optimized**: Fits tasks into available time slots
4. **Conflict-free**: Avoids busy blocks (classes, meetings, etc.)
5. **Free time calculation**: Automatically finds available slots

### How to Use AI Scheduling

```bash
# 1. Add tasks
POST /tasks
{
  "title": "Study Math",
  "estimated_minutes": 60,
  "deadline_at": "2026-01-25T18:00:00Z",
  "priority": 5
}

# 2. Add busy blocks (classes, meetings)
POST /busy-blocks
{
  "title": "Math Class",
  "start_at": "2026-01-21T09:00:00Z",
  "end_at": "2026-01-21T10:30:00Z"
}

# 3. Generate optimized plan
POST /plans/generate
{
  "date": "2026-01-21",
  "workStart": "09:00",
  "workEnd": "22:00"
}
```

The engine will automatically:
- Schedule high-priority tasks first
- Respect deadlines
- Avoid busy blocks
- Optimize time usage
- Report unscheduled tasks if time is insufficient


## Project Structure
```
src/
├── app.js                          # Express app setup & middleware
├── index.js                        # Server entry point
├── controllers/                    # Route controllers
│   ├── auth.controller.js         # Authentication endpoints
│   ├── users.controller.js        # User management
│   ├── tasks.controller.js        # Task CRUD operations
│   ├── plans.controller.js        # Planning & AI scheduling
│   └── busyBlocks.controller.js   # Busy blocks management
├── db/                            # Database configuration
│   ├── pool.js                   # PostgreSQL connection pool
│   └── schema.sql                # Database schema (7 tables)
├── middleware/                    # Custom middleware
│   ├── auth.js                   # JWT authentication
│   └── errorHandler.js           # Error handling & async wrapper
├── routes/                        # API routes
│   ├── auth.routes.js
│   ├── users.routes.js
│   ├── tasks.routes.js
│   ├── plans.routes.js
│   └── busyBlocks.routes.js
├── services/                      # Business logic
│   ├── plannerEngine.js          # AI task scheduling algorithm
│   ├── timeUtils.js              # Time slot calculations
│   ├── auth/                     # Authentication services
│   │   ├── emailVerification.js
│   │   ├── passwordReset.js
│   │   └── refreshToken.js
│   └── email/                    # Email services
│       ├── emailService.js       # Resend API integration
│       └── emailTemplates.js     # Email templates
└── utils/                         # Utilities
    ├── jwt.js                    # JWT token functions
    └── password.js               # Password hashing (bcrypt)
```

## Security Features

### Authentication & Authorization
- JWT-based authentication with access & refresh tokens
- Token rotation on refresh for security
- HTTP-only cookies to prevent XSS attacks
- Password hashing with bcrypt (10 rounds)
- Email verification required
- Secure password reset flow

### API Security
- **Helmet.js** - Security headers (XSS, clickjacking, etc.)
- **CORS** - Cross-origin resource sharing protection
- **Rate Limiting** - 100 requests per 15 minutes
- **SQL Injection Prevention** - Parameterized queries
- **Input Validation** - Request validation on all endpoints

### Token Expiration
- Access Token: 15 minutes
- Refresh Token: 7 days
- Verification Token: 24 hours
- Reset Token: 1 hour

## Testing

### Health Check
```bash
curl http://localhost:5000/health
```

### Register User
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"Test123!"}'
```

### Login
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"john@example.com","password":"Test123!"}'
```

### Access Protected Route
```bash
curl http://localhost:5000/api/profile -b cookies.txt
```

### Generate AI Plan
```bash
curl -X POST http://localhost:5000/plans/generate \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"date":"2026-01-21","workStart":"09:00","workEnd":"22:00"}'
```

## Documentation

- **[AUTH_API_DOCUMENTATION.md](./AUTH_API_DOCUMENTATION.md)** - Complete authentication API guide
- **[src/db/schema.sql](./src/db/schema.sql)** - Database schema with all tables

## Environment Configuration

See `.env` file for all required environment variables:
- Database credentials
- JWT secrets (change in production!)
- Email service configuration
- Token expiration settings
- Frontend URL for email links

## Production Deployment

### Before Deploying:
1. ✅ Change all JWT secrets to strong random strings
2. ✅ Use production-grade database (not localhost)
3. ✅ Set `NODE_ENV=production`
4. ✅ Configure production email domain in Resend
5. ✅ Enable HTTPS/SSL
6. ✅ Set proper CORS origins
7. ✅ Review rate limits for your use case

## Troubleshooting

### Database Connection Failed
- Check PostgreSQL is running
- Verify database credentials in `.env`
- Ensure database exists: `CREATE DATABASE "planning-project";`

### Email Not Sending
- Verify `RESEND_API_KEY` is set correctly
- Check Resend dashboard for errors
- Free tier: 100 emails/day, 3,000/month

### Token Expired
- Use `/auth/refresh` endpoint to get new access token
- Refresh token valid for 7 days

### CORS Errors
- Ensure `FRONTEND_URL` in `.env` matches your frontend

## License

ISC

## Status

✅ **Production Ready**
- All 25 endpoints implemented and tested
- Complete authentication system
- AI task scheduling working
- Database schema complete
- Security features active
- Email service configured
- Error handling comprehensive
