module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test', '<rootDir>/backend'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};
