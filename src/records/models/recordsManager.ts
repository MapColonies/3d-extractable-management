import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { SERVICES, IExtractableRecord } from '@common/constants';
import { LogContext } from '@common/interfaces';
import { recordInstance } from '../../common/mocks';

@injectable()
export class RecordsManager {
  private readonly logContext: LogContext;

  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger) {
    this.logContext = { fileName: __filename, class: RecordsManager.name };
  }

  // TODO: remove the ? when real DB is integrated
  public getRecords(records?: IExtractableRecord[]): IExtractableRecord[] | undefined {
    const logContext = { ...this.logContext, function: this.getRecords.name };
    this.logger.debug({ msg: 'getting all records', logContext });

    if (!(Array.isArray(records) && records.length > 0)) {
      this.logger.warn({ msg: 'no records found', logContext });
      return undefined;
    }

    return records;
  }

  public getRecord(recordName: string): IExtractableRecord | undefined {
    const logContext = { ...this.logContext, function: this.getRecord.name };
    this.logger.debug({ msg: 'getting record', recordName, logContext });

    return recordName === recordInstance.recordName ? recordInstance : undefined;
  }

  public createRecord(recordName: string): IExtractableRecord {
    const logContext = { ...this.logContext, function: this.createRecord.name };
    this.logger.info({ msg: `Starting to create record '${recordName}'`, recordName, logContext });

    // Db creation logic to be implemented
    const record: IExtractableRecord = { ...recordInstance, recordName: recordName };

    this.logger.info({ msg: 'record created', recordName, logContext });

    return record;
  }

  public deleteRecord(recordName: string): boolean {
    const logContext = { ...this.logContext, function: this.deleteRecord.name };
    this.logger.info({ msg: `Starting to delete record '${recordName}'`, recordName, logContext });

    // Db deletion logic to be implemented

    this.logger.info({ msg: `record '${recordName}' deleted`, recordName, logContext });
    return true;
  }
}
