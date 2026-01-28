// Notice: The following file is used only for running loacl migration from CLI
/* istanbul ignore file */
import { DataSource } from 'typeorm';
import config from 'config';
import { DbConfig } from '@src/common/interfaces';
import { AuditLog } from '../entities/auditLog.entity';

const dbConfig = config.get<DbConfig>('audit-db');

// eslint-disable-next-line @typescript-eslint/naming-convention
export const AuditLogDataSource = new DataSource({
  type: dbConfig.type,
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  entities: [AuditLog],
  migrations: ['src/DAL/migrations/audit/*.ts'],
  synchronize: false,
  logging: false,
});
