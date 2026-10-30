import 'dotenv/config';
import { z } from 'zod';

const isPlaceholder = (v) => /^(REPLACE_|<)/i.test(v);
const optionalStr = z.string().optional();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  MONGODB_URI: z
    .string({ required_error: 'MONGODB_URI is required' })
    .refine(
      (v) => /^mongodb(\+srv)?:\/\//.test(v) && !v.includes('<'),
      'must be a real MongoDB connection string (still a placeholder?)'
    ),
  MONGO_AUTO_INDEX: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  JWT_SECRET: z
    .string({ required_error: 'JWT_SECRET is required' })
    .min(32, 'must be at least 32 characters')
    .refine((v) => !isPlaceholder(v), 'must not be the placeholder value'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
  CLOUDINARY_CLOUD_NAME: optionalStr,
  CLOUDINARY_API_KEY: optionalStr,
  CLOUDINARY_API_SECRET: optionalStr,
  CLOUDINARY_FOLDER: z.string().default('natural-glow'),
  MAX_UPLOAD_MB: z.coerce.number().min(1).max(20).default(5),
  BOOKING_WINDOW_DAYS: z.coerce.number().int().min(1).max(365).default(60),
  ADMIN_NAME: optionalStr,
  ADMIN_EMAIL: optionalStr,
  ADMIN_PASSWORD: optionalStr,
});

// Treat empty strings as "not set"
const cleaned = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== ''));
const parsed = schema.safeParse(cleaned);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const data = parsed.data;

export const env = Object.freeze({
  ...data,
  CORS_ORIGINS: data.CORS_ORIGINS.split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean),
  isProd: data.NODE_ENV === 'production',
  isTest: data.NODE_ENV === 'test',
  cloudinaryConfigured: Boolean(
    data.CLOUDINARY_CLOUD_NAME && data.CLOUDINARY_API_KEY && data.CLOUDINARY_API_SECRET
  ),
});
