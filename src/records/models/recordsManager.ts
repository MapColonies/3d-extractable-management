import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { SERVICES, IExtractableRecord, IAuthPayloadWithRecord, IAuthPayload, IValidateResponse } from '@common/constants';
import { LogContext } from '@common/interfaces';
import { recordInstance, validCredentials } from '../../common/mocks';

type ValidationAction = 'CREATE' | 'DELETE' | 'USER';
type ValidatePayload =
  | IAuthPayload // USER
  | IAuthPayloadWithRecord; // CREATE / DELETE

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
      this.logger.warn({ msg: `record name '${recordName}' not allowed`, recordName, logContext });
      throw new Error('Record not found');
    }
    const record: IExtractableRecord = { ...recordInstance, recordName: recordName };

    this.logger.info({ msg: 'record created', recordName, logContext });

    return record;
  }

  public validate(action: ValidationAction, payload: ValidatePayload): IValidateResponse {
    const logContext = { ...this.logContext, function: this.validate.name, action };

    if (!payload.username || !payload.password) {
      this.logger.warn({ msg: 'missing credentials', logContext });
      return { isValid: false, message: 'Username and password are required', code: 'MISSING_CREDENTIALS' };
    }

    if (action === 'USER') {
      if (payload.username !== validCredentials.username || payload.password !== validCredentials.password) {
        this.logger.warn({ msg: 'invalid credentials', username: payload.username, logContext });
        return { isValid: false, message: 'Invalid username or password', code: 'INVALID_CREDENTIALS' };
      }

      this.logger.info({ msg: 'user validation successful', logContext });
      return { isValid: true, message: 'User credentials are valid' };
    }

    /* eslint-disable @typescript-eslint/strict-boolean-expressions */
    if (!('recordName' in payload) || !payload.recordName) {
      this.logger.warn({ msg: 'missing recordName', logContext });
      return { isValid: false, message: 'recordName is required', code: 'MISSING_CREDENTIALS' };
    }

    const { recordName } = payload;
    if (payload.username !== validCredentials.username || payload.password !== validCredentials.password) {
      this.logger.warn({ msg: 'invalid credentials', username: payload.username, logContext });
      return { isValid: false, message: 'Invalid username or password', code: 'INVALID_CREDENTIALS' };
    }

    if (recordName !== recordInstance.recordName) {
      this.logger.warn({ msg: `record not found for ${action.toLowerCase()}`, recordName, logContext });
      return { isValid: false, message: `Record '${recordName}' not found`, code: 'INVALID_RECORD_NAME' };
    }

    this.logger.info({ msg: 'validation successful', action, recordName, logContext });
    return { isValid: true, message: action === 'CREATE' ? 'Record can be created' : 'Record can be deleted' };
  }

  public deleteRecord(recordName: string): boolean {
    const logContext = { ...this.logContext, function: this.deleteRecord.name };

    const record = this.getRecord(recordName);

    if (!record) {
      this.logger.warn({ msg: 'record not found for deletion', recordName, logContext });
      return false;
    }

    this.logger.info({ msg: `record '${record.recordName}' deleted`, recordName, logContext });
    return true;
  }

  public validateUser(payload: IAuthPayload): IValidateResponse {
    return this.validate('USER', payload);
  }
}
