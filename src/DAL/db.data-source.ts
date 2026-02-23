// Notice: The following file is used only for running loacl migration from CLI
/* istanbul ignore file */
import { DataSource } from 'typeorm';
import { DbConfig } from '@src/common/interfaces';
import { ExtractableRecord } from './entities/extractableRecord.entity';
import { AuditLog } from './entities/auditLog.entity';

// Get DB config from environment variables (used for CLI migrations)
const dbConfig: DbConfig = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? '3d-extractable-management',
};

/* eslint-disable @typescript-eslint/naming-convention */
export const ExtractabledDataSource = new DataSource({
  type: dbConfig.type,
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  entities: [ExtractableRecord, AuditLog],
  migrations: ['src/DAL/migrations/*.ts'],
  synchronize: false,
  logging: false,
});
