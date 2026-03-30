import axios from 'axios';
jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;
import config from 'config';
import jsLogger from '@map-colonies/js-logger';
import { faker } from '@faker-js/faker';
import { trace } from '@opentelemetry/api';
import { CswClient } from '../../../../src/externalServices/catalog/cswClient';
import { BBox } from 'geojson';

let cswCatalog: CswClient;

describe('cswCatalog tests', () => {
  const cswCatalogUrl = `${config.get<string>('externalServices.csw.url')}`;

  beforeEach(() => {
    cswCatalog = new CswClient(config, jsLogger({ enabled: false }), trace.getTracer('testTracer'));
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  function generateBBox(): BBox {
    const lat1 = faker.location.latitude();
    const lat2 = faker.location.latitude();
    const lng1 = faker.location.longitude();
    const lng2 = faker.location.longitude();

    return [
      Math.min(lng1, lng2), // minLongitude
      Math.min(lat1, lat2), // minLatitude
      Math.max(lng1, lng2), // maxLongitude
      Math.max(lat1, lat2), // maxLatitude
    ];
  }

  const expected_CSW_4_results = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- pycsw 2.7.dev0 -->
<csw:GetRecordsResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dct="http://purl.org/dc/terms/" xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:gml="http://www.opengis.net/gml" xmlns:ows="http://www.opengis.net/ows" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:mc="http://schema.mapcolonies.com/3d" version="2.0.2" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd">
    <csw:SearchStatus timestamp="2026-03-30T09:48:26Z"/>
    <csw:SearchResults numberOfRecordsMatched="4" numberOfRecordsReturned="4" nextRecord="0" recordSchema="http://schema.mapcolonies.com/3d" elementSet="full">
        <mc:MC3DRecord>
            <mc:productId>32d542c1-b956-4579-91df-2a43b183d8b3</mc:productId>
            <mc:productName>a</mc:productName>
        </mc:MC3DRecord>
        <mc:MC3DRecord>
            <mc:productId>bcc9985f-50eb-4545-84ae-f668b5172681</mc:productId>
            <mc:productName>b</mc:productName>
        </mc:MC3DRecord>
        <mc:MC3DRecord>
            <mc:productId>33333333-3333-3333-3333-333333333333</mc:productId>
            <mc:productName>c</mc:productName>
        </mc:MC3DRecord>
        <mc:MC3DRecord>
            <mc:productId>47978ca9-232a-4be8-b2d1-b04f71dcafcf</mc:productId>
            <mc:productName>d</mc:productName>
        </mc:MC3DRecord>
    </csw:SearchResults>
</csw:GetRecordsResponse>`;

  const expected_CSW_0_results = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- pycsw 2.7.dev0 -->
<csw:GetRecordsResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dct="http://purl.org/dc/terms/" xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:gml="http://www.opengis.net/gml" xmlns:ows="http://www.opengis.net/ows" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.0.2" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd">
    <csw:SearchStatus timestamp="2026-03-30T12:32:33Z"/>
    <csw:SearchResults numberOfRecordsMatched="0" numberOfRecordsReturned="0" nextRecord="0" recordSchema="http://schema.mapcolonies.com/3d" elementSet="full"/>
</csw:GetRecordsResponse>`;

  const expected_CSW_1_result = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- pycsw 2.7.dev0 -->
<csw:GetRecordsResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dct="http://purl.org/dc/terms/" xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:gml="http://www.opengis.net/gml" xmlns:ows="http://www.opengis.net/ows" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:mc="http://schema.mapcolonies.com/3d" version="2.0.2" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd">
    <csw:SearchStatus timestamp="2026-03-30T13:07:36Z"/>
    <csw:SearchResults numberOfRecordsMatched="1" numberOfRecordsReturned="1" nextRecord="0" recordSchema="http://schema.mapcolonies.com/3d" elementSet="full">
        <mc:MC3DRecord>
            <mc:productId>33333333-3333-3333-3333-333333333333</mc:productId>
            <mc:productName>c</mc:productName>
        </mc:MC3DRecord>
    </csw:SearchResults>
</csw:GetRecordsResponse>`;

  const expected_CSW_page_1_result_1 = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- pycsw 2.7.dev0 -->
<csw:GetRecordsResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dct="http://purl.org/dc/terms/" xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:gml="http://www.opengis.net/gml" xmlns:ows="http://www.opengis.net/ows" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:mc="http://schema.mapcolonies.com/3d" version="2.0.2" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd">
    <csw:SearchStatus timestamp="2026-03-30T13:34:18Z"/>
    <csw:SearchResults numberOfRecordsMatched="2" numberOfRecordsReturned="1" nextRecord="2" recordSchema="http://schema.mapcolonies.com/3d" elementSet="full">
        <mc:MC3DRecord>
            <mc:productId>alexccee-55ab-42c1-936b-e7fa81f518a3</mc:productId>
            <mc:productName>aaa</mc:productName>
        </mc:MC3DRecord>
    </csw:SearchResults>
</csw:GetRecordsResponse>`;
  const expected_CSW_page_2_result_1 = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- pycsw 2.7.dev0 -->
<csw:GetRecordsResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dct="http://purl.org/dc/terms/" xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:gml="http://www.opengis.net/gml" xmlns:ows="http://www.opengis.net/ows" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:mc="http://schema.mapcolonies.com/3d" version="2.0.2" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd">
    <csw:SearchStatus timestamp="2026-03-30T13:35:36Z"/>
    <csw:SearchResults numberOfRecordsMatched="2" numberOfRecordsReturned="1" nextRecord="0" recordSchema="http://schema.mapcolonies.com/3d" elementSet="full">
        <mc:MC3DRecord>
            <mc:productId>33333333-3333-3333-3333-333333333333</mc:productId>
            <mc:productName>c</mc:productName>
        </mc:MC3DRecord>
    </csw:SearchResults>
</csw:GetRecordsResponse>`;

  describe('getAllRecords Function', () => {
    it('Returns 4 records for BBOX', async () => {
      const bbox = generateBBox();

      mockAxios.post.mockResolvedValueOnce({ data: expected_CSW_4_results });
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

      mockAxios.post.mockResolvedValueOnce({ data: expected_CSW_0_results });
      const response = await cswCatalog.getAllRecords(bbox, 'ASC', 'mc:productName');

      expect(response).toEqual([]);
    });

    it('Returns 1 records for BBOX', async () => {
      const bbox = generateBBox();

      mockAxios.post.mockResolvedValueOnce({ data: expected_CSW_1_result });
      const response = await cswCatalog.getAllRecords(bbox, 'ASC', 'mc:productName');

      expect(response).toEqual([{ productName: 'c', productId: '33333333-3333-3333-3333-333333333333' }]);
    });

    it('Returns 2 records for BBOX with pagination of 1', async () => {
      const bbox = generateBBox();

      mockAxios.post.mockResolvedValueOnce({ data: expected_CSW_page_1_result_1 });
      mockAxios.post.mockResolvedValueOnce({ data: expected_CSW_page_2_result_1 });
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
