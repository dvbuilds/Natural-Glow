import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const ISSUER = 'natural-glow-api';

export const signAdminToken = (admin) =>
  jwt.sign({ sub: String(admin._id), role: admin.role }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: ISSUER,
  });

export const verifyAdminToken = (token) =>
  jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'], issuer: ISSUER });
