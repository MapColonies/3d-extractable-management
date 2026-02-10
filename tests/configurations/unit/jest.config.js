const { pathsToModuleNameMapper } = require('ts-jest');
const tsconfigJson = require('../../../tsconfig.json');

module.exports = {
  transform: {
    '^.+\\.(ts|js)$': ['@swc/jest'],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@map-colonies/mc-model-types|concaveman|@turf/convex|tinyqueue|rbush|quickselect|robust-predicates)/)',
  ],
  moduleNameMapper: pathsToModuleNameMapper(tsconfigJson.compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
  testMatch: ['<rootDir>/tests/unit/**/*.spec.ts'],
  coverageReporters: ['text', 'html'],
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!*/node_modules/',
    '!/vendor/**',
    '!*/common/**',
    '!**/controllers/**',
    '!**/routes/**',
    '!<rootDir>/src/*',
  ],
  coverageDirectory: '<rootDir>/coverage/unit',
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        multipleReportsUnitePath: './reports',
        pageTitle: 'unit',
        publicPath: './reports',
        filename: 'unit.html',
      },
    ],
  ],
  rootDir: '../../../.',
  setupFiles: ['<rootDir>/tests/configurations/jest.setup.ts'],
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: -10,
    },
  },
};
