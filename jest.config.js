export default {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/**/*.test.js',
    '!server/**/*.spec.js',
    '!server/node_modules/**',
    '!server/migrations/**',
    '!server/examples/**',
    '!server/tests/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '<rootDir>/server/routes/*.test.js',
    '<rootDir>/server/tests/*.test.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  transform: {},
  transformIgnorePatterns: [],
  moduleNameMapper: {},
  testTimeout: 30000,
  verbose: true,
  maxWorkers: 1,
  bail: false
};
