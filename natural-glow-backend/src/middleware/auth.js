import mongoose from 'mongoose';
import { Admin } from '../models/Admin.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAdminToken } from '../utils/token.js';

// Bearer-token auth. Tokens are sent in the Authorization header (never cookies),
// so browsers cannot attach them automatically => no CSRF exposure.
export const requireAdmin = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Authentication required', { code: 'AUTH_REQUIRED' });
  }

  let payload;
  try {
    payload = verifyAdminToken(header.slice(7).trim());
  } catch {
    throw ApiError.unauthorized('Invalid or expired token', { code: 'INVALID_TOKEN' });
  }

  if (!mongoose.isValidObjectId(payload.sub)) {
    throw ApiError.unauthorized('Invalid or expired token', { code: 'INVALID_TOKEN' });
  }

  const admin = await Admin.findById(payload.sub);
  if (!admin || !admin.isActive) {
    throw ApiError.unauthorized('Invalid or expired token', { code: 'INVALID_TOKEN' });
  }

  req.admin = admin;
  next();
});
