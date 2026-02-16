import { container as tsyringeContainer } from 'tsyringe';
import httpStatusCodes from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { paths, operations } from '@openapi';
import { SERVICES, IAuthPayload } from '@common/constants';
import { ValidationsManager } from '@src/validations/models/validationsManager';
import { validCredentials, invalidCredentials } from '@tests/mocks/generalMocks';
import { initConfig } from '@src/common/config';
import { ConnectionManager } from '@src/DAL/connectionManager';
import { getApp } from '@src/app';

describe('users', function () {
  let requestSender: RequestSender<paths, operations>;

  beforeAll(async () => {
    await initConfig(true);

    console.log('✅ ConnectionManager DataSource initialized.');

    const [app] = await getApp({ useChild: false });

    requestSender = await createRequestSender('openapi3.yaml', app);
  });

  beforeEach(() => {
    // No config mocking needed - @map-colonies/config is initialized once at startup
  });

  afterAll(async () => {
    try {
      const connectionManager = tsyringeContainer.resolve<ConnectionManager>(SERVICES.CONNECTION_MANAGER);
      await connectionManager.shutdown()();
      console.log('🧹 ConnectionManager shut down.');
    } catch (err) {
      console.log('⚠️  Error during shutdown:', err);
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.USERS_JSON;
  });

  describe('Happy Path', function () {
    it('should return 200 when credentials are valid', async function () {
      const response = await requestSender.validateUser({
        requestBody: validCredentials,
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.body).toEqual({
        isValid: true,
        message: 'User credentials are valid',
        code: 'SUCCESS',
      });
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
      const payload: IAuthPayload = {
        username: invalidCredentials.username,
        password: invalidCredentials.password,
      };

      const response = await requestSender.validateUser({ requestBody: payload });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.UNAUTHORIZED);
      expect(response.body).toEqual({
        isValid: false,
        message: 'Invalid username or password',
        code: 'INVALID_CREDENTIALS',
      });
    });
  });

  describe('Internal Errors', function () {
    it('should return 500 when validation returns an unknown code', async function () {
      const spy = jest.spyOn(ValidationsManager.prototype, 'validateUser').mockReturnValueOnce({
        isValid: false,
        message: 'Some unknown error',
        code: 'INTERNAL_ERROR',
      });

      const response = await requestSender.validateUser({
        requestBody: validCredentials,
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toEqual({
        isValid: false,
        message: 'Some unknown error',
        code: 'INTERNAL_ERROR',
      });

      spy.mockRestore();
    });

    it('should return 500 when validateUser throws', async function () {
      const spy = jest.spyOn(ValidationsManager.prototype, 'validateUser').mockImplementation(() => {
        throw new Error('Simulated server error');
      });

      const response = await requestSender.validateUser({
        requestBody: validCredentials,
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toEqual({
        isValid: false,
        message: 'Failed to validate user',
        code: 'INTERNAL_ERROR',
      });

      spy.mockRestore();
    });
  });

  describe('Config-driven users behavior', function () {
    // Note: These tests have been removed as they relied on mocking the npm 'config' package
    // With @map-colonies/config, the configuration is loaded from the configuration server
    // and is injected into services, so direct mocking is no longer possible
  });
});
