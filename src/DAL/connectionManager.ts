/* istanbul ignore file */
import config from 'config';
import { DataSource } from 'typeorm';
import httpStatusCodes from 'http-status-codes';
import type { Logger } from '@map-colonies/js-logger';
import { inject, singleton } from 'tsyringe';
import { promiseTimeout } from '@src/utils/promiseTimeout';
import { AppError } from '@src/utils/appError';
import { DB_TIMEOUT, MAX_CONNECT_RETRIES, SERVICES } from '../common/constants';
import { DbConfig, LogContext } from '../common/interfaces';
import { createConnectionOptions } from './createConnectionOptions';

@singleton()
export class ConnectionManager {
  private auditDataSource: DataSource | null = null;
  private extractableDataSource: DataSource | null = null;
  private readonly auditConnectionConfig: DbConfig;
  private readonly extractableConnectionConfig: DbConfig;
  private readonly logContext: LogContext;

  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger) {
    this.auditConnectionConfig = config.get<DbConfig>('audit-db');
    this.extractableConnectionConfig = config.get<DbConfig>('extractable-db');
    this.logContext = { fileName: __filename, class: ConnectionManager.name };
  }

  public async init(): Promise<void> {
    await Promise.all([this.initDataSource('audit'), this.initDataSource('extractable')]);
  }

  public getDataSource(type: 'audit' | 'extractable'): DataSource {
    const logContext = { ...this.logContext, function: `getDataSource:${type}` };
    const dataSource = type === 'audit' ? this.auditDataSource : this.extractableDataSource;

    if (dataSource?.isInitialized !== true) {
      this.logger.error({ msg: `${type} Data Source not available or lost`, logContext });
      throw new AppError('DB', httpStatusCodes.INTERNAL_SERVER_ERROR, `${type} Database connection not initialized`, false);
    }

    return dataSource;
  }

  public healthCheck = (): (() => Promise<void>) => {
    return async (): Promise<void> => {
      await Promise.all([this.checkDataSource('audit'), this.checkDataSource('extractable')]);
    };
  };

  public shutdown(): () => Promise<void> {
    return async (): Promise<void> => {
      await Promise.all([this.destroyDataSource('audit'), this.destroyDataSource('extractable')]);
    };
  }

  private async initDataSource(type: 'audit' | 'extractable'): Promise<void> {
    const logContext = { ...this.logContext, function: `initDataSource:${type}` };
    const config = type === 'audit' ? this.auditConnectionConfig : this.extractableConnectionConfig;

    let retries = 0;
    let connectionSuccess = false;

    while (retries < MAX_CONNECT_RETRIES && !connectionSuccess) {
      try {
        const dataSource = new DataSource(createConnectionOptions(config));
        await dataSource.initialize();

        if (type === 'audit') this.auditDataSource = dataSource;
        else this.extractableDataSource = dataSource;

        this.logger.info({ msg: `${type} Data Source successfully initialized`, logContext });
        connectionSuccess = true;
      } catch (error) {
        retries++;
        this.logger.warn({ msg: `${type} DB connection failed, retrying ${retries}/${MAX_CONNECT_RETRIES}`, error, logContext });
        await new Promise((res) => setTimeout(res, DB_TIMEOUT));
      }
    }

    if (!connectionSuccess) {
      this.logger.error({ msg: `${type} Database connection failed`, logContext });
      throw new AppError('DB', httpStatusCodes.INTERNAL_SERVER_ERROR, `${type} Database connection failed`, false);
    }
  }
  private async checkDataSource(type: 'audit' | 'extractable'): Promise<void> {
    const logContext = { ...this.logContext, function: `checkDataSource:${type}` };
    const dataSource = this.getDataSource(type);

    try {
      const check = dataSource.query('SELECT 1').then(() => {});
      await promiseTimeout<void>(DB_TIMEOUT, check);
      this.logger.debug({ msg: `${type} Database health check passed`, logContext });
    } catch (error) {
      this.logger.error({ msg: `${type} Database health check failed`, error, logContext });
      throw new AppError('DB', httpStatusCodes.INTERNAL_SERVER_ERROR, `${type} Database health check failed`, false);
    }
  }

  private async destroyDataSource(type: 'audit' | 'extractable'): Promise<void> {
    const logContext = { ...this.logContext, function: `destroyDataSource:${type}` };
    const dataSource = type === 'audit' ? this.auditDataSource : this.extractableDataSource;

    if (dataSource?.isInitialized !== true) {
      this.logger.warn({ msg: `Shutdown skipped: ${type} Data Source not initialized`, logContext });
      return;
    }

    try {
      this.logger.info({ msg: `Shutting down ${type} Data Source...`, logContext });
      await dataSource.destroy();
      if (type === 'audit') this.auditDataSource = null;
      else this.extractableDataSource = null;
      this.logger.info({ msg: `${type} Data Source successfully shut down`, logContext });
    } catch (error) {
      this.logger.error({ msg: `Failed to shut down ${type} Data Source`, error, logContext });
      throw new AppError('DB', httpStatusCodes.INTERNAL_SERVER_ERROR, `Failed to shut down ${type} database connection`, false);
    }
  }
}
