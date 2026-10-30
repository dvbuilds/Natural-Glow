// No database needed: tokens are rejected before any lookup happens.
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';

const api = (path) => `/api/v1${path}`;
const ID = '64b7f0f2a1b2c3d4e5f60718';

const PROTECTED = [
  ['get', '/admin/auth/me'],
  ['get', '/admin/dashboard'],
  ['get', '/admin/services'],
  ['post', '/admin/services'],
  ['patch', `/admin/services/${ID}`],
  ['delete', `/admin/services/${ID}`],
  ['get', '/admin/appointments'],
  ['patch', `/admin/appointments/${ID}/status`],
  ['get', '/admin/gallery'],
  ['post', '/admin/gallery'],
  ['delete', `/admin/gallery/${ID}`],
  ['get', '/admin/testimonials'],
  ['post', '/admin/testimonials'],
  ['get', '/admin/offers'],
  ['post', '/admin/offers'],
  ['get', '/admin/settings'],
  ['put', '/admin/settings'],
  ['get', '/admin/enquiries'],
  ['delete', `/admin/enquiries/${ID}`],
];

describe('protected admin routes', () => {
  it.each(PROTECTED)('%s %s rejects requests without a token', async (method, path) => {
    const res = await request(app)[method](api(path)).send({});
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('AUTH_REQUIRED');
  });

  it('rejects a malformed token', async () => {
    const res = await request(app).get(api('/admin/dashboard')).set('Authorization', 'Bearer garbage');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_TOKEN');
  });

  it('rejects a token signed with the wrong secret', async () => {
    const forged = jwt.sign({ sub: ID, role: 'admin' }, 'a-different-secret-of-sufficient-length-123', {
      issuer: 'natural-glow-api',
    });
    const res = await request(app).get(api('/admin/dashboard')).set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const expired = jwt.sign({ sub: ID, role: 'admin' }, process.env.JWT_SECRET, {
      issuer: 'natural-glow-api',
      expiresIn: -10,
    });
    const res = await request(app).get(api('/admin/dashboard')).set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  it('rejects an unsigned (alg: none) token', async () => {
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const none = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: ID, role: 'admin', iss: 'natural-glow-api' })}.`;
    const res = await request(app).get(api('/admin/dashboard')).set('Authorization', `Bearer ${none}`);
    expect(res.status).toBe(401);
  });

  it('has no public admin registration endpoint', async () => {
    for (const path of ['/admin/auth/register', '/admin/register', '/auth/register']) {
      // eslint-disable-next-line no-await-in-loop
      const res = await request(app).post(api(path)).send({ email: 'x@example.test', password: 'Passw0rd!Passw0rd' });
      expect([401, 404]).toContain(res.status); // never 200/201
    }
  });
});
