/**
 * Auth routes integration tests â€” POST /auth/register, POST /auth/login,
 * POST /auth/logout, GET /api/profile, POST /auth/forgotpassword
 *
 * Uses Jest native ESM mocking (jest.unstable_mockModule) so no Babel
 * transform is required and import.meta is handled natively by Node.
 */
import { jest } from '@jest/globals';

// â”€â”€ env setup (must happen before app import) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
process.env.ACCESS_TOKEN_SECRET = 'test-jwt-secret-for-jest';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-for-jest';
process.env.JWT_SECRET = 'test-jwt-secret-for-jest';
process.env.DISABLE_RATE_LIMIT = 'true';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';

// â”€â”€ mocks (must be registered before dynamic import of app) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const mockPool = { query: jest.fn(), on: jest.fn(), end: jest.fn() };
const mockSendEmail = jest.fn().mockResolvedValue({});

jest.unstable_mockModule('../src/db/pool.js', () => ({
  default: mockPool,
}));

jest.unstable_mockModule('../src/services/email/emailService.js', () => ({
  sendEmail: mockSendEmail,
}));

jest.unstable_mockModule('../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    stream: { write: jest.fn() },
  },
}));

// â”€â”€ lazy imports (picks up mocks registered above) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const { default: request } = await import('supertest');
const { default: app } = await import('../src/app.js');
const { makeToken } = await import('./helpers.js');

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('POST /auth/register', () => {
  beforeEach(() => {
    mockPool.query.mockReset();
    mockSendEmail.mockReset();
    mockSendEmail.mockResolvedValue({});
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/auth/register').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it('returns 409 when email already exists', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] });

    const res = await request(app).post('/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('registers a new user and sends a verification email', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // email exists check
      .mockResolvedValueOnce({ rowCount: 1, rows: [] }); // INSERT user

    const res = await request(app).post('/auth/register').send({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'strongPass1!',
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/registration successful/i);
    expect(res.body.email).toBe('bob@example.com');
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('POST /auth/login', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 400 when credentials are missing', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'x@x.com' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it('returns 401 when user is not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'noone@example.com', password: 'irrelevant' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it('returns 401 when password is wrong', async () => {
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.default.hash('correctPassword', 10);

    mockPool.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ id: 1, name: 'Alice', email: 'alice@example.com', email_verified: true, password_hash: hash }],
    });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'alice@example.com', password: 'wrongPass' });

    expect(res.status).toBe(401);
  });

  it('logs in successfully and returns accessToken + sets cookies', async () => {
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.default.hash('myPassword', 10);

    mockPool.query
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 42, name: 'Carol', email: 'carol@example.com', email_verified: true, password_hash: hash }],
      })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] }); // INSERT refresh_token

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'carol@example.com', password: 'myPassword' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/login successful/i);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.id).toBe(42);
    expect(res.headers['set-cookie']).toBeDefined();
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('POST /auth/logout', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/auth/logout');
    expect(res.status).toBe(401);
  });

  it('logs out successfully with a valid Bearer token', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 1, rows: [] }); // DELETE refresh token

    const token = makeToken(1);
    const res = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logout successful/i);
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('GET /api/profile', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(401);
  });

  it('returns decoded user object for authenticated user', async () => {
    const token = makeToken(7);
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(7);
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('POST /auth/forgotpassword', () => {
  beforeEach(() => mockPool.query.mockReset());

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/auth/forgotpassword').send({});
    expect(res.status).toBe(400);
  });

  it('returns 200 even when email does not exist (prevents user enumeration)', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const res = await request(app)
      .post('/auth/forgotpassword')
      .send({ email: 'ghost@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset link/i);
  });

  it('sends a reset email when user exists', async () => {
    mockSendEmail.mockReset();
    mockSendEmail.mockResolvedValue({});
    mockPool.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 5 }] }) // user exists
      .mockResolvedValueOnce({ rowCount: 1, rows: [] }); // UPDATE reset token

    const res = await request(app)
      .post('/auth/forgotpassword')
      .send({ email: 'real@example.com' });

    expect(res.status).toBe(200);
  });
});