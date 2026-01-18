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
        pathParams: { recordName: recordInstance.record_name },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.OK);

      const record = response.body as IExtractableRecord;
      expect(record.id).toBe(recordInstance.id);
      expect(record.username).toBe(recordInstance.username);
      expect(record.data?.productType).toBe(recordInstance.data?.productType);
    });

    it('should return 200 and the available records', async function () {
      jest.spyOn(RecordsManager.prototype, 'getRecords').mockReturnValueOnce([recordInstance]);
      const response = await requestSender.getRecords();

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.body).toEqual([recordInstance]);
    });

    it('should return 200 and empty array when no records exist', async function () {
      jest.spyOn(RecordsManager.prototype, 'getRecords').mockReturnValueOnce(undefined);
      const response = await requestSender.getRecords();

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.body).toEqual([]);
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
    it('should return 500 if getRecords throws an unexpected error', async function () {
      const spy = jest.spyOn(RecordsManager.prototype, 'getRecords').mockImplementation(() => {
        throw new Error('Simulated server error');
      });

      const response = await requestSender.getRecords();

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toEqual({ message: 'Failed to get records' });

      spy.mockRestore();
    });

    it('should return 500 if getRecord throws an unexpected error', async function () {
      const spy = jest.spyOn(RecordsManager.prototype, 'getRecord').mockImplementation(() => {
        throw new Error('Simulated server error');
      });

      const response = await requestSender.getRecord({
        pathParams: { recordName: 'test-record' },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toEqual({ message: 'Failed to get record' });

      spy.mockRestore();
    });

    it('should return 500 if createRecord throws an unexpected error', async function () {
      const spy = jest.spyOn(RecordsManager.prototype, 'createRecord').mockImplementation(() => {
        throw new Error('Simulated server error');
      });

      const response = await requestSender.createRecord({
        pathParams: { recordName: 'test-record' },
        requestBody: {
          username: recordInstance.username,
          password: 'any-password',
        },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toEqual({ message: 'Failed to create record' });

      spy.mockRestore();
    });

    it('should return 500 if validateRecord throws an unexpected error', async function () {
      const spy = jest.spyOn(RecordsManager.prototype, 'validateRecord').mockImplementation(() => {
        throw new Error('Simulated server error');
      });

      const response = await requestSender.validateRecord({
        requestBody: {
          username: recordInstance.username,
          password: 'any-password',
        },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toEqual({ message: 'Failed to validate record' });

      spy.mockRestore();
    });
  });
});
