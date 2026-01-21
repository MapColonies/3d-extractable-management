import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { paths, operations } from '@openapi';
import { getApp } from '@src/app';
import { SERVICES, IExtractableRecord, IAuthPayloadWithRecord, IValidateResponse } from '@common/constants';
import { RecordsManager } from '@src/records/models/recordsManager';
import { invalidCredentials, recordInstance, validCredentials } from '@src/common/mocks';
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
    it('should return 201 when recordName is valid', async function () {
      const response = await requestSender.createRecord({
        pathParams: { recordName: recordInstance.recordName },
        requestBody: {
          ...recordInstance,
          username: validCredentials.username,
          password: validCredentials.password,
          authorizedBy: recordInstance.authorizedBy,
          data: recordInstance.data,
        },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.CREATED);

      const record = response.body as IExtractableRecord;
      expect(record.recordName).toBe(recordInstance.recordName);
      expect(record.id).toBeDefined();
    });

    it('should return 200 and the record', async function () {
      const response = await requestSender.getRecord({
        pathParams: { recordName: recordInstance.recordName },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.OK);

      const record = response.body as IExtractableRecord;
      expect(record.id).toBe(recordInstance.id);
      expect(record.authorizedBy).toBe(recordInstance.authorizedBy);
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

    it('should return 200 when credentials are valid in order to post', async function () {
      const payload: IAuthPayloadWithRecord = {
        username: validCredentials.username,
        password: validCredentials.password,
        recordName: validCredentials.recordName,
      };

      const response = await requestSender.validateCreate({
        requestBody: payload,
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.OK);

      const body = response.body as IValidateResponse;
      expect(body.isValid).toBe(true);
      expect(body.message).toBe('Record can be created');
    });

    it('should return 200 when credentials are valid', async function () {
      const payload: IAuthPayloadWithRecord = {
        username: validCredentials.username,
        password: validCredentials.password,
        recordName: recordInstance.recordName,
      };

      const response = await requestSender.validateDelete({
        requestBody: payload,
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.OK);

      const body = response.body as IValidateResponse;
      expect(body.isValid).toBe(true);
      expect(body.message).toBe('Record can be deleted');
    });

    it('should return 204 when recordName is valid and deleted successfully', async function () {
      const response = await requestSender.deleteRecord({
        pathParams: { recordName: recordInstance.recordName },
        requestBody: {
          ...recordInstance,
          username: validCredentials.username,
          password: validCredentials.password,
          authorizedBy: recordInstance.authorizedBy,
        },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.NO_CONTENT);
    });
  });

  describe('Bad Path', function () {
    it('should return 404 when recordName is invalid', async function () {
      const response = await requestSender.createRecord({
        pathParams: { recordName: 'rec_invalid' },
        requestBody: {
          ...recordInstance,
          username: validCredentials.username,
          password: validCredentials.password,
          authorizedBy: recordInstance.authorizedBy,
          data: recordInstance.data,
        },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
    });

    it('should return 400 when credentials are missing in order to post', async function () {
      const response = await requestSender.validateCreate({
        requestBody: {} as IAuthPayloadWithRecord,
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('should return 400 when credentials are missing in validateCreate', async () => {
      jest.spyOn(RecordsManager.prototype, 'validate').mockReturnValueOnce({
        isValid: false,
        message: 'Missing credentials',
        code: 'MISSING_CREDENTIALS',
      });

      const response = await requestSender.validateCreate({
        requestBody: {
          username: '',
          password: '',
          recordName: validCredentials.recordName,
        },
      });

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response.body).toEqual({
        isValid: false,
        message: 'Missing credentials',
        code: 'MISSING_CREDENTIALS',
      });

      jest.restoreAllMocks();
    });

    it('should return 401 when credentials are invalid in order to post', async function () {
      const response = await requestSender.validateCreate({
        requestBody: {
          username: invalidCredentials.username,
          password: invalidCredentials.password,
          recordName: invalidCredentials.recordName,
        },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.UNAUTHORIZED);
    });

    it('should return 401 when credentials are invalid for validateCreate', async () => {
      const response = await requestSender.validateCreate({
        requestBody: {
          username: invalidCredentials.username,
          password: invalidCredentials.password,
          recordName: invalidCredentials.recordName,
        },
      });

      expect(response.status).toBe(httpStatusCodes.UNAUTHORIZED);
    });

    it('should return 400 when credentials are missing', async function () {
      const response = await requestSender.validateDelete({
        requestBody: null as unknown as IAuthPayloadWithRecord,
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('should return 400 when credentials are missing in validateDelete', async () => {
      jest.spyOn(RecordsManager.prototype, 'validate').mockReturnValueOnce({
        isValid: false,
        message: 'Missing credentials',
        code: 'MISSING_CREDENTIALS',
      });

      const response = await requestSender.validateDelete({
        requestBody: {
          username: '',
          password: '',
          recordName: validCredentials.recordName,
        },
      });

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response.body).toEqual({
        isValid: false,
        message: 'Missing credentials',
        code: 'MISSING_CREDENTIALS',
      });

      jest.restoreAllMocks();
    });

    it('should return 401 when credentials are invalid', async function () {
      const response = await requestSender.validateDelete({
        requestBody: {
          username: invalidCredentials.username,
          password: invalidCredentials.password,
          recordName: invalidCredentials.recordName,
        },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.UNAUTHORIZED);
    });
    it('should return 401 when credentials are invalid for validateDelete', async () => {
      const response = await requestSender.validateDelete({
        requestBody: {
          username: invalidCredentials.username,
          password: invalidCredentials.password,
          recordName: invalidCredentials.recordName,
        },
      });

      expect(response.status).toBe(httpStatusCodes.UNAUTHORIZED);
    });

    it('should return 404 when deleting a non-existing record', async function () {
      const response = await requestSender.deleteRecord({
        pathParams: { recordName: 'rec_invalid' },
        requestBody: {
          ...recordInstance,
          username: validCredentials.username,
          password: validCredentials.password,
          authorizedBy: recordInstance.authorizedBy,
        },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({
        isValid: false,
        message: 'Record not found',
        code: 'INVALID_RECORD_NAME',
      });
    });

    it('should return 404 for non-existent record', async function () {
      const response = await requestSender.getRecord({
        pathParams: { recordName: 'rec_nonexistent' },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
    });

    it('should return 404 when validateCreate returns INVALID_RECORD_NAME', async () => {
      jest.spyOn(RecordsManager.prototype, 'validate').mockReturnValueOnce({
        isValid: false,
        message: 'Record does not exist',
        code: 'INVALID_RECORD_NAME',
      });

      const response = await requestSender.validateCreate({
        requestBody: {
          username: 'any-user',
          password: 'any-password',
          recordName: 'nonexistent-record',
        },
      });

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({
        isValid: false,
        message: 'Record does not exist',
        code: 'INVALID_RECORD_NAME',
      });

      jest.restoreAllMocks();
    });

    it('should return 404 when validateDelete returns INVALID_RECORD_NAME', async () => {
      jest.spyOn(RecordsManager.prototype, 'validate').mockReturnValueOnce({
        isValid: false,
        message: 'Record does not exist',
        code: 'INVALID_RECORD_NAME',
      });

      const response = await requestSender.validateDelete({
        requestBody: {
          username: 'any-user',
          password: 'any-password',
          recordName: 'nonexistent-record',
        },
      });

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({
        isValid: false,
        message: 'Record does not exist',
        code: 'INVALID_RECORD_NAME',
      });

      jest.restoreAllMocks();
    });
  });

  describe('Sad Path', function () {
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
          ...recordInstance,
          username: validCredentials.username,
          password: validCredentials.password,
          authorizedBy: recordInstance.authorizedBy,
          data: recordInstance.data,
        },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toEqual({ message: 'Failed to create record' });

      spy.mockRestore();
    });

    it('should return 500 if validateCreate throws an unexpected error', async function () {
      const spy = jest.spyOn(RecordsManager.prototype, 'validate').mockImplementation(() => {
        throw new Error('Simulated server error');
      });

      const response = await requestSender.validateCreate({
        requestBody: {
          username: validCredentials.username,
          password: 'any-password',
          recordName: validCredentials.recordName,
        },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toEqual({ message: 'Failed to validate record' });

      spy.mockRestore();
    });

    it('should return 500 if validateDelete throws an unexpected error', async function () {
      const spy = jest.spyOn(RecordsManager.prototype, 'validate').mockImplementation(() => {
        throw new Error('Simulated server error');
      });

      const response = await requestSender.validateDelete({
        requestBody: {
          username: validCredentials.username,
          password: 'any-password',
          recordName: validCredentials.recordName,
        },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toEqual({ message: 'Failed to validate record' });

      spy.mockRestore();
    });

    it('should return 500 for createRecord with unknown error type', async () => {
      jest.spyOn(RecordsManager.prototype, 'createRecord').mockImplementation(() => {
        throw new Error('non-error object');
      });

      const response = await requestSender.createRecord({
        pathParams: { recordName: recordInstance.recordName },
        requestBody: {
          ...recordInstance,
          username: validCredentials.username,
          password: validCredentials.password,
          authorizedBy: recordInstance.authorizedBy,
          data: recordInstance.data,
        },
      });

      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toEqual({ message: 'Failed to create record' });

      jest.restoreAllMocks();
    });

    it('should return 500 for validateCreate with unknown error type', async () => {
      jest.spyOn(RecordsManager.prototype, 'validate').mockImplementation(() => {
        throw new Error('non-error object');
      });

      const response = await requestSender.validateCreate({
        requestBody: {
          username: 'any-username',
          password: 'any-password',
          recordName: 'any-recordName',
        },
      });

      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toEqual({ message: 'Failed to validate record' });

      jest.restoreAllMocks();
    });

    it('should return 500 for validateDelete with unknown error type', async () => {
      jest.spyOn(RecordsManager.prototype, 'validate').mockImplementation(() => {
        throw new Error('not an Error instance');
      });

      const response = await requestSender.validateDelete({
        requestBody: {
          username: 'any-username',
          password: 'any-password',
          recordName: 'any-recordName',
        },
      });

      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toEqual({ message: 'Failed to validate record' });

      jest.restoreAllMocks();
    });
  });

  it('should return 500 if deleteRecord throws an unexpected error', async function () {
    const spy = jest.spyOn(RecordsManager.prototype, 'deleteRecord').mockImplementation(() => {
      throw new Error('Simulated server error');
    });

    const response = await requestSender.deleteRecord({
      pathParams: { recordName: recordInstance.recordName },
      requestBody: {
        ...recordInstance,
        username: validCredentials.username,
        password: validCredentials.password,
        authorizedBy: recordInstance.authorizedBy,
      },
    });

    expect(response).toSatisfyApiSpec();
    expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
    expect(response.body).toEqual({ message: 'Failed to delete record' });

    spy.mockRestore();
  });

  it('should return 500 for createRecord when thrown error is not an instance of Error', async () => {
    jest.spyOn(RecordsManager.prototype, 'createRecord').mockImplementation(() => {
      throw { weird: 'object' } as unknown as Error;
    });

    const response = await requestSender.createRecord({
      pathParams: { recordName: recordInstance.recordName },
      requestBody: {
        ...recordInstance,
        username: validCredentials.username,
        password: validCredentials.password,
        authorizedBy: recordInstance.authorizedBy,
        data: recordInstance.data,
      },
    });

    expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
    expect(response.body).toEqual({ message: 'Failed to create record' });

    jest.restoreAllMocks();
  });

  it('should return 500 for deleteRecord with unknown error type', async function () {
    jest.spyOn(RecordsManager.prototype, 'deleteRecord').mockImplementation(() => {
      throw new Error('not-an-error');
    });

    const response = await requestSender.deleteRecord({
      pathParams: { recordName: recordInstance.recordName },
      requestBody: {
        ...recordInstance,
        username: validCredentials.username,
        password: validCredentials.password,
        authorizedBy: recordInstance.authorizedBy,
      },
    });

    expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
    expect(response.body).toEqual({ message: 'Failed to delete record' });

    jest.restoreAllMocks();
  });
});
