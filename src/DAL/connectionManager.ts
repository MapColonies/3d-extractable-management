/* istanbul ignore file */
import { readFileSync } from 'fs';
import { DataSource, DataSourceOptions } from 'typeorm';
import httpStatusCodes from 'http-status-codes';
import type { Logger } from '@map-colonies/js-logger';
import { inject, singleton } from 'tsyringe';
import { promiseTimeout } from '@src/utils/promiseTimeout';
import { AppError } from '@src/utils/appError';
import { DB_TIMEOUT, MAX_CONNECT_RETRIES, SERVICES } from '../common/constants';
import { DbConfig, LogContext } from '../common/interfaces';
import type { ConfigType } from '../common/config';
import { ExtractableRecord } from './entities/extractableRecord.entity';
import { AuditLog } from './entities/auditLog.entity';

@singleton()
export class ConnectionManager {
  private dataSource: DataSource | null = null;
  private readonly dbConfig: DbConfig;
  private readonly logContext: LogContext;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONFIG) private readonly configInstance: ConfigType
  ) {
    this.dbConfig = this.configInstance.get('db') as DbConfig;
    this.logContext = { fileName: __filename, class: ConnectionManager.name };
  }

  public async init(): Promise<void> {
    await this.initDataSource();
  }

  public getDataSourceConnection(): DataSource {
    const logContext = { ...this.logContext, function: this.getDataSourceConnection.name };
    if (this.dataSource?.isInitialized !== true) {
      this.logger.error({ msg: `Database connection not initialized`, logContext });
      throw new AppError('DB', httpStatusCodes.INTERNAL_SERVER_ERROR, `Database connection not initialized`, false);
    }
    return this.dataSource;
  }

  public healthCheck = (): (() => Promise<void>) => {
    return async (): Promise<void> => {
      await this.checkDataSource();
    };
  };

  public shutdown(): () => Promise<void> {
    return async (): Promise<void> => {
      await this.destroyDataSource();
    };
  }

  private async initDataSource(): Promise<void> {
    const logContext = { ...this.logContext, function: this.initDataSource.name };
    let retries = 0;
    let connectionSuccess = false;
    this.logger.info({ msg: `Trying to connect to DB`, host: this.dbConfig.host, database: this.dbConfig.database, logContext });

    while (retries < MAX_CONNECT_RETRIES && !connectionSuccess) {
      try {
        const ds = new DataSource(this.createConnectionOptions(this.dbConfig));
        await ds.initialize();
        this.dataSource = ds;

        this.logger.info({ msg: `Database successfully initialized`, logContext });
        connectionSuccess = true;
      } catch (err) {
        retries++;
        this.logger.warn({ msg: `DB connection failed, retrying ${retries}/${MAX_CONNECT_RETRIES}`, err, logContext });
        await new Promise((res) => setTimeout(res, DB_TIMEOUT));
      }
    }

    if (!connectionSuccess) {
      this.logger.error({ msg: `Database connection failed`, logContext });
      throw new AppError('DB', httpStatusCodes.INTERNAL_SERVER_ERROR, `Database connection failed`, false);
    }
  }

  private async checkDataSource(): Promise<void> {
    const logContext = { ...this.logContext, function: this.checkDataSource.name };
    const dataSource = this.getDataSourceConnection();
    try {
      await promiseTimeout<void>(DB_TIMEOUT, dataSource.query('SELECT 1'));
      this.logger.debug({ msg: `Database health check passed`, logContext });
    } catch (err) {
      this.logger.error({ msg: `Database health check failed`, err, logContext });
      throw new AppError('DB', httpStatusCodes.INTERNAL_SERVER_ERROR, `Database health check failed`, false);
    }
  }

  private async destroyDataSource(): Promise<void> {
    const logContext = { ...this.logContext, function: this.destroyDataSource.name };
    if (this.dataSource?.isInitialized !== true) {
      this.logger.warn({ msg: `Shutdown skipped: Database not initialized`, logContext });
      return;
    }
    try {
      this.logger.info({ msg: `Shutting down database...`, logContext });
      await this.dataSource.destroy();
      this.dataSource = null;
      this.logger.info({ msg: `Database successfully shut down`, logContext });
    } catch (err) {
      this.logger.error({ msg: `Failed to shut down database`, err, logContext });
      throw new AppError('DB', httpStatusCodes.INTERNAL_SERVER_ERROR, `Failed to shut down database`, false);
    }
  }

  private readonly createConnectionOptions = (dbConfig: DbConfig): DataSourceOptions => {
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
}
