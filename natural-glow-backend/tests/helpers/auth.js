import request from 'supertest';
import app from '../../src/app.js';
import { Admin } from '../../src/models/Admin.js';

export const ADMIN = { name: 'Test Admin', email: 'admin@example.test', password: 'Str0ngPassw0rd!' };

export async function createAdminAndLogin() {
  await Admin.create(ADMIN);
  const res = await request(app)
    .post('/api/v1/admin/auth/login')
    .send({ email: ADMIN.email, password: ADMIN.password });
  return res.body.data.token;
}
