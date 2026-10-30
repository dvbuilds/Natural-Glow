// Runs before every test file. Values set here win over any local .env (dotenv never overrides).
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = `test-secret-${'x'.repeat(48)}`;
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/natural-glow-test';
process.env.BCRYPT_ROUNDS = '4';
process.env.CORS_ORIGINS = 'http://localhost:5173';
process.env.BOOKING_WINDOW_DAYS = '60';
process.env.MAX_UPLOAD_MB = '5';
