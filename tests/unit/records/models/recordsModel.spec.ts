import 'reflect-metadata';
import config from 'config';
import jsLogger from '@map-colonies/js-logger';
import { Repository, DeleteResult, EntityManager } from 'typeorm';
import { RecordsManager } from '@src/records/models/recordsManager';
import { ValidationsManager } from '@src/validations/models/validationsManager';
import { ExtractableRecord } from '@src/DAL/entities/extractableRecord.entity';
import { AuditLog } from '@src/DAL/entities/auditLog.entity';
import { invalidCredentials, recordInstance, validCredentials } from '@tests/mocks/generalMocks';
import {
  mockExtractableRepo,
  mockExtractableFind,
  mockExtractableFindOne,
  mockExtractableSave,
  mockExtractableDelete,
  resetRepoMocks,
  mockAuditRepo,
} from '@tests/mocks/unitMocks';

jest.mock('config');
const mockedConfig = config as jest.Mocked<typeof config>;

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

    type MockEntityManager = Pick<EntityManager, 'transaction' | 'getRepository'>;

    (extractableRepo as unknown as { manager?: MockEntityManager }).manager = {
      transaction: jest.fn().mockImplementation(async <T>(runInTransaction: (manager: EntityManager) => Promise<T>) => {
        return runInTransaction(fakeEntityManager as EntityManager);
      }),
      getRepository: fakeEntityManager.getRepository,
    };

    mockedConfig.get.mockReturnValue([{ username: validCredentials.username, password: validCredentials.password }]);

    validationsManager = new ValidationsManager(jsLogger({ enabled: false }), extractableRepo);
    recordsManager = new RecordsManager(jsLogger({ enabled: false }), extractableRepo);
  });

  afterEach(() => {
    resetRepoMocks();
    jest.resetAllMocks();
  });

  describe('#getRecords', () => {
    it('should return all records', async () => {
      const records: ExtractableRecord[] = [
        {
          ...recordInstance,
          username: validCredentials.username,
          authorizedAt: new Date(),
        },
      ];

      mockExtractableFind.mockResolvedValue(records);

      const result = await recordsManager.getRecords();
      expect(result[0]).toBe(records[0]);
    });

    it('should return empty array if no records exist', async () => {
      mockExtractableFind.mockResolvedValue([]);
      const result = await recordsManager.getRecords();
      expect(result).toEqual([]);
    });
  });

  describe('#getRecord', () => {
    it('should return a record by name', async () => {
      const record: ExtractableRecord = {
        ...recordInstance,
        username: validCredentials.username,
        authorizedAt: new Date(),
      };

      mockExtractableFindOne.mockResolvedValue(record);

      const result = await recordsManager.getRecord(record.recordName);
      expect(result).toBe(record);
    });

    it('should return undefined if record does not exist', async () => {
      mockExtractableFindOne.mockResolvedValue(null);

      const result = await recordsManager.getRecord(invalidCredentials.recordName);
      expect(result).toBeUndefined();
    });
  });

  describe('#createRecord', () => {
    it('should create and return the saved record', async () => {
      const record: ExtractableRecord = {
        ...recordInstance,
        username: validCredentials.username,
        authorizedAt: new Date(),
      };

      mockExtractableSave.mockResolvedValue(record);

      const result = await recordsManager.createRecord({
        recordName: record.recordName,
        username: record.username,
        authorizedBy: record.authorizedBy,
        data: record.data,
      });

      expect(result).toBe(record);
      expect(result.recordName).toBe(record.recordName);
    });
  });

  describe('#deleteRecord', () => {
    it('should delete an existing record', async () => {
      const record: ExtractableRecord = {
        ...recordInstance,
        username: validCredentials.username,
        authorizedAt: new Date(),
      };

      mockExtractableFindOne.mockResolvedValue(record);
      const deleteResult: DeleteResult = { raw: null, affected: 1 };
      mockExtractableDelete.mockResolvedValue(deleteResult);

      const result = await recordsManager.deleteRecord(record.recordName);
      expect(result).toBe(true);
    });

    it('should return false when record does not exist', async () => {
      mockExtractableFindOne.mockResolvedValue(null);

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

    describe('#validateCreate - missing recordName', () => {
      it('should return invalid if recordName is missing', async () => {
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

    describe('#validateDelete - missing recordName', () => {
      it('should return invalid if recordName is missing', async () => {
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
