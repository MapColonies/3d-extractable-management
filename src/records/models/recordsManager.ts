import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { Repository, EntityManager } from 'typeorm';
import { BBox } from 'geojson';
import { bbox, circle, isNumber, point } from '@turf/turf';
import { StatusCodes } from 'http-status-codes';
import type { Tracer } from '@opentelemetry/api';
import { withSpanAsyncV4 } from '@map-colonies/telemetry';
import { SERVICES, IExtractableRecord, MAX_DISTANCE } from '@common/constants';
import { LogContext, IAuditAction, IPaginationResponse } from '@common/interfaces';
import { AuditLog } from '@src/DAL/entities/auditLog.entity';
import { ExtractableRecord } from '@src/DAL/entities/extractableRecord.entity';
import { mapExtractableRecordToCamelCase } from '@src/utils/converter';
import { CswClient } from '@src/externalServices/catalog/cswClient';
import { AppError } from '@src/utils/appError';

@injectable()
export class RecordsManager {
  private readonly logContext: LogContext;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.TRACER) public readonly tracer: Tracer,
    @inject(SERVICES.EXTRACTABLE_RECORD_REPOSITORY) private readonly extractableRepo: Repository<ExtractableRecord>,
    @inject(CswClient) private readonly cswClient: CswClient
  ) {
    this.logContext = { fileName: __filename, class: RecordsManager.name };
  }

  @withSpanAsyncV4
  public async getRecords(startPosition: number, maxRecords: number): Promise<IPaginationResponse<IExtractableRecord>> {
    const skip = startPosition - 1;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const [records, total] = await this.extractableRepo.findAndCount({ order: { authorized_at: 'DESC' }, skip, take: maxRecords });

    const mapped = records.map(mapExtractableRecordToCamelCase);

    const nextRecord = skip + mapped.length < total ? skip + mapped.length + 1 : 0;

    return { numberOfRecords: total, numberOfRecordsReturned: mapped.length, nextRecord, records: mapped };
  }

  @withSpanAsyncV4
  public async getRecord(recordName: string): Promise<IExtractableRecord | undefined> {
    const logContext = { ...this.logContext, function: this.getRecord.name };
    this.logger.debug({ msg: 'getting record', recordName, logContext });

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const record = await this.extractableRepo.findOne({ where: { record_name: recordName } });
    if (!record) return undefined;

    return mapExtractableRecordToCamelCase(record);
  }

  @withSpanAsyncV4
  public async createRecord(params: {
    recordName: string;
    username: string;
    authorizedBy: string;
    data?: Record<string, unknown>;
    remarks?: string;
  }): Promise<IExtractableRecord> {
    const logContext = { ...this.logContext, function: this.createRecord.name };
    const { recordName, username, authorizedBy, data, remarks } = params;

    this.logger.info({ msg: `starting to create extractable record '${recordName}'`, recordName, logContext });

    const savedRecord = await this.extractableRepo.manager.transaction(async (manager): Promise<IExtractableRecord> => {
      const { extractableRepo, auditRepo } = this.getTransactionalRepos(manager);

      const record = extractableRepo.create({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        record_name: recordName,
        username,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        authorized_by: authorizedBy,
        data,
        remarks,
      });

      const saved = await extractableRepo.save(record);

      await auditRepo.save(
        auditRepo.create({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          record_name: record.record_name,
          username: record.username,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          authorized_by: record.authorized_by,
          action: IAuditAction.CREATE,
          remarks: record.remarks,
        })
      );

      return mapExtractableRecordToCamelCase(saved);
    });

    this.logger.info({ msg: 'extractable record created', recordName, logContext });

    return savedRecord;
  }

  @withSpanAsyncV4
  public async deleteRecord(recordName: string, username: string, authorizedBy: string, deleteRecordRemarks?: string): Promise<boolean> {
    const logContext = { ...this.logContext, function: this.deleteRecord.name };
    this.logger.info({ msg: `starting to delete extractable record '${recordName}'`, recordName, logContext });

    const result = await this.extractableRepo.manager.transaction(async (manager) => {
      const { extractableRepo, auditRepo } = this.getTransactionalRepos(manager);

      // eslint-disable-next-line @typescript-eslint/naming-convention
      const record = await extractableRepo.findOne({ where: { record_name: recordName } });

      if (!record) {
        this.logger.warn({ msg: 'extractable record not found for delete', recordName, logContext });
        return false;
      }

      // eslint-disable-next-line @typescript-eslint/naming-convention
      await extractableRepo.delete({ record_name: recordName });

      await auditRepo.save(
        auditRepo.create({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          record_name: record.record_name,
          username: username,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          authorized_by: authorizedBy,
          action: IAuditAction.DELETE,
          remarks: deleteRecordRemarks,
        })
      );
      return true;
    });

    this.logger.info({ msg: `extractable record deleted`, recordName, logContext });
    return result;
  }

  @withSpanAsyncV4
  public async getRecordsByCoordinate(longitude: number, latitude: number, distanceMeters: number = 1): Promise<IExtractableRecord[]> {
    const logContext = { ...this.logContext, function: this.getRecordsByCoordinate.name };
    this.logger.debug({ msg: 'getting records by coordinate', longitude, latitude, distanceMeters, logContext });

    this.validatePointAndRadius(longitude, latitude, distanceMeters);
    distanceMeters = Math.min(distanceMeters, MAX_DISTANCE);

    const bbox = this.getPolygonByPointAndRadius([longitude, latitude], distanceMeters);
    const catalogRecords = await this.cswClient.getAllRecords(bbox, 'ASC', 'mc:productName');

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const recordsFromExtractable = await this.extractableRepo.find({ order: { record_name: 'ASC' } });
    const recordsUnion = recordsFromExtractable.filter((extractableRecord) => {
      const record = catalogRecords.find((recordFromcatalog) => recordFromcatalog.productName === extractableRecord.record_name);
      return !!record;
    });
    const response = recordsUnion.map(mapExtractableRecordToCamelCase);
    return response;
  }

  private validatePointAndRadius(longitude: number, latitude: number, distanceMeters: number): void {
    if (!isNumber(longitude) || !isNumber(latitude)) {
      throw new AppError('Invalid coordinates', StatusCodes.BAD_REQUEST, 'Invalid coordinates', false);
    }
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      throw new AppError('Coordinates out of range', StatusCodes.BAD_REQUEST, 'Coordinates Out Of Range', false);
    }

    if (!isNumber(distanceMeters) || distanceMeters < 1) {
      throw new AppError('Invalid distance', StatusCodes.BAD_REQUEST, 'Invalid Distance', false);
    }
  }

  private getPolygonByPointAndRadius(coordinates: [number, number], radiusInMeters = 1): BBox {
    const tPoint = point(coordinates);
    const circ = circle(tPoint, radiusInMeters, { units: 'meters' });
    const bb = bbox(circ) as [number, number, number, number];
    return bb;
  }

  private getTransactionalRepos(manager: EntityManager): {
    extractableRepo: Repository<ExtractableRecord>;
    auditRepo: Repository<AuditLog>;
  } {
    return {
      extractableRepo: manager.getRepository(ExtractableRecord),
      auditRepo: manager.getRepository(AuditLog),
    };
  }
}
