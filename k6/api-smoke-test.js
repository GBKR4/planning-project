import http from 'k6/http';
import { check, sleep, group } from 'k6';

// ─────────────────────────────────────────────────────────────────────────────
// SMOKE TEST
// 2 VUs · 1 minute · exhaustive coverage of every single API endpoint
// Verifies correct status codes, response shapes, and full CRUD cycles.
// ─────────────────────────────────────────────────────────────────────────────
export const options = {
  vus: 2,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(99)<2000'], // 99% under 2 s (DB-backed, local)
    http_req_failed: ['rate<0.01'],    // <1% true failures (5xx / network errors)
  },
};

const BASE_URL = 'http://localhost:5000';
const TODAY = new Date().toISOString().slice(0, 10);

// Tomorrow's date used for busy-block timestamps (avoids past-date conflicts)
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const TOMORROW = tomorrow.toISOString().slice(0, 10);

export function setup() {
  const email    = __ENV.TEST_EMAIL    || 'test-load@example.com';
  const password = __ENV.TEST_PASSWORD || 'password123';

  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (res.status !== 200) {
    console.error(`[setup] Login failed – status ${res.status}: ${res.body}`);
    return null;
  }
  const body = res.json();
  if (!body || !body.accessToken) {
    console.error('[setup] accessToken missing in login response');
    return null;
  }
  return { token: body.accessToken };
}

export default function (data) {
  // 400 (already verified / bad request), 404 (not found), 409 (conflict)
  // are all EXPECTED in specific endpoints — exclude them from http_req_failed.
  http.setResponseCallback(http.expectedStatuses({ min: 200, max: 299 }, 400, 404, 409));

  if (!data || !data.token) {
    console.error('No auth token – skipping iteration');
    return;
  }

  const p = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.token}`,
    },
  };

  // ── 1. PUBLIC / HEALTH ──────────────────────────────────────────────────────
  group('1. Public & Health', () => {
    const healthRes = http.get(`${BASE_URL}/health`);
    check(healthRes, {
      'GET /health: status 200': (r) => r.status === 200,
      'GET /health: db ok':      (r) => r.json('db') === 'ok',
    });

    // VAPID key may return 500 when keys are not configured; both are acceptable
    const vapidRes = http.get(`${BASE_URL}/api/notifications/vapid-public-key`);
    check(vapidRes, {
      'GET /vapid-public-key: 200 or 500': (r) => r.status === 200 || r.status === 500,
    });
  });

  sleep(0.3);

  // ── 2. AUTH ENDPOINTS ───────────────────────────────────────────────────────
  group('2. Auth', () => {
    // Forgot password (safe – always returns success message regardless)
    const forgotRes = http.post(
      `${BASE_URL}/auth/forgotpassword`,
      JSON.stringify({ email: 'nonexistent-smoke@example.com' }),
      p
    );
    check(forgotRes, {
      'POST /auth/forgotpassword: status 200': (r) => r.status === 200,
    });

    // Resend verification (email doesn't exist → 404 is correct)
    const resendRes = http.post(
      `${BASE_URL}/auth/resend-verification`,
      JSON.stringify({ email: 'nonexistent-smoke@example.com' }),
      p
    );
    check(resendRes, {
      'POST /auth/resend-verification: 200 or 404': (r) =>
        r.status === 200 || r.status === 404,
    });
  });

  sleep(0.3);

  // ── 3. USER & PROFILE ───────────────────────────────────────────────────────
  group('3. User & Profile', () => {
    const meRes = http.get(`${BASE_URL}/api/me`, p);
    check(meRes, {
      'GET /api/me: status 200':  (r) => r.status === 200,
      'GET /api/me: has id':      (r) => r.json().hasOwnProperty('id'),
      'GET /api/me: has email':   (r) => r.json().hasOwnProperty('email'),
    });

    // GET /api/profile (returns JWT payload: id + email)
    const profileRes = http.get(`${BASE_URL}/api/profile`, p);
    check(profileRes, {
      'GET /api/profile: status 200': (r) => r.status === 200,
    });

    // List all users
    const usersRes = http.get(`${BASE_URL}/api/users`, p);
    check(usersRes, {
      'GET /api/users: status 200':       (r) => r.status === 200,
      'GET /api/users: returns array':    (r) => Array.isArray(r.json()),
    });

    // GET /api/users/:id using the authenticated user's own id
    const meId = meRes.json('id');
    if (meId) {
      const userByIdRes = http.get(`${BASE_URL}/api/users/${meId}`, p);
      check(userByIdRes, {
        'GET /api/users/:id: status 200': (r) => r.status === 200,
        'GET /api/users/:id: correct id': (r) => r.json('id') == meId,
      });
    }

    // Update profile (send same name/email – non-destructive)
    const meData = meRes.json();
    if (meData && meData.name && meData.email) {
      const updateRes = http.put(
        `${BASE_URL}/api/profile`,
        JSON.stringify({ name: meData.name, email: meData.email }),
        p
      );
      check(updateRes, {
        'PUT /api/profile: status 200': (r) => r.status === 200,
      });
    }
  });

  sleep(0.3);

  // ── 4. TASKS CRUD ───────────────────────────────────────────────────────────
  group('4. Tasks CRUD', () => {
    // List
    const listRes = http.get(`${BASE_URL}/api/tasks`, p);
    check(listRes, {
      'GET /api/tasks: status 200':      (r) => r.status === 200,
      'GET /api/tasks: returns array':   (r) => Array.isArray(r.json()),
    });

    // Create
    const createRes = http.post(
      `${BASE_URL}/api/tasks`,
      JSON.stringify({
        title: `Smoke Task ${Date.now()}`,
        estimated_minutes: 30,
        priority: 3,
        time_preference: 'anytime',
        notes: 'Created by k6 smoke test',
      }),
      p
    );
    check(createRes, {
      'POST /api/tasks: status 201':   (r) => r.status === 201,
      'POST /api/tasks: has id':       (r) => r.json().hasOwnProperty('id'),
      'POST /api/tasks: has title':    (r) => r.json().hasOwnProperty('title'),
    });

    const taskId = createRes.json('id');

    if (taskId) {
      // Read by ID
      const getRes = http.get(`${BASE_URL}/api/tasks/${taskId}`, p);
      check(getRes, {
        'GET /api/tasks/:id: status 200':   (r) => r.status === 200,
        'GET /api/tasks/:id: correct id':   (r) => r.json('id') == taskId,
      });

      // Update (title + priority)
      const patchRes = http.patch(
        `${BASE_URL}/api/tasks/${taskId}`,
        JSON.stringify({ title: 'Smoke Task Updated', priority: 5 }),
        p
      );
      check(patchRes, {
        'PATCH /api/tasks/:id: status 200':       (r) => r.status === 200,
        'PATCH /api/tasks/:id: title updated':    (r) => r.json('title') === 'Smoke Task Updated',
        'PATCH /api/tasks/:id: priority updated': (r) => r.json('priority') === 5,
      });

      // Mark as done
      const doneRes = http.patch(
        `${BASE_URL}/api/tasks/${taskId}`,
        JSON.stringify({ status: 'done' }),
        p
      );
      check(doneRes, {
        'PATCH /api/tasks/:id (done): status 200':   (r) => r.status === 200,
        'PATCH /api/tasks/:id (done): status=done':  (r) => r.json('status') === 'done',
      });

      // Mark back to todo
      const todoRes = http.patch(
        `${BASE_URL}/api/tasks/${taskId}`,
        JSON.stringify({ status: 'todo' }),
        p
      );
      check(todoRes, {
        'PATCH /api/tasks/:id (todo): status 200': (r) => r.status === 200,
      });

      // Delete (cleanup)
      const delRes = http.del(`${BASE_URL}/api/tasks/${taskId}`, null, p);
      check(delRes, {
        'DELETE /api/tasks/:id: status 200': (r) => r.status === 200,
      });
    }
  });

  sleep(0.3);

  // ── 5. BUSY BLOCKS CRUD ─────────────────────────────────────────────────────
  group('5. Busy Blocks CRUD', () => {
    // List
    const listRes = http.get(`${BASE_URL}/api/busyblocks`, p);
    check(listRes, {
      'GET /api/busyblocks: status 200':    (r) => r.status === 200,
      'GET /api/busyblocks: returns array': (r) => Array.isArray(r.json()),
    });

    // Create
    const createRes = http.post(
      `${BASE_URL}/api/busyblocks`,
      JSON.stringify({
        title: `Smoke Block ${Date.now()}`,
        start_at: `${TOMORROW}T09:00:00.000Z`,
        end_at:   `${TOMORROW}T10:30:00.000Z`,
      }),
      p
    );
    check(createRes, {
      'POST /api/busyblocks: status 201': (r) => r.status === 201,
      'POST /api/busyblocks: has id':     (r) => r.json().hasOwnProperty('id'),
    });

    const blockId = createRes.json('id');
    if (blockId) {
      // Delete (cleanup)
      const delRes = http.del(`${BASE_URL}/api/busyblocks/${blockId}`, null, p);
      check(delRes, {
        'DELETE /api/busyblocks/:id: status 200': (r) => r.status === 200,
      });
    }
  });

  sleep(0.3);

  // ── 6. PLANS ────────────────────────────────────────────────────────────────
  group('6. Plans', () => {
    // Get today's plan
    const getPlanRes = http.get(`${BASE_URL}/api/plans?date=${TODAY}`, p);
    check(getPlanRes, {
      'GET /api/plans: status 200':         (r) => r.status === 200,
      'GET /api/plans: has blocks':         (r) => r.json().hasOwnProperty('blocks'),
      'GET /api/plans: has busyBlocks':     (r) => r.json().hasOwnProperty('busyBlocks'),
    });

    // Generate plan for today
    const genRes = http.post(
      `${BASE_URL}/api/plans/generate`,
      JSON.stringify({ date: TODAY, workStart: '09:00', workEnd: '22:00' }),
      p
    );
    check(genRes, {
      'POST /api/plans/generate: status 200':   (r) => r.status === 200,
      'POST /api/plans/generate: has planId':   (r) => r.json().hasOwnProperty('planId'),
      'POST /api/plans/generate: has blocks':   (r) => r.json().hasOwnProperty('blocks'),
    });

    const genBody = genRes.json();

    // Test mark-done on first scheduled block (if any exist)
    if (genBody && genBody.blocks && genBody.blocks.length > 0) {
      const firstBlock = genBody.blocks[0];

      const doneRes = http.post(
        `${BASE_URL}/api/plans/blocks/${firstBlock.id}/done`,
        JSON.stringify({ markTaskDone: false }),
        p
      );
      check(doneRes, {
        // 404 OK: the other VU may have regenerated the plan, deleting this block
        'POST /api/plans/blocks/:id/done: status 200': (r) => r.status === 200 || r.status === 404,
      });
    }

    // Test mark-missed on second block (if two or more exist)
    if (genBody && genBody.blocks && genBody.blocks.length > 1) {
      const secondBlock = genBody.blocks[1];

      const missedRes = http.post(
        `${BASE_URL}/api/plans/blocks/${secondBlock.id}/missed`,
        JSON.stringify({ reschedule: true }),
        p
      );
      check(missedRes, {
        // 404 OK: the other VU may have regenerated the plan, deleting this block
        'POST /api/plans/blocks/:id/missed: status 200': (r) => r.status === 200 || r.status === 404,
      });
    }

    // Create a daily plan entry directly
    const createPlanRes = http.post(
      `${BASE_URL}/api/plans`,
      JSON.stringify({ plan_date: TOMORROW, work_start: '08:00', work_end: '18:00' }),
      p
    );
    check(createPlanRes, {
      'POST /api/plans: 201 or 409': (r) =>
        r.status === 201 || r.status === 409, // 409 if plan already exists for that date
    });
  });

  sleep(0.3);

  // ── 7. NOTIFICATIONS ────────────────────────────────────────────────────────
  group('7. Notifications', () => {
    // List with pagination params
    const listRes = http.get(`${BASE_URL}/api/notifications?limit=20&offset=0`, p);
    check(listRes, {
      'GET /api/notifications: status 200':            (r) => r.status === 200,
      'GET /api/notifications: has notifications key': (r) =>
        r.json().hasOwnProperty('notifications'),
      'GET /api/notifications: notifications is array': (r) =>
        Array.isArray(r.json('notifications')),
    });

    // Unread count
    const unreadRes = http.get(`${BASE_URL}/api/notifications/unread`, p);
    check(unreadRes, {
      'GET /api/notifications/unread: status 200':    (r) => r.status === 200,
      'GET /api/notifications/unread: has unreadCount': (r) =>
        r.json().hasOwnProperty('unreadCount'),
    });

    // Get preferences
    const prefRes = http.get(`${BASE_URL}/api/notifications/preferences`, p);
    check(prefRes, {
      'GET /api/notifications/preferences: status 200': (r) => r.status === 200,
      'GET /api/notifications/preferences: has preferences': (r) =>
        r.json().hasOwnProperty('preferences'),
    });

    // Update preferences
    const updatePrefRes = http.put(
      `${BASE_URL}/api/notifications/preferences`,
      JSON.stringify({
        task_reminders: true,
        overdue_alerts: true,
        email_enabled: true,
        push_enabled: false,
        reminder_time_minutes: 30,
      }),
      p
    );
    check(updatePrefRes, {
      'PUT /api/notifications/preferences: status 200': (r) => r.status === 200,
    });

    // Mark all as read
    const readAllRes = http.patch(`${BASE_URL}/api/notifications/read-all`, null, p);
    check(readAllRes, {
      'PATCH /api/notifications/read-all: status 200': (r) => r.status === 200,
    });

    // Per-notification operations (if any notifications exist)
    const notifications = listRes.json('notifications');
    if (notifications && notifications.length > 0) {
      const firstId = notifications[0].id;

      // Mark single notification as read
      const markRes = http.patch(
        `${BASE_URL}/api/notifications/${firstId}/read`,
        null,
        p
      );
      check(markRes, {
        'PATCH /api/notifications/:id/read: status 200': (r) => r.status === 200,
      });

      // Delete last notification (cleanup)
      const lastId = notifications[notifications.length - 1].id;
      const delRes = http.del(`${BASE_URL}/api/notifications/${lastId}`, null, p);
      check(delRes, {
        'DELETE /api/notifications/:id: status 200': (r) => r.status === 200,
      });
    }
  });

  sleep(1);
}
