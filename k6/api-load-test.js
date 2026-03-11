import http from 'k6/http';
import { check, sleep, group } from 'k6';

// ─────────────────────────────────────────────────────────────────────────────
// LOAD TEST
// Simulates 50 concurrent users in realistic sessions across EVERY API endpoint.
// Each VU picks a weighted random "user flow" per iteration covering reads,
// writes, plan management, notifications, and profile operations.
// ─────────────────────────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp up
    { duration: '2m',  target: 50 }, // Steady state
    { duration: '30s', target: 0  }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% under 1 s
    http_req_failed:   ['rate<0.01'],  // <1% failures
  },
};

const BASE_URL = 'http://localhost:5000';
const TODAY    = new Date().toISOString().slice(0, 10);
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
  http.setResponseCallback(http.expectedStatuses({ min: 200, max: 299 }, 400, 404, 409));
  if (!data || !data.token) return;

  const p = {
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${data.token}`,
    },
  };

  // Weighted random flow selection (sum = 1.0)
  // 35% read dashboard, 25% task management, 15% planning,
  // 15% notifications, 10% busy blocks & profile
  const roll = Math.random();

  if (roll < 0.35) {
    // ── FLOW A: Dashboard read (most common – covers core read endpoints) ────
    group('Flow A: Dashboard Read', () => {
      const tasksRes = http.get(`${BASE_URL}/api/tasks`, p);
      check(tasksRes, {
        'A | GET /api/tasks: 200':           (r) => r.status === 200,
        'A | GET /api/tasks: array':         (r) => Array.isArray(r.json()),
      });
      sleep(0.4);

      const planRes = http.get(`${BASE_URL}/api/plans?date=${TODAY}`, p);
      check(planRes, {
        'A | GET /api/plans: 200':           (r) => r.status === 200,
        'A | GET /api/plans: has blocks':    (r) => r.json().hasOwnProperty('blocks'),
        'A | GET /api/plans: has busyBlocks':(r) => r.json().hasOwnProperty('busyBlocks'),
      });
      sleep(0.4);

      const busyRes = http.get(`${BASE_URL}/api/busyblocks`, p);
      check(busyRes, {
        'A | GET /api/busyblocks: 200':      (r) => r.status === 200,
        'A | GET /api/busyblocks: array':    (r) => Array.isArray(r.json()),
      });
      sleep(0.4);

      const meRes = http.get(`${BASE_URL}/api/me`, p);
      check(meRes, {
        'A | GET /api/me: 200':              (r) => r.status === 200,
        'A | GET /api/me: has email':        (r) => r.json().hasOwnProperty('email'),
      });
      sleep(0.4);

      const unreadRes = http.get(`${BASE_URL}/api/notifications/unread`, p);
      check(unreadRes, {
        'A | GET /api/notifications/unread: 200': (r) => r.status === 200,
        'A | unreadCount present':                (r) => r.json().hasOwnProperty('unreadCount'),
      });
    });

  } else if (roll < 0.60) {
    // ── FLOW B: Full Task Management ─────────────────────────────────────────
    group('Flow B: Task Management', () => {
      // List tasks
      const listRes = http.get(`${BASE_URL}/api/tasks`, p);
      check(listRes, { 'B | GET /api/tasks: 200': (r) => r.status === 200 });
      sleep(0.3);

      // Create a task
      const createRes = http.post(
        `${BASE_URL}/api/tasks`,
        JSON.stringify({
          title:              `Load Task ${Date.now()}`,
          estimated_minutes:  45,
          priority:           3,
          time_preference:    'anytime',
        }),
        p
      );
      check(createRes, {
        'B | POST /api/tasks: 201':  (r) => r.status === 201,
        'B | POST /api/tasks: id':   (r) => r.json().hasOwnProperty('id'),
      });
      sleep(0.3);

      const taskId = createRes.json('id');
      if (taskId) {
        // Read by ID
        const getRes = http.get(`${BASE_URL}/api/tasks/${taskId}`, p);
        check(getRes, {
          'B | GET /api/tasks/:id: 200': (r) => r.status === 200,
        });
        sleep(0.2);

        // Update the task
        const patchRes = http.patch(
          `${BASE_URL}/api/tasks/${taskId}`,
          JSON.stringify({ title: 'Load Task Updated', priority: 4 }),
          p
        );
        check(patchRes, {
          'B | PATCH /api/tasks/:id: 200':           (r) => r.status === 200,
          'B | PATCH /api/tasks/:id: title updated': (r) =>
            r.json('title') === 'Load Task Updated',
        });
        sleep(0.2);

        // Mark done
        const doneRes = http.patch(
          `${BASE_URL}/api/tasks/${taskId}`,
          JSON.stringify({ status: 'done' }),
          p
        );
        check(doneRes, {
          'B | PATCH /api/tasks/:id (done): 200': (r) => r.status === 200,
        });
        sleep(0.2);

        // Delete (cleanup)
        const delRes = http.del(`${BASE_URL}/api/tasks/${taskId}`, null, p);
        check(delRes, {
          'B | DELETE /api/tasks/:id: 200': (r) => r.status === 200,
        });
      }
    });

  } else if (roll < 0.75) {
    // ── FLOW C: Planning ─────────────────────────────────────────────────────
    group('Flow C: Planning', () => {
      // View today's plan
      const getPlanRes = http.get(`${BASE_URL}/api/plans?date=${TODAY}`, p);
      check(getPlanRes, {
        'C | GET /api/plans: 200':      (r) => r.status === 200,
        'C | GET /api/plans: blocks':   (r) => r.json().hasOwnProperty('blocks'),
      });
      sleep(0.4);

      // Generate plan
      const genRes = http.post(
        `${BASE_URL}/api/plans/generate`,
        JSON.stringify({ date: TODAY, workStart: '09:00', workEnd: '22:00' }),
        p
      );
      check(genRes, {
        'C | POST /api/plans/generate: 200':    (r) => r.status === 200,
        'C | POST /api/plans/generate: planId': (r) => r.json().hasOwnProperty('planId'),
      });
      sleep(0.4);

      // Mark a block done if any were scheduled
      const blocks = genRes.json('blocks');
      if (blocks && blocks.length > 0) {
        const doneRes = http.post(
          `${BASE_URL}/api/plans/blocks/${blocks[0].id}/done`,
          JSON.stringify({ markTaskDone: false }),
          p
        );
        check(doneRes, {
          // 404 is OK: concurrent VUs may have regenerated the plan, deleting this block
          'C | POST /api/plans/blocks/:id/done: 200 or 404': (r) => r.status === 200 || r.status === 404,
        });
        sleep(0.3);
      }

      // View tomorrow's plan (likely empty – tests the empty-plan code path)
      const tomorrowPlanRes = http.get(`${BASE_URL}/api/plans?date=${TOMORROW}`, p);
      check(tomorrowPlanRes, {
        'C | GET /api/plans (tomorrow): 200': (r) => r.status === 200,
      });
    });

  } else if (roll < 0.90) {
    // ── FLOW D: Notifications ────────────────────────────────────────────────
    group('Flow D: Notifications', () => {
      // Fetch notification list
      const listRes = http.get(`${BASE_URL}/api/notifications?limit=20&offset=0`, p);
      check(listRes, {
        'D | GET /api/notifications: 200':          (r) => r.status === 200,
        'D | GET /api/notifications: array':        (r) =>
          Array.isArray(r.json('notifications')),
      });
      sleep(0.3);

      // Unread count
      const unreadRes = http.get(`${BASE_URL}/api/notifications/unread`, p);
      check(unreadRes, {
        'D | GET /api/notifications/unread: 200':   (r) => r.status === 200,
      });
      sleep(0.3);

      // Get preferences
      const prefRes = http.get(`${BASE_URL}/api/notifications/preferences`, p);
      check(prefRes, {
        'D | GET /api/notifications/preferences: 200': (r) => r.status === 200,
      });
      sleep(0.2);

      // Update preferences
      const updatePrefRes = http.put(
        `${BASE_URL}/api/notifications/preferences`,
        JSON.stringify({ task_reminders: true, overdue_alerts: true }),
        p
      );
      check(updatePrefRes, {
        'D | PUT /api/notifications/preferences: 200': (r) => r.status === 200,
      });
      sleep(0.2);

      // Mark all as read
      const readAllRes = http.patch(`${BASE_URL}/api/notifications/read-all`, null, p);
      check(readAllRes, {
        'D | PATCH /api/notifications/read-all: 200': (r) => r.status === 200,
      });
      sleep(0.2);

      // Per-notification read + delete if any exist
      const notifications = listRes.json('notifications');
      if (notifications && notifications.length > 0) {
        const id = notifications[0].id;
        const markRes = http.patch(`${BASE_URL}/api/notifications/${id}/read`, null, p);
        check(markRes, {
          'D | PATCH /api/notifications/:id/read: 200': (r) => r.status === 200,
        });
        sleep(0.2);

        if (notifications.length > 1) {
          const lastId = notifications[notifications.length - 1].id;
          const delRes = http.del(`${BASE_URL}/api/notifications/${lastId}`, null, p);
          check(delRes, {
            'D | DELETE /api/notifications/:id: 200': (r) => r.status === 200,
          });
        }
      }
    });

  } else {
    // ── FLOW E: Busy Blocks & Profile ────────────────────────────────────────
    group('Flow E: Busy Blocks & Profile', () => {
      // List busy blocks
      const listRes = http.get(`${BASE_URL}/api/busyblocks`, p);
      check(listRes, {
        'E | GET /api/busyblocks: 200':  (r) => r.status === 200,
        'E | GET /api/busyblocks: array':(r) => Array.isArray(r.json()),
      });
      sleep(0.3);

      // Create a busy block
      const createRes = http.post(
        `${BASE_URL}/api/busyblocks`,
        JSON.stringify({
          title:    `Load Block ${Date.now()}`,
          start_at: `${TOMORROW}T14:00:00.000Z`,
          end_at:   `${TOMORROW}T15:00:00.000Z`,
        }),
        p
      );
      check(createRes, {
        'E | POST /api/busyblocks: 201': (r) => r.status === 201,
        'E | POST /api/busyblocks: id':  (r) => r.json().hasOwnProperty('id'),
      });
      sleep(0.3);

      const blockId = createRes.json('id');
      if (blockId) {
        const delRes = http.del(`${BASE_URL}/api/busyblocks/${blockId}`, null, p);
        check(delRes, {
          'E | DELETE /api/busyblocks/:id: 200': (r) => r.status === 200,
        });
        sleep(0.2);
      }

      // Users list
      const usersRes = http.get(`${BASE_URL}/api/users`, p);
      check(usersRes, {
        'E | GET /api/users: 200': (r) => r.status === 200,
      });
      sleep(0.2);

      // Profile
      const meRes = http.get(`${BASE_URL}/api/me`, p);
      check(meRes, {
        'E | GET /api/me: 200':      (r) => r.status === 200,
        'E | GET /api/me: has id':   (r) => r.json().hasOwnProperty('id'),
      });
      sleep(0.2);

      // GET /api/profile
      const profileRes = http.get(`${BASE_URL}/api/profile`, p);
      check(profileRes, {
        'E | GET /api/profile: 200': (r) => r.status === 200,
      });
    });
  }

  // Human think-time between sessions
  sleep(Math.random() * 2 + 1);
}
