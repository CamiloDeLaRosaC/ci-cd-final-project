module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/app.js'],
  coverageThreshold: { global: { branches: 95, functions: 100, lines: 95, statements: 95 } }
};
