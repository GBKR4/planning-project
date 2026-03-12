/**
 * Busy Blocks API integration tests
 * POST /api/busyblocks, GET /api/busyblocks, DELETE /api/busyblocks/:id
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
const VALID_BLOCK = {
  title: 'Gym',
  start_at: '2026-03-12T08:00:00.000Z',
  end_at: '2026-03-12T09:00:00.000Z',
};

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/busyblocks', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/busyblocks').send(VALID_BLOCK);
    expect(res.status).toBe(401);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/busyblocks')
      .set(AUTH())
      .send({ title: 'Gym' }); // missing start_at / end_at

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/missing/i);
  });

  it('returns 400 when end_at is before start_at', async () => {
    const res = await request(app)
      .post('/api/busyblocks')
      .set(AUTH())
      .send({
        title: 'Nap',
        start_at: '2026-03-12T10:00:00.000Z',
        end_at: '2026-03-12T09:00:00.000Z',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/end_at/i);
  });

  it('returns 400 when end_at equals start_at', async () => {
    const res = await request(app)
      .post('/api/busyblocks')
      .set(AUTH())
      .send({
        title: 'Zero duration',
        start_at: '2026-03-12T10:00:00.000Z',
        end_at: '2026-03-12T10:00:00.000Z',
      });

    expect(res.status).toBe(400);
  });

  it('creates a busy block and returns 201', async () => {
    const block = {
      id: 1,
      user_id: 1,
      title: 'Gym',
      start_at: '2026-03-12T08:00:00.000Z',
      end_at: '2026-03-12T09:00:00.000Z',
    };
    mockPool.query.mockResolvedValueOnce({ rows: [block], rowCount: 1 });

    const res = await request(app)
      .post('/api/busyblocks')
      .set(AUTH())
      .send(VALID_BLOCK);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Gym');
    expect(res.body.id).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/busyblocks', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/busyblocks');
    expect(res.status).toBe(401);
  });

  it('returns empty array when user has no busy blocks', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app).get('/api/busyblocks').set(AUTH());

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns all busy blocks for the user', async () => {
    const blocks = [
      { id: 1, user_id: 1, title: 'Gym', start_at: '2026-03-12T08:00:00.000Z', end_at: '2026-03-12T09:00:00.000Z' },
      { id: 2, user_id: 1, title: 'Lunch', start_at: '2026-03-12T12:00:00.000Z', end_at: '2026-03-12T13:00:00.000Z' },
    ];
    mockPool.query.mockResolvedValueOnce({ rows: blocks, rowCount: 2 });

    const res = await request(app).get('/api/busyblocks').set(AUTH());

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].title).toBe('Gym');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/busyblocks/:id', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).delete('/api/busyblocks/1');
    expect(res.status).toBe(401);
  });

  it('returns 404 when block not found or belongs to another user', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const res = await request(app).delete('/api/busyblocks/999').set(AUTH());

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it('deletes a busy block successfully', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 1, rows: [] });

    const res = await request(app).delete('/api/busyblocks/1').set(AUTH());

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted successfully/i);
  });
});

