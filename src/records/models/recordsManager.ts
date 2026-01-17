import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { SERVICES, IExtractableRecord } from '@common/constants';
import { LogContext } from '@common/interfaces';
import { recordInstance } from '../../common/mocks';

function generateRandomId(): number {
  const rangeOfIds = 100;
  return Math.floor(Math.random() * rangeOfIds);
}

@injectable()
export class RecordsManager {
  private readonly logContext: LogContext;

  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger) {
    this.logContext = { fileName: __filename, class: RecordsManager.name };
  }

  public getRecord(recordName: string): IExtractableRecord | undefined {
    const logContext = { ...this.logContext, function: this.getRecord.name };
    this.logger.info({ msg: 'getting record', recordId: recordInstance.id, logContext });

    return recordName === recordInstance.record_name ? recordInstance : undefined;
  }

  public createRecord(record: IExtractableRecord): IExtractableRecord {
    const logContext = { ...this.logContext, function: this.getRecord.name };
    const recordId = generateRandomId();

    this.logger.info({ msg: 'creating record', recordId, logContext });

    return { ...record, id: recordId };
  }
}
