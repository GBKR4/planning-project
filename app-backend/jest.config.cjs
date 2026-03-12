/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  // Disable all transforms — Node handles ESM natively via --experimental-vm-modules
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  clearMocks: true,
  // Collect coverage from source files
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/utils/generateVapidKeys.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};
