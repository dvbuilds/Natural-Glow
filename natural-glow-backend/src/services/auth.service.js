import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { Admin } from '../models/Admin.js';
import { ApiError } from '../utils/ApiError.js';
import { signAdminToken } from '../utils/token.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

// Compared against when the email is unknown, so response time does not reveal whether an account exists.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', env.BCRYPT_ROUNDS);

const invalid = () =>
  ApiError.unauthorized('Invalid email or password', { code: 'INVALID_CREDENTIALS' });

export async function login({ email, password }) {
  const admin = await Admin.findOne({ email }).select('+password');

  if (!admin || !admin.isActive) {
    await bcrypt.compare(password, DUMMY_HASH);
    throw invalid();
  }

  if (admin.lockUntil && admin.lockUntil > new Date()) {
    throw new ApiError(429, 'Too many failed login attempts. Please try again later.', {
      code: 'ACCOUNT_LOCKED',
    });
  }

  const ok = await admin.comparePassword(password);
  if (!ok) {
    const updated = await Admin.findByIdAndUpdate(
      admin._id,
      { $inc: { failedLoginAttempts: 1 } },
      { new: true }
    );
    if (updated.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      await Admin.updateOne(
        { _id: admin._id },
        { $set: { lockUntil: new Date(Date.now() + LOCK_MS), failedLoginAttempts: 0 } }
      );
    }
    throw invalid();
  }

  await Admin.updateOne(
    { _id: admin._id },
    { $set: { failedLoginAttempts: 0, lastLoginAt: new Date() }, $unset: { lockUntil: 1 } }
  );

  return {
    token: signAdminToken(admin),
    tokenType: 'Bearer',
    expiresIn: env.JWT_EXPIRES_IN,
    admin: admin.toJSON(),
  };
}
