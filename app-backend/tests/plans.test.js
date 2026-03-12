/**
 * Plans API integration tests
 * POST /api/plans, GET /api/plans, POST /api/plans/generate,
 * POST /api/plans/blockplan, POST /api/plans/blocks/:blockId/done,
 * POST /api/plans/blocks/:blockId/missed
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

jest.unstable_mockModule('../src/services/plannerEngine.js', () => ({
  assignSlots: jest.fn().mockResolvedValue([]),
  regeneratePlan: jest.fn().mockResolvedValue([]),
  generateSchedule: jest.fn().mockReturnValue([]),
}));

const { default: request } = await import('supertest');
const { default: app } = await import('../src/app.js');
const { makeToken } = await import('./helpers.js');

const AUTH = () => ({ Authorization: `Bearer ${makeToken(1)}` });
// -----------------------------------------------------------------------------
describe('POST /api/plans', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/plans').send({ plan_date: '2026-03-12' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when plan_date is missing', async () => {
    const res = await request(app).post('/api/plans').set(AUTH()).send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/plan_date/i);
  });

  it('returns 409 when plan already exists for that date', async () => {
    // ON CONFLICT DO NOTHING → rowCount 0
    mockPool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const res = await request(app)
      .post('/api/plans')
      .set(AUTH())
      .send({ plan_date: '2026-03-12' });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('creates a new daily plan', async () => {
    const plan = { id: 5, user_id: 1, plan_date: '2026-03-12', work_start: '09:00', work_end: '17:00' };
    mockPool.query.mockResolvedValueOnce({ rowCount: 1, rows: [plan] });

    const res = await request(app)
      .post('/api/plans')
      .set(AUTH())
      .send({ plan_date: '2026-03-12', work_start: '09:00', work_end: '17:00' });

    expect(res.status).toBe(201);
    expect(res.body.plan_date).toBe('2026-03-12');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/plans', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/plans');
    expect(res.status).toBe(401);
  });

  it('returns plan data for authenticated user', async () => {
    const plan = { id: 1, user_id: 1, plan_date: '2026-03-12', work_start: '09:00', work_end: '22:00' };
    mockPool.query
      .mockResolvedValueOnce({ rows: [plan], rowCount: 1 })  // SELECT plan
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })       // SELECT busy blocks
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });      // SELECT plan_blocks

    const res = await request(app)
      .get('/api/plans?date=2026-03-12')
      .set(AUTH());

    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/plans/generate', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/plans/generate').send({ date: '2026-03-12' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when date is missing', async () => {
    const res = await request(app).post('/api/plans/generate').set(AUTH()).send({});
    expect(res.status).toBe(400);
  });

  it('generates a plan and returns schedule', async () => {
    mockPool.query
      // 1. UPSERT plan
      .mockResolvedValueOnce({ rows: [{ id: 10 }], rowCount: 1 })
      // 2. DELETE old blocks
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      // 3. SELECT plan details (work_start, work_end)
      .mockResolvedValueOnce({ rows: [{ id: 10, work_start: '09:00', work_end: '22:00' }], rowCount: 1 })
      // 4. SELECT busy blocks
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      // 5. SELECT tasks
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });
    // assignSlots returns [] (mocked), so no INSERT queries run

    const res = await request(app)
      .post('/api/plans/generate')
      .set(AUTH())
      .send({ date: '2026-03-12' });

    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/plans/blockplan', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/plans/blockplan').send({});
    expect(res.status).toBe(401);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/plans/blockplan')
      .set(AUTH())
      .send({ plan_id: 1 }); // missing block_type, start_at, end_at

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/missing/i);
  });

  it('returns 400 when end_at is not after start_at', async () => {
    const res = await request(app)
      .post('/api/plans/blockplan')
      .set(AUTH())
      .send({
        plan_id: 1,
        block_type: 'task',
        start_at: '2026-03-12T12:00:00.000Z',
        end_at: '2026-03-12T10:00:00.000Z', // before start
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/end_at/i);
  });

  it('returns 403 when plan does not belong to the user', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] }); // plan check fails

    const res = await request(app)
      .post('/api/plans/blockplan')
      .set(AUTH())
      .send({
        plan_id: 99,
        block_type: 'task',
        start_at: '2026-03-12T10:00:00.000Z',
        end_at: '2026-03-12T11:00:00.000Z',
      });

    expect(res.status).toBe(403);
  });

  it('adds a plan block successfully', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] }); // plan check
    mockPool.query.mockResolvedValueOnce({ rowCount: 1, rows: [] }); // INSERT

    const res = await request(app)
      .post('/api/plans/blockplan')
      .set(AUTH())
      .send({
        plan_id: 1,
        block_type: 'task',
        start_at: '2026-03-12T10:00:00.000Z',
        end_at: '2026-03-12T11:00:00.000Z',
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/successful/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/plans/blocks/:blockId/done', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/plans/blocks/1/done').send({});
    expect(res.status).toBe(401);
  });

  it('marks a block as done', async () => {
    mockPool.query
      // 1. SELECT block JOIN plans — user_id must match token user (1)
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, user_id: 1, task_id: null, plan_id: 5 }] })
      // 2. UPDATE plan_blocks status = 'done'
      .mockResolvedValueOnce({ rowCount: 1, rows: [] });

    const res = await request(app)
      .post('/api/plans/blocks/1/done')
      .set(AUTH())
      .send({});

    if (res.status !== 200) console.error('DEBUG markBlockDone error:', JSON.stringify(res.body));
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/done/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/plans/blocks/:blockId/missed', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/plans/blocks/1/missed');
    expect(res.status).toBe(401);
  });

  it('marks a block as missed (no reschedule)', async () => {
    mockPool.query
      // 1. SELECT block JOIN plans
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, user_id: 1, task_id: null, plan_id: 5, plan_date: '2026-03-12', work_end: '22:00' }] })
      // 2. UPDATE plan_blocks status = 'missed'
      .mockResolvedValueOnce({ rowCount: 1, rows: [] })
      // 3. DELETE remaining scheduled blocks
      .mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const res = await request(app)
      .post('/api/plans/blocks/1/missed')
      .set(AUTH())
      .send({ reschedule: false });

    expect(res.status).toBe(200);
  });
});

