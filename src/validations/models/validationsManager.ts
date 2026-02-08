/* eslint-disable @typescript-eslint/naming-convention */
import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import config from 'config';
import { Repository } from 'typeorm';
import { IUser, LogContext } from '@src/common/interfaces';
import { SERVICES, IAuthPayloadWithRecord, IAuthPayload, IValidateResponse } from '@common/constants';
import { UsersSchema } from '@src/users/utils/userSchema';
import { ExtractableRecord } from '@src/DAL/entities/extractableRecord.entity';
import { CatalogCall } from '../../externalServices/catalog/catalogCall';

@injectable()
export class ValidationsManager {
  private readonly logContext: LogContext;
  private readonly users: IAuthPayload[];

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.EXTRACTABLE_RECORD_REPOSITORY) private readonly extractableRepo: Repository<ExtractableRecord>,
    @inject(CatalogCall) private readonly catalog: CatalogCall
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

    if (!payload.recordName) {
      this.logger.debug({ msg: 'missing recordName', logContext });
      return { isValid: false, message: 'recordName is required', code: 'MISSING_CREDENTIALS' };
    }

    const record = await this.extractableRepo.findOne({ where: { record_name: payload.recordName } });
    if (record) {
      this.logger.debug({ msg: 'record already exists for create', recordName: payload.recordName, logContext });
      return { isValid: false, message: `Record '${payload.recordName}' already exists`, code: 'INVALID_RECORD_NAME' };
    }

    let existsInCatalog: boolean;
    try {
      existsInCatalog = await this.catalog.findRecord(payload.recordName);
    } catch (err) {
      this.logger.warn({ msg: 'catalog unavailable during create validation', recordName: payload.recordName, logContext, err });
      return { isValid: false, message: 'Catalog service is currently unavailable', code: 'INTERNAL_ERROR' };
    }

    if (!existsInCatalog) {
      this.logger.debug({ msg: 'record does not exist in catalog', recordName: payload.recordName, logContext });
      return { isValid: false, message: `Record '${payload.recordName}' is missing from the catalog`, code: 'INVALID_RECORD_NAME' };
    }

    //add another property to stop the validation chain [the length of the routes maybe] - if(!shouldStopValidation) :
    //forEach extractable url(other sites) send /records/validateCreate
    //use promiseAll- get all responses and aggregate to get validOnOtherSites boolean
    // if (!payload.stopRemoteValidation) {
    //   try {
    //     const routes = config.get<{ url: string }[]>('externalServices.publicExtractableRoutes');

    //     const results = await Promise.all(
    //       routes.map(async (r) => {
    //         try {
    //           const res = await fetch(`${r.url}/records/validateCreate`, {
    //             method: 'POST',
    //             headers: { 'content-type': 'application/json' },
    //             body: JSON.stringify({ ...payload, skipRemoteValidation: true }), // stop flag set here
    //           });
    //           const data = (await res.json()) as IValidateResponse;
    //           return data.isValid;
    //         } catch {
    //           return false;
    //         }
    //       })
    //     );

    //     const validOnOtherSites = results.every(Boolean);
    //     if (!validOnOtherSites) {
    //       this.logger.debug({ msg: 'record validation failed on another site', recordName: payload.recordName, logContext });
    //       return { isValid: false, message: 'Record validation failed on another site', code: 'REMOTE_VALIDATION_FAILED' };
    //     }
    //   } catch (err) {
    //     this.logger.warn({ msg: 'remote validation unavailable', recordName: payload.recordName, logContext, err });
    //     return { isValid: false, message: 'Remote validation service unavailable', code: 'INTERNAL_ERROR' };
    //   }
    // }

    this.logger.debug({ msg: 'create validation successful', recordName: payload.recordName, logContext });
    return { isValid: true, message: `Record '${payload.recordName}' can be created`, code: 'SUCCESS' };
  }

  public async validateDelete(payload: IAuthPayloadWithRecord): Promise<IValidateResponse> {
    const logContext = { ...this.logContext, function: 'validateDelete' };

    const userValidation = this.validateUser(payload);
    if (!userValidation.isValid) {
      return userValidation;
    }

    if (!payload.recordName) {
      this.logger.debug({ msg: 'missing recordName', logContext });
      return { isValid: false, message: 'recordName is required', code: 'MISSING_CREDENTIALS' };
    }

    const record = await this.extractableRepo.findOne({ where: { record_name: payload.recordName } });
    if (!record) {
      this.logger.debug({ msg: 'record not found for delete', record_name: payload.recordName, logContext });
      return { isValid: false, message: `Record '${payload.recordName}' not found`, code: 'INVALID_RECORD_NAME' };
    }

    this.logger.debug({ msg: 'delete validation successful', recordName: payload.recordName, logContext });
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
