const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

const jestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
};

module.exports = createJestConfig(jestConfig);
