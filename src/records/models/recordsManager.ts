import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { SERVICES, IExtractableRecord } from '@common/constants';
import { LogContext } from '@common/interfaces';
import { AuditLog } from '@src/DAL/entities/auditLog.entity';
import { ExtractableRecord } from '@src/DAL/entities/extractableRecord.entity';

@injectable()
export class RecordsManager {
  private readonly logContext: LogContext;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.EXTRACTABLE_RECORD_REPOSITORY) private readonly extractableRepo: Repository<ExtractableRecord>,
    @inject(SERVICES.AUDIT_LOG_REPOSITORY) private readonly auditRepo: Repository<AuditLog>
  ) {
    this.logContext = { fileName: __filename, class: RecordsManager.name };
  }

  public async getRecords(): Promise<IExtractableRecord[]> {
    const logContext = { ...this.logContext, function: this.getRecords.name };
    this.logger.debug({ msg: 'getting all records', logContext });

    const records = await this.extractableRepo.find();

    if (records.length === 0) {
      this.logger.warn({ msg: 'no records found', logContext });
    }

    return records.map((record) => ({
      ...record,
      authorizedAt: record.authorizedAt.toISOString(),
    }));
  }

  public async getRecord(recordName: string): Promise<IExtractableRecord | undefined> {
    const logContext = { ...this.logContext, function: this.getRecord.name };
    this.logger.debug({ msg: 'getting record', recordName, logContext });

    const record = await this.extractableRepo.findOne({ where: { recordName } });
    if (!record) return undefined;

    return {
      ...record,
      authorizedAt: record.authorizedAt.toISOString(),
    };
  }

  public async createRecord(params: {
    recordName: string;
    username: string;
    authorizedBy: string;
    data?: Record<string, unknown>;
  }): Promise<IExtractableRecord> {
    const logContext = { ...this.logContext, function: this.createRecord.name };
    const { recordName, username, authorizedBy, data } = params;

    this.logger.info({ msg: `starting to create extractable record '${recordName}'`, recordName, logContext });

    const record = this.extractableRepo.create({
      recordName,
      username,
      authorizedBy,
      authorizedAt: new Date(),
      data,
    });
    const savedRecord = await this.extractableRepo.save(record);

    await this.auditRepo.save(
      this.auditRepo.create({
        recordName: savedRecord.recordName,
        username: savedRecord.username,
        authorizedBy: savedRecord.authorizedBy,
        action: 'CREATE',
        authorizedAt: new Date(),
        data: savedRecord.data,
      })
    );

    this.logger.info({ msg: `extractable record '${recordName}' created`, recordName, logContext });

    return {
      ...savedRecord,
      authorizedAt: savedRecord.authorizedAt.toISOString(),
    };
  }

  public async deleteRecord(recordName: string): Promise<boolean> {
    const logContext = { ...this.logContext, function: this.deleteRecord.name };
    this.logger.info({ msg: `starting to delete extractable record '${recordName}'`, recordName, logContext });

    const record = await this.extractableRepo.findOne({ where: { recordName } });

    if (!record) {
      this.logger.warn({ msg: `extractable record '${recordName}' not found`, recordName, logContext });
      return false;
    }

    await this.extractableRepo.delete({ recordName });

    await this.auditRepo.save(
      this.auditRepo.create({
        recordName: record.recordName,
        username: record.username,
        authorizedBy: record.authorizedBy,
        action: 'DELETE',
        authorizedAt: new Date(),
        data: {
          deletedRecordId: record.id,
          originalData: record.data,
        },
      })
    );

    this.logger.info({ msg: `extractable record '${recordName}' deleted`, recordName, logContext });

    return true;
  }
}
