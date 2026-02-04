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

    return records;
  }

  public async getRecord(record_name: string): Promise<IExtractableRecord | undefined> {
    const logContext = { ...this.logContext, function: this.getRecord.name };
    this.logger.debug({ msg: 'getting record', record_name, logContext });

    const record = await this.extractableRepo.findOne({ where: { record_name } });
    if (!record) return undefined;

    return record;
  }

  public async createRecord(params: {
    record_name: string;
    username: string;
    authorized_by: string;
    data?: Record<string, unknown>;
  }): Promise<IExtractableRecord> {
    const logContext = { ...this.logContext, function: this.createRecord.name };
    const { record_name, username, authorized_by, data } = params;

    this.logger.info({ msg: `starting to create extractable record '${record_name}'`, record_name, logContext });

    const savedRecord = await this.extractableRepo.manager.transaction(async (manager): Promise<IExtractableRecord> => {
      const { extractableRepo, auditRepo } = this.getTransactionalRepos(manager);

      const record = extractableRepo.create({
        record_name,
        username,
        authorized_by,
        authorized_at: new Date(),
        data,
      });

      const saved = await extractableRepo.save(record);

      await auditRepo.save(
        auditRepo.create({
          record_name: saved.record_name,
          username: saved.username,
          authorized_by: saved.authorized_by,
          action: IAuditAction.CREATE,
          authorized_at: new Date(),
        })
      );

      return saved;
    });

    this.logger.info({ msg: 'extractable record created', record_name, logContext });

    return savedRecord;
  }

  public async deleteRecord(record_name: string): Promise<boolean> {
    const logContext = { ...this.logContext, function: this.deleteRecord.name };
    this.logger.info({ msg: `starting to delete extractable record '${record_name}'`, record_name, logContext });

    const result = await this.extractableRepo.manager.transaction(async (manager) => {
      const { extractableRepo, auditRepo } = this.getTransactionalRepos(manager);

      const record = await extractableRepo.findOne({ where: { record_name } });

      if (!record) {
        this.logger.warn({ msg: 'extractable record not found for delete', record_name, logContext });
        return false;
      }

      await extractableRepo.delete({ record_name });

      await auditRepo.save(
        auditRepo.create({
          record_name: record.record_name,
          username: record.username,
          authorized_by: record.authorized_by,
          action: IAuditAction.DELETE,
          authorized_at: new Date(),
        })
      );
      return true;
    });

    this.logger.info({ msg: `extractable record deleted`, record_name, logContext });
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
