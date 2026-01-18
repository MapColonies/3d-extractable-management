import jsLogger from '@map-colonies/js-logger';
import { RecordsManager } from '@src/records/models/recordsManager';
import { recordInstance, credentialsInstance } from '@src/common/mocks';

let recordsManager: RecordsManager;

describe('RecordsManager', () => {
  beforeEach(() => {
    recordsManager = new RecordsManager(jsLogger({ enabled: false }));
  });

  describe('#getRecord', () => {
    it('should return the mocked record instance when record exists', () => {
      const record = recordsManager.getRecord(recordInstance.record_name);

      expect(record).toBeDefined();
      expect(record).toEqual(recordInstance);
    });

    it('should return undefined when record does not exist', () => {
      const record = recordsManager.getRecord('non_existing_record');

      expect(record).toBeUndefined();
    });
  });

  describe('#createRecord', () => {
    it('should create a new record with a generated id', () => {
      const createdRecord = recordsManager.createRecord(recordInstance);

      expect(createdRecord).not.toBe(recordInstance);

      expect(createdRecord.id).toBeGreaterThanOrEqual(0);

      expect(createdRecord.record_name).toBe(recordInstance.record_name);
      expect(createdRecord.username).toBe(recordInstance.username);
      expect(createdRecord.created_at).toBe(recordInstance.created_at);
      expect(createdRecord.data).toEqual(recordInstance.data);
    });
  });

  describe('#validateRecord', () => {
    it('should fail if username/password missing', () => {
      const result = recordsManager.validateRecord({ username: '', password: '' });
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Username and password are required');
    });

    it('should fail if credentials are invalid', () => {
      const result = recordsManager.validateRecord({ username: 'wrong', password: 'wrong' });
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Invalid username or password');
    });

    it('should succeed with correct credentials', () => {
      const result = recordsManager.validateRecord(credentialsInstance);
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Record can be created or deleted');
    });
  });
});
