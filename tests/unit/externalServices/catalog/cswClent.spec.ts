import axios from 'axios';
import config from 'config';
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import {
  expectedCSW0Results,
  expectedCSW1Result,
  expectedCSW4Results,
  expectedCSWPage1Result1,
  expectedCSWPage2Result1,
  generateBBox,
} from '@tests/mocks/cswMocks';
import { CswClient } from '../../../../src/externalServices/catalog/cswClient';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

let cswCatalog: CswClient;

describe('cswCatalog tests', () => {
  beforeEach(() => {
    cswCatalog = new CswClient(config, jsLogger({ enabled: false }), trace.getTracer('testTracer'));
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllRecords Function', () => {
    it('Returns 4 records for BBOX', async () => {
      const bbox = generateBBox();

      mockAxios.post.mockResolvedValueOnce({ data: expectedCSW4Results });
      const response = await cswCatalog.getAllRecords(bbox, 'ASC', 'mc:productName');

      expect(response).toEqual([
        { productName: 'a', productId: '32d542c1-b956-4579-91df-2a43b183d8b3' },
        { productName: 'b', productId: 'bcc9985f-50eb-4545-84ae-f668b5172681' },
        { productName: 'c', productId: '33333333-3333-3333-3333-333333333333' },
        { productName: 'd', productId: '47978ca9-232a-4be8-b2d1-b04f71dcafcf' },
      ]);
    });

    it('Returns 0 records for BBOX', async () => {
      const bbox = generateBBox();

      mockAxios.post.mockResolvedValueOnce({ data: expectedCSW0Results });
      const response = await cswCatalog.getAllRecords(bbox, 'ASC', 'mc:productName');

      expect(response).toEqual([]);
    });

    it('Returns 1 records for BBOX', async () => {
      const bbox = generateBBox();

      mockAxios.post.mockResolvedValueOnce({ data: expectedCSW1Result });
      const response = await cswCatalog.getAllRecords(bbox, 'ASC', 'mc:productName');

      expect(response).toEqual([{ productName: 'c', productId: '33333333-3333-3333-3333-333333333333' }]);
    });

    it('Returns 2 records for BBOX with pagination of 1', async () => {
      const bbox = generateBBox();

      mockAxios.post.mockResolvedValueOnce({ data: expectedCSWPage1Result1 });
      mockAxios.post.mockResolvedValueOnce({ data: expectedCSWPage2Result1 });
      const response = await cswCatalog.getAllRecords(bbox, 'ASC', 'mc:productName', 1, 1);

      expect(response).toEqual([
        { productName: 'aaa', productId: 'alexccee-55ab-42c1-936b-e7fa81f518a3' },
        { productName: 'c', productId: '33333333-3333-3333-3333-333333333333' },
      ]);
    });

    it('rejects if CSW is not available', async () => {
      const bbox = generateBBox();

      mockAxios.post.mockRejectedValueOnce(new Error('catalog is not available'));
      const response = cswCatalog.getAllRecords(bbox, 'ASC', 'mc:productName');

      await expect(response).rejects.toThrow('CSW_CATALOG_ERROR');
    });
  });
});
