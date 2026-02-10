/* eslint-disable @typescript-eslint/naming-convention */
import axios from 'axios';
import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import config from 'config';
import { Repository } from 'typeorm';
import { IUser, LogContext } from '@src/common/interfaces';
import { SERVICES, IAuthPayloadWithRecord, IAuthPayload, IValidateResponse, REMOTE_VALIDATE_CREATE_PATH } from '@common/constants';
import { UsersSchema } from '@src/users/utils/userSchema';
import { ExtractableRecord } from '@src/DAL/entities/extractableRecord.entity';
import { CatalogCall } from '../../externalServices/catalog/catalogCall';

@injectable()
export class ValidationsManager {
  private readonly logContext: LogContext;
  private readonly users: IAuthPayload[];
  private readonly routesConfig: { url: string }[];

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.EXTRACTABLE_RECORD_REPOSITORY) private readonly extractableRepo: Repository<ExtractableRecord>,
    @inject(CatalogCall) private readonly catalog: CatalogCall
  ) {
    this.logContext = { fileName: __filename, class: ValidationsManager.name };
    this.users = this.loadUsers();

    try {
      this.routesConfig = config.get<{ url: string }[]>('externalServices.publicExtractableRoutes');
    } catch (err) {
      this.logger.error({ msg: 'Failed to load routes from config', err, logContext: this.logContext });
      this.routesConfig = [];
    }
  }

  public async validateCreate(payload: IAuthPayloadWithRecord): Promise<IValidateResponse> {
    const logContext = { ...this.logContext, function: this.validateCreate.name };

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

    let existsAndPublishedInCatalog: boolean;
    try {
      existsAndPublishedInCatalog = await this.catalog.findPublishedRecord(payload.recordName);
    } catch (err) {
      this.logger.warn({ msg: 'catalog unavailable during create validation', recordName: payload.recordName, logContext, err });
      return { isValid: false, message: 'Catalog service is currently unavailable', code: 'INTERNAL_ERROR' };
    }

    if (!existsAndPublishedInCatalog) {
      this.logger.debug({ msg: 'record does not exist in catalog', recordName: payload.recordName, logContext });
      return { isValid: false, message: `Record '${payload.recordName}' is missing from the catalog`, code: 'INVALID_RECORD_NAME' };
    }

    if (payload.multiSiteValidation === true) {
      try {
        const results = await Promise.all(
          this.routesConfig.map(async (route) => {
            try {
              const response = await axios.post<IValidateResponse>(`${route.url}${REMOTE_VALIDATE_CREATE_PATH}`, {
                ...payload,
                multiSiteValidation: false,
              });

              return response.data.isValid;
            } catch {
              return false;
            }
          })
        );

        const validOnOtherSites = results.every(Boolean);
        if (!validOnOtherSites) {
          this.logger.debug({ msg: 'record validation failed on another site', recordName: payload.recordName, logContext });
          return { isValid: false, message: 'Record validation failed on another site', code: 'INTERNAL_ERROR' };
        }
      } catch (err) {
        this.logger.warn({ msg: 'remote validation unavailable', recordName: payload.recordName, logContext, err });
        return { isValid: false, message: 'Remote validation service unavailable', code: 'INTERNAL_ERROR' };
      }
    }

    this.logger.debug({ msg: 'create validation successful', recordName: payload.recordName, logContext });
    return { isValid: true, message: `Record '${payload.recordName}' can be created`, code: 'SUCCESS' };
  }

  public async validateDelete(payload: IAuthPayloadWithRecord): Promise<IValidateResponse> {
    const logContext = { ...this.logContext, function: this.validateDelete.name };

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
    const logContext = { ...this.logContext, function: this.validateUser.name };

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
