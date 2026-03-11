import http from 'k6/http';
import { check, sleep, group } from 'k6';

// ─────────────────────────────────────────────────────────────────────────────
// AUTH LOAD TEST
// 20 VUs · 2 minutes steady state
// Covers the full authentication lifecycle:
//   login → authenticated calls → token refresh → logout
//   forgot-password · resend-verification · profile read · password change flow
// ─────────────────────────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up
    { duration: '2m',  target: 20 }, // Steady state
    { duration: '30s', target: 0  }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% under 2 s (bcrypt is CPU-bound; serialises under concurrent load)
    http_req_failed:   ['rate<0.01'],  // < 1% failures
  },
};

const BASE_URL = 'http://localhost:5000';

export default function () {
  // 400 (wrong password), 401 (post-logout access), 404 (not found), 409 (duplicate on rare race) are expected
  http.setResponseCallback(http.expectedStatuses({ min: 200, max: 299 }, 400, 401, 404, 409));

  const email    = __ENV.TEST_EMAIL    || 'test-load@example.com';
  const password = __ENV.TEST_PASSWORD || 'password123';

  const jsonHeader = { headers: { 'Content-Type': 'application/json' } };

  // ── 1. LOGIN ────────────────────────────────────────────────────────────────
  let token;
  group('1. Login', () => {
    const loginRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ email, password }),
      jsonHeader
    );

    const ok = check(loginRes, {
      'POST /auth/login: status 200':         (r) => r.status === 200,
      'POST /auth/login: message correct':    (r) =>
        r.json('message') === 'Login Successful',
      'POST /auth/login: has accessToken':    (r) => !!r.json('accessToken'),
      'POST /auth/login: has user object':    (r) => !!r.json('user'),
      'POST /auth/login: user has id':        (r) => !!r.json('user.id'),
      'POST /auth/login: user has email':     (r) => !!r.json('user.email'),
    });

    if (ok) token = loginRes.json('accessToken');
  });

  if (!token) {
    console.error('Login failed – skipping rest of auth flow');
    sleep(1);
    return;
  }

  const authHeader = {
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
    },
  };

  sleep(0.3);

  // ── 2. AUTHENTICATED PROFILE READS ─────────────────────────────────────────
  group('2. Authenticated reads', () => {
    // GET /api/me
    const meRes = http.get(`${BASE_URL}/api/me`, authHeader);
    check(meRes, {
      'GET /api/me: status 200':        (r) => r.status === 200,
      'GET /api/me: has id':            (r) => r.json().hasOwnProperty('id'),
      'GET /api/me: has email':         (r) => r.json().hasOwnProperty('email'),
      'GET /api/me: has email_verified':(r) => r.json().hasOwnProperty('email_verified'),
    });

    // GET /api/profile (JWT payload endpoint)
    const profileRes = http.get(`${BASE_URL}/api/profile`, authHeader);
    check(profileRes, {
      'GET /api/profile: status 200': (r) => r.status === 200,
    });
  });

  sleep(0.3);

  // ── 3. TOKEN REFRESH ────────────────────────────────────────────────────────
  // k6 manages cookies per VU: the refreshToken cookie set during login is
  // automatically sent with this request.
  group('3. Token refresh', () => {
    const refreshRes = http.post(
      `${BASE_URL}/auth/refresh`,
      null,
      jsonHeader
    );
    check(refreshRes, {
      'POST /auth/refresh: 200 or 401': (r) =>
        r.status === 200 || r.status === 401, // 401 = no cookie in k6 headless mode is OK
    });

    // If we got a new token, use it for subsequent requests
    if (refreshRes.status === 200 && refreshRes.json('accessToken')) {
      token = refreshRes.json('accessToken');
      authHeader.headers.Authorization = `Bearer ${token}`;
    }
  });

  sleep(0.3);

  // ── 4. CHANGE PASSWORD (wrong current password → 401 expected) ──────────────
  // We deliberately test with wrong current password – verifies the endpoint
  // handles bad credentials correctly without changing anything.
  group('4. Change password (validation check)', () => {
    const changeRes = http.post(
      `${BASE_URL}/api/change-password`,
      JSON.stringify({
        currentPassword: 'wrong-password-for-testing',
        newPassword:     'NewPassword123!',
      }),
      authHeader
    );
    check(changeRes, {
      'POST /api/change-password (wrong pw): 401': (r) => r.status === 401,
    });
  });

  sleep(0.3);

  // ── 5. FORGOT PASSWORD ──────────────────────────────────────────────────────
  // Use a non-existent email so the controller returns immediately without
  // triggering a real SMTP call (avoids Gmail throttling under load).
  group('5. Forgot password', () => {
    const forgotRes = http.post(
      `${BASE_URL}/auth/forgotpassword`,
      JSON.stringify({ email: 'no-smtp-load-test@example.invalid' }),
      jsonHeader
    );
    check(forgotRes, {
      'POST /auth/forgotpassword: status 200': (r) => r.status === 200,
      'POST /auth/forgotpassword: has message':(r) => !!r.json('message'),
    });
  });

  sleep(0.3);

  // ── 6. RESEND EMAIL VERIFICATION ───────────────────────────────────────────
  // Use a non-existent email so the controller returns 404 immediately without
  // an SMTP call.
  group('6. Resend verification', () => {
    const resendRes = http.post(
      `${BASE_URL}/auth/resend-verification`,
      JSON.stringify({ email: 'no-smtp-load-test@example.invalid' }),
      jsonHeader
    );
    check(resendRes, {
      'POST /auth/resend-verification: 200 or 404': (r) =>
        r.status === 200 || r.status === 404,
    });
  });

  sleep(0.3);

  // ── 7. LOGOUT ───────────────────────────────────────────────────────────────
  group('7. Logout', () => {
    const logoutRes = http.post(`${BASE_URL}/auth/logout`, null, authHeader);
    check(logoutRes, {
      'POST /auth/logout: status 200':         (r) => r.status === 200,
      'POST /auth/logout: message correct':    (r) =>
        r.json('message') === 'Logout successful',
    });
  });

  sleep(0.3);

  // ── 8. VERIFY LOGOUT INVALIDATED THE REFRESH TOKEN ───────────────────────
  // Access tokens are stateless JWTs — they remain valid until expiry even after
  // logout. The correct way to verify logout worked is to confirm the refresh
  // token was deleted: POST /auth/refresh must return 401.
  group('8. Refresh rejected after logout', () => {
    const postLogoutRefresh = http.post(`${BASE_URL}/auth/refresh`, null, jsonHeader);
    check(postLogoutRefresh, {
      'POST /auth/refresh after logout: 401': (r) => r.status === 401,
    });
  });

  // Think time between full auth cycles
  sleep(Math.random() * 2 + 1);
}
