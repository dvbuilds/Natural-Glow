import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { Admin } from '../src/models/Admin.js';
import { startTestDb, stopTestDb, clearDb } from './helpers/db.js';
import { ADMIN } from './helpers/auth.js';

const login = (body) => request(app).post('/api/v1/admin/auth/login').send(body);

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(async () => {
  await clearDb();
  await Admin.create(ADMIN);
});

describe('admin authentication', () => {
  it('stores only a bcrypt hash of the password', async () => {
    const stored = await Admin.findOne({ email: ADMIN.email }).select('+password').lean();
    expect(stored.password).not.toBe(ADMIN.password);
    expect(stored.password).toMatch(/^\$2[aby]\$/);
  });

  it('logs in with valid credentials and never returns the password', async () => {
    const res = await login({ email: ADMIN.email, password: ADMIN.password });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.admin.email).toBe(ADMIN.email);
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  it('treats the email case-insensitively', async () => {
    const res = await login({ email: ADMIN.email.toUpperCase(), password: ADMIN.password });
    expect(res.status).toBe(200);
  });

  it('returns the same generic error for a wrong password and an unknown email', async () => {
    const wrong = await login({ email: ADMIN.email, password: 'WrongPassword123!' });
    const unknown = await login({ email: 'nobody@example.test', password: 'WrongPassword123!' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.message).toBe(unknown.body.message);
  });

  it('allows /me with a valid token', async () => {
    const { body } = await login({ email: ADMIN.email, password: ADMIN.password });
    const me = await request(app)
      .get('/api/v1/admin/auth/me')
      .set('Authorization', `Bearer ${body.data.token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(ADMIN.email);
  });

  it('locks the account after repeated failures', async () => {
    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await login({ email: ADMIN.email, password: 'WrongPassword123!' });
    }
    const locked = await login({ email: ADMIN.email, password: ADMIN.password });
    expect(locked.status).toBe(429);
    expect(locked.body.code).toBe('ACCOUNT_LOCKED');
  });

  it('rejects a token for a deactivated admin', async () => {
    const { body } = await login({ email: ADMIN.email, password: ADMIN.password });
    await Admin.updateOne({ email: ADMIN.email }, { isActive: false });
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${body.data.token}`);
    expect(res.status).toBe(401);
  });
});
