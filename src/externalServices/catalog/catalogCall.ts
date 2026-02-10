import axios from 'axios';
import { inject, injectable } from 'tsyringe';
import type { Logger } from '@map-colonies/js-logger';
import { RecordStatus } from '@map-colonies/mc-model-types';
import { StatusCodes } from 'http-status-codes';
import type { Tracer } from '@opentelemetry/api';
import { withSpanAsyncV4 } from '@map-colonies/telemetry';
import { SERVICES } from '../../common/constants';
import { AppError } from '../../utils/appError';
import type { IConfig, LogContext } from '../../common/interfaces';
import type { Record3D, IFindPublishedRecordsPayload } from './interfaces';

@injectable()
export class CatalogCall {
  private readonly logContext: LogContext;
  private readonly catalog: string;

  public constructor(
    @inject(SERVICES.CONFIG) private readonly config: IConfig,
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.TRACER) public readonly tracer: Tracer
  ) {
    this.catalog = this.config.get<string>('externalServices.catalog');
    this.logContext = { fileName: __filename, class: CatalogCall.name };
  }

  @withSpanAsyncV4
  public async findPublishedRecord(recordName: string): Promise<boolean> {
    const logContext = { ...this.logContext, function: this.findPublishedRecord.name };
    this.logger.debug({ msg: `Searching for record '${recordName}' in catalog service`, logContext });

    try {
      const payload: IFindPublishedRecordsPayload = { productName: recordName };
      const response = await axios.post<Record3D[]>(`${this.catalog}/metadata/find`, payload);

      if (response.status !== StatusCodes.OK.valueOf()) {
        this.logger.error({ msg: `Catalog returned unexpected status: ${response.status}`, logContext, response });
        throw new AppError('catalog', StatusCodes.INTERNAL_SERVER_ERROR, 'Problem with catalog during record lookup', true);
      }

      const records = response.data;
      if (!Array.isArray(records) || records.length === 0) {
        this.logger.debug({ msg: `No record found for '${recordName}'`, logContext });
        return false;
      }

      const isPublished = records.every((r) => r.productStatus?.toLowerCase() === RecordStatus.PUBLISHED);
      this.logger.debug({
        msg: isPublished ? `Record '${recordName}' found and published` : `Record '${recordName}' found but not published`,
        logContext,
      });

      return isPublished;
    } catch (err) {
      this.logger.error({ msg: 'Error occurred during findPublishedRecord call', logContext, err });
      throw new AppError('catalog', StatusCodes.INTERNAL_SERVER_ERROR, 'Problem with catalog findPublishedRecord', true);
    }
  }
}
