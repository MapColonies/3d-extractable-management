import 'reflect-metadata';
import jsLogger from '@map-colonies/js-logger';
import { Repository } from 'typeorm';
import { RecordsManager } from '@src/records/models/recordsManager';
import { ValidationsManager } from '@src/validations/models/validationsManager';
import { ExtractableRecord } from '@src/DAL/entities/extractableRecord.entity';
import { AuditLog } from '@src/DAL/entities/auditLog.entity';
import { recordInstance, validCredentials } from '@tests/mocks';

let recordsManager: RecordsManager;
let validationsManager: ValidationsManager;

const mockRepo = () => ({
  find: jest.fn() as jest.Mock<Promise<ExtractableRecord[]>>,
  findOne: jest.fn() as jest.Mock<Promise<ExtractableRecord | null>>,
  // create: jest.fn().mockImplementation(
  //   (dto: Partial<ExtractableRecord>): ExtractableRecord => ({
  //     id: 1,
  //     recordName: dto.recordName ?? '',
  //     username: dto.username ?? '',
  //     authorizedBy: dto.authorizedBy ?? '',
  //     authorizedAt: dto.authorizedAt ? new Date(record.authorizedAt) : new Date(),
  //     data: dto.data,
  //   })
  // ),
  save: jest.fn().mockImplementation(async (record: Partial<ExtractableRecord>): Promise<ExtractableRecord> => {
    await Promise.resolve(); // satisfies ESLint
    return {
      id: 1,
      recordName: record.recordName ?? '',
      username: record.username ?? '',
      authorizedBy: record.authorizedBy ?? '',
      authorizedAt: record.authorizedAt ? new Date(record.authorizedAt) : new Date(),
      data: record.data,
    };
  }),
  delete: jest.fn() as jest.Mock<Promise<void>>,
});

describe('RecordsManager & ValidationsManager', () => {
  beforeEach(() => {
    const extractableRepo = mockRepo() as unknown as Repository<ExtractableRecord>;
    const auditRepo = mockRepo() as unknown as Repository<AuditLog>;

    recordsManager = new RecordsManager(jsLogger({ enabled: false }), extractableRepo, auditRepo);
    validationsManager = new ValidationsManager(jsLogger({ enabled: false }), extractableRepo);

    jest.clearAllMocks();
  });

  describe('#getRecords', () => {
    it('should return all records', async () => {
      const records = [{ ...recordInstance, authorizedAt: new Date() }];
      (recordsManager['extractableRepo'].find as jest.Mock).mockResolvedValue(records);

      const result = await recordsManager.getRecords();
      expect(result[0].recordName).toBe(records[0].recordName);
      expect(typeof result[0].authorizedAt).toBe('string');
    });

    it('should return empty array if no records exist', async () => {
      (recordsManager['extractableRepo'].find as jest.Mock).mockResolvedValue([]);
      const result = await recordsManager.getRecords();
      expect(result).toEqual([]);
    });
  });

  describe('#getRecord', () => {
    it('should return a record by name', async () => {
      const record = { ...recordInstance, authorizedAt: new Date() };
      (recordsManager['extractableRepo'].findOne as jest.Mock).mockResolvedValue(record);

      const result = await recordsManager.getRecord(record.recordName);
      expect(result?.recordName).toBe(record.recordName);
      expect(typeof result?.authorizedAt).toBe('string');
    });

    it('should return undefined if record does not exist', async () => {
      (recordsManager['extractableRepo'].findOne as jest.Mock).mockResolvedValue(null);
      const result = await recordsManager.getRecord('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('#createRecord', () => {
    it('should return the created record', async () => {
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

      expect(result.recordName).toBe(record.recordName);
    });
  });
});

describe('#deleteRecord', () => {
  it('should delete an existing record', async () => {
    const record = { ...recordInstance, authorizedAt: new Date() };
    (recordsManager['extractableRepo'].findOne as jest.Mock).mockResolvedValue(record);

    const result = await recordsManager.deleteRecord(record.recordName);
    expect(result).toBe(true);
  });

  it('should return false when record does not exist', async () => {
    (recordsManager['extractableRepo'].findOne as jest.Mock).mockResolvedValue(null);
    const result = await recordsManager.deleteRecord('nonexistent');
    expect(result).toBe(false);
  });
});

describe('ValidationsManager', () => {
  describe('#validateCreate', () => {
    it('should succeed for existing record and valid credentials', async () => {
      (validationsManager['extractableRepo'].findOne as jest.Mock).mockResolvedValue(recordInstance);
      const result = await validationsManager.validateCreate({
        ...validCredentials,
        recordName: recordInstance.recordName,
      });
      expect(result.isValid).toBe(true);
    });

    it('should fail if record does not exist', async () => {
      (validationsManager['extractableRepo'].findOne as jest.Mock).mockResolvedValue(null);
      const result = await validationsManager.validateCreate({
        ...validCredentials,
        recordName: 'nonexistent',
      });
      expect(result.isValid).toBe(false);
    });
  });

  describe('#validateDelete', () => {
    it('should succeed for existing record', async () => {
      (validationsManager['extractableRepo'].findOne as jest.Mock).mockResolvedValue(recordInstance);
      const result = await validationsManager.validateDelete({
        ...validCredentials,
        recordName: recordInstance.recordName,
      });
      expect(result.isValid).toBe(true);
    });

    it('should fail if record does not exist', async () => {
      (validationsManager['extractableRepo'].findOne as jest.Mock).mockResolvedValue(null);
      const result = await validationsManager.validateDelete({
        ...validCredentials,
        recordName: 'nonexistent',
      });
      expect(result.isValid).toBe(false);
    });
  });
});
