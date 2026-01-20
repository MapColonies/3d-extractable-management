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
      const spy = jest.spyOn(RecordsManager.prototype, 'getRecords');
      const recordsArray = [recordInstance];

      const result = recordsManager.getRecords(recordsArray);

      expect(result).toBeDefined();
      expect(result).toEqual(recordsArray);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should return undefined when records array is empty', () => {
      const spy = jest.spyOn(RecordsManager.prototype, 'getRecords');
      const result = recordsManager.getRecords([]);

      expect(result).toBeUndefined();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should return undefined when records is undefined', () => {
      const spy = jest.spyOn(RecordsManager.prototype, 'getRecords');
      const result = recordsManager.getRecords();

      expect(result).toBeUndefined();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('#getRecord', () => {
    it('should return the mocked record instance when record exists', () => {
      const record = recordsManager.getRecord(recordInstance.recordName);

      expect(record).toBeDefined();
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

      expect(createdRecord).toBeDefined();
      expect(createdRecord.recordName).toBe(recordInstance.recordName);
      expect(createdRecord.id).toBeDefined();
    });

    it('should throw when recordName is invalid', () => {
      expect(() => recordsManager.createRecord('rec_invoalid')).toThrow('Record not found');
    });
  });

  describe('#validate', () => {
    it.each([
      ['CREATE', 'Record can be created'],
      ['DELETE', 'Record can be deleted'],
    ])('should succeed for %s when credentials are valid', (action, expectedMessage) => {
      const result = recordsManager.validate(action as 'CREATE' | 'DELETE', validCredentials);

      expect(result.isValid).toBe(true);
      expect(result.message).toBe(expectedMessage);
    });

    it.each([['CREATE'], ['DELETE']])('should fail for %s when credentials are missing', (action) => {
      const result = recordsManager.validate(action as 'CREATE' | 'DELETE', {
        username: '',
        password: '',
      });

      expect(result.isValid).toBe(false);
      expect(result.code).toBe('MISSING_CREDENTIALS');
    });

    it.each([['CREATE'], ['DELETE']])('should fail for %s when credentials are invalid', (action) => {
      const result = recordsManager.validate(action as 'CREATE' | 'DELETE', {
        username: invalidCredentials.username,
        password: invalidCredentials.password,
      });

      expect(result.isValid).toBe(false);
      expect(result.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('#deleteRecord', () => {
    it('should return true when recordName is valid and record is deleted', () => {
      const result = recordsManager.deleteRecord(recordInstance.recordName);

      expect(result).toBe(true);
    });

    it('should return false when record does not exist', () => {
      const result = recordsManager.deleteRecord('non_existing_record');

      expect(result).toBe(false);
    });
  });
});
