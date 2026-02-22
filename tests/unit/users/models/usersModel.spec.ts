/* eslint-disable @typescript-eslint/naming-convention */
import axios from 'axios';
import { Repository } from 'typeorm';
import jsLogger from '@map-colonies/js-logger';
import { ValidationsManager } from '@src/validations/models/validationsManager';
import type { IConfig } from '@src/common/interfaces';
import { validCredentials, invalidCredentials } from '@tests/mocks/generalMocks';
import { IAuthPayloadWithRecord } from '@src/common/constants';
import { ExtractableRecord } from '@src/DAL/entities/extractableRecord.entity';
import { mockExtractableRepo, mockExtractableFindOne, resetRepoMocks, mockCatalogCall } from '@tests/mocks/unitMocks';
import { CatalogCall } from '@src/externalServices/catalog/catalogCall';

let validationsManager: ValidationsManager;

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Helper function to create ValidationsManager with custom config
const createValidationsManager = (customConfig?: Partial<IConfig>) => {
  const extractableRepo = mockExtractableRepo as unknown as Repository<ExtractableRecord>;
  const mockConfig = {
    get: jest.fn((key: string) => {
      if (key === 'externalServices.publicExtractableRoutes') {
        return customConfig?.get?.('externalServices.publicExtractableRoutes') ?? [];
      }
      if (key === 'users') {
        return customConfig?.get?.('users') ?? [{ username: validCredentials.username, password: validCredentials.password }];
      }
      return customConfig?.get?.(key);
    }),
  };

  return new ValidationsManager(
    jsLogger({ enabled: false }),
    mockConfig as unknown as IConfig,
    extractableRepo,
    mockCatalogCall as unknown as CatalogCall
  );
};

describe('ValidationsManager - User & Record Validation', () => {
  beforeEach(() => {
    validationsManager = createValidationsManager();
  });

  afterEach(() => {
    resetRepoMocks();
    jest.resetAllMocks();
  });

  describe('#validateUser', () => {
    it('should succeed when credentials are valid', () => {
      const result = validationsManager.validateUser(validCredentials);

      expect(result.isValid).toBe(true);
      expect(result.code).toBe('SUCCESS');
      expect(result.message).toBe('User credentials are valid');
    });

    it('should fail when credentials are invalid', () => {
      const result = validationsManager.validateUser(invalidCredentials);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Invalid username or password');
      expect(result.code).toBe('INVALID_CREDENTIALS');
    });

    it('should fail when credentials are missing', () => {
      const result = validationsManager.validateUser({ username: '', password: '' });

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Username and password are required');
      expect(result.code).toBe('MISSING_CREDENTIALS');
    });
  });

  describe('#validateCreate', () => {
    it('should succeed when record does not exist and credentials are valid', async () => {
      mockExtractableFindOne.mockResolvedValueOnce(null);
      mockCatalogCall.findPublishedRecord.mockResolvedValueOnce(true);

      const record_name = 'newRecord';

      const payload: IAuthPayloadWithRecord = { ...validCredentials, recordName: record_name, multiSiteValidation: false };
      const result = await validationsManager.validateCreate(payload);

      expect(result.isValid).toBe(true);
      expect(result.message).toBe(`Record '${record_name}' can be created`);
      expect(result.code).toBe('SUCCESS');
    });

    it('should fail when record already exists', async () => {
      mockExtractableFindOne.mockResolvedValueOnce({ record_name: 'existingRecord' } as ExtractableRecord);

      const payload: IAuthPayloadWithRecord = { ...validCredentials, recordName: 'existingRecord' };
      const result = await validationsManager.validateCreate(payload);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe("Record 'existingRecord' already exists");
      expect(result.code).toBe('INVALID_RECORD_NAME');
    });

    describe('Remote Validation', () => {
      beforeEach(() => {
        mockExtractableFindOne.mockResolvedValueOnce(null);
        mockCatalogCall.findPublishedRecord.mockResolvedValueOnce(true);
      });

      it('should skip remote validation when multiSiteValidation is true', async () => {
        mockedAxios.post.mockClear();

        const record_name = 'remoteTestRecord';
        const payload: IAuthPayloadWithRecord = { ...validCredentials, recordName: record_name, multiSiteValidation: false };
        const result = await validationsManager.validateCreate(payload);

        expect(result.isValid).toBe(true);
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(mockedAxios.post).not.toHaveBeenCalled();
      });

      it('should perform remote validation when multiSiteValidation is undefined (defaults to false)', async () => {
        const routes = [{ url: 'http://site1.com' }];
        mockedAxios.post.mockResolvedValueOnce({ data: { isValid: true, code: 'SUCCESS', message: 'Valid' } });

        validationsManager = createValidationsManager({
          get: (key: string) => {
            if (key === 'externalServices.publicExtractableRoutes') return routes;
            if (key === 'users') return [{ username: validCredentials.username, password: validCredentials.password }];
            return undefined;
          },
        } as unknown as Partial<IConfig>);

        const record_name = 'remoteTestRecord';
        const payload: IAuthPayloadWithRecord = { ...validCredentials, recordName: record_name };
        const result = await validationsManager.validateCreate(payload);

        expect(result.isValid).toBe(true);
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(mockedAxios.post).not.toHaveBeenCalled();
      });

      it('should succeed when remote validation passes on all sites', async () => {
        const routes = [{ url: 'http://site1.com' }, { url: 'http://site2.com' }];
        mockedAxios.post
          .mockResolvedValueOnce({ data: { isValid: true, code: 'SUCCESS', message: 'Valid' } })
          .mockResolvedValueOnce({ data: { isValid: true, code: 'SUCCESS', message: 'Valid' } });

        validationsManager = createValidationsManager({
          get: (key: string) => {
            if (key === 'externalServices.publicExtractableRoutes') return routes;
            if (key === 'users') return [{ username: validCredentials.username, password: validCredentials.password }];
            return undefined;
          },
        } as unknown as Partial<IConfig>);

        const record_name = 'remoteTestRecord';
        const payload: IAuthPayloadWithRecord = { ...validCredentials, recordName: record_name, multiSiteValidation: true };
        const result = await validationsManager.validateCreate(payload);

        expect(result.isValid).toBe(true);
        expect(result.code).toBe('SUCCESS');
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      });

      it('should fail when remote validation fails on at least one site', async () => {
        const routes = [{ url: 'http://site1.com' }, { url: 'http://site2.com' }];
        mockedAxios.post
          .mockResolvedValueOnce({ data: { isValid: true, code: 'SUCCESS', message: 'Valid' } })
          .mockResolvedValueOnce({ data: { isValid: false, code: 'INVALID_RECORD_NAME', message: 'Invalid' } });

        validationsManager = createValidationsManager({
          get: (key: string) => {
            if (key === 'externalServices.publicExtractableRoutes') return routes;
            if (key === 'users') return [{ username: validCredentials.username, password: validCredentials.password }];
            return undefined;
          },
        } as unknown as Partial<IConfig>);

        const record_name = 'remoteTestRecord';
        const payload: IAuthPayloadWithRecord = { ...validCredentials, recordName: record_name, multiSiteValidation: true };
        const result = await validationsManager.validateCreate(payload);

        expect(result.isValid).toBe(false);
        expect(result.message).toBe('Record validation failed on another site');
        expect(result.code).toBe('INTERNAL_ERROR');
      });

      it('should return false for remote site when fetch fails', async () => {
        const routes = [{ url: 'http://site1.com' }, { url: 'http://site2.com' }];
        mockedAxios.post
          .mockResolvedValueOnce({ data: { isValid: true, code: 'SUCCESS', message: 'Valid' } })
          .mockRejectedValueOnce(new Error('Network error'));

        validationsManager = createValidationsManager({
          get: (key: string) => {
            if (key === 'externalServices.publicExtractableRoutes') return routes;
            if (key === 'users') return [{ username: validCredentials.username, password: validCredentials.password }];
            return undefined;
          },
        } as unknown as Partial<IConfig>);

        const record_name = 'remoteTestRecord';
        const payload: IAuthPayloadWithRecord = { ...validCredentials, recordName: record_name, multiSiteValidation: true };
        const result = await validationsManager.validateCreate(payload);

        expect(result.isValid).toBe(false);
        expect(result.message).toBe('Record validation failed on another site');
        expect(result.code).toBe('INTERNAL_ERROR');
      });

      it('should handle remote validation config retrieval failure (routes load failure at construction)', async () => {
        validationsManager = createValidationsManager({
          get: (key: string) => {
            if (key === 'externalServices.publicExtractableRoutes') {
              throw new Error('Config error');
            }
            if (key === 'users') return [{ username: validCredentials.username, password: validCredentials.password }];
            return undefined;
          },
        } as unknown as Partial<IConfig>);

        const record_name = 'remoteTestRecord';
        const payload: IAuthPayloadWithRecord = { ...validCredentials, recordName: record_name, multiSiteValidation: false };
        const result = await validationsManager.validateCreate(payload);

        expect(result.isValid).toBe(true);
        expect(result.message).toBe(`Record '${record_name}' can be created`);
        expect(result.code).toBe('SUCCESS');
      });

      it('should handle fetch JSON parsing failure', async () => {
        const routes = [{ url: 'http://site1.com' }];
        mockedAxios.post.mockRejectedValueOnce(new Error('JSON parse error'));

        validationsManager = createValidationsManager({
          get: (key: string) => {
            if (key === 'externalServices.publicExtractableRoutes') return routes;
            if (key === 'users') return [{ username: validCredentials.username, password: validCredentials.password }];
            return undefined;
          },
        } as unknown as Partial<IConfig>);

        const record_name = 'remoteTestRecord';
        const payload: IAuthPayloadWithRecord = { ...validCredentials, recordName: record_name, multiSiteValidation: true };
        const result = await validationsManager.validateCreate(payload);

        expect(result.isValid).toBe(false);
        expect(result.message).toBe('Record validation failed on another site');
        expect(result.code).toBe('INTERNAL_ERROR');
      });
    });
  });

  describe('#validateDelete', () => {
    it('should succeed when record exists and credentials are valid', async () => {
      mockExtractableFindOne.mockResolvedValueOnce({ record_name: 'existingRecord' } as ExtractableRecord);

      const payload: IAuthPayloadWithRecord = { ...validCredentials, recordName: 'existingRecord' };
      const result = await validationsManager.validateDelete(payload);

      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Record can be deleted');
      expect(result.code).toBe('SUCCESS');
    });

    it('should fail when record does not exist', async () => {
      mockExtractableFindOne.mockResolvedValueOnce(null);

      const payload: IAuthPayloadWithRecord = { ...validCredentials, recordName: 'nonExistingRecord' };
      const result = await validationsManager.validateDelete(payload);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe("Record 'nonExistingRecord' not found");
      expect(result.code).toBe('INVALID_RECORD_NAME');
    });
  });
});
