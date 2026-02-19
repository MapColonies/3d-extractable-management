import httpStatusCodes from 'http-status-codes';
import axios from 'axios';
import { container as tsyringeContainer } from 'tsyringe';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { paths, operations } from '@openapi';
import { getApp } from '@src/app';
import { SERVICES } from '@common/constants';
import { initConfig } from '@src/common/config';
import { ConnectionManager } from '@src/DAL/connectionManager';
import { IAuditAction } from '@src/common/interfaces';
import { AuditManager } from '@src/audit_logs/models/auditManager';
import { validCredentials, recordInstance } from '@tests/mocks/generalMocks';
import { getAxiosPostMockResponse } from '@tests/mocks/integrationMocks';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('@src/externalServices/catalog/catalogCall', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CatalogCall: jest.fn().mockImplementation(() => ({
    findPublishedRecord: jest.fn().mockResolvedValue(true),
  })),
}));

describe('records', function () {
  let requestSender: RequestSender<paths, operations>;

  beforeAll(async () => {
    mockedAxios.post.mockResolvedValue(getAxiosPostMockResponse());

    await initConfig(true);

    console.log('✅ ConnectionManager DataSource initialized.');

    const [app] = await getApp({ useChild: false });

    requestSender = await createRequestSender('openapi3.yaml', app);
  });

  afterAll(async () => {
    try {
      jest.restoreAllMocks();
      const connectionManager = tsyringeContainer.resolve<ConnectionManager>(SERVICES.CONNECTION_MANAGER);
      await connectionManager.shutdown()();
      console.log('🧹 ConnectionManager shut down.');
    } catch (err) {
      console.log('⚠️  Error during shutdown:', err);
    }
  });

  describe('Happy Path', function () {
    it('should return 200 and the available audits', async function () {
      await requestSender.createRecord({
        pathParams: { recordName: 'rec_test' },
        requestBody: {
          ...recordInstance,
          username: validCredentials.username,
          password: validCredentials.password,
        },
      });

      const response = await requestSender.getAudit({
        pathParams: { recordName: 'rec_test' },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.OK);
      const body = response.body as {
        numberOfRecords: number;
        numberOfRecordsReturned: number;
        nextRecord: number | null;
        records: { recordName: string; authorizedBy: string; action: string }[];
      };
      expect(body.numberOfRecords).toBeGreaterThan(0);
      expect(body.numberOfRecordsReturned).toBeGreaterThan(0);
      expect(Array.isArray(body.records)).toBe(true);
      expect(body.records).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            recordName: 'rec_test',
            authorizedBy: recordInstance.authorizedBy,
            action: IAuditAction.CREATE,
          }),
        ])
      );
    });

    it('should return 200 and empty records when no audit logs by recordName found', async function () {
      jest.spyOn(AuditManager.prototype, 'getAuditLogs').mockResolvedValueOnce({
        numberOfRecords: 0,
        numberOfRecordsReturned: 0,
        nextRecord: 0,
        records: [],
      });
      const response = await requestSender.getAudit({
        pathParams: { recordName: validCredentials.recordName },
      });

      expect(response.status).toBe(httpStatusCodes.OK);
      const body = response.body as { numberOfRecords: number; numberOfRecordsReturned: number; records: [] };
      expect(body.numberOfRecords).toBe(0);
      expect(body.numberOfRecordsReturned).toBe(0);
      expect(body.records).toEqual([]);
    });

    it('should return 200 with default pagination parameters when not provided', async function () {
      const dbAuditLog = {
        id: 1,
        recordName: 'rec_default_pagination',
        username: validCredentials.username,
        authorizedBy: recordInstance.authorizedBy,
        action: IAuditAction.CREATE,
        authorizedAt: new Date().toISOString(),
      };

      jest.spyOn(AuditManager.prototype, 'getAuditLogs').mockResolvedValueOnce({
        numberOfRecords: 5,
        numberOfRecordsReturned: 5,
        nextRecord: 0,
        records: [dbAuditLog],
      });

      const response = await requestSender.getAudit({
        pathParams: { recordName: 'rec_default_pagination' },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.OK);
      const body = response.body as {
        numberOfRecords: number;
        numberOfRecordsReturned: number;
        records: { recordName: string }[];
      };
      expect(body.numberOfRecords).toBe(5);
      expect(Array.isArray(body.records)).toBe(true);
    });

    it('should return 200 with pagination parameters', async function () {
      const dbAuditLog = {
        id: 1,
        recordName: 'rec_pagination_test',
        username: validCredentials.username,
        authorizedBy: recordInstance.authorizedBy,
        action: IAuditAction.CREATE,
        authorizedAt: new Date().toISOString(),
      };

      jest.spyOn(AuditManager.prototype, 'getAuditLogs').mockResolvedValueOnce({
        numberOfRecords: 50,
        numberOfRecordsReturned: 10,
        nextRecord: 11,
        records: [dbAuditLog],
      });

      const response = await requestSender.getAudit({
        pathParams: { recordName: 'rec_pagination_test' },
        queryParams: { startPosition: 1, maxRecords: 10 },
      });

      expect(response.status).toBe(httpStatusCodes.OK);
      const body = response.body as {
        numberOfRecords: number;
        numberOfRecordsReturned: number;
        nextRecord: number;
        records: { recordName: string }[];
      };
      expect(body.numberOfRecords).toBe(50);
      expect(body.numberOfRecordsReturned).toBe(10);
      expect(body.nextRecord).toBe(11);
      expect(Array.isArray(body.records)).toBe(true);
      const getAuditLogsSpy = jest.spyOn(AuditManager.prototype, 'getAuditLogs');
      expect(getAuditLogsSpy).toHaveBeenCalledWith('rec_pagination_test', 1, 10);
    });
  });

  describe('Bad Path - Validation Errors', function () {
    it('should return 400 if startPosition is invalid for getAudit', async function () {
      const response = await requestSender.getAudit({
        pathParams: { recordName: validCredentials.recordName },
        queryParams: { startPosition: -5 },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response.body).toEqual({ isValid: false, message: 'startPosition must be a positive integer', code: 'INVALID_START_POSITION' });
    });

    it('should return 200 and appropriate message from the openapi if maxRecords is invalid for getAudit', async function () {
      const response = await requestSender.getAudit({
        pathParams: { recordName: validCredentials.recordName },
        queryParams: { maxRecords: 0 },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.body).toEqual({
        message: 'request/query/maxRecords must be >= 1',
      });
    });
  });

  describe('Sad Path', function () {
    it('should return 500 if getAudit throws an unexpected error', async function () {
      jest.spyOn(AuditManager.prototype, 'getAuditLogs').mockImplementation(() => {
        throw new Error('Simulated server error');
      });

      const response = await requestSender.getAudit({
        pathParams: { recordName: validCredentials.recordName },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toEqual({ isValid: false, message: 'Failed to get audit logs', code: 'INTERNAL_ERROR' });
    });
  });
});
