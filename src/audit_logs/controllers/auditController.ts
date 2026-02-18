import type { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import type { TypedRequestHandlers } from '@openapi';
import { DEFAULT_MAX_RECORDS, DEFAULT_START_POSITION, SERVICES } from '@common/constants';
import { ValidationsManager } from '@src/validations/models/validationsManager';
import { LogContext } from '@src/common/interfaces';
import { AuditManager } from '../models/auditManager';

@injectable()
export class AuditController {
  private readonly logContext: LogContext;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(AuditManager) private readonly manager: AuditManager,
    @inject(ValidationsManager) private readonly validationsManager: ValidationsManager
  ) {
    this.logContext = { fileName: __filename, class: AuditController.name };
  }

  public getAudit: TypedRequestHandlers['GET /audit/{recordName}'] = async (req, res) => {
    const logContext = { ...this.logContext, function: this.getAudit.name };

    const { recordName } = req.params;

    const start = Number(req.query?.startPosition ?? DEFAULT_START_POSITION);
    const max = Number(req.query?.maxRecords ?? DEFAULT_MAX_RECORDS);

    try {
      const result = await this.manager.getAuditLogs(recordName, start, max);
      return res.status(httpStatus.OK).json({ ...result.paginationResponse, records: result.records });
    } catch (err) {
      this.logger.error({ msg: 'Unexpected error getting audit logs', recordName, err, logContext });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ isValid: false, message: 'Failed to get audit logs', code: 'INTERNAL_ERROR' });
    }
  };
}
