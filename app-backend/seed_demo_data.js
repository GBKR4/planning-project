/**
 * seed_demo_data.js
 * -----------------
 * Seeds realistic tasks, busy blocks, and sample notifications for a user
 * so you can explore the full notification system in action.
 *
 * Usage:
 *   node seed_demo_data.js                     → seeds first user found
 *   node seed_demo_data.js you@email.com       → seeds specific user
 *   node seed_demo_data.js you@email.com your-password
 *   node seed_demo_data.js you@email.com,your-password
 *   node seed_demo_data.js --reset             → clears then re-seeds first user
 *   node seed_demo_data.js you@email.com --reset
 */

import 'dotenv/config';
import pool from './src/db/pool.js';
import { hashPassword } from './src/utils/password.js';

// ── helpers ──────────────────────────────────────────────────────────────────

/** Returns a Date offset from now by the given amount. */
const fromNow = (unit, amount) => {
  const d = new Date();
  if (unit === 'minutes') d.setMinutes(d.getMinutes() + amount);
  if (unit === 'hours')   d.setHours(d.getHours() + amount);
  if (unit === 'days')    d.setDate(d.getDate() + amount);
  return d.toISOString();
};

/** Returns ISO string for TODAY at a fixed clock time (HH:MM). */
const todayAt = (hh, mm = 0) => {
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
};

/** Returns ISO string for a day offset at a fixed clock time. */
const dayAt = (dayOffset, hh, mm = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
};

/** Returns local YYYY-MM-DD instead of UTC date slice. */
const localDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Parses email/password from args, supporting either separate args or email,password. */
const parseCredentials = (args) => {
  const positionals = args.filter(arg => !arg.startsWith('--'));
  const combined = positionals.find(arg => arg.includes('@') && arg.includes(','));

  if (combined) {
    const [email, password] = combined.split(/,(.+)/);
    return {
      email: email?.trim().toLowerCase() || null,
      password: password?.trim() || null,
    };
  }

  const emailIndex = positionals.findIndex(arg => arg.includes('@'));
  if (emailIndex === -1) {
    return { email: null, password: null };
  }

  return {
    email: positionals[emailIndex].trim().toLowerCase(),
    password: positionals[emailIndex + 1]?.trim() || null,
  };
};

// ── seed data definitions ─────────────────────────────────────────────────────

const TASKS = [
  // ── OVERDUE → fires task_overdue notification ─────────────────────────────
  {
    title: 'Linear Algebra Problem Set',
    notes: 'Chapter 4: Eigenvalues and eigenvectors. Submit on the course portal.',
    estimated_minutes: 90,
    deadline_at: dayAt(-1, 17, 0),   // yesterday at 17:00 → OVERDUE
    priority: 5,
    status: 'todo',
    time_preference: 'anytime',
    _tag: '🔴 OVERDUE  → triggers task_overdue notification',
  },
  {
    title: 'Fix Login Bug in Backend',
    notes: 'Refresh token not clearing cookie on logout in production. Quick fix needed.',
    estimated_minutes: 45,
    deadline_at: dayAt(-1, 9, 0),    // yesterday at 09:00 → OVERDUE
    priority: 4,
    status: 'todo',
    time_preference: 'morning',
    _tag: '🔴 OVERDUE  → triggers task_overdue notification',
  },

  // ── DUE WITHIN REMINDER WINDOW → fires task_reminder notification ─────────
  {
    title: 'Finish Database Assignment',
    notes: 'ER diagram + normalization to 3NF. Submit as PDF.',
    estimated_minutes: 60,
    deadline_at: fromNow('minutes', 25),  // 25 min from now → inside 30-min reminder window
    priority: 5,
    status: 'todo',
    time_preference: 'anytime',
    _tag: '🟡 DUE SOON → triggers task_reminder notification (within 30-min window)',
  },

  // ── DUE LATER TODAY → shows up in today's schedule ────────────────────────
  {
    title: 'Prepare Presentation Slides',
    notes: 'SE capstone demo — 10 slides max. Include architecture diagram.',
    estimated_minutes: 120,
    deadline_at: todayAt(20, 0),    // today at 20:00
    priority: 4,
    status: 'todo',
    time_preference: 'evening',
    _tag: '🟠 DUE TODAY  → shows up in today\'s generated plan',
  },
  {
    title: 'Review Pull Requests',
    notes: 'Three open PRs in the team repo. Leave feedback by end of day.',
    estimated_minutes: 30,
    deadline_at: todayAt(18, 0),    // today at 18:00
    priority: 3,
    status: 'todo',
    time_preference: 'anytime',
    _tag: '🟠 DUE TODAY  → shows up in today\'s generated plan',
  },

  // ── DUE TOMORROW ──────────────────────────────────────────────────────────
  {
    title: 'Read OS Concepts — Chapter 7 (Memory Management)',
    notes: 'Focus on paging, segmentation, and virtual memory. Take notes.',
    estimated_minutes: 75,
    deadline_at: dayAt(1, 23, 59),  // tomorrow at midnight
    priority: 3,
    status: 'todo',
    time_preference: 'morning',
    _tag: '🔵 DUE TOMORROW',
  },

  // ── DUE IN 3 DAYS ─────────────────────────────────────────────────────────
  {
    title: 'Write Unit Tests for Auth Module',
    notes: 'Cover register, login, logout, forgot-password. Min 90% line coverage.',
    estimated_minutes: 100,
    deadline_at: dayAt(3, 17, 0),
    priority: 4,
    status: 'todo',
    time_preference: 'anytime',
    _tag: '🔵 DUE IN 3 DAYS',
  },

  // ── NO DEADLINE → backlog ─────────────────────────────────────────────────
  {
    title: 'Research Docker Deployment',
    notes: 'Containerize backend + postgres, write docker-compose.yml.',
    estimated_minutes: 180,
    deadline_at: null,
    priority: 2,
    status: 'todo',
    time_preference: 'anytime',
    _tag: '⚪ NO DEADLINE → backlog task',
  },

  // ── ALREADY DONE ──────────────────────────────────────────────────────────
  {
    title: 'Set Up JWT Authentication',
    notes: 'Access + refresh token rotation. Done.',
    estimated_minutes: 120,
    deadline_at: dayAt(-3, 12, 0),
    priority: 5,
    status: 'done',
    time_preference: 'anytime',
    _tag: '✅ COMPLETED → notification history example',
  },
];

const BUSY_BLOCKS = [
  // Today ───────────────────────────────────────────────────────────────────
  {
    title: 'DBMS Lecture',
    start_at: todayAt(9, 0),
    end_at:   todayAt(10, 30),
    _tag: 'today',
  },
  {
    title: 'Lunch Break',
    start_at: todayAt(12, 30),
    end_at:   todayAt(13, 30),
    _tag: 'today',
  },
  {
    title: 'Software Engineering Lab',
    start_at: todayAt(14, 0),
    end_at:   todayAt(16, 30),
    _tag: 'today',
  },
  {
    title: 'Evening Workout',
    start_at: todayAt(18, 30),
    end_at:   todayAt(19, 30),
    _tag: 'today',
  },

  // Tomorrow ────────────────────────────────────────────────────────────────
  {
    title: 'Morning Lecture (Algorithms)',
    start_at: dayAt(1, 8, 0),
    end_at:   dayAt(1, 9, 30),
    _tag: 'tomorrow',
  },
  {
    title: 'Team Stand-up',
    start_at: dayAt(1, 10, 0),
    end_at:   dayAt(1, 10, 30),
    _tag: 'tomorrow',
  },
];

// ── main ─────────────────────────────────────────────────────────────────────

async function run() {
  const args = process.argv.slice(2);
  const reset = args.includes('--reset');
  const { email, password } = parseCredentials(args);

  const client = await pool.connect();
  try {
    // 1. Find user
    let user;
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = await client.query(
        'SELECT id, name, email FROM users WHERE email = $1',
        [normalizedEmail]
      );

      if (!existingUser.rowCount && !password) {
        console.error(`❌ No user found with email: ${normalizedEmail}`);
        console.error('   Provide a password as a second argument to create that user automatically.');
        process.exit(1);
      }

      if (!existingUser.rowCount && password) {
        const passwordHash = await hashPassword(password);
        const insertedUser = await client.query(
          `INSERT INTO users (name, email, password_hash, email_verified)
           VALUES ($1, $2, $3, TRUE)
           RETURNING id, name, email`,
          ['Notification Demo User', normalizedEmail, passwordHash]
        );

        user = insertedUser.rows[0];
        console.log(`\n👤 Created demo user: ${user.name} (${user.email}) [id=${user.id}]`);
      } else {
        user = existingUser.rows[0];

        if (password) {
          const passwordHash = await hashPassword(password);
          await client.query(
            `UPDATE users
             SET password_hash = $1,
                 email_verified = TRUE,
                 verification_token_hash = NULL,
                 verification_token_expires = NULL,
                 reset_token_hash = NULL,
                 reset_token_expires = NULL
             WHERE id = $2`,
            [passwordHash, user.id]
          );
          console.log(`\n🔐 Updated password and verified email for ${user.email}`);
        }
      }
    } else {
      const r = await client.query('SELECT id, name, email FROM users ORDER BY id LIMIT 1');
      if (!r.rowCount) { console.error('❌ No users found in the database. Register first.'); process.exit(1); }
      user = r.rows[0];
    }

    console.log(`\n👤 Seeding for: ${user.name} (${user.email}) [id=${user.id}]\n`);

    // 2. Optionally clear old data
    if (reset) {
      await client.query('DELETE FROM busy_blocks WHERE user_id = $1', [user.id]);
      await client.query('DELETE FROM notifications WHERE user_id = $1', [user.id]);
      // Tasks have plan_blocks referencing them — cascade handles it
      await client.query('DELETE FROM tasks WHERE user_id = $1', [user.id]);
      console.log('🗑️  Cleared existing tasks, busy blocks, and notifications.\n');
    }

    // 3. Ensure notification_preferences row exists
    await client.query(
      `INSERT INTO notification_preferences (user_id, reminder_time_minutes)
       VALUES ($1, 30)
       ON CONFLICT (user_id) DO NOTHING`,
      [user.id]
    );

    // 4. Insert tasks
    console.log('📝 Inserting tasks:\n');
    const taskIds = {};
    for (const t of TASKS) {
      const r = await client.query(
        `INSERT INTO tasks (user_id, title, notes, estimated_minutes, deadline_at, priority, status, time_preference)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id`,
        [user.id, t.title, t.notes, t.estimated_minutes, t.deadline_at, t.priority, t.status, t.time_preference]
      );
      taskIds[t.title] = r.rows[0].id;
      console.log(`  ${t._tag}`);
      console.log(`  → "${t.title}" [id=${r.rows[0].id}]`);
      if (t.deadline_at) {
        const d = new Date(t.deadline_at);
        const now = new Date();
        const diffMin = Math.round((d - now) / 60000);
        const label = diffMin < 0
          ? `${Math.abs(diffMin)} min ago`
          : diffMin < 60 ? `in ${diffMin} min` : `on ${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
        console.log(`     Deadline: ${label}`);
      } else {
        console.log(`     Deadline: none`);
      }
      console.log('');
    }

    // 5. Insert busy blocks
    console.log('🚫 Inserting busy blocks:\n');
    for (const b of BUSY_BLOCKS) {
      const r = await client.query(
        `INSERT INTO busy_blocks (user_id, title, start_at, end_at)
         VALUES ($1,$2,$3,$4) RETURNING id`,
        [user.id, b.title, b.start_at, b.end_at]
      );
      const start = new Date(b.start_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const end   = new Date(b.end_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      console.log(`  [${b._tag}] "${b.title}"  ${start} – ${end}  [id=${r.rows[0].id}]`);
    }

    // 6. Seed a few sample notifications to populate the notification center.
    // First discover which types the DB constraint actually allows (handles old schema versions).
    console.log('\n🔔 Seeding sample notifications:\n');

    const constraintRow = await client.query(`
      SELECT pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE conrelid = 'notifications'::regclass
        AND conname = 'notifications_type_check'
    `);
    const allowedTypes = constraintRow.rows.length
      ? (constraintRow.rows[0].def.match(/'([^']+)'/g) || []).map(s => s.replace(/'/g, ''))
      : ['task_reminder', 'task_starting', 'plan_created', 'schedule_conflict', 'deadline_approaching'];

    console.log(`  DB allows types: ${allowedTypes.join(', ')}\n`);

    // Map each desired type to the closest allowed alternative
    const resolveType = (preferred, fallback) =>
      allowedTypes.includes(preferred) ? preferred : fallback;

    const sampleNotifs = [
      {
        type: resolveType('task_overdue', 'overdue_task'),
        title: '🚨 Task Overdue',
        message: `Your task "Linear Algebra Problem Set" is overdue! Please complete it as soon as possible.`,
        taskKey: 'Linear Algebra Problem Set',
        read: false,
        created_at: dayAt(-1, 17, 5),
      },
      {
        type: resolveType('task_overdue', 'overdue_task'),
        title: '🚨 Task Overdue',
        message: `Your task "Fix Login Bug in Backend" is overdue! Please complete it as soon as possible.`,
        taskKey: 'Fix Login Bug in Backend',
        read: false,
        created_at: dayAt(-1, 9, 5),
      },
      {
        type: resolveType('plan_created', 'task_reminder'),
        title: '📅 Plan Created',
        message: `Your daily plan for ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} has been generated with 4 scheduled blocks.`,
        taskKey: null,
        read: true,
        created_at: todayAt(8, 30),
      },
      {
        type: 'task_reminder',
        title: '⏰ Task Reminder',
        message: `Your task "Prepare Presentation Slides" is due at 8:00 PM tonight.`,
        taskKey: 'Prepare Presentation Slides',
        read: true,
        created_at: fromNow('hours', -2),
      },
    ];

    let notifCount = 0;
    for (const n of sampleNotifs) {
      const taskId = n.taskKey ? taskIds[n.taskKey] : null;
      try {
        await client.query(
          `INSERT INTO notifications (user_id, type, title, message, related_task_id, read, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [user.id, n.type, n.title, n.message, taskId, n.read, n.created_at]
        );
        console.log(`  ${n.read ? '✓ (read)  ' : '● (unread)'} [${n.type}] ${n.title}`);
        notifCount++;
      } catch (e) {
        console.warn(`  ⚠️  Skipped notification (${e.message.split('\n')[0]})`);
      }
    }

    // 7. Summary
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Done! Seeded for ${user.name}

📊 NOTIFICATION SYSTEM STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When the scheduler runs (every 15 min), it will:

 🚨 task_overdue  (checks every 15 min)
    Will fire for:
    - "Linear Algebra Problem Set"   → deadline was yesterday
    - "Fix Login Bug in Backend"     → deadline was yesterday

 ⏰ task_reminder  (checks every 15 min)
    Will fire for:
    - "Finish Database Assignment"   → due in ~25 min (inside 30-min window)
    Will NOT fire yet for:
    - "Prepare Presentation Slides"  → due tonight (outside window right now)
    - "Review Pull Requests"         → due tonight (outside window right now)

 🔔 Notification center (in-app) has ${notifCount} seeded items:
    - 2 unread overdue alerts
    - 1 read task reminder
    - 1 read plan_created

To force-run the scheduler check immediately, you can call:
    GET http://localhost:5000/health  (starts scheduler on server boot)

Or generate a plan for today to trigger plan_created:
    POST http://localhost:5000/api/plans/generate
  { "date": "${localDateString()}", "workStart": "09:00", "workEnd": "22:00" }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
