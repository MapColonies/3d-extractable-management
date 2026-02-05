/**
 * Test configuration helper that loads database and users config from test.json
 */
import { DbConfig } from '@src/common/interfaces';
import testConfigData from '../../config/test.json';

interface TestConfig {
  db: DbConfig;
}

const testConfig: TestConfig = testConfigData as unknown as TestConfig;

export const getTestDbConfig = (): DbConfig => {
  return testConfig.db;
};

export const getTestConfig = (): TestConfig => {
  return testConfig;
};
