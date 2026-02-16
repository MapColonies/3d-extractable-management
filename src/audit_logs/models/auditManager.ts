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

  public async getAuditLogs(
    recordName: string,
    startPosition: number,
    maxRecords: number
  ): Promise<{ numberOfRecords: number; numberOfRecordsReturned: number; nextRecord: number | null; records: IAuditLog[] }> {
    const skip = startPosition - 1;

    /* eslint-disable @typescript-eslint/naming-convention */
    const [records, total] = await this.auditRepo.findAndCount({ where: { record_name: recordName }, order: { id: 'ASC' }, skip, take: maxRecords });

    const mapped = records.map(mapAuditLogToCamelCase);

    const nextRecord = skip + mapped.length < total ? skip + mapped.length + 1 : null;

    return { numberOfRecords: total, numberOfRecordsReturned: mapped.length, nextRecord, records: mapped };
  }
}
