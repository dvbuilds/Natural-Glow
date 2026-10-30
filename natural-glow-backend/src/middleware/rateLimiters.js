import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const make = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => env.isTest,
    handler: (_req, _res, next) =>
      next(new ApiError(429, message, { code: 'RATE_LIMITED' })),
  });

const MIN = 60 * 1000;

// Whole API: generous, protects against scraping/floods
export const generalLimiter = make(15 * MIN, 600, 'Too many requests. Please try again later.');
// Login: brute-force protection
export const authLimiter = make(15 * MIN, 10, 'Too many login attempts. Please try again later.');
// Public forms (appointments, contact): spam protection
export const formLimiter = make(60 * MIN, 10, 'Too many submissions. Please try again later.');
