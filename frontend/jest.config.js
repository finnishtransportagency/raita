export default {
  roots: ['<rootDir>/src'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/mocks/**',
  ],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./config/jest/setupTests.js'],
  modulePaths: ['<rootDir>/src'],
  transform: {
    '^.+\\.(ts|js|tsx|jsx)$': '@swc/jest',
    '^.+\\.css$': '<rootDir>/config/jest/cssTransform.js',
  },
  resetMocks: true,
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};
