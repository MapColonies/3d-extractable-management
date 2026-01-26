// Notice: The following file is used only for running loacl migration from CLI
/* istanbul ignore file */
import { DataSource } from 'typeorm';
import { ExtractableRecord } from '../entities/extractableRecord';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ExtractableRecordDataSource = new DataSource({
  type: 'postgres',
  host: process.env.RECORDS_DB_HOST,
  port: 5432,
  username: process.env.RECORDS_DB_USER,
  password: process.env.RECORDS_DB_PASSWORD,
  database: 'records_db',
  entities: [ExtractableRecord],
  migrations: ['./src/DAL/migrations/*.ts'],
  synchronize: false,
});
