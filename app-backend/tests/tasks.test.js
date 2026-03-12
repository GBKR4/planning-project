/**
 * Tasks API integration tests
 * GET /api/tasks, POST /api/tasks, GET /api/tasks/:id,
 * PATCH /api/tasks/:id, DELETE /api/tasks/:id
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

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/tasks', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  it('returns an empty array when user has no tasks', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app).get('/api/tasks').set(AUTH());

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  it('returns list of tasks for the authenticated user', async () => {
    const fakeTasks = [
      { id: 1, user_id: 1, title: 'Buy groceries', estimated_minutes: 30, priority: 2 },
      { id: 2, user_id: 1, title: 'Read book', estimated_minutes: 60, priority: 3 },
    ];
    mockPool.query.mockResolvedValueOnce({ rows: fakeTasks, rowCount: 2 });

    const res = await request(app).get('/api/tasks').set(AUTH());

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].title).toBe('Buy groceries');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/tasks', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Task' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(AUTH())
      .send({ title: 'No duration' }); // missing estimated_minutes

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(AUTH())
      .send({ estimated_minutes: 30 });

    expect(res.status).toBe(400);
  });

  it('creates a task and returns 201 with the new task', async () => {
    const newTask = {
      id: 10,
      user_id: 1,
      title: 'Write report',
      estimated_minutes: 90,
      priority: 1,
      status: 'pending',
    };
    mockPool.query.mockResolvedValueOnce({ rows: [newTask], rowCount: 1 });

    const res = await request(app)
      .post('/api/tasks')
      .set(AUTH())
      .send({ title: 'Write report', estimated_minutes: 90, priority: 1 });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Write report');
    expect(res.body.id).toBe(10);
  });

  it('creates a task with optional fields (notes, deadline, time_preference)', async () => {
    const newTask = {
      id: 11,
      user_id: 1,
      title: 'Plan trip',
      notes: 'Book flights',
      estimated_minutes: 45,
      priority: 2,
      time_preference: 'morning',
      deadline_at: '2026-04-01T10:00:00.000Z',
    };
    mockPool.query.mockResolvedValueOnce({ rows: [newTask], rowCount: 1 });

    const res = await request(app)
      .post('/api/tasks')
      .set(AUTH())
      .send({
        title: 'Plan trip',
        notes: 'Book flights',
        estimated_minutes: 45,
        priority: 2,
        time_preference: 'morning',
        deadline_at: '2026-04-01T10:00:00.000Z',
      });

    expect(res.status).toBe(201);
    expect(res.body.time_preference).toBe('morning');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/tasks/:id', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/tasks/1');
    expect(res.status).toBe(401);
  });

  it('returns 404 when task does not belong to the user', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app).get('/api/tasks/999').set(AUTH());

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it('returns the task when it exists and belongs to the user', async () => {
    const task = { id: 5, user_id: 1, title: 'Study', estimated_minutes: 120 };
    mockPool.query.mockResolvedValueOnce({ rows: [task], rowCount: 1 });

    const res = await request(app).get('/api/tasks/5').set(AUTH());

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(5);
    expect(res.body.title).toBe('Study');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PATCH /api/tasks/:id', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).patch('/api/tasks/1').send({ title: 'New' });
    expect(res.status).toBe(401);
  });

  it('returns 404 when task is not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .patch('/api/tasks/999')
      .set(AUTH())
      .send({ title: 'Updated' });

    expect(res.status).toBe(404);
  });

  it('updates a task successfully', async () => {
    const updated = { id: 3, user_id: 1, title: 'Updated Task', estimated_minutes: 60 };
    mockPool.query.mockResolvedValueOnce({ rows: [updated], rowCount: 1 });

    const res = await request(app)
      .patch('/api/tasks/3')
      .set(AUTH())
      .send({ title: 'Updated Task' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Task');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/tasks/:id', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without token', async () => {
    const res = await request(app).delete('/api/tasks/1');
    expect(res.status).toBe(401);
  });

  it('returns 404 when task is not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const res = await request(app).delete('/api/tasks/404').set(AUTH());

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it('deletes a task successfully', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 1, rows: [] });

    const res = await request(app).delete('/api/tasks/3').set(AUTH());

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted successfully/i);
  });
});
