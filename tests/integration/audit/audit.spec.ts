import config from 'config';
import httpStatusCodes from 'http-status-codes';
import { container as tsyringeContainer } from 'tsyringe';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { paths, operations } from '@openapi';
import { getApp } from '@src/app';
import { SERVICES } from '@common/constants';
import { initConfig } from '@src/common/config';
import { ConnectionManager } from '@src/DAL/connectionManager';
import { getTestDbConfig } from '@tests/configurations/testConfig';
import { IAuditAction } from '@src/common/interfaces';
import { AuditManager } from '@src/audit_logs/models/auditManager';
import { validCredentials, recordInstance } from '@tests/mocks/generalMocks';

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
    it('should return 200 and the available audits', async function () {
      await requestSender.createRecord({
        pathParams: { record_name: validCredentials.record_name },
        requestBody: {
          ...recordInstance,
          username: validCredentials.username,
          password: validCredentials.password,
        },
      });

      const response = await requestSender.getAudit({
        pathParams: { record_name: recordInstance.record_name },
      });

      expect(response).toSatisfyApiSpec();
      expect(Array.isArray(response.body)).toBe(true);

      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            record_name: recordInstance.record_name,
            authorized_by: recordInstance.authorized_by,
            action: IAuditAction.CREATE,
          }),
        ])
      );
    });

    it('should return 200 and empty array when no audit logs by recordName found', async function () {
      jest.spyOn(AuditManager.prototype, 'getAuditLogs').mockResolvedValueOnce([]);
      const response = await requestSender.getAudit({
        pathParams: { record_name: validCredentials.record_name },
      });

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.body).toEqual([]);
    });
  });

  describe('Sad Path', function () {
    it('should return 500 if getAudit throws an unexpected error', async function () {
      jest.spyOn(AuditManager.prototype, 'getAuditLogs').mockImplementation(() => {
        throw new Error('Simulated server error');
      });

      const response = await requestSender.getAudit({
        pathParams: { record_name: validCredentials.record_name },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toEqual({ isValid: false, message: 'Failed to get audit logs', code: 'INTERNAL_ERROR' });
    });
  });
});
