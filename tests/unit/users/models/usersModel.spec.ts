import config from 'config';
import { Repository } from 'typeorm';
import jsLogger from '@map-colonies/js-logger';
import { ValidationsManager } from '@src/validations/models/validationsManager';
import { validCredentials, invalidCredentials } from '@tests/mocks/generalMocks';
import { IAuthPayloadWithRecord } from '@src/common/constants';
import { ExtractableRecord } from '@src/DAL/entities/extractableRecord.entity';
import { mockExtractableRepo, mockExtractableFindOne, resetRepoMocks } from '@tests/mocks/unitMocks';

let validationsManager: ValidationsManager;

jest.mock('config');
const mockedConfig = config as jest.Mocked<typeof config>;

describe('ValidationsManager - User & Record Validation', () => {
  beforeEach(() => {
    const extractableRepo = mockExtractableRepo as unknown as Repository<ExtractableRecord>;

    mockedConfig.get.mockReturnValue([{ username: validCredentials.username, password: validCredentials.password }]);

    validationsManager = new ValidationsManager(jsLogger({ enabled: false }), extractableRepo);
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
      mockExtractableFindOne.mockResolvedValue(null);
      const recordName = 'newRecord';

      const payload: IAuthPayloadWithRecord = { ...validCredentials, recordName: recordName };
      const result = await validationsManager.validateCreate(payload);

      expect(result.isValid).toBe(true);
      expect(result.message).toBe(`Record '${recordName}' can be created`);
      expect(result.code).toBe('SUCCESS');
    });

    it('should fail when record already exists', async () => {
      mockExtractableFindOne.mockResolvedValue({ recordName: 'existingRecord' } as ExtractableRecord);

      const payload: IAuthPayloadWithRecord = { ...validCredentials, recordName: 'existingRecord' };
      const result = await validationsManager.validateCreate(payload);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe("Record 'existingRecord' already exists");
      expect(result.code).toBe('INVALID_RECORD_NAME');
    });
  });

  describe('#validateDelete', () => {
    it('should succeed when record exists and credentials are valid', async () => {
      mockExtractableFindOne.mockResolvedValue({ recordName: 'existingRecord' } as ExtractableRecord);

      const payload: IAuthPayloadWithRecord = { ...validCredentials, recordName: 'existingRecord' };
      const result = await validationsManager.validateDelete(payload);

      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Record can be deleted');
      expect(result.code).toBe('SUCCESS');
    });

    it('should fail when record does not exist', async () => {
      mockExtractableFindOne.mockResolvedValue(null);

      const payload: IAuthPayloadWithRecord = { ...validCredentials, recordName: 'nonExistingRecord' };
      const result = await validationsManager.validateDelete(payload);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe("Record 'nonExistingRecord' not found");
      expect(result.code).toBe('INVALID_RECORD_NAME');
    });
  });
});
