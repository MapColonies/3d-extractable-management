import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { IAuditLog, SERVICES } from '@common/constants';
import { LogContext, IPaginationResponse } from '@common/interfaces';
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

  public async getAuditLogs(recordName: string, startPosition: number, maxRecords: number): Promise<IPaginationResponse<IAuditLog>> {
    const skip = startPosition - 1;

    /* eslint-disable @typescript-eslint/naming-convention */
    const [records, total] = await this.auditRepo.findAndCount({
      where: { record_name: recordName },
      order: { authorized_at: 'DESC' },
      skip,
      take: maxRecords,
    });

    const mapped = records.map(mapAuditLogToCamelCase);

    const nextRecord = skip + mapped.length < total ? skip + mapped.length + 1 : 0;

    return { numberOfRecords: total, numberOfRecordsReturned: mapped.length, nextRecord, records: mapped };
  }
}
