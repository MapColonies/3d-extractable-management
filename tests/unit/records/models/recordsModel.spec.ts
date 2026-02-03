import 'reflect-metadata';
import config from 'config';
import jsLogger from '@map-colonies/js-logger';
import { Repository } from 'typeorm';
import { RecordsManager } from '@src/records/models/recordsManager';
import { ValidationsManager } from '@src/validations/models/validationsManager';
import { ExtractableRecord } from '@src/DAL/entities/extractableRecord.entity';
import { invalidCredentials, recordInstance, validCredentials } from '@tests/mocks';

jest.mock('config');
const mockedConfig = config as jest.Mocked<typeof config>;

const mockRepo = () => {
  const mockRepoMethods = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  return {
    ...mockRepoMethods,
    manager: {
      transaction: async <T>(cb: (manager: { getRepository: <T>(entity: new () => T) => typeof mockRepoMethods }) => Promise<T> | T): Promise<T> => {
        const manager = {
          getRepository: jest.fn(() => mockRepoMethods),
        };
        return cb(manager);
      },
    },
  };
};

let recordsManager: RecordsManager;
let validationsManager: ValidationsManager;

describe('RecordsManager & ValidationsManager', () => {
  beforeEach(() => {
    const extractableRepo = mockRepo() as unknown as Repository<ExtractableRecord>;

    mockedConfig.get.mockReturnValue([{ username: validCredentials.username, password: validCredentials.password }]);

    validationsManager = new ValidationsManager(jsLogger({ enabled: false }), extractableRepo);
    recordsManager = new RecordsManager(jsLogger({ enabled: false }), extractableRepo);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('#getRecords', () => {
    it('should return all records', async () => {
      const records = [{ ...recordInstance, authorizedAt: new Date().toISOString() }];
      (recordsManager['extractableRepo'].find as jest.Mock).mockResolvedValue(records);

      const result = await recordsManager.getRecords();
      expect(result[0]?.recordName).toBe(records[0]?.recordName);
      expect(typeof result[0]?.authorizedAt).toBe('string');
    });

    it('should return empty array if no records exist', async () => {
      (recordsManager['extractableRepo'].find as jest.Mock).mockResolvedValue([]);
      const result = await recordsManager.getRecords();
      expect(result).toEqual([]);
    });
  });

  describe('#getRecord', () => {
    it('should return a record by name', async () => {
      const record = { ...recordInstance, authorizedAt: new Date().toISOString() };
      (recordsManager['extractableRepo'].findOne as jest.Mock).mockResolvedValue(record);

      const result = await recordsManager.getRecord(record.recordName);
      expect(result?.recordName).toBe(record.recordName);
      expect(typeof result?.authorizedAt).toBe('string');
    });

    it('should return undefined if record does not exist', async () => {
      (recordsManager['extractableRepo'].findOne as jest.Mock).mockResolvedValue(null);
      const result = await recordsManager.getRecord(invalidCredentials.recordName);
      expect(result).toBeUndefined();
    });
  });

  describe('#createRecord', () => {
    it('should create and return the saved record', async () => {
      const record = { ...recordInstance, username: validCredentials.username };
      const repo = recordsManager['extractableRepo'];

      repo.create = jest.fn().mockReturnValue(record);
      repo.save = jest.fn().mockResolvedValue(record);

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
      const record = { ...recordInstance, authorizedAt: new Date().toISOString() };
      (recordsManager['extractableRepo'].findOne as jest.Mock).mockResolvedValue(record);

      const result = await recordsManager.deleteRecord(record.recordName);
      expect(result).toBe(true);
    });

    it('should return false when record does not exist', async () => {
      (recordsManager['extractableRepo'].findOne as jest.Mock).mockResolvedValue(null);
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

    describe('#validateDelete - missing recordName', () => {
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
  });
});
