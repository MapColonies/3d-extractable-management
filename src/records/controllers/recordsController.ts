/* eslint-disable @typescript-eslint/switch-exhaustiveness-check */
import type { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { type Registry, Counter } from 'prom-client';
import type { TypedRequestHandlers } from '@openapi';
import { SERVICES } from '@common/constants';
import { ValidationsManager } from '@src/validations/models/validationsManager';
import { RecordsManager } from '../models/recordsManager';

@injectable()
export class RecordsController {
  private readonly requestsCounter: Counter;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(RecordsManager) private readonly manager: RecordsManager,
    @inject(ValidationsManager) private readonly validationsManager: ValidationsManager,

    @inject(SERVICES.METRICS) private readonly metricsRegistry: Registry
  ) {
    this.requestsCounter = new Counter({
      name: 'records_requests_total',
      help: 'Total number of requests to records endpoints, labeled by HTTP status code',
      labelNames: ['status'],
      registers: [this.metricsRegistry],
    });
  }

  public getRecords: TypedRequestHandlers['GET /records'] = (_req, res) => {
    try {
      const records = this.manager.getRecords() ?? [];

      return res.status(httpStatus.OK).json(records);
    } catch (err) {
      this.logger.error({ msg: 'Unexpected error getting records', error: err });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ isValid: false, message: 'Failed to get records', code: 'INTERNAL_ERROR' });
    }
  };

  public getRecord: TypedRequestHandlers['GET /records/{recordName}'] = (req, res) => {
    try {
      const { recordName } = req.params;
      const record = this.manager.getRecord(recordName);

      if (!record) {
        return res.status(httpStatus.NOT_FOUND).json({ isValid: false, message: `Record ${recordName} not found`, code: 'INVALID_RECORD_NAME' });
      }

      return res.status(httpStatus.OK).json(record);
    } catch (err) {
      this.logger.error({ msg: 'Unexpected error getting record', error: err });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ isValid: false, message: 'Failed to get record', code: 'INTERNAL_ERROR' });
    }
  };

  public createRecord: TypedRequestHandlers['POST /records/{recordName}'] = (req, res) => {
    try {
      const { recordName } = req.params;
      const { username, password } = req.body;

      const validation = this.validationsManager.validateCreate({ recordName, username, password });

      let status: number;
      if (!validation.isValid) {
        switch (validation.code) {
          case 'MISSING_CREDENTIALS':
            status = httpStatus.BAD_REQUEST;
            break;
          case 'INVALID_RECORD_NAME':
            status = httpStatus.NOT_FOUND;
            break;
          case 'INVALID_CREDENTIALS':
            status = httpStatus.UNAUTHORIZED;
            break;
          default:
            status = httpStatus.INTERNAL_SERVER_ERROR;
            this.logger.error({ msg: 'Unexpected validation error code', code: validation.code });
            break;
        }

        this.requestsCounter.inc({ status: String(status) });
        return res.status(status).json(validation);
      }

      const createdRecord = this.manager.createRecord(recordName);

      this.requestsCounter.inc({ status: '201' });
      return res.status(httpStatus.CREATED).json(createdRecord);
    } catch (error: unknown) {
      const logContext = { recordName: req.params.recordName };

      if (error instanceof Error) {
        this.logger.error({ msg: 'Failed to create record', error, logContext });

        if (error.message === 'Record not found') {
          this.requestsCounter.inc({ status: '404' });
          return res.status(httpStatus.NOT_FOUND).json({ isValid: false, message: error.message, code: 'INVALID_RECORD_NAME' });
        }
      } else {
        this.logger.error({ msg: 'Unexpected error type', error, logContext });
      }

      this.requestsCounter.inc({ status: '500' });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ isValid: false, message: 'Failed to create record', code: 'INTERNAL_ERROR' });
    }
  };

  public validateCreate: TypedRequestHandlers['POST /records/validateCreate'] = (req, res) => {
    try {
      const result = this.validationsManager.validateCreate(req.body);

      const status = result.isValid
        ? httpStatus.OK
        : result.code === 'MISSING_CREDENTIALS'
          ? httpStatus.BAD_REQUEST
          : result.code === 'INVALID_RECORD_NAME'
            ? httpStatus.NOT_FOUND
            : httpStatus.UNAUTHORIZED;

      this.requestsCounter.inc({ status: String(status) });
      return res.status(status).json(result);
    } catch (err) {
      this.logger.error({ msg: 'Failed to validate create', error: err });
      this.requestsCounter.inc({ status: '500' });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ isValid: false, message: 'Failed to validate record', code: 'INTERNAL_ERROR' });
    }
  };

  public deleteRecord: TypedRequestHandlers['DELETE /records/{recordName}'] = (req, res) => {
    try {
      const { recordName } = req.params;
      const { username, password } = req.body;

      const validation = this.validationsManager.validateDelete({ recordName, username, password });

      let status: number;
      if (!validation.isValid) {
        switch (validation.code) {
          case 'MISSING_CREDENTIALS':
            status = httpStatus.BAD_REQUEST;
            break;
          case 'INVALID_RECORD_NAME':
            status = httpStatus.NOT_FOUND;
            break;
          case 'INVALID_CREDENTIALS':
            status = httpStatus.UNAUTHORIZED;
            break;
          default:
            status = httpStatus.INTERNAL_SERVER_ERROR;
            this.logger.error({ msg: 'Unexpected validation error code', code: validation.code });
            break;
        }

        this.requestsCounter.inc({ status: String(status) });
        return res.status(status).json(validation);
      }

      this.manager.deleteRecord(recordName);

      this.requestsCounter.inc({ status: '204' });
      return res.status(httpStatus.NO_CONTENT).send();
    } catch (error: unknown) {
      const logContext = { recordName: req.params.recordName };

      if (error instanceof Error) {
        this.logger.error({ msg: 'Failed to delete record', error, logContext });
      }

      this.requestsCounter.inc({ status: '500' });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ isValid: false, message: 'Failed to delete record', code: 'INTERNAL_ERROR' });
    }
  };

  public validateDelete: TypedRequestHandlers['POST /records/validateDelete'] = (req, res) => {
    try {
      const result = this.validationsManager.validateDelete(req.body);

      let status: number;
      switch (result.code) {
        case 'MISSING_CREDENTIALS':
          status = httpStatus.BAD_REQUEST;
          break;
        case 'INVALID_RECORD_NAME':
          status = httpStatus.NOT_FOUND;
          break;
        case 'INVALID_CREDENTIALS':
          status = httpStatus.UNAUTHORIZED;
          break;
        case 'INTERNAL_ERROR':
          status = httpStatus.INTERNAL_SERVER_ERROR;
          break;
        default:
          status = result.isValid ? httpStatus.OK : httpStatus.INTERNAL_SERVER_ERROR;
      }

      return res.status(status).json(result);
    } catch (err) {
      this.logger.error({ msg: 'Failed to validate delete', error: err });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ isValid: false, message: 'Failed to validate record', code: 'INTERNAL_ERROR' });
    }
  };
}
