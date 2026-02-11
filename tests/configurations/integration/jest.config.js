const { pathsToModuleNameMapper } = require('ts-jest');
const tsconfigJson = require('../../../tsconfig.json');

/** @type {import('jest').Config} */
module.exports = {
  transform: {
    '^.+\\.(ts|js)$': ['@swc/jest'],
  },

  transformIgnorePatterns: ['/node_modules/(?!(@map-colonies/mc-model-types|concaveman|@turf|tinyqueue|rbush|quickselect|robust-predicates)/)'],

  moduleNameMapper: pathsToModuleNameMapper(tsconfigJson.compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),

  testMatch: ['<rootDir>/tests/integration/**/*.spec.ts'],

  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!*/node_modules/', '!/vendor/**', '!*/common/**', '!**/models/**', '!<rootDir>/src/*'],

  coverageReporters: ['text', 'html'],
  coverageDirectory: '<rootDir>/coverage/integration',

  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        multipleReportsUnitePath: './reports',
        pageTitle: 'integration',
        publicPath: './reports',
        filename: 'integration.html',
      },
    ],
  ],

  rootDir: '../../../.',
  setupFiles: ['<rootDir>/tests/configurations/jest.setup.ts'],
  setupFilesAfterEnv: ['jest-openapi', '<rootDir>/tests/configurations/initJestOpenapi.setup.ts'],

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

  globalSetup: '<rootDir>/tests/global-setup.js',
  globalTeardown: '<rootDir>/tests/global-teardown.js',
};
