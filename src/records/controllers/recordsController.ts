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
  private readonly createdRecordCounter: Counter;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(RecordsManager) private readonly manager: RecordsManager,
    @inject(SERVICES.METRICS) private readonly metricsRegistry: Registry
  ) {
    this.createdRecordCounter = new Counter({
      name: 'created_record',
      help: 'number of created records',
      registers: [this.metricsRegistry],
    });
  }

  public getRecord: TypedRequestHandlers['GET /records/{recordName}'] = (req, res, next) => {
    const { recordName } = req.params;

    const record = this.manager.getRecord(recordName);

    if (!record) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: `Record ${recordName} not found`,
      });
    }

    return res.status(httpStatus.OK).json(record);
  };

  public createRecord: TypedRequestHandlers['POST /records/{recordName}'] = (req, res) => {
    const payload: IExtractableRecord = recordInstance;
    const createdRecord = this.manager.createRecord(payload);
    this.createdRecordCounter.inc(1);
    return res.status(httpStatus.CREATED).json(createdRecord);
  };
}
