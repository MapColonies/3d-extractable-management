import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { SERVICES, IExtractableRecord, IAuthPayload, IValidateResponse } from '@common/constants';
import { LogContext } from '@common/interfaces';
import { recordInstance, credentialsInstance } from '../../common/mocks';

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

  public validateRecord(payload: IAuthPayload): IValidateResponse {
    const logContext = { ...this.logContext, function: this.validateRecord.name };

    if (!payload.username || !payload.password) {
      this.logger.warn({ msg: 'validation failed: missing credentials', logContext });
      return { isValid: false, message: 'Username and password are required', code: 'MISSING_CREDENTIALS' };
    }

    // simple authentication check against mock credentials
    if (payload.username !== credentialsInstance.username || payload.password !== credentialsInstance.password) {
      this.logger.warn({ msg: 'validation failed: invalid credentials', username: payload.username, logContext });
      return { isValid: false, message: 'Invalid username or password', code: 'INVALID_CREDENTIALS' };
    }

    this.logger.info({ msg: 'validation successful', username: payload.username, logContext });
    return { isValid: true, message: 'Record can be created or deleted' };
  }
}
