import type { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import type { TypedRequestHandlers } from '@openapi';
import { SERVICES } from '@common/constants';
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

  public getAudit: TypedRequestHandlers['GET /audit/{record_name}'] = async (req, res) => {
    const logContext = { ...this.logContext, function: this.getAudit.name };
    const { record_name } = req.params;

    try {
      const records = await this.manager.getAuditLogs(record_name);

      return res.status(httpStatus.OK).json(records);
    } catch (err) {
      this.logger.error({ msg: 'Unexpected error getting record', record_name, err, logContext });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ isValid: false, message: 'Failed to get record', code: 'INTERNAL_ERROR' });
    }
  };
}
