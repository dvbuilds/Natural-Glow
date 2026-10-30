export default {
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    testTimeout: 30000,
    hookTimeout: 180000,
    pool: 'forks',
  },
};
