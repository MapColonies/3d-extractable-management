import config from 'config';
import jsLogger from '@map-colonies/js-logger';
import { ValidationsManager } from '@src/validations/models/validationsManager';
import { validCredentials, invalidCredentials } from '@src/common/mocks';
import { IAuthPayload } from '@src/common/constants';

let validationsManager: ValidationsManager;

jest.mock('config');

const mockedConfig = config as jest.Mocked<typeof config>;

describe('RecordsManager', () => {
  beforeEach(() => {
    mockedConfig.get.mockReturnValue([{ username: validCredentials.username, password: validCredentials.password }]);

    validationsManager = new ValidationsManager(jsLogger({ enabled: false }));
  });

  afterEach(() => {
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

    it('should fail when the username exists but password is wrong', () => {
      const validUser = validCredentials;

      const payload: IAuthPayload = {
        username: validUser.username,
        password: 'wrongPassword',
      };

      const result = validationsManager.validateUser(payload);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Invalid username or password');
      expect(result.code).toBe('INVALID_CREDENTIALS');
    });
  });
});
