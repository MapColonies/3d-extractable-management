import axios from 'axios';
import config from 'config';
import jsLogger from '@map-colonies/js-logger';
import { StatusCodes } from 'http-status-codes';
import { trace } from '@opentelemetry/api';
import { RecordStatus } from '@map-colonies/mc-model-types';
import { validCredentials } from '@tests/mocks/generalMocks';
import { Record3D } from '@src/externalServices/catalog/interfaces';
import { CatalogCall } from '@src/externalServices/catalog/catalogCall';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;
let catalog: CatalogCall;

describe('catalogCall tests', () => {
  const catalogUrl = `${config.get<string>('externalServices.catalog')}/metadata`;

  beforeEach(() => {
    catalog = new CatalogCall(config, jsLogger({ enabled: false }), trace.getTracer('testTracer'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findPublishedRecord Function', () => {
    it('returns false when no records exist', async () => {
      const recordName = validCredentials.recordName;

      mockedAxios.post.mockResolvedValueOnce({
        status: StatusCodes.OK,
        data: [],
      });

      const response = await catalog.findPublishedRecord(recordName);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedAxios.post).toHaveBeenCalledWith(`${catalogUrl}/find`, { productName: recordName });
      expect(response).toBe(false);
    });

    it('returns true when record exists and is published', async () => {
      const recordName = validCredentials.recordName;

      mockedAxios.post.mockResolvedValueOnce({
        status: StatusCodes.OK,
        data: [
          {
            productName: recordName,
            productStatus: RecordStatus.PUBLISHED,
          } as unknown as Record3D,
        ],
      });

      const response = await catalog.findPublishedRecord(recordName);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedAxios.post).toHaveBeenCalledWith(`${catalogUrl}/find`, { productName: recordName });
      expect(response).toBe(true);
    });

    it('returns false when record exists but not published', async () => {
      const recordName = validCredentials.recordName;

      mockedAxios.post.mockResolvedValueOnce({
        status: StatusCodes.OK,
        data: [
          {
            productName: recordName,
            productStatus: 'draft',
          } as unknown as Record3D,
        ],
      });

      await expect(catalog.findPublishedRecord(recordName)).resolves.toBe(false);
    });

    it('throws error on bad status', async () => {
      const recordName = validCredentials.recordName;

      mockedAxios.post.mockResolvedValueOnce({
        status: StatusCodes.BAD_REQUEST,
        data: [],
      });

      await expect(catalog.findPublishedRecord(recordName)).rejects.toThrow('Problem with catalog findPublishedRecord');
    });

    it('throws error if service is down', async () => {
      const recordName = validCredentials.recordName;

      mockedAxios.post.mockRejectedValueOnce(new Error('Service unavailable'));

      await expect(catalog.findPublishedRecord(recordName)).rejects.toThrow('Problem with catalog findPublishedRecord');
    });
  });
});
