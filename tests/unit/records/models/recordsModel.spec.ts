import jsLogger from '@map-colonies/js-logger';
import { RecordsManager } from '@src/records/models/recordsManager';
import { recordInstance } from '@src/common/mocks';

let recordsManager: RecordsManager;

describe('RecordsManager', () => {
  beforeEach(() => {
    recordsManager = new RecordsManager(jsLogger({ enabled: false }));
  });

  describe('#getRecord', () => {
    it('should return the mocked record instance', () => {
      const record = recordsManager.getRecord();

      expect(record).toEqual(recordInstance);
      expect(record.id).toBe(recordInstance.id);
      expect(record.record_name).toBe(recordInstance.record_name);
      expect(record.credentials).toBe(recordInstance.credentials);
    });
  });

  describe('#createRecord', () => {
    it('should return a new record with a new id', () => {
      const createdRecord = recordsManager.createRecord(recordInstance);

      expect(createdRecord).not.toBe(recordInstance);
      expect(createdRecord.id).toBeGreaterThanOrEqual(0);
      expect(createdRecord.id).toBeLessThan(100);

      expect(createdRecord.site_id).toBe(recordInstance.site_id);
      expect(createdRecord.record_name).toBe(recordInstance.record_name);
      expect(createdRecord.credentials).toBe(recordInstance.credentials);
      expect(createdRecord.extractable).toBe(recordInstance.extractable);
      expect(createdRecord.created_at).toBe(recordInstance.created_at);
      expect(createdRecord.updated_at).toBe(recordInstance.updated_at);
      expect(createdRecord.data).toEqual(recordInstance.data);
    });
  });
});
