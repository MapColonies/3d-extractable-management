import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { paths, operations } from '@openapi';
import { getApp } from '@src/app';
import { SERVICES, IAuthPayload } from '@common/constants';
import { ValidationsManager } from '@src/validations/models/validationsManager';
import { validCredentials, invalidCredentials } from '@src/common/mocks';
import { initConfig } from '@src/common/config';
import { hashPassword, verifyPassword } from '@src/users/utils/password';

describe('users', function () {
  let requestSender: RequestSender<paths, operations>;

  beforeAll(async function () {
    await initConfig(true);
  });

  beforeEach(async function () {
    const [app] = await getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
      ],
      useChild: true,
    });

    requestSender = await createRequestSender<paths, operations>('openapi3.yaml', app);
  });

  describe('Happy Path', function () {
    it('should return 200 when credentials are valid', async function () {
      const response = await requestSender.validateUser({ requestBody: validCredentials });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.OK);

      const body = response.body;
      expect(body.isValid).toBe(true);
      expect(body.message).toBe('User credentials are valid');
    });
    it('should generate a bcrypt hash and verify correctly', async function () {
      const testHash = await hashPassword('test');

      expect(typeof testHash).toBe('string');
      expect(testHash).not.toBe('test');
      expect(testHash.startsWith('$2b$')).toBe(true);

      const isValid = await verifyPassword('test', testHash);
      expect(isValid).toBe(true);
    });

    it('should generate different hashes for the same password', async function () {
      const hash1 = await hashPassword('test');
      const hash2 = await hashPassword('test');

      expect(hash1).not.toBe(hash2);

      expect(await verifyPassword('test', hash1)).toBe(true);
      expect(await verifyPassword('test', hash2)).toBe(true);
    });
  });

  describe('Bad Path', function () {
    it('should return 400 when credentials are missing', async function () {
      const payload: IAuthPayload = { username: '', password: '' };
      const response = await requestSender.validateUser({ requestBody: payload });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response.body).toEqual({
        isValid: false,
        message: 'Username and password are required',
        code: 'MISSING_CREDENTIALS',
      });
    });

    it('should return 401 when credentials are invalid', async function () {
      const payload: IAuthPayload = { username: invalidCredentials.username, password: invalidCredentials.password };
      const response = await requestSender.validateUser({ requestBody: payload });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.UNAUTHORIZED);

      const body = response.body;
      expect(body.isValid).toBe(false);
      expect(body.code).toBe('INVALID_CREDENTIALS');
      expect(body.message).toBe('Invalid username or password');
    });

    it('should return 500 when validation returns an unknown code', async function () {
      const spy = jest.spyOn(ValidationsManager.prototype, 'validateUser').mockResolvedValueOnce({
        isValid: false,
        message: 'Some unknown error',
        code: 'INTERNAL_ERROR',
      });

      const payload: IAuthPayload = { username: 'anyuser', password: 'anypass' };
      const response = await requestSender.validateUser({ requestBody: payload });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toEqual({
        isValid: false,
        message: 'Some unknown error',
        code: 'INTERNAL_ERROR',
      });

      spy.mockRestore();
    });
  });

  describe('Internal Errors', function () {
    it('should return 500 when validateUser throws an unexpected exception', async function () {
      const spy = jest.spyOn(ValidationsManager.prototype, 'validateUser').mockImplementation(() => {
        throw new Error('Simulated server error');
      });

      const payload: IAuthPayload = { username: validCredentials.username, password: validCredentials.password };
      const response = await requestSender.validateUser({ requestBody: payload });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toEqual({ isValid: false, message: 'Failed to validate user', code: 'INTERNAL_ERROR' });

      spy.mockRestore();
    });
  });
});
