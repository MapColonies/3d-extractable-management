import config from 'config';
import httpStatusCodes from 'http-status-codes';
import { container as tsyringeContainer } from 'tsyringe';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { paths, operations } from '@openapi';
import { getApp } from '@src/app';
import { SERVICES, IAuthPayloadWithRecord } from '@common/constants';
import { RecordsManager } from '@src/records/models/recordsManager';
import { ValidationsManager } from '@src/validations/models/validationsManager';
import { invalidCredentials, recordInstance, validCredentials } from '@tests/mocks/generalMocks';
import { initConfig } from '@src/common/config';
import { ConnectionManager } from '@src/DAL/connectionManager';
import { getTestDbConfig } from '@tests/configurations/testConfig';

jest.mock('config');

const mockedConfig = config as jest.Mocked<typeof config>;

describe('records', function () {
  let requestSender: RequestSender<paths, operations>;

  beforeAll(async () => {
    await initConfig(true);

    const dbConfig = getTestDbConfig();

    mockedConfig.get.mockImplementation((key: string) => {
      if (key === 'db') {
        return dbConfig;
      }
      if (key === 'users') {
        return [{ username: validCredentials.username, password: validCredentials.password }];
      }
      return undefined;
    });

    console.log('✅ ConnectionManager DataSource initialized.');

    const [app] = await getApp({ useChild: false });

    requestSender = await createRequestSender('openapi3.yaml', app);
  });

  beforeEach(() => {
    const dbConfig = getTestDbConfig();

    mockedConfig.get.mockImplementation((key: string) => {
      if (key === 'db') {
        return dbConfig;
      }
      if (key === 'users') {
        return [{ username: validCredentials.username, password: validCredentials.password }];
      }
      return undefined;
    });
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
    it('should return 201 when record_name is valid', async function () {
      const response = await requestSender.createRecord({
        pathParams: { record_name: recordInstance.record_name },
        requestBody: {
          ...recordInstance,
          username: validCredentials.username,
          password: validCredentials.password,
        },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.CREATED);

      expect(response.body).toMatchObject({
        record_name: recordInstance.record_name,
        authorized_by: recordInstance.authorized_by,
        data: recordInstance.data,
        authorized_at: expect.any(String),
      });
    });

    it('should return 200 and the record', async function () {
      const response = await requestSender.getRecord({
        pathParams: { record_name: recordInstance.record_name },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.OK);

      expect(response.body).toMatchObject({
        record_name: recordInstance.record_name,
        authorized_by: recordInstance.authorized_by,
        data: recordInstance.data,
        authorized_at: expect.any(String),
      });
    });

    it('should return 200 and the available records', async function () {
      jest.spyOn(RecordsManager.prototype, 'getRecords').mockResolvedValueOnce([recordInstance]);
      const response = await requestSender.getRecords();

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.body).toEqual([recordInstance]);
    });

    it('should return 200 and empty array when no records exist', async function () {
      jest.spyOn(RecordsManager.prototype, 'getRecords').mockResolvedValueOnce([]);
      const response = await requestSender.getRecords();

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.body).toEqual([]);
    });

    it('should return 200 when credentials are valid', async function () {
      const payload: IAuthPayloadWithRecord = {
        username: validCredentials.username,
        password: validCredentials.password,
        record_name: recordInstance.record_name,
      };

      const response = await requestSender.validateDelete({
        requestBody: payload,
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.OK);

      const body = response.body;
      expect(body.isValid).toBe(true);
      expect(body.message).toBe('Record can be deleted');
    });

    it('should return 204 when record_name is valid and deleted successfully', async function () {
      const response = await requestSender.deleteRecord({
        pathParams: { record_name: recordInstance.record_name },
        requestBody: {
          ...recordInstance,
          username: validCredentials.username,
          password: validCredentials.password,
        },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.NO_CONTENT);
    });
  });

  describe('Bad Path', function () {
    beforeAll(async () => {
      await requestSender.createRecord({
        pathParams: { record_name: validCredentials.record_name },
        requestBody: {
          ...recordInstance,
          username: validCredentials.username,
          password: validCredentials.password,
        },
      });
    });
    it('should return 404 when record_name is invalid', async function () {
      const response = await requestSender.createRecord({
        pathParams: { record_name: validCredentials.record_name },
        requestBody: {
          ...recordInstance,
          username: validCredentials.username,
          password: validCredentials.password,
        },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
    });

    it('should return 404 when createRecord throws "Record not found"', async () => {
      const response = await requestSender.createRecord({
        pathParams: { record_name: validCredentials.record_name },
        requestBody: {
          username: validCredentials.username,
          password: validCredentials.password,
          authorized_by: recordInstance.authorized_by,
        },
      });

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({
        isValid: false,
        message: `Record 'rec_name' already exists`,
        code: 'INVALID_RECORD_NAME',
      });

      jest.restoreAllMocks();
    });

    it('should return 400 when credentials are missing in validateCreate', async () => {
      jest.spyOn(ValidationsManager.prototype, 'validateCreate').mockResolvedValueOnce({
        isValid: false,
        message: 'Missing credentials',
        code: 'MISSING_CREDENTIALS',
      });

      const response = await requestSender.validateCreate({
        requestBody: {
          username: '',
          password: '',
          record_name: validCredentials.record_name,
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
          record_name: invalidCredentials.record_name,
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
          record_name: invalidCredentials.record_name,
        },
      });

      expect(response.status).toBe(httpStatusCodes.UNAUTHORIZED);
    });

    it('should return 401 when validation fails with non-specific code', async () => {
      jest.spyOn(ValidationsManager.prototype, 'validateCreate').mockResolvedValueOnce({
        isValid: false,
        message: 'Unauthorized',
        code: 'INVALID_CREDENTIALS',
      });

      const response = await requestSender.createRecord({
        pathParams: { record_name: recordInstance.record_name },
        requestBody: {
          username: invalidCredentials.username,
          password: invalidCredentials.password,
          authorized_by: recordInstance.authorized_by,
        },
      });

      expect(response.status).toBe(httpStatusCodes.UNAUTHORIZED);
      expect(response.body).toEqual({
        isValid: false,
        message: 'Unauthorized',
        code: 'INVALID_CREDENTIALS',
      });

      jest.restoreAllMocks();
    });

    it('should return 400 when credentials are missing in validateDelete', async () => {
      jest.spyOn(ValidationsManager.prototype, 'validateDelete').mockResolvedValueOnce({
        isValid: false,
        message: 'Missing credentials',
        code: 'MISSING_CREDENTIALS',
      });

      const response = await requestSender.validateDelete({
        requestBody: {
          username: '',
          password: '',
          record_name: validCredentials.record_name,
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

    it('should return 400 when validation fails with MISSING_CREDENTIALS (createRecord)', async () => {
      jest.spyOn(ValidationsManager.prototype, 'validateCreate').mockResolvedValueOnce({
        isValid: false,
        message: 'Missing credentials',
        code: 'MISSING_CREDENTIALS',
      });

      const response = await requestSender.createRecord({
        pathParams: { record_name: recordInstance.record_name },
        requestBody: {
          username: invalidCredentials.username,
          password: invalidCredentials.password,
          authorized_by: recordInstance.authorized_by,
          data: recordInstance.data,
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

    it('should return 400 when validation fails with MISSING_CREDENTIALS (deleteRecord)', async () => {
      jest.spyOn(ValidationsManager.prototype, 'validateDelete').mockResolvedValueOnce({
        isValid: false,
        message: 'Missing credentials',
        code: 'MISSING_CREDENTIALS',
      });

      const response = await requestSender.deleteRecord({
        pathParams: { record_name: recordInstance.record_name },
        requestBody: {
          username: invalidCredentials.username,
          password: invalidCredentials.password,
          authorized_by: recordInstance.authorized_by,
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
          record_name: invalidCredentials.record_name,
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
          record_name: invalidCredentials.record_name,
        },
      });

      expect(response.status).toBe(httpStatusCodes.UNAUTHORIZED);
    });

    it('should return 401 when delete validation fails with INVALID_CREDENTIALS', async () => {
      jest.spyOn(ValidationsManager.prototype, 'validateDelete').mockResolvedValueOnce({
        isValid: false,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });

      const response = await requestSender.deleteRecord({
        pathParams: { record_name: recordInstance.record_name },
        requestBody: {
          username: invalidCredentials.username,
          password: invalidCredentials.password,
          authorized_by: recordInstance.authorized_by,
        },
      });

      expect(response.status).toBe(httpStatusCodes.UNAUTHORIZED);
      expect(response.body).toEqual({
        isValid: false,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });

      jest.restoreAllMocks();
    });

    it('should return 404 for non-existent record', async function () {
      const response = await requestSender.getRecord({
        pathParams: { record_name: 'rec_nonexistent' },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
    });

    it('should return 404 when validateCreate returns INVALID_RECORD_NAME', async () => {
      jest.spyOn(ValidationsManager.prototype, 'validateCreate').mockResolvedValueOnce({
        isValid: false,
        message: 'Record does not exist',
        code: 'INVALID_RECORD_NAME',
      });

      const response = await requestSender.validateCreate({
        requestBody: {
          username: invalidCredentials.username,
          password: invalidCredentials.password,
          record_name: 'nonexistent-record',
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
      jest.spyOn(ValidationsManager.prototype, 'validateDelete').mockResolvedValueOnce({
        isValid: false,
        message: 'Record does not exist',
        code: 'INVALID_RECORD_NAME',
      });

      const response = await requestSender.validateDelete({
        requestBody: {
          username: invalidCredentials.username,
          password: invalidCredentials.password,
          record_name: 'nonexistent-record',
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
    afterEach(function () {
      jest.clearAllMocks();
      jest.resetAllMocks();
      jest.restoreAllMocks();
    });

    it('should return 500 if getRecords throws an unexpected error', async function () {
      jest.spyOn(RecordsManager.prototype, 'getRecords').mockImplementation(() => {
        throw new Error('Simulated server error');
      });

      const response = await requestSender.getRecords();

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toEqual({ isValid: false, message: 'Failed to get records', code: 'INTERNAL_ERROR' });
    });

    it('should return 500 if getRecord throws an unexpected error', async function () {
      jest.spyOn(RecordsManager.prototype, 'getRecord').mockImplementation(() => {
        throw new Error('Simulated server error');
      });

      const response = await requestSender.getRecord({
        pathParams: { record_name: validCredentials.record_name },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toEqual({ isValid: false, message: 'Failed to get record', code: 'INTERNAL_ERROR' });
    });

    it('should return 500 if createRecord throws an unexpected error', async function () {
      jest.spyOn(ValidationsManager.prototype, 'validateCreate').mockResolvedValueOnce({
        isValid: true,
        message: 'Record can be created',
        code: 'SUCCESS',
      });

      jest.spyOn(RecordsManager.prototype, 'createRecord').mockImplementation(() => {
        throw new Error('Simulated server error');
      });

      const response = await requestSender.createRecord({
        pathParams: { record_name: recordInstance.record_name },
        requestBody: {
          username: validCredentials.username,
          password: validCredentials.password,
          authorized_by: recordInstance.authorized_by,
        },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toEqual({ isValid: false, message: 'Failed to create record', code: 'INTERNAL_ERROR' });
    });

    it('should return 500 if validateCreate throws an unexpected error', async function () {
      jest.spyOn(ValidationsManager.prototype, 'validateCreate').mockImplementation(() => {
        throw new Error('Simulated server error');
      });

      const response = await requestSender.validateCreate({
        requestBody: {
          username: validCredentials.username,
          password: 'any-password',
          record_name: validCredentials.record_name,
        },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toEqual({ isValid: false, message: 'Failed to validate record', code: 'INTERNAL_ERROR' });
    });

    it('should return 500 if validateDelete throws an unexpected error', async function () {
      jest.spyOn(ValidationsManager.prototype, 'validateDelete').mockImplementation(() => {
        throw new Error('Simulated server error');
      });

      const response = await requestSender.validateDelete({
        requestBody: {
          username: validCredentials.username,
          password: 'any-password',
          record_name: validCredentials.record_name,
        },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toEqual({ isValid: false, message: 'Failed to validate record', code: 'INTERNAL_ERROR' });
    });

    it('should return 500 for validateDelete when validation fails without error code', async function () {
      jest.spyOn(ValidationsManager.prototype, 'validateDelete').mockResolvedValueOnce({
        isValid: false,
        message: 'Validation failed',
        code: 'SUCCESS',
      });

      const response = await requestSender.validateDelete({
        requestBody: {
          ...validCredentials,
          record_name: validCredentials.record_name,
        },
      });

      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toMatchObject({
        isValid: false,
        message: 'Validation failed',
      });
    });

    it('should return 500 for validateCreate with unknown error type', async () => {
      jest.spyOn(ValidationsManager.prototype, 'validateCreate').mockImplementation(() => {
        throw new Error('non-error object');
      });

      const response = await requestSender.validateCreate({
        requestBody: {
          username: 'any-username',
          password: 'any-password',
          record_name: 'any-record_name',
        },
      });

      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toEqual({ isValid: false, message: 'Failed to validate record', code: 'INTERNAL_ERROR' });
    });

    it('should return 500 for validateDelete with unknown error type', async () => {
      jest.spyOn(ValidationsManager.prototype, 'validateDelete').mockImplementation(() => {
        throw new Error('not an Error instance');
      });

      const response = await requestSender.validateDelete({
        requestBody: {
          ...recordInstance,
          username: validCredentials.username,
          password: validCredentials.password,
        },
      });

      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toEqual({ isValid: false, message: 'Failed to validate record', code: 'INTERNAL_ERROR' });
    });
  });

  it('should return 500 if deleteRecord throws an unexpected error', async function () {
    jest.spyOn(RecordsManager.prototype, 'deleteRecord').mockImplementation(() => {
      throw new Error('Simulated server error');
    });

    const response = await requestSender.deleteRecord({
      pathParams: { record_name: recordInstance.record_name },
      requestBody: {
        ...recordInstance,
        username: validCredentials.username,
        password: validCredentials.password,
        authorized_by: recordInstance.authorized_by,
      },
    });

    expect(response).toSatisfyApiSpec();
    expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
    expect(response.body).toEqual({ isValid: false, message: 'Failed to delete record', code: 'INTERNAL_ERROR' });
  });

  it('should return 500 for deleteRecord when thrown error is not an instance of Error', async () => {
    jest.spyOn(RecordsManager.prototype, 'deleteRecord').mockImplementation(() => {
      throw { weird: 'object' } as unknown as Error;
    });

    const response = await requestSender.deleteRecord({
      pathParams: { record_name: recordInstance.record_name },
      requestBody: {
        ...recordInstance,
        username: validCredentials.username,
        password: validCredentials.password,
        authorized_by: recordInstance.authorized_by,
      },
    });

    expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
    expect(response.body).toEqual({ isValid: false, message: 'Failed to delete record', code: 'INTERNAL_ERROR' });
  });

  it('should return 500 for deleteRecord with unknown error type', async function () {
    jest.spyOn(RecordsManager.prototype, 'deleteRecord').mockImplementation(() => {
      throw new Error('not-an-error');
    });

    const response = await requestSender.deleteRecord({
      pathParams: { record_name: recordInstance.record_name },
      requestBody: {
        ...recordInstance,
        username: validCredentials.username,
        password: validCredentials.password,
        authorized_by: recordInstance.authorized_by,
      },
    });

    expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
    expect(response.body).toEqual({ isValid: false, message: 'Failed to delete record', code: 'INTERNAL_ERROR' });
  });

  it('should return 500 for validateDelete when INTERNAL_ERROR is returned', async function () {
    jest.spyOn(ValidationsManager.prototype, 'validateDelete').mockResolvedValueOnce({
      isValid: false,
      code: 'INTERNAL_ERROR',
      message: 'Failed to delete record',
    });

    const response = await requestSender.validateDelete({
      requestBody: {
        ...validCredentials,
        record_name: validCredentials.record_name,
      },
    });

    expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
    expect(response.body).toMatchObject({
      isValid: false,
      code: 'INTERNAL_ERROR',
      message: 'Failed to delete record',
    });
  });

  it('should return 500 for validateDelete with unknown validation code', async function () {
    jest.spyOn(ValidationsManager.prototype, 'validateDelete').mockReturnValue({
      isValid: false,
      code: 'UNKNOWN_CODE',
      message: 'Unknown error',
    } as never);

    const response = await requestSender.validateDelete({
      requestBody: {
        ...validCredentials,
        record_name: validCredentials.record_name,
      },
    });

    expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
  });
});
