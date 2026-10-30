// No database needed: every request below is rejected by validation before any query runs.
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

const api = (path) => `/api/v1${path}`;

describe('request validation', () => {
  it('rejects a login body with a bad email', async () => {
    const res = await request(app).post(api('/admin/auth/login')).send({ email: 'nope', password: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors[0].field).toBe('body.email');
  });

  it('blocks NoSQL operator injection in the login body', async () => {
    const res = await request(app)
      .post(api('/admin/auth/login'))
      .send({ email: { $gt: '' }, password: { $gt: '' } });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an invalid ObjectId route parameter', async () => {
    const res = await request(app).get(api('/services/not-an-object-id'));
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('params.id');
  });

  it('rejects out-of-range pagination and unknown sort fields', async () => {
    const a = await request(app).get(api('/services?limit=1000'));
    expect(a.status).toBe(400);
    const b = await request(app).get(api('/services?sort=password'));
    expect(b.status).toBe(400);
  });

  it('rejects an appointment request with missing/invalid fields', async () => {
    const res = await request(app).post(api('/appointments')).send({
      customerName: 'A',
      phone: 'abc',
      serviceId: '123',
      preferredDate: '24-10-2026',
      preferredTime: '25:99',
    });
    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(
      expect.arrayContaining([
        'body.customerName',
        'body.phone',
        'body.serviceId',
        'body.preferredDate',
        'body.preferredTime',
      ])
    );
  });

  it('rejects a filled honeypot field on the contact form', async () => {
    const res = await request(app).post(api('/contact')).send({
      name: 'Bot',
      email: 'bot@example.test',
      message: 'Buy cheap stuff now please',
      website: 'http://spam.example',
    });
    expect(res.status).toBe(400);
  });

  it('requires an email or phone on the contact form', async () => {
    const res = await request(app)
      .post(api('/contact'))
      .send({ name: 'Visitor', message: 'Do you offer bridal makeup?' });
    expect(res.status).toBe(400);
  });

  it('returns a safe 400 for malformed JSON (no stack trace)', async () => {
    const res = await request(app)
      .post(api('/contact'))
      .set('Content-Type', 'application/json')
      .send('{"name": ');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('MALFORMED_JSON');
    expect(JSON.stringify(res.body)).not.toMatch(/stack|node_modules/i);
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get(api('/does-not-exist'));
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('denies browser origins that are not on the allow-list', async () => {
    const res = await request(app).get(api('/health')).set('Origin', 'https://evil.example');
    // The health route sits after CORS, so a disallowed origin is rejected.
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CORS_ORIGIN_DENIED');
  });
});
