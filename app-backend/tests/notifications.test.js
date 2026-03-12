/**
 * Notifications API integration tests
 */
import { jest } from '@jest/globals';

process.env.ACCESS_TOKEN_SECRET = 'test-jwt-secret-for-jest';
process.env.JWT_SECRET = 'test-jwt-secret-for-jest';
process.env.DISABLE_RATE_LIMIT = 'true';
process.env.NODE_ENV = 'test';
process.env.VAPID_PUBLIC_KEY = 'test-vapid-public-key';

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
describe('GET /api/notifications/vapid-public-key (public)', () => {
  it('returns the VAPID public key without authentication', async () => {
    const res = await request(app).get('/api/notifications/vapid-public-key');

    expect(res.status).toBe(200);
    expect(res.body.publicKey).toBe('test-vapid-public-key');
  });

  it('returns 500 when VAPID key is not configured', async () => {
    const original = process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PUBLIC_KEY;

    const res = await request(app).get('/api/notifications/vapid-public-key');

    expect(res.status).toBe(500);
    process.env.VAPID_PUBLIC_KEY = original;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/notifications', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });

  it('returns empty notifications list', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app).get('/api/notifications').set(AUTH());

    expect(res.status).toBe(200);
    expect(res.body.notifications).toEqual([]);
  });

  it('returns list of notifications for the user', async () => {
    const notifications = [
      { id: 1, type: 'task_reminder', title: 'Task due', message: 'Your task is due soon', read: false },
      { id: 2, type: 'plan_ready', title: 'Plan ready', message: 'Your plan is ready', read: true },
    ];
    mockPool.query.mockResolvedValueOnce({ rows: notifications, rowCount: 2 });

    const res = await request(app).get('/api/notifications').set(AUTH());

    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(2);
    expect(res.body.notifications[0].type).toBe('task_reminder');
  });

  it('supports limit and offset query params', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .get('/api/notifications?limit=10&offset=5')
      .set(AUTH());

    expect(res.status).toBe(200);
    // Verify query was called with limit=10 and offset=5
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['10', '5'])
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/notifications/unread', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/notifications/unread');
    expect(res.status).toBe(401);
  });

  it('returns unread count of 0 when no unread notifications', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ unread_count: '0' }], rowCount: 1 });

    const res = await request(app).get('/api/notifications/unread').set(AUTH());

    expect(res.status).toBe(200);
    expect(res.body.unreadCount).toBe(0);
  });

  it('returns correct unread notification count', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ unread_count: '7' }], rowCount: 1 });

    const res = await request(app).get('/api/notifications/unread').set(AUTH());

    expect(res.status).toBe(200);
    expect(res.body.unreadCount).toBe(7);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/notifications/preferences', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/notifications/preferences');
    expect(res.status).toBe(401);
  });

  it('returns user notification preferences', async () => {
    const prefs = { user_id: 1, email_notifications: true, push_notifications: false };
    mockPool.query.mockResolvedValueOnce({ rows: [prefs], rowCount: 1 });

    const res = await request(app).get('/api/notifications/preferences').set(AUTH());

    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /api/notifications/preferences', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/notifications/preferences').send({});
    expect(res.status).toBe(401);
  });

  it('updates notification preferences', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ user_id: 1, email_notifications: false, push_notifications: true }],
      rowCount: 1,
    });

    const res = await request(app)
      .put('/api/notifications/preferences')
      .set(AUTH())
      .send({ email_notifications: false, push_notifications: true });

    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PATCH /api/notifications/read-all', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).patch('/api/notifications/read-all');
    expect(res.status).toBe(401);
  });

  it('marks all notifications as read', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 5, rows: [] });

    const res = await request(app).patch('/api/notifications/read-all').set(AUTH());

    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PATCH /api/notifications/:id/read', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).patch('/api/notifications/1/read');
    expect(res.status).toBe(401);
  });

  it('returns 404 when notification not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const res = await request(app).patch('/api/notifications/999/read').set(AUTH());

    expect(res.status).toBe(404);
  });

  it('marks a single notification as read', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, read: true }] });

    const res = await request(app).patch('/api/notifications/1/read').set(AUTH());

    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/notifications/:id', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).delete('/api/notifications/1');
    expect(res.status).toBe(401);
  });

  it('returns 404 when notification not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const res = await request(app).delete('/api/notifications/999').set(AUTH());

    expect(res.status).toBe(404);
  });

  it('deletes a notification successfully', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 1, rows: [] });

    const res = await request(app).delete('/api/notifications/1').set(AUTH());

    expect(res.status).toBe(200);
  });
});

