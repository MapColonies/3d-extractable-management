import axios from 'axios';
import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import type { Tracer } from '@opentelemetry/api';
import { withSpanAsyncV4 } from '@map-colonies/telemetry';
import type { BBox } from 'geojson';
import { XMLParser } from 'fast-xml-parser';
import { StatusCodes } from 'http-status-codes';
import type { IConfig, LogContext } from '../../common/interfaces';
import { AppError } from '../../utils/appError';
import { SERVICES } from '../../common/constants';
import type { CSWResponse, CSWRecord } from './interfaces';
import { options, namespaceString, DEFAULT_MAX_RECORDS, DEFAULT_START_POSITION } from './cswHelpers';

@injectable()
export class CswClient {
  private readonly logContext: LogContext;
  private readonly cswUrl: string;
  private readonly cswToken: string;

  public constructor(
    @inject(SERVICES.CONFIG) private readonly config: IConfig,
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.TRACER) public readonly tracer: Tracer
  ) {
    this.logContext = { fileName: __filename, class: CswClient.name };
    this.cswUrl = this.config.get('externalServices.csw.url');
    this.cswToken = this.config.get('externalServices.csw.token');
  }

  @withSpanAsyncV4
  public async getAllRecords(
    bbox: BBox,
    sortOrder: 'DESC' | 'ASC',
    sortColumn: string,
    startPosition = DEFAULT_START_POSITION,
    maxRecords = DEFAULT_MAX_RECORDS
  ): Promise<CSWRecord[]> {
    const logContext = { ...this.logContext, function: this.getAllRecords.name };

    const aggregated: CSWRecord[] = [];
    let currentStart = startPosition;

    try {
      do {
        const res = await this.getRecords(bbox, sortOrder, sortColumn, currentStart, maxRecords);
        aggregated.push(...res.records);
        currentStart = res.nextRecord;
      } while (currentStart !== 0);
      return aggregated;
    } catch (err) {
      this.logger.error({ msg: 'pagination request to CSW catalog has failed', logContext, err });
      throw err;
    }
  }

  @withSpanAsyncV4
  private async getRecords(
    bbox: BBox,
    sortOrder: 'DESC' | 'ASC',
    sortColumn: string,
    startPosition: number,
    maxRecords?: number
  ): Promise<CSWResponse> {
    const logContext = { ...this.logContext, function: this.getRecords.name };
    const body = this.generateCswBody(bbox, sortOrder, sortColumn, startPosition, maxRecords);
    try {
      const res = await axios.post(this.cswUrl, body, {
        params: { token: this.cswToken == '' ? undefined : this.cswToken },
        headers: { 'Content-Type': 'text/xml' },
      });
      const parser = new XMLParser(options);
      /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
      const jsonObj = parser.parse(res.data as string);
      const result = jsonObj['csw:GetRecordsResponse']['csw:SearchResults'];
      if (result != undefined && Number(result.numberOfRecordsMatched) === 0) {
        return { nextRecord: 0, records: [] };
      }
      const records =
        result['mc:MC3DRecord'] === undefined
          ? []
          : // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
            result['mc:MC3DRecord'].map((record: { 'mc:productName': string; 'mc:productId': string }) => ({
              productName: record['mc:productName'],
              productId: record['mc:productId'],
            }));
      return {
        nextRecord: Number(result['nextRecord']),
        records,
      };
      /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    } catch (err) {
      this.logger.error({ msg: 'request to CSW catalog has failed', logContext, err });
      throw new AppError('CSW catalog throw and error', StatusCodes.INTERNAL_SERVER_ERROR, 'CSW_CATALOG_ERROR', false);
    }
  }

  private generateCswBody(bbox: BBox, sortOrder: 'DESC' | 'ASC', sortColumn: string, startPosition: number, maxRecords?: number): string {
    return `<csw:GetRecords xmlns="http://www.opengis.net/cat/csw/2.0.2" ${namespaceString} service="CSW" version="2.0.2" resultType="results" outputSchema="http://schema.mapcolonies.com/3d" startPosition="${startPosition}" ${
      maxRecords !== undefined ? `maxRecords="${maxRecords}"` : ''
    }>
      <csw:Query typeNames="csw:Record">
        <csw:ElementSetName>full</csw:ElementSetName>
        <csw:Constraint version="2.0.2">
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>mc:productType</ogc:PropertyName>
                <ogc:Literal>3DPhotoRealistic</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:Intersects>
                <ogc:PropertyName>ows:BoundingBox</ogc:PropertyName>
                <gml:Envelope>
                  <gml:lowerCorner>${bbox[1]} ${bbox[0]}</gml:lowerCorner>
                  <gml:upperCorner>${bbox[3]} ${bbox[2]}</gml:upperCorner>
                </gml:Envelope>
              </ogc:Intersects>
            </ogc:And>
          </ogc:Filter>
        </csw:Constraint>
        <ogc:SortBy>
          <ogc:SortProperty>
              <ogc:PropertyName>${sortColumn}</ogc:PropertyName>
              <ogc:SortOrder>${sortOrder}</ogc:SortOrder>
          </ogc:SortProperty>
        </ogc:SortBy>
      </csw:Query>
    </csw:GetRecords>`;
  }
}
