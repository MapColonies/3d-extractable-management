import type { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import type { TypedRequestHandlers } from '@openapi';
import { SERVICES, DEFAULT_START_POSITION, DEFAULT_MAX_RECORDS } from '@common/constants';
import type { IConfig, LogContext } from '@src/common/interfaces';
import { AuditManager } from '../models/auditManager';

@injectable()
export class AuditController {
  private readonly logContext: LogContext;
  private readonly maxRecords: number;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(AuditManager) private readonly manager: AuditManager,
    @inject(SERVICES.CONFIG) private readonly config: IConfig
  ) {
    this.logContext = { fileName: __filename, class: AuditController.name };
    this.maxRecords = this.config.get<number>('pagination.maxRecords');
  }

  public getAudit: TypedRequestHandlers['GET /audit/{recordName}'] = async (req, res) => {
    const logContext = { ...this.logContext, function: this.getAudit.name };

    const { recordName } = req.params;

    const start = Number(req.query?.startPosition ?? DEFAULT_START_POSITION);
    const max = Math.min(Number(req.query?.maxRecords ?? DEFAULT_MAX_RECORDS), this.maxRecords);

    if (!Number.isInteger(start) || start < 1) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ isValid: false, message: 'startPosition must be a positive integer', code: 'INVALID_START_POSITION' });
    }

    if (!Number.isInteger(max) || max < 1) {
      return res.status(httpStatus.BAD_REQUEST).json({
        isValid: false,
        message: `maxRecords must be a positive integer and at most ${this.maxRecords}`,
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
