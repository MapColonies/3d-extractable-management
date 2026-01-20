import jsLogger from '@map-colonies/js-logger';
import { RecordsManager } from '@src/records/models/recordsManager';
import { recordInstance, validCredentials, invalidCredentials } from '@src/common/mocks';

let recordsManager: RecordsManager;

describe('RecordsManager', () => {
  beforeEach(() => {
    recordsManager = new RecordsManager(jsLogger({ enabled: false }));
  });

  describe('#getRecords', () => {
    it('should return the records array when records exist', () => {
      const recordsArray = [recordInstance];
      const result = recordsManager.getRecords(recordsArray);
      expect(result).toEqual(recordsArray);
    });

    it('should return undefined when records array is empty', () => {
      const result = recordsManager.getRecords([]);
      expect(result).toBeUndefined();
    });

    it('should return undefined when records is undefined', () => {
      const result = recordsManager.getRecords();
      expect(result).toBeUndefined();
    });
  });

  describe('#getRecord', () => {
    it('should return the mocked record instance when record exists', () => {
      const record = recordsManager.getRecord(recordInstance.recordName);
      expect(record).toEqual(recordInstance);
    });

    it('should return undefined when record does not exist', () => {
      const record = recordsManager.getRecord('non_existing_record');
      expect(record).toBeUndefined();
    });
  });

  describe('#createRecord', () => {
    it('should create a record when recordName is valid', () => {
      const createdRecord = recordsManager.createRecord(recordInstance.recordName);
      expect(createdRecord.recordName).toBe(recordInstance.recordName);
    });

    it('should throw when recordName is invalid', () => {
      expect(() => recordsManager.createRecord('invalid')).toThrow('Record not found');
    });
  });

  describe('#deleteRecord', () => {
    it('should return true when recordName is valid', () => {
      const result = recordsManager.deleteRecord(recordInstance.recordName);
      expect(result).toBe(true);
    });

    it('should return false when record does not exist', () => {
      const result = recordsManager.deleteRecord('non_existing_record');
      expect(result).toBe(false);
    });
  });

  describe('#validate', () => {
    it.each([
      ['CREATE', 'Record can be created'],
      ['DELETE', 'Record can be deleted'],
    ])('should succeed for %s with valid credentials and recordName', (action, expectedMessage) => {
      const result = recordsManager.validate(action as 'CREATE' | 'DELETE', validCredentials);
      expect(result.isValid).toBe(true);
      expect(result.message).toBe(expectedMessage);
    });

    it.each([['CREATE'], ['DELETE']])('should fail for %s when username/password are missing', (action) => {
      const result = recordsManager.validate(action as 'CREATE' | 'DELETE', { username: '', password: '', recordName: validCredentials.recordName });
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('MISSING_CREDENTIALS');
    });

    it.each([['CREATE'], ['DELETE']])('should fail for %s when credentials are invalid', (action) => {
      const result = recordsManager.validate(action as 'CREATE' | 'DELETE', invalidCredentials);
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('INVALID_CREDENTIALS');
    });

    it.each([['CREATE'], ['DELETE']])('should fail for %s when recordName is missing', (action) => {
      const result = recordsManager.validate(action as 'CREATE' | 'DELETE', {
        username: validCredentials.username,
        password: validCredentials.password,
      });
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('MISSING_CREDENTIALS');
      expect(result.message).toBe('recordName is required');
    });

    it.each([['CREATE'], ['DELETE']])('should fail for %s when recordName is invalid', (action) => {
      const result = recordsManager.validate(action as 'CREATE' | 'DELETE', {
        username: validCredentials.username,
        password: validCredentials.password,
        recordName: 'wrong_name',
      });
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('INVALID_RECORD_NAME');
      expect(result.message).toBe("Record 'wrong_name' not found");
    });
  });

  describe('#validateUser', () => {
    it('should succeed with valid credentials', () => {
      const result = recordsManager.validateUser(validCredentials);
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('User credentials are valid');
    });

    it('should fail with invalid credentials', () => {
      const result = recordsManager.validateUser(invalidCredentials);
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('INVALID_CREDENTIALS');
      expect(result.message).toBe('Invalid username or password');
    });

    it('should fail when credentials are missing', () => {
      const result = recordsManager.validateUser({ username: '', password: '' });
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('MISSING_CREDENTIALS');
      expect(result.message).toBe('Username and password are required');
    });
  });
});
