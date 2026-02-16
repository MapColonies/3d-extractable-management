/* eslint-disable @typescript-eslint/naming-convention */
import 'reflect-metadata';
import jsLogger from '@map-colonies/js-logger';
import { Repository, DeleteResult, EntityManager } from 'typeorm';
import { RecordsManager } from '@src/records/models/recordsManager';
import { ValidationsManager } from '@src/validations/models/validationsManager';
import type { IConfig } from '@src/common/interfaces';
import { ExtractableRecord } from '@src/DAL/entities/extractableRecord.entity';
import { AuditLog } from '@src/DAL/entities/auditLog.entity';
import { invalidCredentials, recordInstance, validCredentials } from '@tests/mocks/generalMocks';
import {
  mockExtractableRepo,
  mockExtractableFindOne,
  mockExtractableSave,
  mockExtractableDelete,
  resetRepoMocks,
  mockAuditRepo,
  mockCatalogCall,
  mockExtractableFindAndCount,
} from '@tests/mocks/unitMocks';

import { mapExtractableRecordToCamelCase } from '@src/utils/converter';
import { CatalogCall } from '@src/externalServices/catalog/catalogCall';

let recordsManager: RecordsManager;
let validationsManager: ValidationsManager;

describe('RecordsManager & ValidationsManager', () => {
  beforeEach(() => {
    const extractableRepo = mockExtractableRepo as unknown as Repository<ExtractableRecord>;

    const repoMap = new Map<unknown, unknown>([
      [ExtractableRecord, mockExtractableRepo],
      [AuditLog, mockAuditRepo],
    ]);

    const fakeEntityManager: Pick<EntityManager, 'getRepository'> = {
      getRepository: <T extends object>(entity: new () => T): Repository<T> => {
        const repo = repoMap.get(entity);
        if (repo === undefined) {
          const entityName = 'name' in entity ? (entity as { name: string }).name : String(entity);
          throw new Error(`No mock defined for repository: ${entityName}`);
        }
        return repo as Repository<T>;
      },
    };

    // Mock config for ValidationsManager
    const mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'externalServices.publicExtractableRoutes') {
          return [];
        }
        if (key === 'users') {
          return [{ username: validCredentials.username, password: validCredentials.password }];
        }
        return undefined;
      }),
    };

    type MockEntityManager = Pick<EntityManager, 'transaction' | 'getRepository'>;

    (extractableRepo as unknown as { manager?: MockEntityManager }).manager = {
      transaction: jest.fn().mockImplementation(async <T>(runInTransaction: (manager: EntityManager) => Promise<T>) => {
        return runInTransaction(fakeEntityManager as EntityManager);
      }),
      getRepository: fakeEntityManager.getRepository,
    };

    validationsManager = new ValidationsManager(
      jsLogger({ enabled: false }),
      mockConfig as unknown as IConfig,
      extractableRepo,
      mockCatalogCall as unknown as CatalogCall
    );
    recordsManager = new RecordsManager(jsLogger({ enabled: false }), extractableRepo);
  });

  afterEach(() => {
    resetRepoMocks();
    jest.resetAllMocks();
  });

  describe('#getRecords', () => {
    it('should return paginated records', async () => {
      const dbRecords: ExtractableRecord[] = [
        {
          id: 1,
          record_name: recordInstance.recordName,
          username: validCredentials.username,
          authorized_by: recordInstance.authorizedBy,
          authorized_at: new Date(),
          data: recordInstance.data,
        },
      ];

      mockExtractableFindAndCount.mockResolvedValueOnce([dbRecords, 1]);

      const result = await recordsManager.getRecords(1, 10);

      expect(result).toEqual({
        numberOfRecords: 1,
        numberOfRecordsReturned: 1,
        nextRecord: null,
        records: dbRecords.map(mapExtractableRecordToCamelCase),
      });
    });

    it('should return empty array if no records exist', async () => {
      mockExtractableFindAndCount.mockResolvedValueOnce([[], 0]);

      const result = await recordsManager.getRecords(1, 10);
      expect(result).toEqual({
        numberOfRecords: 0,
        numberOfRecordsReturned: 0,
        nextRecord: null,
        records: [],
      });
    });

    it('should return nextRecord when more records exist', async () => {
      const dbRecords: ExtractableRecord[] = [
        {
          id: 1,
          record_name: recordInstance.recordName,
          username: validCredentials.username,
          authorized_by: recordInstance.authorizedBy,
          authorized_at: new Date(),
          data: recordInstance.data,
        },
      ];

      mockExtractableFindAndCount.mockResolvedValueOnce([dbRecords, 25]);

      const result = await recordsManager.getRecords(1, 10);

      expect(result).toEqual({
        numberOfRecords: 25,
        numberOfRecordsReturned: 1,
        nextRecord: 2,
        records: dbRecords.map(mapExtractableRecordToCamelCase),
      });
    });
  });

  describe('#getRecord', () => {
    it('should return a record by name', async () => {
      const dbRecord: ExtractableRecord = {
        id: 1,
        record_name: recordInstance.recordName,
        username: validCredentials.username,
        authorized_by: recordInstance.authorizedBy,
        authorized_at: new Date(),
        data: recordInstance.data,
      };

      mockExtractableFindOne.mockResolvedValueOnce(dbRecord);

      const result = await recordsManager.getRecord(dbRecord.record_name);

      expect(result).toEqual(mapExtractableRecordToCamelCase(dbRecord));
    });

    it('should return undefined if record does not exist', async () => {
      mockExtractableFindOne.mockResolvedValueOnce(null);

      const result = await recordsManager.getRecord(invalidCredentials.recordName);
      expect(result).toBeUndefined();
    });
  });

  describe('#createRecord', () => {
    it('should create and return the saved record', async () => {
      const dbRecord: ExtractableRecord = {
        id: 1,
        record_name: recordInstance.recordName,
        username: validCredentials.username,
        authorized_by: recordInstance.authorizedBy,
        authorized_at: new Date(),
        data: recordInstance.data,
      };

      mockExtractableSave.mockResolvedValueOnce(dbRecord);

      const result = await recordsManager.createRecord({
        recordName: dbRecord.record_name,
        username: dbRecord.username,
        authorizedBy: dbRecord.authorized_by,
        data: dbRecord.data,
      });

      expect(result).toEqual(mapExtractableRecordToCamelCase(dbRecord));
      expect(result.recordName).toBe(dbRecord.record_name);
    });
  });

  describe('#deleteRecord', () => {
    it('should delete an existing record', async () => {
      const dbRecord: ExtractableRecord = {
        id: 1,
        record_name: recordInstance.recordName,
        username: validCredentials.username,
        authorized_by: recordInstance.authorizedBy,
        authorized_at: new Date(),
        data: recordInstance.data,
      };

      mockExtractableFindOne.mockResolvedValueOnce(dbRecord);

      const deleteResult: DeleteResult = { raw: null, affected: 1 };
      mockExtractableDelete.mockResolvedValueOnce(deleteResult);

      const result = await recordsManager.deleteRecord(dbRecord.record_name);
      expect(result).toBe(true);
    });

    it('should return false when record does not exist', async () => {
      mockExtractableFindOne.mockResolvedValueOnce(null);

      const result = await recordsManager.deleteRecord(invalidCredentials.recordName);
      expect(result).toBe(false);
    });
  });

  describe('ValidationsManager - uncovered branches', () => {
    describe('#validateCreate - userValidation failure', () => {
      it('should return invalid if username/password are missing', async () => {
        const result = await validationsManager.validateCreate({
          ...validCredentials,
          username: '',
          password: '',
          recordName: recordInstance.recordName,
        });

        expect(result).toEqual({
          isValid: false,
          message: 'Username and password are required',
          code: 'MISSING_CREDENTIALS',
        });
      });
    });

    describe('#validateCreate - missing record_name', () => {
      it('should return invalid if record_name is missing', async () => {
        const result = await validationsManager.validateCreate({
          ...validCredentials,
          recordName: '',
        });

        expect(result).toEqual({
          isValid: false,
          message: 'recordName is required',
          code: 'MISSING_CREDENTIALS',
        });
      });

      it('should return INTERNAL_ERROR if catalog throws', async () => {
        (mockCatalogCall as unknown as CatalogCall).findPublishedRecord = jest.fn().mockRejectedValue(new Error('Catalog down'));

        const result = await validationsManager.validateCreate({
          ...validCredentials,
          recordName: 'someRecord',
        });

        expect(result).toEqual({
          isValid: false,
          message: 'Catalog service is currently unavailable',
          code: 'INTERNAL_ERROR',
        });
      });
      it('should return INVALID_RECORD_NAME if catalog does not contain record', async () => {
        (mockCatalogCall as unknown as CatalogCall).findPublishedRecord = jest.fn().mockResolvedValueOnce(false);

        const result = await validationsManager.validateCreate({
          ...validCredentials,
          recordName: 'missingRecord',
        });

        expect(result).toEqual({
          isValid: false,
          message: "Record 'missingRecord' is missing from the catalog",
          code: 'INVALID_RECORD_NAME',
        });
      });
    });

    describe('#validateDelete - userValidation failure', () => {
      it('should return invalid if username/password are missing', async () => {
        const result = await validationsManager.validateDelete({
          ...validCredentials,
          username: '',
          password: '',
          recordName: recordInstance.recordName,
        });

        expect(result).toEqual({
          isValid: false,
          message: 'Username and password are required',
          code: 'MISSING_CREDENTIALS',
        });
      });
    });

    describe('#validateDelete - missing record_name', () => {
      it('should return invalid if record_name is missing', async () => {
        const result = await validationsManager.validateDelete({
          ...validCredentials,
          recordName: '',
        });

        expect(result).toEqual({
          isValid: false,
          message: 'recordName is required',
          code: 'MISSING_CREDENTIALS',
        });
      });
    });
  });
});
