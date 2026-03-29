/* istanbul ignore file */
import { DataSource, DataSourceOptions } from 'typeorm';
import { DbConfig } from '@src/common/interfaces';
import { createConnectionOptions } from './connectionOptions';

const dbConfig: DbConfig = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? '3d-extractable-management',
  enableSslAuth: process.env.DB_ENABLE_SSL?.toLowerCase() === 'true',
  sslPaths: {
    key: process.env.DB_SSL_KEY_PATH ?? '',
    cert: process.env.DB_SSL_CERT_PATH ?? '',
    ca: process.env.DB_SSL_CA_PATH ?? '',
  },
};

const buildConnectionOptions = (): DataSourceOptions => {
  const options = createConnectionOptions(dbConfig);
  return {
    ...options,
    migrations: ['src/DAL/migrations/*.ts'],
  };
};

/* eslint-disable @typescript-eslint/naming-convention */
export const ExtractabledDataSource = new DataSource(buildConnectionOptions());
