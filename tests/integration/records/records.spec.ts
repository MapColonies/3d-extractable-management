import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { paths, operations } from '@openapi';
import { getApp } from '@src/app';
import { SERVICES, IExtractableRecord, ICreateRecordPayload } from '@common/constants';
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
    it('should return 200 status code and the record', async function () {
      const response = await requestSender.getRecord({
        pathParams: { recordName: 'rec_3DModel_001' },
        headers: { 'X-Site-Id': '5001' },
      });

      expect(response.status).toBe(httpStatusCodes.OK);
      const record = response.body as IExtractableRecord;
      expect(record.id).toBe(101);
      expect(record.credentials).toBe('alice_admin');
      expect(record.data?.productType).toBe('3DPhotoRealistic');
    });

    it('should return 201 status code and create the record', async function () {
      const payload: ICreateRecordPayload = {
        credentials: 'alice_admin',
        extractable: true,
        data: {
          productType: '3DPhotoRealistic',
          resolution: '4K',
          source: 'drone_scan',
          fileSizeMB: 350,
        },
      };

      const response = await requestSender.createRecord({
        pathParams: { recordName: `rec_${Date.now()}` },
        headers: { 'X-Site-Id': '5001' },
        requestBody: payload,
      });

      expect(response.status).toBe(httpStatusCodes.CREATED);
      const record = response.body as IExtractableRecord;
      expect(record.credentials).toBe(payload.credentials);
      expect(record.data?.resolution).toBe('4K');
    });
  });

  describe('Bad Path', function () {
    it('should return 400 when payload is invalid', async function () {
      const invalidPayload = {} as unknown as ICreateRecordPayload;

      const response = await requestSender.createRecord({
        pathParams: { recordName: 'rec_invalid' },
        headers: { 'X-Site-Id': '5001' },
        requestBody: invalidPayload,
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });
  });

  describe('Sad Path', function () {
    it('should return 404 for non-existent record', async function () {
      const response = await requestSender.getRecord({
        pathParams: { recordName: 'rec_nonexistent' },
        headers: { 'X-Site-Id': '5001' },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
    });
  });
});
