/* istanbul ignore file */
import { readFileSync } from 'fs';
import { DataSourceOptions } from 'typeorm';
import { DbConfig } from '../common/interfaces';
import { ExtractableRecord } from './entities/extractableRecord.entity';
import { AuditLog } from './entities/auditLog.entity';

export const createConnectionOptions = (dbConfig: DbConfig): DataSourceOptions => {
  const ENTITIES_DIRS = [ExtractableRecord, AuditLog, 'src/DAL/entities/*.ts'];
  const { enableSslAuth, sslPaths, ...connectionOptions } = dbConfig;

  const baseOptions: DataSourceOptions = { ...connectionOptions, entities: ENTITIES_DIRS, ssl: false };

  if (enableSslAuth === true && sslPaths) {
    return {
      ...baseOptions,
      password: undefined,
      ssl: {
        key: readFileSync(sslPaths.key),
        cert: readFileSync(sslPaths.cert),
        ca: readFileSync(sslPaths.ca),
        rejectUnauthorized: true,
      },
    };
  }

  return baseOptions;
};
