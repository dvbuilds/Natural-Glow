// Minimal logger. Deliberately avoids importing env.js so it has no dependency cycles.
const silent = process.env.NODE_ENV === 'test' && !process.env.LOG_IN_TESTS;

const write = (level, message, meta) => {
  if (silent) return;
  const line = `${new Date().toISOString()} [${level}] ${message}`;
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  if (meta) fn(line, meta);
  else fn(line);
};

export const logger = {
  info: (m, meta) => write('info', m, meta),
  warn: (m, meta) => write('warn', m, meta),
  error: (m, meta) => write('error', m, meta),
};
