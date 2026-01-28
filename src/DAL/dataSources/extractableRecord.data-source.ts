// Notice: The following file is used only for running loacl migration from CLI
/* istanbul ignore file */
import { DataSource } from 'typeorm';
import config from 'config';
import { DbConfig } from '@src/common/interfaces';
import { ExtractableRecord } from '../entities/extractableRecord.entity';

const dbConfig = config.get<DbConfig>('extractable-db');

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ExtractableRecordDataSource = new DataSource({
  type: dbConfig.type,
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  entities: [ExtractableRecord],
  migrations: ['src/DAL/migrations/extractable/*.ts'],
  synchronize: false,
  logging: false,
});
