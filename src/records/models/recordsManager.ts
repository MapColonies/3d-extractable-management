import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { Repository, EntityManager } from 'typeorm';
import { SERVICES, IExtractableRecord } from '@common/constants';
import { LogContext, IAuditAction } from '@common/interfaces';
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

    return records;
  }

  public async getRecord(recordName: string): Promise<IExtractableRecord | undefined> {
    const logContext = { ...this.logContext, function: this.getRecord.name };
    this.logger.debug({ msg: 'getting record', recordName, logContext });

    const record = await this.extractableRepo.findOne({ where: { recordName } });
    if (!record) return undefined;

    return record;
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
        recordName,
        username,
        authorizedBy,
        authorizedAt: new Date(),
        data,
      });

      const saved = await extractableRepo.save(record);

      await auditRepo.save(
        auditRepo.create({
          recordName: saved.recordName,
          username: saved.username,
          authorizedBy: saved.authorizedBy,
          action: IAuditAction.CREATE,
          authorizedAt: new Date(),
        })
      );

      return saved;
    });

    this.logger.info({ msg: 'extractable record created', recordName, logContext });

    return savedRecord;
  }

  public async deleteRecord(recordName: string): Promise<boolean> {
    const logContext = { ...this.logContext, function: this.deleteRecord.name };
    this.logger.info({ msg: `starting to delete extractable record '${recordName}'`, recordName, logContext });

    await this.extractableRepo.manager.transaction(async (manager) => {
      const { extractableRepo, auditRepo } = this.getTransactionalRepos(manager);

      const record = await extractableRepo.findOne({ where: { recordName } });

      if (!record) {
        this.logger.warn({ msg: 'extractable record not found for delete', recordName, logContext });
        return;
      }

      await extractableRepo.delete({ recordName });

      await auditRepo.save(
        auditRepo.create({
          recordName: record.recordName,
          username: record.username,
          authorizedBy: record.authorizedBy,
          action: IAuditAction.DELETE,
          authorizedAt: new Date(),
        })
      );
    });

    this.logger.info({ msg: `extractable record deleted`, recordName, logContext });
    return true;
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
