/**
 * Users API integration tests
 * GET /api/me, PUT /api/profile, POST /api/change-password,
 * GET /api/users, GET /api/users/:id, DELETE /api/users/:id
 */
import { jest } from '@jest/globals';

process.env.ACCESS_TOKEN_SECRET = 'test-jwt-secret-for-jest';
process.env.JWT_SECRET = 'test-jwt-secret-for-jest';
process.env.DISABLE_RATE_LIMIT = 'true';
process.env.NODE_ENV = 'test';

const mockPool = { query: jest.fn(), on: jest.fn(), end: jest.fn() };

jest.unstable_mockModule('../src/db/pool.js', () => ({ default: mockPool }));

jest.unstable_mockModule('../src/utils/logger.js', () => ({
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), stream: { write: jest.fn() } },
}));

const { default: request } = await import('supertest');
const { default: app } = await import('../src/app.js');
const { makeToken } = await import('./helpers.js');

const AUTH = () => ({ Authorization: `Bearer ${makeToken(1)}` });
// -----------------------------------------------------------------------------
describe('GET /api/me', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user profile', async () => {
    const user = {
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
      email_verified: true,
      profile_photo: null,
      created_at: '2026-01-01T00:00:00.000Z',
    };
    mockPool.query.mockResolvedValueOnce({ rows: [user], rowCount: 1 });

    const res = await request(app).get('/api/me').set(AUTH());

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('alice@example.com');
    expect(res.body).not.toHaveProperty('password_hash');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /api/profile', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/profile').send({ name: 'Bob' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when no update fields are provided', async () => {
    const res = await request(app).put('/api/profile').set(AUTH()).send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no updates/i);
  });

  it('returns 409 when new email is already taken', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 99 }] }); // email check

    const res = await request(app)
      .put('/api/profile')
      .set(AUTH())
      .send({ email: 'taken@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already in use/i);
  });

  it('updates the profile name successfully', async () => {
    // Sending only `name` (no email) — the email-check query is skipped;
    // only the UPDATE query runs.
    mockPool.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ id: 1, name: 'New Name', email: 'alice@example.com', email_verified: true }],
    });

    const res = await request(app)
      .put('/api/profile')
      .set(AUTH())
      .send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('New Name');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/change-password', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/change-password')
      .send({ currentPassword: 'old', newPassword: 'new' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/change-password')
      .set(AUTH())
      .send({ currentPassword: 'onlythis' });

    expect(res.status).toBe(400);
  });

  it('returns 401 when current password is incorrect', async () => {
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash('correct', 10);
    mockPool.query.mockResolvedValueOnce({ rows: [{ password_hash: hash }], rowCount: 1 });

    const res = await request(app)
      .post('/api/change-password')
      .set(AUTH())
      .send({ currentPassword: 'wrong', newPassword: 'newSecurePass1!' });

    expect(res.status).toBe(401);
  });

  it('changes password successfully', async () => {
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash('currentPass', 10);
    // 1st query: fetch current password hash
    mockPool.query.mockResolvedValueOnce({ rows: [{ password_hash: hash }], rowCount: 1 });
    // 2nd query: UPDATE password
    mockPool.query.mockResolvedValueOnce({ rowCount: 1, rows: [] });

    const res = await request(app)
      .post('/api/change-password')
      .set(AUTH())
      .send({ currentPassword: 'currentPass', newPassword: 'newSecurePass1!' });

    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/users', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('returns list of all users', async () => {
    const users = [
      { id: 1, name: 'Alice', email: 'alice@example.com', created_at: '2026-01-01T00:00:00.000Z' },
      { id: 2, name: 'Bob', email: 'bob@example.com', created_at: '2026-01-02T00:00:00.000Z' },
    ];
    mockPool.query.mockResolvedValueOnce({ rows: users, rowCount: 2 });

    const res = await request(app).get('/api/users').set(AUTH());

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    // Password hashes must never be exposed
    expect(res.body[0]).not.toHaveProperty('password_hash');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/users/:id', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/users/1');
    expect(res.status).toBe(401);
  });

  it('returns 404 when user is not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app).get('/api/users/999').set(AUTH());

    expect(res.status).toBe(404);
  });

  it('returns a user by ID', async () => {
    const user = { id: 2, name: 'Bob', email: 'bob@example.com', created_at: '2026-01-02T00:00:00.000Z' };
    mockPool.query.mockResolvedValueOnce({ rows: [user], rowCount: 1 });

    const res = await request(app).get('/api/users/2').set(AUTH());

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/users/:id', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).delete('/api/users/1');
    expect(res.status).toBe(401);
  });

  it('returns 404 when user is not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const res = await request(app).delete('/api/users/999').set(AUTH());

    expect(res.status).toBe(404);
  });

  it('deletes a user successfully', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 1, rows: [] });

    const res = await request(app).delete('/api/users/2').set(AUTH());

    expect(res.status).toBe(200);
  });
});

