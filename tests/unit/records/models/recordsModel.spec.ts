import jsLogger from '@map-colonies/js-logger';
import { RecordsManager } from '@src/records/models/recordsManager';
import { ValidationsManager } from '@src/validations/models/validationsManager';
import { recordInstance, validCredentials, invalidCredentials } from '@src/common/mocks';

let recordsManager: RecordsManager;
let validationsManager: ValidationsManager;

describe('RecordsManager', () => {
  beforeEach(() => {
    recordsManager = new RecordsManager(jsLogger({ enabled: false }));
    validationsManager = new ValidationsManager(jsLogger({ enabled: false }));
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

  describe('RecordsManager Validation', () => {
    describe('#validateCreate', () => {
      it('should succeed with valid credentials and recordName', () => {
        const result = validationsManager.validateCreate({
          ...validCredentials,
          recordName: validCredentials.recordName,
        });
        expect(result.isValid).toBe(true);
        expect(result.message).toBe('Record can be created');
      });

      it('should fail when username/password are missing', () => {
        const result = validationsManager.validateCreate({
          username: '',
          password: '',
          recordName: validCredentials.recordName,
        });
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('MISSING_CREDENTIALS');
        expect(result.message).toBe('Username and password are required');
      });

      it('should fail when credentials are invalid', () => {
        const result = validationsManager.validateCreate({
          username: invalidCredentials.username,
          password: invalidCredentials.password,
          recordName: validCredentials.recordName,
        });
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('INVALID_CREDENTIALS');
      });

      it('should fail when recordName is missing', () => {
        const result = validationsManager.validateCreate({
          username: validCredentials.username,
          password: validCredentials.password,
          recordName: '',
        });
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('MISSING_CREDENTIALS');
        expect(result.message).toBe('recordName is required');
      });

      it('should fail when recordName is invalid', () => {
        const result = validationsManager.validateCreate({
          username: validCredentials.username,
          password: validCredentials.password,
          recordName: invalidCredentials.recordName,
        });
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('INVALID_RECORD_NAME');
        expect(result.message).toBe(`Record '${invalidCredentials.recordName}' not found`);
      });
    });

    describe('#validateDelete', () => {
      it('should succeed with valid credentials and recordName', () => {
        const result = validationsManager.validateDelete({
          ...validCredentials,
          recordName: validCredentials.recordName,
        });
        expect(result.isValid).toBe(true);
        expect(result.message).toBe('Record can be deleted');
      });

      it('should fail when username/password are missing', () => {
        const result = validationsManager.validateDelete({
          username: '',
          password: '',
          recordName: validCredentials.recordName,
        });
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('MISSING_CREDENTIALS');
        expect(result.message).toBe('Username and password are required');
      });

      it('should fail when credentials are invalid', () => {
        const result = validationsManager.validateDelete({
          username: invalidCredentials.username,
          password: invalidCredentials.password,
          recordName: validCredentials.recordName,
        });
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('INVALID_CREDENTIALS');
      });

      it('should fail when recordName is missing', () => {
        const result = validationsManager.validateDelete({
          username: validCredentials.username,
          password: validCredentials.password,
          recordName: '',
        });
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('MISSING_CREDENTIALS');
        expect(result.message).toBe('recordName is required');
      });

      it('should fail when recordName is invalid', () => {
        const result = validationsManager.validateDelete({
          username: validCredentials.username,
          password: validCredentials.password,
          recordName: invalidCredentials.recordName,
        });
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('INVALID_RECORD_NAME');
        expect(result.message).toBe(`Record '${invalidCredentials.recordName}' not found`);
      });
    });
  });
});
