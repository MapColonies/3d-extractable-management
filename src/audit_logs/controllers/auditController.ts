import type { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import type { TypedRequestHandlers } from '@openapi';
import { SERVICES } from '@common/constants';
import type { IConfig, LogContext } from '@src/common/interfaces';
import { AuditManager } from '../models/auditManager';

@injectable()
export class AuditController {
  private readonly logContext: LogContext;
  /* eslint-disable @typescript-eslint/naming-convention */
  private readonly DEFAULT_START_POSITION: number;
  private readonly DEFAULT_MAX_RECORDS: number;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(AuditManager) private readonly manager: AuditManager,
    @inject(SERVICES.CONFIG) private readonly config: IConfig
  ) {
    this.logContext = { fileName: __filename, class: AuditController.name };
    this.DEFAULT_START_POSITION = this.config.get<number>('pagination.defaultStartPosition');
    this.DEFAULT_MAX_RECORDS = this.config.get<number>('pagination.defaultMaxRecords');
  }

  public getAudit: TypedRequestHandlers['GET /audit/{recordName}'] = async (req, res) => {
    const logContext = { ...this.logContext, function: this.getAudit.name };

    const { recordName } = req.params;

    const start = Number(req.query?.startPosition ?? this.DEFAULT_START_POSITION);
    const max = Number(req.query?.maxRecords ?? this.DEFAULT_MAX_RECORDS);

    if (!Number.isInteger(start) || start < 1) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ isValid: false, message: 'startPosition must be a positive integer', code: 'INVALID_START_POSITION' });
    }

    if (!Number.isInteger(max) || max < 1 || max > this.DEFAULT_MAX_RECORDS) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({
          isValid: false,
          message: `maxRecords must be a positive integer and at most ${this.DEFAULT_MAX_RECORDS}`,
          code: 'INVALID_MAX_RECORDS',
        });
    }

    try {
      const result = await this.manager.getAuditLogs(recordName, start, max);
      return res.status(httpStatus.OK).json({ ...result.paginationResponse, records: result.records });
    } catch (err) {
      this.logger.error({ msg: 'Unexpected error getting audit logs', recordName, err, logContext });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ isValid: false, message: 'Failed to get audit logs', code: 'INTERNAL_ERROR' });
    }
  };
}
