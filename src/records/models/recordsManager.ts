import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { SERVICES, IExtractableRecord, IAuthPayload, IValidateResponse } from '@common/constants';
import { LogContext } from '@common/interfaces';
import { recordInstance, credentialsInstance } from '../../common/mocks';

type ValidationAction = 'CREATE' | 'DELETE';

@injectable()
export class RecordsManager {
  private readonly logContext: LogContext;

  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger) {
    this.logContext = { fileName: __filename, class: RecordsManager.name };
  }

  // TODO: remove the ? when real DB is integrated
  public getRecords(records?: IExtractableRecord[]): IExtractableRecord[] | undefined {
    const logContext = { ...this.logContext, function: this.getRecords.name };
    this.logger.info({ msg: 'getting all records', logContext });

    if (!records || records.length === 0) {
      this.logger.warn({ msg: 'no records found', logContext });
      return undefined;
    }

    return records;
  }

  public getRecord(recordName: string): IExtractableRecord | undefined {
    const logContext = { ...this.logContext, function: this.getRecord.name };
    this.logger.info({ msg: 'getting record', recordName, logContext });

    return recordName === recordInstance.recordName ? recordInstance : undefined;
  }

  public createRecord(recordName: string): IExtractableRecord {
    const logContext = { ...this.logContext, function: this.createRecord.name };

    // mock validation for now
    if (recordName !== recordInstance.recordName) {
      // 'rec_name'
      this.logger.warn({ msg: 'record name not allowed', recordName, logContext });
      throw new Error('Record not found');
    }
    const record: IExtractableRecord = { ...recordInstance, recordName: recordName };

    this.logger.info({ msg: 'record created', recordName, logContext });

    return record;
  }

  public validate(action: ValidationAction, payload: IAuthPayload): IValidateResponse {
    const logContext = { ...this.logContext, function: this.validate.name, action };

    if (!payload.username || !payload.password) {
      this.logger.warn({ msg: 'missing credentials', logContext });
      return { isValid: false, message: 'Username and password are required', code: 'MISSING_CREDENTIALS' };
    }

    // mock for now(should be replaced with real auth)
    if (payload.username !== credentialsInstance.username || payload.password !== credentialsInstance.password) {
      this.logger.warn({ msg: 'invalid credentials', username: payload.username, logContext });
      return { isValid: false, message: 'Invalid username or password', code: 'INVALID_CREDENTIALS' };
    }

    this.logger.info({ msg: 'validation successful', action, logContext });

    return { isValid: true, message: action === 'CREATE' ? 'Record can be created' : 'Record can be deleted' };
  }

  public deleteRecord(recordName: string): boolean {
    const logContext = { ...this.logContext, function: this.deleteRecord.name };

    const record = this.getRecord(recordName);

    if (!record) {
      this.logger.warn({ msg: 'record not found for deletion', recordName, logContext });
      return false;
    }

    this.logger.info({ msg: 'record deleted', recordName, logContext });
    return true;
  }

  public validateUser(payload: IAuthPayload): IValidateResponse {
    return this.validate('CREATE', payload);
  }
}
