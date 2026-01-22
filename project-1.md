# Task Scheduling & Time‑Blocking Planner (Constraints + Rescheduling) — Simple Handover (Postgres + Express + React)

## 1) Project Description

A web app that helps a student plan their day:

*   Add tasks with **deadline + estimated time + priority**
*   Add **busy time blocks** (classes, commute, gym)
*   Click **Generate Plan** → app creates a **time‑blocked schedule** for today
*   If a scheduled block is missed → click **Missed** → app **replans the remaining day**
*   Each block shows a small **reason** (“why this was scheduled here”)

✅ The standout part is the **planning logic** + **rescheduling** (not just CRUD).

***

## 2) Scope (Keep it finishable)

### MVP (7–10 days)

1.  Register/Login
2.  Task CRUD
3.  Busy Blocks CRUD
4.  Generate plan for **one day**
5.  Calendar view for plan
6.  Block actions: **Done / Missed**
7.  Missed → reschedule remaining blocks

### Stretch (only if time)

*   Break insertion (10 min after long tasks)
*   Preferences: morning/evening tasks
*   Reminders (cron/queue)
*   Export schedule (CSV / ICS)

***

## 3) Tech Stack (Simple + Resume‑worthy)

### Frontend

*   **React** (JS or TS)
*   **React Big Calendar** (simple calendar UI) OR FullCalendar
*   Fetch layer: plain `fetch` or Axios

### Backend

*   **Node.js + Express**
*   **PostgreSQL**
*   **pg** (node-postgres) — simple SQL queries, no ORM
*   Auth: JWT (access token)

### Dev setup

*   Local Postgres via Docker (recommended)
*   Deploy: Render/Fly.io + Supabase/Neon (Postgres)

***

## 4) Database (Postgres) — Simple Schema (No fancy versioning)

We’ll store:

*   users
*   tasks
*   busy\_blocks
*   plans (one plan per user per date)
*   plan\_blocks (the actual scheduled blocks inside a plan)

### `db/schema.sql` (run once)

```sql
-- USERS
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TASKS
CREATE TABLE IF NOT EXISTS tasks (
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

-- BUSY TIME BLOCKS (classes/commute)
CREATE TABLE IF NOT EXISTS busy_blocks (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);

-- DAILY PLAN (one per user per date)
CREATE TABLE IF NOT EXISTS plans (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  work_start TIME NOT NULL DEFAULT '09:00',
  work_end TIME NOT NULL DEFAULT '22:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, plan_date)
);

-- BLOCKS INSIDE A PLAN
CREATE TABLE IF NOT EXISTS plan_blocks (
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

CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_busy_user ON busy_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_blocks_plan ON plan_blocks(plan_id);
```

**Why this is simple:** It’s just tables and straightforward queries. No migrations framework required for MVP.

***

## 5) Features + How to Achieve Them (Simple Implementation)

### 5.1 Plan Generation (core feature)

**Inputs**

*   Tasks (todo)
*   Busy blocks for that day
*   Work hours (09:00–22:00)

**Output**

*   A list of scheduled time blocks + list of unscheduled tasks

#### Planning Algorithm (Simple and explainable)

##### Step A — Build free slots

1.  Create working interval for the day: `workStart → workEnd`
2.  Fetch busy blocks for that date
3.  Sort busy blocks by start time
4.  Subtract busy blocks from work interval → produce free slots

Example:

*   Work: 09:00–22:00
*   Busy: 10:30–12:00, 16:00–17:00
*   Free: 09:00–10:30, 12:00–16:00, 17:00–22:00

##### Step B — Sort tasks

Sort tasks by:

1.  nearest `deadline_at` first (null deadlines go last)
2.  higher `priority` first
3.  larger `estimated_minutes` first (helps fit big tasks early)

##### Step C — Fit tasks into slots (greedy)

For each task:

*   Find first slot where it fits
*   Create a plan block for that time range
*   Shrink the slot start forward
*   If no slot fits → mark unscheduled with reason “Not enough free time”

✅ This is easy to implement and easy to defend in interviews.

***

### 5.2 Rescheduling (when a block is missed)

When user clicks **Missed** on a block:

**Goal:** Replan only remaining day, not everything.

**Simplest approach:**

1.  Mark that block `status = missed`
2.  Delete all future blocks that are still `scheduled` and start after `now`
3.  Rebuild free slots from `now → workEnd` (subtract busy blocks and also subtract any blocks already done)
4.  Take remaining tasks (todo + missed task if still todo)
5.  Run the same scheduler again and insert new blocks

This gives a clean “dynamic replanning” experience without complexity.

***

### 5.3 Explainability (“reason”)

Store a short text per block like:

*   `"Reason: earliest deadline + free slot available"`
*   `"Reason: high priority task scheduled in earliest available slot"`

Keep it as a string field (`reason`)—super simple and still impressive.

***

## 6) API Contract (Simple REST)

**Base:** `/api/v1`  
**Auth:** `Authorization: Bearer <token>`

### 6.1 Auth

#### `POST /auth/register`

```json
{ "name": "A", "email": "a@mail.com", "password": "Secret123!" }
```

#### `POST /auth/login`

```json
{ "email": "a@mail.com", "password": "Secret123!" }
```

Response:

```json
{ "token": "jwtTokenHere", "user": { "id": 1, "name": "A", "email": "a@mail.com" } }
```

***

### 6.2 Tasks

#### `POST /tasks`

```json
{
  "title": "Revise Unit 3",
  "notes": "Focus on joins",
  "estimatedMinutes": 90,
  "deadlineAt": "2026-01-12T18:00:00.000Z",
  "priority": 5
}
```

#### `GET /tasks`

Optional filters:

*   `GET /tasks?status=todo`
*   `GET /tasks?from=2026-01-10&to=2026-01-12`

#### `PATCH /tasks/:taskId`

```json
{ "priority": 4, "status": "done" }
```

#### `DELETE /tasks/:taskId`

***

### 6.3 Busy Blocks

#### `POST /busy-blocks`

```json
{
  "title": "DBMS class",
  "startAt": "2026-01-10T10:30:00.000Z",
  "endAt": "2026-01-10T12:00:00.000Z"
}
```

#### `GET /busy-blocks?date=2026-01-10`

#### `DELETE /busy-blocks/:blockId`

***

### 6.4 Plan

#### `POST /plan/generate`

Body:

```json
{
  "date": "2026-01-10",
  "workStart": "09:00",
  "workEnd": "22:00"
}
```

Response:

```json
{
  "date": "2026-01-10",
  "planId": 7,
  "blocks": [
    {
      "id": 31,
      "type": "task",
      "taskId": 12,
      "startAt": "2026-01-10T09:00:00.000Z",
      "endAt": "2026-01-10T10:30:00.000Z",
      "status": "scheduled",
      "reason": "Earliest deadline + fits in first free slot"
    }
  ],
  "unscheduled": [
    { "taskId": 99, "reason": "Not enough free time today" }
  ]
}
```

#### `GET /plan?date=2026-01-10`

Returns saved plan + blocks for that day.

***

### 6.5 Plan Block Actions

#### `POST /plan/blocks/:blockId/done`

Marks block done; optionally marks task done:

```json
{ "markTaskDone": true }
```

#### `POST /plan/blocks/:blockId/missed`

Triggers reschedule from now:

```json
{ "reschedule": true }
```

Response:

```json
{
  "message": "Rescheduled remaining blocks",
  "blocks": [ /* updated blocks */ ]
}
```

***

## 7) Folder Structure (Beginner‑friendly)

### Backend (Express + pg)

    planner-api/
      src/
        index.js                  // start server
        app.js                    // express app
        db/
          pool.js                 // pg Pool setup
          schema.sql              // run once to create tables
        middleware/
          auth.js                 // JWT verify
          error.js                // error handler
        routes/
          auth.routes.js
          tasks.routes.js
          busyBlocks.routes.js
          plan.routes.js
        controllers/
          auth.controller.js
          tasks.controller.js
          busyBlocks.controller.js
          plan.controller.js
        services/
          plannerEngine.js        // generate plan blocks (core logic)
          timeUtils.js            // helper: merge/subtract intervals
        utils/
          jwt.js
          password.js             // bcrypt hashing
      package.json
      .env.example

### Frontend (React)

    planner-web/
      src/
        api/
          client.js
          authApi.js
          tasksApi.js
          busyBlocksApi.js
          planApi.js
        pages/
          Login.jsx
          Tasks.jsx
          BusyBlocks.jsx
          Planner.jsx
        components/
          TaskForm.jsx
          BusyBlockForm.jsx
          CalendarView.jsx
          BlockDetails.jsx
        App.jsx
        main.jsx
      package.json
      .env.example

***

## 8) Build Order (Do this in sequence)

1.  **Backend**
    *   connect Postgres using `pg`
    *   run `schema.sql`
    *   implement register/login (JWT)
2.  Task CRUD
3.  Busy Blocks CRUD
4.  Implement `plannerEngine.generatePlan(date, workStart, workEnd)`
5.  Plan generate endpoint: write blocks into `plans` + `plan_blocks`
6.  Block actions: done/missed + reschedule
7.  **Frontend**
    *   Tasks page
    *   Busy blocks page
    *   Planner page with calendar + Generate button
    *   Done/Missed buttons

***

## 9) What makes it “stand out” (even kept simple)

*   A real **algorithm** (slot generation + task allocation)
*   Real **rescheduling** behavior (not just editing)
*   Calendar visualization + “reason” per block
*   Postgres + clean REST APIs

***

