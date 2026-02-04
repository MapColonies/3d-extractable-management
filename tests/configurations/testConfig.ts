/**
 * Test configuration helper that loads database and users config from test.json
 */
import testConfigData from '../../config/test.json';

interface DbConfig {
  type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  enableSslAuth: boolean;
  sslPaths: {
    ca: string;
    key: string;
    cert: string;
  };
}

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
