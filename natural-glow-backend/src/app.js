import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { isDbConnected } from './config/db.js';
import routes from './routes/index.js';
import { generalLimiter } from './middleware/rateLimiters.js';
import { sanitizeRequest } from './middleware/sanitize.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ApiError } from './utils/ApiError.js';

const app = express();

app.set('trust proxy', env.TRUST_PROXY); // correct client IPs behind Render's proxy (needed for rate limiting)
app.disable('x-powered-by');

app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      // No Origin header = non-browser client (curl, health checks, server-to-server): CORS does not apply.
      if (!origin || env.CORS_ORIGINS.includes(origin)) return cb(null, true);
      return cb(ApiError.forbidden('Origin not allowed', { code: 'CORS_ORIGIN_DENIED' }));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  })
);
app.use(express.json({ limit: '100kb' }));
app.use(sanitizeRequest);

// Health check (before the rate limiter so uptime pings never get throttled)
app.get('/api/v1/health', (_req, res) => {
  const dbUp = isDbConnected();
  res.status(dbUp ? 200 : 503).json({
    success: dbUp,
    message: dbUp ? 'OK' : 'Database unavailable',
    data: { status: dbUp ? 'ok' : 'degraded', uptimeSeconds: Math.round(process.uptime()) },
  });
});

app.use('/api/v1', generalLimiter, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
