/**
 * One-time admin creation. There is intentionally NO public registration endpoint.
 *
 *   ADMIN_NAME="Owner" ADMIN_EMAIL="owner@example.com" ADMIN_PASSWORD="<strong password>" npm run seed:admin
 *   npm run seed:admin -- --reset-password     (updates the password of an existing admin)
 *
 * Credentials are read from the environment (never from source code). Remove them afterwards.
 * Also makes sure the salon settings document exists (unknown details stay empty).
 */
import { env } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { Admin } from '../models/Admin.js';
import { getSettings } from '../services/settings.service.js';

const resetPassword = process.argv.includes('--reset-password');

function passwordProblem(pw) {
  if (pw.length < 12) return 'must be at least 12 characters';
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw)) {
    return 'must contain upper-case, lower-case and a digit';
  }
  return null;
}

async function main() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (and optionally ADMIN_NAME) in the environment.');
    process.exit(1);
  }
  const problem = passwordProblem(ADMIN_PASSWORD);
  if (problem) {
    console.error(`ADMIN_PASSWORD ${problem}.`);
    process.exit(1);
  }
  const email = ADMIN_EMAIL.trim().toLowerCase();

  await connectDB();
  try {
    const existing = await Admin.findOne({ email }).select('+password');
    if (existing && !resetPassword) {
      console.log(`Admin "${email}" already exists. Use --reset-password to change its password.`);
    } else if (existing) {
      existing.password = ADMIN_PASSWORD; // hashed by the pre-save hook
      existing.failedLoginAttempts = 0;
      existing.lockUntil = undefined;
      await existing.save();
      console.log(`Password updated for "${email}".`);
    } else {
      await Admin.create({ name: ADMIN_NAME || 'Salon Admin', email, password: ADMIN_PASSWORD });
      console.log(`Admin "${email}" created.`);
    }
    await getSettings(); // ensure settings singleton exists
    console.log('Reminder: remove ADMIN_PASSWORD from your environment/.env now.');
  } finally {
    await disconnectDB();
  }
}

main().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
