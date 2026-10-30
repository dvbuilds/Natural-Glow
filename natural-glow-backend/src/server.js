import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import app from './app.js';
import { logger } from './utils/logger.js';

let server;
let shuttingDown = false;

async function shutdown(reason, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`Shutting down (${reason})`);

  // Safety net: force-exit if connections refuse to drain.
  const force = setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
  force.unref();

  try {
    if (server) await new Promise((resolve) => server.close(resolve)); // stop accepting, drain in-flight
    await disconnectDB();
    process.exit(exitCode);
  } catch (err) {
    logger.error('Error during shutdown', { message: err.message });
    process.exit(1);
  }
}

async function start() {
  try {
    await connectDB();
  } catch (err) {
    logger.error('Failed to connect to MongoDB', { message: err.message });
    process.exit(1);
  }

  server = app.listen(env.PORT, () => {
    logger.info(`API listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { message: reason?.message ?? String(reason) });
    shutdown('unhandledRejection', 1);
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { message: err.message, stack: err.stack });
    shutdown('uncaughtException', 1);
  });
}

start();
