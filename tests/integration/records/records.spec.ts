import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { paths, operations } from '@openapi';
import { getApp } from '@src/app';
import { SERVICES, IExtractableRecord, IAuthPayload, IValidateResponse } from '@common/constants';
import { RecordsManager } from '@src/records/models/recordsManager';
import { recordInstance, credentialsInstance } from '@src/common/mocks';
import { initConfig } from '@src/common/config';

describe('records', function () {
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
    it('should return 200 and the record', async function () {
      const response = await requestSender.getRecord({
        pathParams: { recordName: 'rec_3DModel_001' },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.OK);

      const record = response.body as IExtractableRecord;
      expect(record.id).toBe(recordInstance.id);
      expect(record.username).toBe(recordInstance.username);
      expect(record.data?.productType).toBe(recordInstance.data?.productType);
    });

    it('should validate client', async function () {
      const validatePayload: IAuthPayload = {
        username: recordInstance.username,
        password: credentialsInstance.password,
      };

      const validateResponse = await requestSender.validateRecord({
        requestBody: validatePayload,
      });

      expect(validateResponse).toSatisfyApiSpec();
      expect(validateResponse.status).toBe(httpStatusCodes.OK);

      const validation = validateResponse.body as IValidateResponse;
      expect(validation.isValid).toBe(true);
      expect(validation.message).toBe('Record can be created or deleted');
    });
  });

  describe('Bad Path', function () {
    it('should return 400 when payload is invalid', async function () {
      const invalidPayload = {} as unknown as IAuthPayload;

      const response = await requestSender.createRecord({
        pathParams: { recordName: 'rec_invalid' },
        requestBody: invalidPayload,
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('should return 400 if payload is missing', async function () {
      const response = await requestSender.validateRecord({
        requestBody: null as unknown as IAuthPayload,
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('should return 400 if username or password is missing', async function () {
      const invalidPayload: IAuthPayload = { username: '', password: '' };
      const response = await requestSender.validateRecord({
        requestBody: invalidPayload,
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('should return 401 when credentials are invalid', async function () {
      const payload: IAuthPayload = {
        username: 'bad_user',
        password: 'wrong_password',
      };

      const response = await requestSender.validateRecord({
        requestBody: payload,
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.UNAUTHORIZED);
    });
  });

  describe('Sad Path', function () {
    it('should return 404 for non-existent record', async function () {
      const response = await requestSender.getRecord({
        pathParams: { recordName: 'rec_nonexistent' },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
    });
  });

  describe('Internal Errors', function () {
    const tests = [
      {
        name: 'createRecord',
        method: 'createRecord' as const,
        expectedMessage: 'Failed to create record',
        pathParams: { recordName: 'test-record' },
      },
      {
        name: 'getRecord',
        method: 'getRecord' as const,
        expectedMessage: 'Failed to get record',
        pathParams: { recordName: 'test-record' },
      },
      {
        name: 'validateRecord',
        method: 'validateRecord' as const,
        expectedMessage: 'Failed to validate record',
        pathParams: undefined,
      },
    ];

    tests.forEach(({ name, method, expectedMessage, pathParams }) => {
      it(`should return 500 if manager throws an unexpected error on ${name}`, async function () {
        const payload: IAuthPayload = {
          username: recordInstance.username,
          password: credentialsInstance.password,
        };

        const spy = jest.spyOn(RecordsManager.prototype, method).mockImplementation(() => {
          throw new Error('Simulated server error');
        });

        const requestOptions: any = { requestBody: payload };
        if (pathParams) {
          requestOptions.pathParams = pathParams;
        }

        const response = await requestSender[method as keyof typeof requestSender](requestOptions);

        expect(response).toSatisfyApiSpec();
        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toEqual({ message: expectedMessage });

        spy.mockRestore();
      });
    });
  });
});
