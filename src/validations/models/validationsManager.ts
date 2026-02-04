import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import config from 'config';
import { Repository } from 'typeorm';
import { IUser, LogContext } from '@src/common/interfaces';
import { SERVICES, IAuthPayloadWithRecord, IAuthPayload, IValidateResponse } from '@common/constants';
import { UsersSchema } from '@src/users/utils/userSchema';
import { ExtractableRecord } from '@src/DAL/entities/extractableRecord.entity';

@injectable()
export class ValidationsManager {
  private readonly logContext: LogContext;
  private readonly users: IAuthPayload[];

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.EXTRACTABLE_RECORD_REPOSITORY) private readonly extractableRepo: Repository<ExtractableRecord>
  ) {
    this.logContext = { fileName: __filename, class: ValidationsManager.name };
    this.users = this.loadUsers();
  }

  public async validateCreate(payload: IAuthPayloadWithRecord): Promise<IValidateResponse> {
    const logContext = { ...this.logContext, function: 'validateCreate' };

    const userValidation = this.validateUser(payload);
    if (!userValidation.isValid) {
      return userValidation;
    }

    if (!payload.record_name) {
      this.logger.debug({ msg: 'missing record_name', logContext });
      return { isValid: false, message: 'record_name is required', code: 'MISSING_CREDENTIALS' };
    }

    const record = await this.extractableRepo.findOne({ where: { record_name: payload.record_name } });
    if (record) {
      this.logger.debug({ msg: 'record already exists for create', record_name: payload.record_name, logContext });
      return { isValid: false, message: `Record '${payload.record_name}' already exists`, code: 'INVALID_RECORD_NAME' };
    }

    this.logger.debug({ msg: 'create validation successful', record_name: payload.record_name, logContext });
    return { isValid: true, message: `Record '${payload.record_name}' can be created`, code: 'SUCCESS' };
  }

  public async validateDelete(payload: IAuthPayloadWithRecord): Promise<IValidateResponse> {
    const logContext = { ...this.logContext, function: 'validateDelete' };

    const userValidation = this.validateUser(payload);
    if (!userValidation.isValid) {
      return userValidation;
    }

    if (!payload.record_name) {
      this.logger.debug({ msg: 'missing record_name', logContext });
      return { isValid: false, message: 'record_name is required', code: 'MISSING_CREDENTIALS' };
    }

    const record = await this.extractableRepo.findOne({ where: { record_name: payload.record_name } });
    if (!record) {
      this.logger.debug({ msg: 'record not found for delete', record_name: payload.record_name, logContext });
      return { isValid: false, message: `Record '${payload.record_name}' not found`, code: 'INVALID_RECORD_NAME' };
    }

    this.logger.debug({ msg: 'delete validation successful', record_name: payload.record_name, logContext });
    return { isValid: true, message: 'Record can be deleted', code: 'SUCCESS' };
  }

  public validateUser(payload: IAuthPayload): IValidateResponse {
    const logContext = { ...this.logContext, function: 'validateUser' };

    if (!payload.username || !payload.password) {
      this.logger.debug({ msg: 'missing credentials', logContext });
      return { isValid: false, message: 'Username and password are required', code: 'MISSING_CREDENTIALS' };
    }

    if (!this.isValidUser(payload)) {
      this.logger.debug({ msg: 'user not found', username: payload.username, logContext });
      return { isValid: false, message: 'Invalid username or password', code: 'INVALID_CREDENTIALS' };
    }

    this.logger.debug({ msg: 'user validation successful', logContext });
    return { isValid: true, message: 'User credentials are valid', code: 'SUCCESS' };
  }

  private isValidUser(payload: IAuthPayload): boolean {
    return this.users.some((u) => u.username === payload.username && u.password === payload.password);
  }

  // istanbul ignore next
  private loadUsers(): IAuthPayload[] {
    try {
      const usersConfig = config.get<IUser>('users');
      const result = UsersSchema.safeParse(usersConfig);

      if (!result.success) {
        this.logger.error({ msg: 'Invalid users configuration', errors: result.error, logContext: this.logContext });
        return [];
      }

      return result.data;
    } catch (err) {
      this.logger.error({ msg: 'Failed to load users configuration', err, logContext: this.logContext });
      return [];
    }
  }
}
