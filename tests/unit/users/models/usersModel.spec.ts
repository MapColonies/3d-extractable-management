import jsLogger from '@map-colonies/js-logger';
import { ValidationsManager } from '@src/validations/models/validationsManager';
import { validCredentials, invalidCredentials } from '@src/common/mocks';

let validationsManager: ValidationsManager;

describe('RecordsManager', () => {
  beforeEach(() => {
    validationsManager = new ValidationsManager(jsLogger({ enabled: false }));
  });

  describe('#validateUser', () => {
    it('should succeed when credentials are valid', () => {
      const result = validationsManager.validateUser(validCredentials);

      expect(result.isValid).toBe(true);
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
});
