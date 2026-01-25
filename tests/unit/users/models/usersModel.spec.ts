import jsLogger from '@map-colonies/js-logger';
import { ValidationsManager } from '@src/validations/models/validationsManager';
import { validCredentials, invalidCredentials } from '@src/common/mocks';
import { hashPassword, verifyPassword } from '@src/users/utils/password';
import { IAuthPayload } from '@src/common/constants';

let validationsManager: ValidationsManager;

describe('RecordsManager', () => {
  beforeEach(() => {
    validationsManager = new ValidationsManager(jsLogger({ enabled: false }));
  });

  describe('#validateUser', () => {
    it('should succeed when credentials are valid', async () => {
      const result = await validationsManager.validateUser(validCredentials);

      expect(result.isValid).toBe(true);
      expect(result.code).toBe('SUCCESS');
      expect(result.message).toBe('User credentials are valid');
    });

    it('should fail when credentials are invalid', async () => {
      const result = await validationsManager.validateUser(invalidCredentials);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Invalid username or password');
      expect(result.code).toBe('INVALID_CREDENTIALS');
    });

    it('should fail when credentials are missing', async () => {
      const result = await validationsManager.validateUser({ username: '', password: '' });

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Username and password are required');
      expect(result.code).toBe('MISSING_CREDENTIALS');
    });

    it('should fail when the username exists but password is wrong', async () => {
      const validUser = validCredentials;

      const payload: IAuthPayload = {
        username: validUser.username,
        password: 'wrongPassword',
      };

      const result = await validationsManager.validateUser(payload);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Invalid username or password');
      expect(result.code).toBe('INVALID_CREDENTIALS');
    });
  });
});

describe('Password Utils', () => {
  const plainPassword = 'mySecret123';
  let passwordHash: string;

  describe('#hashPassword', () => {
    it('should generate a hash string for a password', async () => {
      passwordHash = await hashPassword(plainPassword);

      expect(typeof passwordHash).toBe('string');
      expect(passwordHash).not.toBe(plainPassword);
      expect(passwordHash.startsWith('$2b$')).toBe(true);
    });

    it('should generate different hashes for the same password', async () => {
      const hash1 = await hashPassword(plainPassword);
      const hash2 = await hashPassword(plainPassword);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('#verifyPassword', () => {
    beforeAll(async () => {
      passwordHash = await hashPassword(plainPassword);
    });

    it('should return true for a matching password', async () => {
      const result = await verifyPassword(plainPassword, passwordHash);
      expect(result).toBe(true);
    });

    it('should return false for a non-matching password', async () => {
      const result = await verifyPassword('wrongPassword', passwordHash);
      expect(result).toBe(false);
    });

    it('should correctly verify multiple hashes of the same password', async () => {
      const hash1 = await hashPassword(plainPassword);
      const hash2 = await hashPassword(plainPassword);

      expect(await verifyPassword(plainPassword, hash1)).toBe(true);
      expect(await verifyPassword(plainPassword, hash2)).toBe(true);
    });
  });
});
