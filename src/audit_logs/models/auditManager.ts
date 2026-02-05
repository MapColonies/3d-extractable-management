import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { SERVICES, IAuditLog } from '@common/constants';
import { LogContext } from '@common/interfaces';
import { AuditLog } from '@src/DAL/entities/auditLog.entity';
import { mapAuditLogToCamelCase } from '@src/utils/converter';

@injectable()
export class AuditManager {
  private readonly logContext: LogContext;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.AUDIT_LOG_REPOSITORY) private readonly auditRepo: Repository<AuditLog>
  ) {
    this.logContext = { fileName: __filename, class: AuditManager.name };
  }

  public async getAuditLogs(recordName: string): Promise<IAuditLog[]> {
    const logContext = { ...this.logContext, function: this.getAuditLogs.name };
    this.logger.debug({ msg: `Fetching audit logs for record '${recordName}'`, recordName, logContext });

    /* eslint-disable @typescript-eslint/naming-convention */
    const records = await this.auditRepo.find({ where: { record_name: recordName } });

    return records.map(mapAuditLogToCamelCase);
  }
}
