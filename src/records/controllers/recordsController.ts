import type { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { type Registry, Counter } from 'prom-client';
import type { TypedRequestHandlers } from '@openapi';
import { SERVICES } from '@common/constants';
import { RecordsManager } from '../models/recordsManager';

@injectable()
export class RecordsController {
  private readonly requestsCounter: Counter;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(RecordsManager) private readonly manager: RecordsManager,
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
      const records = this.manager.getRecords();

      if (!records) {
        this.requestsCounter.inc({ status: '200' });
        return res.status(httpStatus.OK).json([]);
      }

      this.requestsCounter.inc({ status: '200' });
      return res.status(httpStatus.OK).json(records);
    } catch (err) {
      this.logger.error({ msg: 'Unexpected error getting records', error: err });
      this.requestsCounter.inc({ status: '500' });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to get records' });
    }
  };

  public getRecord: TypedRequestHandlers['GET /records/{recordName}'] = (req, res) => {
    try {
      const { recordName } = req.params;
      const record = this.manager.getRecord(recordName);

      if (!record) {
        this.requestsCounter.inc({ status: '404' });
        return res.status(httpStatus.NOT_FOUND).json({ message: `Record ${recordName} not found` });
      }

      this.requestsCounter.inc({ status: '200' });
      return res.status(httpStatus.OK).json(record);
    } catch (err) {
      this.logger.error({ msg: 'Unexpected error getting record', error: err });
      this.requestsCounter.inc({ status: '500' });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to get record' });
    }
  };

  public createRecord: TypedRequestHandlers['POST /records/{recordName}'] = (req, res) => {
    try {
      const createdRecord = this.manager.createRecord(req.params.recordName);

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
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to create record' });
    }
  };

  public validateCreate: TypedRequestHandlers['POST /records/validateCreate'] = (req, res) => {
    try {
      const { username, password, recordName } = req.body;
      const result = this.manager.validate('CREATE', { username, password, recordName });

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
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to validate record' });
    }
  };

  public validateDelete: TypedRequestHandlers['POST /records/validateDelete'] = (req, res) => {
    try {
      const { username, password, recordName } = req.body;
      const result = this.manager.validate('DELETE', { username, password, recordName });

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
      this.logger.error({ msg: 'Failed to validate delete', error: err });
      this.requestsCounter.inc({ status: '500' });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to validate record' });
    }
  };
  public deleteRecord: TypedRequestHandlers['DELETE /records/{recordName}'] = (req, res) => {
    const { recordName } = req.params;
    const logContext = { recordName, function: 'deleteRecord' };

    try {
      const deleted = this.manager.deleteRecord(recordName);

      if (!deleted) {
        this.requestsCounter.inc({ status: '404' });
        return res.status(httpStatus.NOT_FOUND).json({ isValid: false, message: 'Record not found', code: 'INVALID_RECORD_NAME' });
      }

      this.requestsCounter.inc({ status: '204' });
      return res.status(httpStatus.NO_CONTENT).send();
    } catch (error: unknown) {
      this.logger.error({ msg: 'Failed to delete record', error, logContext });

      this.requestsCounter.inc({ status: '500' });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to delete record',
      });
    }
  };
}
