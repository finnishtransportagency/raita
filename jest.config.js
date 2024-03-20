module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/backend'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  collectCoverage: true,
  coverageReporters: ['text'],
  //for local db testing remove 'csvDataParser' from testPathIgnorePatterns
  //TODO some smart way to do db writing tests in dev
  testPathIgnorePatterns: [
    '/node_modules/',
    //'csvDataParser',
    //'csvDataChopper',
    'contentDataParser',
    'parseFileMetaData',
    '/zod-csv/',
  ],
};
