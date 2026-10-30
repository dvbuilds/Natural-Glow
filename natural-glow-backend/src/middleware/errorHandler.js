import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

// Maps any thrown error to a safe client response. Stack traces, driver messages and
// internals are logged server-side only and never returned.
function normalise(err) {
  if (err instanceof ApiError) return err;

  if (err instanceof ZodError) {
    return new ApiError(400, 'Validation failed', {
      code: 'VALIDATION_ERROR',
      errors: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }

  if (err?.name === 'ValidationError' && err.errors) {
    return new ApiError(400, 'Validation failed', {
      code: 'VALIDATION_ERROR',
      errors: Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })),
    });
  }

  if (err?.name === 'CastError') {
    return new ApiError(400, 'Invalid value supplied', { code: 'INVALID_VALUE' });
  }

  if (err?.code === 11000) {
    return new ApiError(409, 'A record with the same unique value already exists', {
      code: 'DUPLICATE_KEY',
    });
  }

  if (err?.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return new ApiError(413, 'Image is too large', { code: 'FILE_TOO_LARGE' });
    }
    return new ApiError(400, 'Invalid upload', { code: 'INVALID_UPLOAD' });
  }

  if (err?.type === 'entity.parse.failed') {
    return new ApiError(400, 'Malformed JSON body', { code: 'MALFORMED_JSON' });
  }
  if (err?.type === 'entity.too.large') {
    return new ApiError(413, 'Request body too large', { code: 'BODY_TOO_LARGE' });
  }

  return null;
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const known = normalise(err);

  if (!known) {
    logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, {
      message: err?.message,
      stack: err?.stack,
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }

  if (known.statusCode >= 500) {
    logger.error(`Server error on ${req.method} ${req.originalUrl}`, { message: err?.message });
  }

  return res.status(known.statusCode).json({
    success: false,
    message: known.message,
    ...(known.code ? { code: known.code } : {}),
    ...(known.errors ? { errors: known.errors } : {}),
  });
}
