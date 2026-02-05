// Notice: The following file is used only for running loacl migration from CLI
/* istanbul ignore file */
import { DataSource } from 'typeorm';
import config from 'config';
import { DbConfig } from '@src/common/interfaces';
import { ExtractableRecord } from './entities/extractableRecord.entity';
import { AuditLog } from './entities/auditLog.entity';

const dbConfig = config.get<DbConfig>('db');

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
