import jsLogger from '@map-colonies/js-logger';
import { ValidationsManager } from '@src/validations/models/validationsManager';
import { validCredentials, invalidCredentials } from '@src/common/mocks';
import { parseUsersJson } from '@src/users/config/validUsers';
import { IAuthPayload } from '@src/common/constants';

let validationsManager: ValidationsManager;

describe('RecordsManager', () => {
  beforeEach(() => {
    process.env.USERS_JSON = JSON.stringify([{ username: validCredentials.username, password: validCredentials.password }]);

    validationsManager = new ValidationsManager(jsLogger({ enabled: false }));
  });

  afterEach(() => {
    delete process.env.USERS_JSON;
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

describe('Password Utils', () => {
  describe('parseUsersJson', () => {
    it('should return users when USERS_JSON is valid', () => {
      const users: IAuthPayload[] = [{ username: validCredentials.username, password: validCredentials.password }];

      process.env.USERS_JSON = JSON.stringify(users);

      const result = parseUsersJson();

      expect(result).toEqual(users);
    });

    it('should return empty array when USERS_JSON is empty', () => {
      delete process.env.USERS_JSON;

      const result = parseUsersJson();

      expect(result).toEqual([]);
    });

    it('should return empty array when USERS_JSON is invalid JSON', () => {
      process.env.USERS_JSON = '{invalid-json}';

      const result = parseUsersJson();

      expect(result).toEqual([]);
    });

    it('should return empty array when USERS_JSON is not an array', () => {
      process.env.USERS_JSON = JSON.stringify({ username: invalidCredentials.username, password: invalidCredentials.password });

      const result = parseUsersJson();

      expect(result).toEqual([]);
    });

    it('should return empty array when array contains no valid users', () => {
      process.env.USERS_JSON = JSON.stringify([{}, { foo: 'bar' }, { username: 123, password: [] }]);

      const result = parseUsersJson();

      expect(result).toEqual([]);
    });
  });
});
