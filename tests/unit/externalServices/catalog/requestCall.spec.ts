import axios from 'axios';
import config from 'config';
import jsLogger from '@map-colonies/js-logger';
import { StatusCodes } from 'http-status-codes';
import { trace } from '@opentelemetry/api';
import { validCredentials } from '@tests/mocks/generalMocks';
import { Record3D } from '@src/externalServices/catalog/interfaces';
import { CatalogCall } from '../../../../src/externalServices/catalog/catalogCall';

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

  describe('findRecord Function', () => {
    it('returns false when no records exist', async () => {
      const recordName = validCredentials.recordName;

      mockedAxios.post.mockResolvedValueOnce({
        status: StatusCodes.OK,
        data: [],
      });

      const response = await catalog.findRecord(recordName);

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
            productStatus: 'published',
          } as unknown as Record3D,
        ],
      });

      const response = await catalog.findRecord(recordName);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedAxios.post).toHaveBeenCalledWith(`${catalogUrl}/find`, { productName: recordName });
      expect(response).toBe(true);
    });

    it('throws error when record exists but not published', async () => {
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

      await expect(catalog.findRecord(recordName)).rejects.toThrow('Problem with catalog findRecord');
    });

    it('throws error on bad status', async () => {
      const recordName = validCredentials.recordName;

      mockedAxios.post.mockResolvedValueOnce({
        status: StatusCodes.BAD_REQUEST,
        data: [],
      });

      await expect(catalog.findRecord(recordName)).rejects.toThrow('Problem with catalog findRecord');
    });

    it('throws error if service is down', async () => {
      const recordName = validCredentials.recordName;

      mockedAxios.post.mockRejectedValueOnce(new Error('Service unavailable'));

      await expect(catalog.findRecord(recordName)).rejects.toThrow('Problem with catalog findRecord');
    });
  });
});
