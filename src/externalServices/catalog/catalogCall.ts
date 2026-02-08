import axios from 'axios';
import { inject, injectable } from 'tsyringe';
import type { Logger } from '@map-colonies/js-logger';
import { StatusCodes } from 'http-status-codes';
import type { Tracer } from '@opentelemetry/api';
import { withSpanAsyncV4 } from '@map-colonies/telemetry';
import { SERVICES } from '../../common/constants';
import { AppError } from '../../utils/appError';
import type { IConfig, LogContext } from '../../common/interfaces';
import type { Record3D, IFindRecordsPayload } from './interfaces';

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
  public async findRecord(recordName: string): Promise<boolean> {
    const logContext = { ...this.logContext, function: this.findRecord.name };
    this.logger.debug({ msg: `Searching for record '${recordName}' in catalog service`, logContext });

    try {
      const payload: IFindRecordsPayload = { productName: recordName };
      const response = await axios.post<Record3D[]>(`${this.catalog}/metadata/find`, payload);

      if (response.status === StatusCodes.OK.valueOf() && Array.isArray(response.data)) {
        if (response.data.length === 0) {
          this.logger.debug({ msg: `No record found for '${recordName}'`, logContext });
          return false;
        }

        this.logger.debug({ msg: `Record '${recordName}' found in catalog`, logContext });
        return true;
      }

      this.logger.error({ msg: `Catalog returned unexpected status: ${response.status}`, logContext, response });
      throw new AppError('catalog', StatusCodes.INTERNAL_SERVER_ERROR, 'Problem with catalog during record lookup', true);
    } catch (err) {
      this.logger.error({ msg: 'Error occurred during findRecord call', logContext, err });
      throw new AppError('catalog', StatusCodes.INTERNAL_SERVER_ERROR, 'Problem with catalog findRecord', true);
    }
  }
}
