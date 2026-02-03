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

  public getRecords: TypedRequestHandlers['GET /records'] = async (_req, res) => {
    try {
      const records = await this.manager.getRecords();
      return res.status(httpStatus.OK).json(records.map(({ authorizedAt, ...record }) => ({ ...record, authorizedAt: authorizedAt.toISOString() })));
    } catch (err) {
      this.logger.error({ msg: 'Unexpected error getting records', err });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ isValid: false, message: 'Failed to get records', code: 'INTERNAL_ERROR' });
    }
  };

  public getRecord: TypedRequestHandlers['GET /records/{recordName}'] = async (req, res) => {
    const { recordName } = req.params;

    try {
      const record = await this.manager.getRecord(recordName);

      if (!record) {
        return res.status(httpStatus.NOT_FOUND).json({ isValid: false, message: `Record ${recordName} not found`, code: 'INVALID_RECORD_NAME' });
      }

      return res.status(httpStatus.OK).json({ ...record, authorizedAt: record.authorizedAt.toISOString() });
    } catch (err) {
      this.logger.error({ msg: 'Unexpected error getting record', recordName, err });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ isValid: false, message: 'Failed to get record', code: 'INTERNAL_ERROR' });
    }
  };

  public createRecord: TypedRequestHandlers['POST /records/{recordName}'] = async (req, res) => {
    const { recordName } = req.params;
    const { username, password, authorizedBy } = req.body;

    try {
      this.logger.info({ msg: 'Create record requested, starts validation' });
      const validation = await this.validationsManager.validateCreate({ recordName, username, password });

      if (!validation.isValid) {
        const status = this.getStatusFromValidation(validation);
        this.requestsCounter.inc({ status: String(status) });
        return res.status(status).json(validation);
      }

      this.logger.info({ msg: 'Create record continues, starts creation' });
      const createdRecord = await this.manager.createRecord({
        recordName,
        username,
        authorizedBy,
      });

      this.requestsCounter.inc({ status: '201' });
      return res.status(httpStatus.CREATED).json({ ...createdRecord, authorizedAt: createdRecord.authorizedAt.toISOString() });
    } catch (err) {
      this.logger.error({ msg: 'Failed to create record', recordName, err });
      this.requestsCounter.inc({ status: '500' });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ isValid: false, message: 'Failed to create record', code: 'INTERNAL_ERROR' });
    }
  };

  public deleteRecord: TypedRequestHandlers['DELETE /records/{recordName}'] = async (req, res) => {
    const { recordName } = req.params;
    const { username, password } = req.body;

    try {
      this.logger.info({ msg: 'Delete record requested, starts validation' });
      const validation = await this.validationsManager.validateDelete({ recordName, username, password });

      if (!validation.isValid) {
        const status = this.getStatusFromValidation(validation);
        this.requestsCounter.inc({ status: String(status) });
        return res.status(status).json(validation);
      }

      this.logger.info({ msg: 'Delete record continues, starts deletion' });
      const deleted = await this.manager.deleteRecord(recordName);

      if (!deleted) {
        this.requestsCounter.inc({ status: '404' });
        return res.status(httpStatus.NOT_FOUND).json({ isValid: false, message: `Record ${recordName} not found`, code: 'INVALID_RECORD_NAME' });
      }

      this.requestsCounter.inc({ status: '204' });
      return res.status(httpStatus.NO_CONTENT).send();
    } catch (err) {
      this.logger.error({ msg: 'Failed to delete record', recordName, err });
      this.requestsCounter.inc({ status: '500' });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ isValid: false, message: 'Failed to delete record', code: 'INTERNAL_ERROR' });
    }
  };

  public validateCreate: TypedRequestHandlers['POST /records/validateCreate'] = async (req, res) => {
    try {
      const result = await this.validationsManager.validateCreate(req.body);
      const status = this.getStatusFromValidation(result);
      this.requestsCounter.inc({ status: String(status) });

      return res.status(status).json(result);
    } catch (err) {
      this.logger.error({ msg: 'Failed to validate create', err });
      this.requestsCounter.inc({ status: '500' });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ isValid: false, message: 'Failed to validate record', code: 'INTERNAL_ERROR' });
    }
  };

  public validateDelete: TypedRequestHandlers['POST /records/validateDelete'] = async (req, res) => {
    try {
      const result = await this.validationsManager.validateDelete(req.body);
      const status = this.getStatusFromValidation(result);
      this.requestsCounter.inc({ status: String(status) });

      return res.status(status).json(result);
    } catch (err) {
      this.logger.error({ msg: 'Failed to validate delete', err });
      this.requestsCounter.inc({ status: '500' });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ isValid: false, message: 'Failed to validate record', code: 'INTERNAL_ERROR' });
    }
  };

  private getStatusFromValidation(result: { isValid: boolean; code?: string }): number {
    if (result.isValid) {
      return httpStatus.OK;
    }

    switch (result.code) {
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
