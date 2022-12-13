const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

const jestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  /**
   * To support absolute imports in tests, we have to add `__dirname` to
   * `moduleDirectories`, @see {@link https://github.com/facebook/jest/issues/12889}
   */
  moduleDirectories: ['node_modules', __dirname],
};

module.exports = createJestConfig(jestConfig);
