import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { paths, operations } from '@openapi';
import { getApp } from '@src/app';
import { SERVICES, IAuthPayload, IValidateResponse } from '@common/constants';
import { ValidationsManager } from '@src/validations/models/validationsManager';
import { validCredentials, invalidCredentials } from '@src/common/mocks';
import { initConfig } from '@src/common/config';

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
      const response = await requestSender.validateUser({
        requestBody: validCredentials,
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.OK);

      const body = response.body as IValidateResponse;
      expect(body.isValid).toBe(true);
      expect(body.message).toBe('User credentials are valid');
    });
  });

  describe('Bad Path', function () {
    it('should return 400 when credentials are missing', async function () {
      const payload: IAuthPayload = {
        username: '',
        password: '',
      };

      const response = await requestSender.validateUser({
        requestBody: payload,
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response.body).toEqual({
        message: 'Username and password are required',
        code: 'MISSING_CREDENTIALS',
      });
    });

    it('should return 401 when credentials are invalid', async function () {
      const payload: IAuthPayload = {
        username: invalidCredentials.username,
        password: invalidCredentials.password,
      };

      const response = await requestSender.validateUser({
        requestBody: payload,
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.UNAUTHORIZED);

      const body = response.body as IValidateResponse;
      expect(body.isValid).toBe(false);
      expect(body.code).toBe('INVALID_CREDENTIALS');
      expect(body.message).toBe('Invalid username or password');
    });
  });

  describe('Internal Errors', function () {
    it('should return 500 when validate throws an unexpected error', async function () {
      const spy = jest.spyOn(ValidationsManager.prototype, 'validateUser').mockImplementation(() => {
        throw new Error('Simulated server error');
      });

      const payload: IAuthPayload = {
        username: validCredentials.username,
        password: validCredentials.password,
      };

      const response = await requestSender.validateUser({
        requestBody: payload,
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toEqual({ message: 'Failed to validate user', code: 'INTERNAL_ERROR' });

      spy.mockRestore();
    });
  });
});
