import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import config from 'config';
import httpStatusCodes from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { paths, operations } from '@openapi';
import { getApp } from '@src/app';
import { SERVICES, IAuthPayload } from '@common/constants';
import { ValidationsManager } from '@src/validations/models/validationsManager';
import { validCredentials, invalidCredentials } from '@src/common/mocks';
import { initConfig } from '@src/common/config';

jest.mock('config');

const mockedConfig = config as jest.Mocked<typeof config>;

describe('users', function () {
  let requestSender: RequestSender<paths, operations>;

  beforeAll(async function () {
    await initConfig(true);
  });

  beforeEach(async function () {
    mockedConfig.get.mockReturnValue([{ username: validCredentials.username, password: validCredentials.password }]);

    const [app] = await getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
      ],
      useChild: true,
    });

    requestSender = await createRequestSender<paths, operations>('openapi3.yaml', app);
  });

  afterEach(() => {
    jest.resetAllMocks();
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
    it('should return 401 when config users is empty', async function () {
      mockedConfig.get.mockReturnValueOnce([]);

      const response = await requestSender.validateUser({
        requestBody: validCredentials,
      });

      expect(response.status).toBe(httpStatusCodes.UNAUTHORIZED);
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 when config users is invalid', async function () {
      mockedConfig.get.mockReturnValueOnce({ foo: 'bar' } as unknown);

      const response = await requestSender.validateUser({
        requestBody: validCredentials,
      });

      expect(response.status).toBe(httpStatusCodes.UNAUTHORIZED);
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 when config.get throws', async function () {
      mockedConfig.get.mockImplementationOnce(() => {
        throw new Error('missing config');
      });

      const response = await requestSender.validateUser({
        requestBody: validCredentials,
      });

      expect(response.status).toBe(httpStatusCodes.UNAUTHORIZED);
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });
  });
});
