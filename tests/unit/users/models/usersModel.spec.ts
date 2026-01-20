import jsLogger from '@map-colonies/js-logger';
import { RecordsManager } from '@src/records/models/recordsManager';
import { validCredentials, invalidCredentials } from '@src/common/mocks';

let recordsManager: RecordsManager;

describe('RecordsManager', () => {
  beforeEach(() => {
    recordsManager = new RecordsManager(jsLogger({ enabled: false }));
  });

  describe('#validateUser', () => {
    it('should return true when record exists', () => {
      const spy = jest.spyOn(RecordsManager.prototype, 'validateUser');

      const result = recordsManager.validateUser(validCredentials);

      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Record can be created');

      spy.mockRestore();
    });

    it('should return false when record does not exist', () => {
      const spy = jest.spyOn(RecordsManager.prototype, 'validateUser');

      const result = recordsManager.validateUser(invalidCredentials);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Invalid username or password');

      spy.mockRestore();
    });

    it('should return false when credentials are missing', () => {
      const spy = jest.spyOn(RecordsManager.prototype, 'validateUser');

      const result = recordsManager.validateUser({ username: '', password: '' });

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Username and password are required');

      spy.mockRestore();
    });
  });
});
