import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { Service } from '../src/models/Service.js';
import { Appointment } from '../src/models/Appointment.js';
import { startTestDb, stopTestDb, clearDb } from './helpers/db.js';
import { createAdminAndLogin } from './helpers/auth.js';
import { istDateString } from '../src/utils/time.js';

const daysFromNow = (n) => istDateString(new Date(Date.now() + n * 86400000));

let service;
let inactive;

const body = (over = {}) => ({
  customerName: 'Priya Sharma',
  phone: '+91 90000 00000',
  serviceId: String(service._id),
  preferredDate: daysFromNow(3),
  preferredTime: '11:00',
  ...over,
});
const post = (b) => request(app).post('/api/v1/appointments').send(b);

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(async () => {
  await clearDb();
  service = await Service.create({ name: 'Test Facial', slug: 'test-facial', category: 'skin', price: 800 });
  inactive = await Service.create({
    name: 'Hidden Service',
    slug: 'hidden-service',
    category: 'hair',
    price: 100,
    isActive: false,
  });
});

describe('POST /appointments (public)', () => {
  it('creates a pending request with a server-side name/price snapshot', async () => {
    const res = await post(body());
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.serviceName).toBe('Test Facial');
    expect(res.body.data.servicePrice).toBe(800);
    expect(res.body.message).toMatch(/pending/i);
  });

  it('ignores client-submitted price and status', async () => {
    const res = await post(body({ status: 'confirmed', servicePrice: 1, price: 1, serviceName: 'Hacked' }));
    expect(res.status).toBe(201);
    const saved = await Appointment.findById(res.body.data._id).lean();
    expect(saved.status).toBe('pending');
    expect(saved.servicePrice).toBe(800);
    expect(saved.serviceName).toBe('Test Facial');
  });

  it('keeps the original snapshot if the service price changes later', async () => {
    const res = await post(body());
    await Service.updateOne({ _id: service._id }, { price: 5000, name: 'Renamed' });
    const saved = await Appointment.findById(res.body.data._id).lean();
    expect(saved.servicePrice).toBe(800);
    expect(saved.serviceName).toBe('Test Facial');
  });

  it('rejects an exact duplicate request with 409', async () => {
    expect((await post(body())).status).toBe(201);
    // Same number written differently is normalised, so it is still a duplicate.
    const same = await post(body({ phone: '+919000000000' }));
    expect(same.status).toBe(409);
    expect(same.body.code).toBe('DUPLICATE_APPOINTMENT');
    // A different phone number is a different customer.
    expect((await post(body({ phone: '+918888888888' }))).status).toBe(201);
  });

  it('handles concurrent duplicate submissions (only one succeeds)', async () => {
    const results = await Promise.all([post(body()), post(body()), post(body())]);
    const statuses = results.map((r) => r.status).sort();
    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(await Appointment.countDocuments()).toBe(1);
  });

  it('rejects past dates and times that are too soon', async () => {
    const past = await post(body({ preferredDate: daysFromNow(-2) }));
    expect(past.status).toBe(400);
    expect(past.body.code).toBe('PREFERRED_TIME_TOO_SOON');
  });

  it('rejects dates beyond the booking window', async () => {
    const res = await post(body({ preferredDate: daysFromNow(200) }));
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('PREFERRED_TIME_TOO_FAR');
  });

  it('rejects impossible calendar dates', async () => {
    const res = await post(body({ preferredDate: '2027-02-31' }));
    expect(res.status).toBe(400);
  });

  it('rejects unknown and inactive services', async () => {
    const unknown = await post(body({ serviceId: '64b7f0f2a1b2c3d4e5f60718' }));
    expect(unknown.status).toBe(404);
    const hidden = await post(body({ serviceId: String(inactive._id) }));
    expect(hidden.status).toBe(404);
  });

  it('caps the number of pending requests per phone number', async () => {
    for (const d of [3, 4, 5]) {
      // eslint-disable-next-line no-await-in-loop
      expect((await post(body({ preferredDate: daysFromNow(d) }))).status).toBe(201);
    }
    const res = await post(body({ preferredDate: daysFromNow(6) }));
    expect(res.status).toBe(429);
  });
});

describe('admin appointment management', () => {
  let token;
  let id;
  const auth = () => ({ Authorization: `Bearer ${token}` });
  const setStatus = (b) =>
    request(app).patch(`/api/v1/admin/appointments/${id}/status`).set(auth()).send(b);

  beforeEach(async () => {
    token = await createAdminAndLogin();
    id = (await post(body())).body.data._id;
  });

  it('lists and filters appointments by status', async () => {
    const all = await request(app).get('/api/v1/admin/appointments').set(auth());
    expect(all.status).toBe(200);
    expect(all.body.meta.total).toBe(1);
    const none = await request(app).get('/api/v1/admin/appointments?status=confirmed').set(auth());
    expect(none.body.meta.total).toBe(0);
  });

  it('confirms, then completes, recording history', async () => {
    expect((await setStatus({ status: 'confirmed' })).body.data.status).toBe('confirmed');
    const done = await setStatus({ status: 'completed', note: 'Service done' });
    expect(done.status).toBe(200);
    expect(done.body.data.statusHistory.map((h) => h.status)).toEqual(['pending', 'confirmed', 'completed']);
  });

  it('refuses invalid transitions', async () => {
    await setStatus({ status: 'cancelled' });
    const res = await setStatus({ status: 'confirmed' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('requires a new date and time to reschedule, then updates the time', async () => {
    const missing = await setStatus({ status: 'rescheduled' });
    expect(missing.status).toBe(400);
    const ok = await setStatus({ status: 'rescheduled', newDate: daysFromNow(10), newTime: '15:30' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.status).toBe('rescheduled');
  });

  it('frees the slot for a new request once cancelled', async () => {
    await setStatus({ status: 'cancelled' });
    expect((await post(body())).status).toBe(201);
  });

  it('does not allow "pending" to be set through the status endpoint', async () => {
    expect((await setStatus({ status: 'pending' })).status).toBe(400);
  });

  it('shows dashboard statistics', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.appointments.byStatus.pending).toBe(1);
  });
});
