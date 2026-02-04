import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { SERVICES, IAuditLog } from '@common/constants';
import { LogContext } from '@common/interfaces';
import { AuditLog } from '@src/DAL/entities/auditLog.entity';

@injectable()
export class AuditManager {
  private readonly logContext: LogContext;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.AUDIT_LOG_REPOSITORY) private readonly auditRepo: Repository<AuditLog>
  ) {
    this.logContext = { fileName: __filename, class: AuditManager.name };
  }

  public async getAuditLogs(record_name: string): Promise<IAuditLog[]> {
    const logContext = { ...this.logContext, function: this.getAuditLogs.name };
    this.logger.debug({ msg: `Fetching audit logs for record '${record_name}'`, record_name, logContext });

    const records = await this.auditRepo.find({ where: { record_name } });

    if (records.length === 0) {
      this.logger.warn({ msg: 'no records found', record_name, logContext });
    }

    return records;
  }
}
