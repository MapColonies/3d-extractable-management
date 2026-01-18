import type { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { type Registry, Counter } from 'prom-client';
import type { TypedRequestHandlers } from '@openapi';
import { SERVICES, IExtractableRecord } from '@common/constants';
import { RecordsManager } from '../models/recordsManager';
import { recordInstance } from '../../common/mocks';

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
      const payload: IExtractableRecord = recordInstance;
      const createdRecord = this.manager.createRecord(payload);

      this.requestsCounter.inc({ status: '201' });
      return res.status(httpStatus.CREATED).json(createdRecord);
    } catch (err) {
      this.logger.error({ msg: 'Failed to create record', error: err });
      this.requestsCounter.inc({ status: '500' });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to create record' });
    }
  };

  public validateRecord: TypedRequestHandlers['POST /records/validate'] = (req, res) => {
    try {
      const validationResult = this.manager.validateRecord(req.body);

      if (!validationResult.isValid) {
        switch (validationResult.code) {
          case 'MISSING_CREDENTIALS':
            this.requestsCounter.inc({ status: '400' });
            return res.status(httpStatus.BAD_REQUEST).json(validationResult);
          case 'INVALID_CREDENTIALS':
            this.requestsCounter.inc({ status: '401' });
            return res.status(httpStatus.UNAUTHORIZED).json(validationResult);
          default:
            this.requestsCounter.inc({ status: '500' });
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to validate record' });
        }
      }

      this.requestsCounter.inc({ status: '200' });
      return res.status(httpStatus.OK).json(validationResult);
    } catch (err) {
      this.logger.error({ msg: 'Unexpected error during validation', error: err });
      this.requestsCounter.inc({ status: '500' });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to validate record' });
    }
  };
}
