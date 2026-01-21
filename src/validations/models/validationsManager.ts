import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { SERVICES, IAuthPayloadWithRecord, IAuthPayload, IValidateResponse } from '@common/constants';
import { LogContext } from '@common/interfaces';
import { recordInstance, validCredentials } from '../../common/mocks';

@injectable()
export class ValidationsManager {
  private readonly logContext: LogContext;

  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger) {
    this.logContext = { fileName: __filename, class: ValidationsManager.name };
  }

  public validateCreate(payload: IAuthPayloadWithRecord): IValidateResponse {
    const logContext = { ...this.logContext, function: 'validateCreate' };

    if (!payload.username || !payload.password) {
      this.logger.warn({ msg: 'missing credentials', logContext });
      return { isValid: false, message: 'Username and password are required', code: 'MISSING_CREDENTIALS' };
    }

    if (!payload.recordName) {
      this.logger.warn({ msg: 'missing recordName', logContext });
      return { isValid: false, message: 'recordName is required', code: 'MISSING_CREDENTIALS' };
    }

    if (payload.username !== validCredentials.username || payload.password !== validCredentials.password) {
      this.logger.warn({ msg: 'invalid credentials', username: payload.username, logContext });
      return { isValid: false, message: 'Invalid username or password', code: 'INVALID_CREDENTIALS' };
    }

    if (payload.recordName !== recordInstance.recordName) {
      this.logger.warn({ msg: 'record not found for create', recordName: payload.recordName, logContext });
      return { isValid: false, message: `Record '${payload.recordName}' not found`, code: 'INVALID_RECORD_NAME' };
    }

    this.logger.info({ msg: 'create validation successful', recordName: payload.recordName, logContext });
    return { isValid: true, message: 'Record can be created', code: undefined };
  }

  public validateDelete(payload: IAuthPayloadWithRecord): IValidateResponse {
    const logContext = { ...this.logContext, function: 'validateDelete' };

    if (!payload.username || !payload.password) {
      this.logger.warn({ msg: 'missing credentials', logContext });
      return { isValid: false, message: 'Username and password are required', code: 'MISSING_CREDENTIALS' };
    }

    if (!payload.recordName) {
      this.logger.warn({ msg: 'missing recordName', logContext });
      return { isValid: false, message: 'recordName is required', code: 'MISSING_CREDENTIALS' };
    }

    if (payload.username !== validCredentials.username || payload.password !== validCredentials.password) {
      this.logger.warn({ msg: 'invalid credentials', username: payload.username, logContext });
      return { isValid: false, message: 'Invalid username or password', code: 'INVALID_CREDENTIALS' };
    }

    if (payload.recordName !== recordInstance.recordName) {
      this.logger.warn({ msg: 'record not found for delete', recordName: payload.recordName, logContext });
      return { isValid: false, message: `Record '${payload.recordName}' not found`, code: 'INVALID_RECORD_NAME' };
    }

    this.logger.info({ msg: 'delete validation successful', recordName: payload.recordName, logContext });
    return { isValid: true, message: 'Record can be deleted', code: undefined };
  }

  public validateUser(payload: IAuthPayload): IValidateResponse {
    const logContext = { ...this.logContext, function: 'validateUser' };

    if (!payload.username || !payload.password) {
      this.logger.warn({ msg: 'missing credentials', logContext });
      return { isValid: false, message: 'Username and password are required', code: 'MISSING_CREDENTIALS' };
    }

    if (payload.username !== validCredentials.username || payload.password !== validCredentials.password) {
      this.logger.warn({ msg: 'invalid credentials', username: payload.username, logContext });
      return { isValid: false, message: 'Invalid username or password', code: 'INVALID_CREDENTIALS' };
    }

    this.logger.info({ msg: 'user validation successful', logContext });
    return { isValid: true, message: 'User credentials are valid', code: undefined };
  }
}
