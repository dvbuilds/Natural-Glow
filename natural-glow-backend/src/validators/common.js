import { z } from 'zod';
import mongoose from 'mongoose';

const stripUnsafe = (s) =>
  s
    .replace(/<[^>]*>/g, '') // HTML tags
    .replace(/[<>]/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // control characters
    .trim();

// Plain text: trimmed, HTML/control characters removed, length-bounded.
export const plainText = (min, max) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters`)
    .transform(stripUnsafe)
    .pipe(z.string().min(min, min === 1 ? 'Required' : `Must be at least ${min} characters`));

export const objectId = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid id')
  .refine((v) => mongoose.isValidObjectId(v), 'Invalid id');

export const idParams = z.object({ id: objectId });

export const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9\s-]{7,16}$/, 'Invalid phone number')
  .transform((v) => v.replace(/[\s-]/g, ''));

export const email = z.string().trim().toLowerCase().email('Invalid email').max(254);
export const optionalEmail = z.union([email, z.literal('')]);

export const httpsUrl = z
  .string()
  .trim()
  .url('Invalid URL')
  .max(500)
  .refine((v) => v.startsWith('https://'), 'URL must start with https://');
export const optionalUrl = z.union([httpsUrl, z.literal('')]);

// "true"/"false" strings (query, multipart) or real booleans (JSON)
export const boolish = z.union([
  z.boolean(),
  z.enum(['true', 'false']).transform((v) => v === 'true'),
]);
export const boolQuery = z.enum(['true', 'false']).transform((v) => v === 'true');

export const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm (24h)');
export const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

export const isoDateTime = z
  .string()
  .datetime({ offset: true, message: 'Use an ISO 8601 date-time' })
  .transform((s) => new Date(s));

export const paginationShape = {
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const searchParam = plainText(1, 100).optional();

export const nonEmptyObject = (schema) =>
  schema.refine((v) => Object.keys(v).length > 0, 'At least one field is required');
