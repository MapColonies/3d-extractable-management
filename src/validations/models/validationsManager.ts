import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { SERVICES, IAuthPayloadWithRecord, IAuthPayload, IValidateResponse } from '@common/constants';
import { LogContext } from '@common/interfaces';
import { verifyPassword } from '@src/users/utils/password';
import { recordInstance } from '../../common/mocks';
import { users } from '../../users/config/validUsers';

@injectable()
export class ValidationsManager {
  private readonly logContext: LogContext;

  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger) {
    this.logContext = { fileName: __filename, class: ValidationsManager.name };
  }

  public async validateCreate(payload: IAuthPayloadWithRecord): Promise<IValidateResponse> {
    const logContext = { ...this.logContext, function: 'validateCreate' };

    const userValidation = await this.validateUser(payload);
    if (!userValidation.isValid) {
      return userValidation;
    }

    if (!payload.recordName) {
      this.logger.debug({ msg: 'missing recordName', logContext });
      return { isValid: false, message: 'recordName is required', code: 'MISSING_CREDENTIALS' };
    }

    if (payload.recordName !== recordInstance.recordName) {
      this.logger.debug({ msg: 'record not found for create', recordName: payload.recordName, logContext });
      return { isValid: false, message: `Record '${payload.recordName}' not found`, code: 'INVALID_RECORD_NAME' };
    }

    this.logger.debug({ msg: 'create validation successful', recordName: payload.recordName, logContext });
    return { isValid: true, message: 'Record can be created', code: 'SUCCESS' };
  }

  public async validateDelete(payload: IAuthPayloadWithRecord): Promise<IValidateResponse> {
    const logContext = { ...this.logContext, function: 'validateDelete' };

    const userValidation = await this.validateUser(payload);
    if (!userValidation.isValid) {
      return userValidation;
    }

    if (!payload.recordName) {
      this.logger.debug({ msg: 'missing recordName', logContext });
      return { isValid: false, message: 'recordName is required', code: 'MISSING_CREDENTIALS' };
    }

    if (payload.recordName !== recordInstance.recordName) {
      this.logger.debug({ msg: 'record not found for delete', recordName: payload.recordName, logContext });
      return { isValid: false, message: `Record '${payload.recordName}' not found`, code: 'INVALID_RECORD_NAME' };
    }

    this.logger.debug({ msg: 'delete validation successful', recordName: payload.recordName, logContext });
    return { isValid: true, message: 'Record can be deleted', code: 'SUCCESS' };
  }

  public async validateUser(payload: IAuthPayload): Promise<IValidateResponse> {
    const logContext = { ...this.logContext, function: 'validateUser' };

    if (!payload.username || !payload.password) {
      this.logger.debug({ msg: 'missing credentials', logContext });
      return { isValid: false, message: 'Username and password are required', code: 'MISSING_CREDENTIALS' };
    }

    const user = users.find((u) => u.username === payload.username);

    if (!user) {
      this.logger.debug({ msg: 'user not found', username: payload.username, logContext });
      return { isValid: false, message: 'Invalid username or password', code: 'INVALID_CREDENTIALS' };
    }

    const isPasswordValid = await verifyPassword(payload.password, user.password);

    if (!isPasswordValid) {
      this.logger.debug({ msg: 'invalid password', username: payload.username, logContext });
      return { isValid: false, message: 'Invalid username or password', code: 'INVALID_CREDENTIALS' };
    }

    this.logger.debug({ msg: 'user validation successful', logContext });
    return { isValid: true, message: 'User credentials are valid', code: 'SUCCESS' };
  }
}
