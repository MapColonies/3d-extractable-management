import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { Repository, EntityManager } from 'typeorm';
import { SERVICES, IExtractableRecord } from '@common/constants';
import { LogContext, IAuditAction } from '@common/interfaces';
import { AuditLog } from '@src/DAL/entities/auditLog.entity';
import { ExtractableRecord } from '@src/DAL/entities/extractableRecord.entity';
import { mapExtractableRecordToCamelCase } from '@src/utils/converter';

@injectable()
export class RecordsManager {
  private readonly logContext: LogContext;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.EXTRACTABLE_RECORD_REPOSITORY) private readonly extractableRepo: Repository<ExtractableRecord>
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

    return records.map(mapExtractableRecordToCamelCase);
  }

  public async getRecord(recordName: string): Promise<IExtractableRecord | undefined> {
    const logContext = { ...this.logContext, function: this.getRecord.name };
    this.logger.debug({ msg: 'getting record', recordName, logContext });

    const record = await this.extractableRepo.findOne({ where: { record_name: recordName } });
    if (!record) return undefined;

    return mapExtractableRecordToCamelCase(record);
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

    const savedRecord = await this.extractableRepo.manager.transaction(async (manager): Promise<IExtractableRecord> => {
      const { extractableRepo, auditRepo } = this.getTransactionalRepos(manager);

      const record = extractableRepo.create({
        record_name: recordName,
        username,
        authorized_by: authorizedBy,
        data,
      });

      const saved = await extractableRepo.save(record);

      await auditRepo.save(
        auditRepo.create({
          record_name: record.record_name,
          username: record.username,
          authorized_by: record.authorized_by,
          action: IAuditAction.CREATE,
        })
      );

      return mapExtractableRecordToCamelCase(saved);
    });

    this.logger.info({ msg: 'extractable record created', recordName, logContext });

    return savedRecord;
  }

  public async deleteRecord(recordName: string): Promise<boolean> {
    const logContext = { ...this.logContext, function: this.deleteRecord.name };
    this.logger.info({ msg: `starting to delete extractable record '${recordName}'`, recordName, logContext });

    const result = await this.extractableRepo.manager.transaction(async (manager) => {
      const { extractableRepo, auditRepo } = this.getTransactionalRepos(manager);

      const record = await extractableRepo.findOne({ where: { record_name: recordName } });

      if (!record) {
        this.logger.warn({ msg: 'extractable record not found for delete', recordName, logContext });
        return false;
      }

      await extractableRepo.delete({ record_name: recordName });

      await auditRepo.save(
        auditRepo.create({
          record_name: record.record_name,
          username: record.username,
          authorized_by: record.authorized_by,
          action: IAuditAction.DELETE,
        })
      );
      return true;
    });

    this.logger.info({ msg: `extractable record deleted`, recordName, logContext });
    return result;
  }

  private getTransactionalRepos(manager: EntityManager): {
    extractableRepo: Repository<ExtractableRecord>;
    auditRepo: Repository<AuditLog>;
  } {
    return {
      extractableRepo: manager.getRepository(ExtractableRecord),
      auditRepo: manager.getRepository(AuditLog),
    };
  }
}
