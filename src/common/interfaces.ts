import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export interface IConfig {
  get: <T>(setting: string) => T;
  has: (setting: string) => boolean;
}

export interface LogContext {
  fileName: string;
  class: string;
  function?: string;
}

export interface DbConfig extends PostgresConnectionOptions {
  type: 'postgres';
  host: string;
  port: number;
  username: string;
  password?: string;
  database: string;
  enableSslAuth?: boolean;
  sslPaths?: {
    ca: string;
    cert: string;
    key: string;
  };
}
