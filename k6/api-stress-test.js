import http from 'k6/http';
import { check, sleep, group } from 'k6';

// ─────────────────────────────────────────────────────────────────────────────
// STRESS TEST
// Pushes all API endpoints to their breaking point.
// Ramps from normal → high → extreme to find degradation points.
// Read-heavy distribution (realistic) with occasional writes.
// ─────────────────────────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 50  }, // Normal load
    { duration: '1m',  target: 50  },
    { duration: '30s', target: 150 }, // High load
    { duration: '1m',  target: 150 },
    { duration: '30s', target: 300 }, // Extreme load
    { duration: '1m',  target: 300 },
    { duration: '1m',  target: 0   }, // Recovery
  ],
  thresholds: {
    // Evaluative – track degradation under extreme load (300 VUs), not a hard pass/fail
    http_req_duration: [{ threshold: 'p(99)<20000', abortOnFail: false }], // 99th pct at 300 VUs
    http_req_failed:   ['rate<0.10'],   // Alert if error rate > 10%
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

  // Probability distribution across all endpoints
  // Reads are more frequent; writes are ~15% to avoid DB saturation at 300 VUs
  const roll = Math.random();

  if (roll < 0.18) {
    // ── Plans (heaviest read – joins plan_blocks + tasks) ────────────────────
    group('Plans read', () => {
      const r = http.get(`${BASE_URL}/api/plans?date=${TODAY}`, p);
      check(r, { 'GET /api/plans: 200': (res) => res.status === 200 });
    });

  } else if (roll < 0.35) {
    // ── Tasks list ──────────────────────────────────────────────────────────
    group('Tasks list', () => {
      const r = http.get(`${BASE_URL}/api/tasks`, p);
      check(r, {
        'GET /api/tasks: 200':   (res) => res.status === 200,
        'GET /api/tasks: array': (res) => Array.isArray(res.json()),
      });
    });

  } else if (roll < 0.48) {
    // ── Busy blocks list ────────────────────────────────────────────────────
    group('Busy blocks list', () => {
      const r = http.get(`${BASE_URL}/api/busyblocks`, p);
      check(r, { 'GET /api/busyblocks: 200': (res) => res.status === 200 });
    });

  } else if (roll < 0.60) {
    // ── Notifications list ──────────────────────────────────────────────────
    group('Notifications list', () => {
      const r = http.get(`${BASE_URL}/api/notifications`, p);
      check(r, {
        'GET /api/notifications: 200':    (res) => res.status === 200,
        'GET /api/notifications: array':  (res) =>
          Array.isArray(res.json('notifications')),
      });
    });

  } else if (roll < 0.68) {
    // ── Me + users ──────────────────────────────────────────────────────────
    group('User profile', () => {
      const meRes = http.get(`${BASE_URL}/api/me`, p);
      check(meRes, { 'GET /api/me: 200': (r) => r.status === 200 });

      const usersRes = http.get(`${BASE_URL}/api/users`, p);
      check(usersRes, { 'GET /api/users: 200': (r) => r.status === 200 });
    });

  } else if (roll < 0.74) {
    // ── Notifications unread + preferences ──────────────────────────────────
    group('Notifications meta', () => {
      const unread = http.get(`${BASE_URL}/api/notifications/unread`, p);
      check(unread, { 'GET /api/notifications/unread: 200': (r) => r.status === 200 });

      const prefs = http.get(`${BASE_URL}/api/notifications/preferences`, p);
      check(prefs, { 'GET /api/notifications/preferences: 200': (r) => r.status === 200 });
    });

  } else if (roll < 0.80) {
    // ── Plans generate (expensive write) ────────────────────────────────────
    group('Plan generate', () => {
      const r = http.post(
        `${BASE_URL}/api/plans/generate`,
        JSON.stringify({ date: TODAY, workStart: '09:00', workEnd: '22:00' }),
        p
      );
      check(r, {
        // Under extreme concurrency many VUs share one user, plan regeneration
        // may still race (UPSERT resolves INSERT race but concurrent regeneration
        // can still return 500 on plan_blocks race). Accept 200 or log gracefully.
        'POST /api/plans/generate: 200':    (res) => res.status === 200,
        'POST /api/plans/generate: planId': (res) => res.status !== 200 || res.json().hasOwnProperty('planId'),
      });
    });

  } else if (roll < 0.87) {
    // ── Task create + delete ────────────────────────────────────────────────
    group('Task write cycle', () => {
      const createRes = http.post(
        `${BASE_URL}/api/tasks`,
        JSON.stringify({
          title:             `Stress Task ${Date.now()}`,
          estimated_minutes: 20,
          priority:          2,
          time_preference:   'anytime',
        }),
        p
      );
      check(createRes, { 'POST /api/tasks: 201': (r) => r.status === 201 });

      const taskId = createRes.json('id');
      if (taskId) {
        const delRes = http.del(`${BASE_URL}/api/tasks/${taskId}`, null, p);
        check(delRes, { 'DELETE /api/tasks/:id: 200': (r) => r.status === 200 });
      }
    });

  } else if (roll < 0.93) {
    // ── Busy block create + delete ──────────────────────────────────────────
    group('Busy block write cycle', () => {
      const createRes = http.post(
        `${BASE_URL}/api/busyblocks`,
        JSON.stringify({
          title:    `Stress Block ${Date.now()}`,
          start_at: `${TOMORROW}T16:00:00.000Z`,
          end_at:   `${TOMORROW}T17:00:00.000Z`,
        }),
        p
      );
      check(createRes, { 'POST /api/busyblocks: 201': (r) => r.status === 201 });

      const blockId = createRes.json('id');
      if (blockId) {
        const delRes = http.del(`${BASE_URL}/api/busyblocks/${blockId}`, null, p);
        check(delRes, { 'DELETE /api/busyblocks/:id: 200': (r) => r.status === 200 });
      }
    });

  } else {
    // ── Notifications mark-all-read (lightweight write) ──────────────────────
    group('Notifications write', () => {
      const r = http.patch(`${BASE_URL}/api/notifications/read-all`, null, p);
      check(r, { 'PATCH /api/notifications/read-all: 200': (res) => res.status === 200 });
    });
  }

  // Minimal sleep to maximise throughput pressure
  sleep(0.3);
}

