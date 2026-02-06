import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { Polygon } from 'geojson';

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

export interface IUser {
  username: string;
  password: string;
}

export enum IAuditAction {
  CREATE = 'CREATE',
  DELETE = 'DELETE',
}

export interface UpdatePayload {
  productName?: string;
  sourceDateStart?: Date;
  sourceDateEnd?: Date;
  footprint?: Polygon;
  description?: string;
  creationDate?: Date;
  minResolutionMeter?: number;
  maxResolutionMeter?: number;
  maxAccuracyCE90?: number;
  absoluteAccuracyLE90?: number;
  accuracySE90?: number;
  relativeAccuracySE90?: number;
  visualAccuracy?: number;
  heightRangeFrom?: number;
  heightRangeTo?: number;
  classification?: string;
  producerName?: string;
  minFlightAlt?: number;
  maxFlightAlt?: number;
  geographicArea?: string;
  keywords?: string;
}

export interface UpdateStatusPayload {
  productStatus: string;
}
