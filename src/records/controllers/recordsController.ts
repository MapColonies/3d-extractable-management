import type { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { type Registry, Counter } from 'prom-client';
import type { TypedRequestHandlers } from '@openapi';
import { SERVICES, DEFAULT_START_POSITION, DEFAULT_MAX_RECORDS } from '@common/constants';
import { ValidationsManager } from '@src/validations/models/validationsManager';
import type { IConfig, LogContext } from '@src/common/interfaces';
import { RecordsManager } from '../models/recordsManager';

@injectable()
export class RecordsController {
  private readonly requestsCounter: Counter;
  private readonly logContext: LogContext;
  private readonly maxConfiguredBatchSize: number;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(RecordsManager) private readonly manager: RecordsManager,
    @inject(ValidationsManager) private readonly validationsManager: ValidationsManager,
    @inject(SERVICES.METRICS) private readonly metricsRegistry: Registry,
    @inject(SERVICES.CONFIG) private readonly config: IConfig
  ) {
    this.requestsCounter = new Counter({
      name: 'records_requests_total',
      help: 'Total number of requests to records endpoints, labeled by HTTP status code',
      labelNames: ['status'],
      registers: [this.metricsRegistry],
    });
    this.logContext = { fileName: __filename, class: RecordsManager.name };
    this.maxConfiguredBatchSize = this.config.get<number>('pagination.maxConfiguredBatchSize');
  }

  public getRecords: TypedRequestHandlers['GET /records'] = async (req, res) => {
    const logContext = { ...this.logContext, function: this.getRecords.name };

    const start = Number(req.query?.startPosition ?? DEFAULT_START_POSITION);
    const requestedMax = Number(req.query?.maxRecords ?? DEFAULT_MAX_RECORDS);
    const max = Math.min(requestedMax, this.maxConfiguredBatchSize);

    if (start < 1) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ isValid: false, message: 'startPosition must be a positive integer', code: 'INVALID_START_POSITION' });
    }

    if (requestedMax < 1) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({
          isValid: false,
          message: `maxRecords must be a positive integer and at most ${this.maxConfiguredBatchSize}`,
          code: 'INVALID_MAX_RECORDS',
        });
    }

    if (requestedMax > this.maxConfiguredBatchSize) {
      this.logger.warn({
        msg: 'Requested maxRecords exceeds configured maximum, capping to maxConfiguredBatchSize',
        requestedMax,
        maxConfiguredBatchSize: this.maxConfiguredBatchSize,
        logContext,
      });
    }

    try {
      const result = await this.manager.getRecords(start, max);
      return res.status(httpStatus.OK).json(result);
    } catch (err) {
      this.logger.error({ msg: 'Unexpected error getting records', err, logContext });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ isValid: false, message: 'Failed to get records', code: 'INTERNAL_ERROR' });
    }
  };

  public getRecord: TypedRequestHandlers['GET /records/{recordName}'] = async (req, res) => {
    const logContext = { ...this.logContext, function: this.getRecord.name };
    const { recordName } = req.params;

    try {
      const record = await this.manager.getRecord(recordName);

      if (!record) {
        return res.status(httpStatus.NOT_FOUND).json({ isValid: false, message: `Record ${recordName} not found`, code: 'INVALID_RECORD_NAME' });
      }

      return res.status(httpStatus.OK).json(record);
    } catch (err) {
      this.logger.error({ msg: 'Unexpected error getting record', recordName, err, logContext });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ isValid: false, message: 'Failed to get record', code: 'INTERNAL_ERROR' });
    }
  };

  public createRecord: TypedRequestHandlers['POST /records/{recordName}'] = async (req, res) => {
    const logContext = { ...this.logContext, function: this.createRecord.name };

    const { recordName } = req.params;
    const { username, password, authorizedBy, data } = req.body;

    try {
      this.logger.info({ msg: 'Create record requested, starts validation', logContext });
      const validation = await this.validationsManager.validateCreate({ recordName, username, password });

      if (!validation.isValid) {
        const status = this.getStatusFromValidation(validation);
        this.requestsCounter.inc({ status: String(status) });
        return res.status(status).json(validation);
      }

      this.logger.info({ msg: 'Create record continues, starts creation', logContext });
      const createdRecord = await this.manager.createRecord({
        recordName,
        username,
        authorizedBy,
        data,
      });

      this.requestsCounter.inc({ status: '201' });
      return res.status(httpStatus.CREATED).json(createdRecord);
    } catch (err) {
      this.logger.error({ msg: 'Failed to create record', recordName, err, logContext });
      this.requestsCounter.inc({ status: '500' });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ isValid: false, message: 'Failed to create record', code: 'INTERNAL_ERROR' });
    }
  };

  public deleteRecord: TypedRequestHandlers['DELETE /records/{recordName}'] = async (req, res) => {
    const logContext = { ...this.logContext, function: this.deleteRecord.name };
    const { recordName } = req.params;
    const { username, password } = req.body;

    try {
      this.logger.info({ msg: 'Delete record requested, starts validation', logContext });
      const validation = await this.validationsManager.validateDelete({ recordName, username, password });

      if (!validation.isValid) {
        const status = this.getStatusFromValidation(validation);
        this.requestsCounter.inc({ status: String(status) });
        return res.status(status).json(validation);
      }

      this.logger.info({ msg: 'Delete record continues, starts deletion', logContext });
      const deleted = await this.manager.deleteRecord(recordName);

      if (!deleted) {
        this.requestsCounter.inc({ status: '404' });
        return res.status(httpStatus.NOT_FOUND).json({ isValid: false, message: `Record ${recordName} not found`, code: 'INVALID_RECORD_NAME' });
      }

      this.requestsCounter.inc({ status: '204' });
      return res.status(httpStatus.NO_CONTENT).send();
    } catch (err) {
      this.logger.error({ msg: 'Failed to delete record', recordName, err, logContext });
      this.requestsCounter.inc({ status: '500' });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ isValid: false, message: 'Failed to delete record', code: 'INTERNAL_ERROR' });
    }
  };

  public validateCreate: TypedRequestHandlers['POST /records/validateCreate'] = async (req, res) => {
    const logContext = { ...this.logContext, function: this.validateCreate.name };

    try {
      const result = await this.validationsManager.validateCreate(req.body);
      const status = this.getStatusFromValidation(result);
      this.requestsCounter.inc({ status: String(status) });

      return res.status(status).json(result);
    } catch (err) {
      this.logger.error({ msg: 'Failed to validate create', err, logContext });
      this.requestsCounter.inc({ status: '500' });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ isValid: false, message: 'Failed to validate record', code: 'INTERNAL_ERROR' });
    }
  };

  public validateDelete: TypedRequestHandlers['POST /records/validateDelete'] = async (req, res) => {
    const logContext = { ...this.logContext, function: this.validateDelete.name };

    try {
      const result = await this.validationsManager.validateDelete(req.body);
      const status = this.getStatusFromValidation(result);
      this.requestsCounter.inc({ status: String(status) });

      return res.status(status).json(result);
    } catch (err) {
      this.logger.error({ msg: 'Failed to validate delete', err, logContext });
      this.requestsCounter.inc({ status: '500' });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ isValid: false, message: 'Failed to validate record', code: 'INTERNAL_ERROR' });
    }
  };

  private getStatusFromValidation(result: { isValid: boolean; code?: string }): number {
    if (result.isValid) {
      return httpStatus.OK;
    }

    const code = result.code ?? 'UNKNOWN';
    switch (code) {
      case 'MISSING_CREDENTIALS':
        return httpStatus.BAD_REQUEST;
      case 'INVALID_RECORD_NAME':
        return httpStatus.NOT_FOUND;
      case 'INVALID_CREDENTIALS':
        return httpStatus.UNAUTHORIZED;
      case 'INTERNAL_ERROR':
        return httpStatus.INTERNAL_SERVER_ERROR;
      default:
        this.logger.error({ msg: 'Unexpected validation error code', code: result.code });
        return httpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}
