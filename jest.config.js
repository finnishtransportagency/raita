module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/backend'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  collectCoverage: true,
  coverageReporters: ['text'],
  testPathIgnorePatterns: ['/node_modules/', 'csvDataParser', '/zod-csv/'],
};
