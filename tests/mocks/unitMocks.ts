/* eslint-disable @typescript-eslint/naming-convention */
import { Repository, DeepPartial, FindOptionsWhere, SaveOptions, DeleteResult } from 'typeorm';
import { ExtractableRecord } from '@src/DAL/entities/extractableRecord.entity';
import { AuditLog } from '@src/DAL/entities/auditLog.entity';

const mockExtractableFind: jest.MockedFunction<() => Promise<ExtractableRecord[]>> = jest.fn();

const mockExtractableFindOne: jest.MockedFunction<(criteria?: unknown) => Promise<ExtractableRecord | null>> = jest.fn();

const mockExtractableCreateImpl = (
  entityLike?: DeepPartial<ExtractableRecord> | DeepPartial<ExtractableRecord>[]
): ExtractableRecord | ExtractableRecord[] => {
  if (Array.isArray(entityLike)) {
    return entityLike.map((e) => ({
      record_name: e.record_name ?? 'mock',
      username: e.username ?? 'mock',
      authorized_by: e.authorized_by ?? 'mock',
      authorized_at: e.authorized_at ?? new Date(),
    })) as ExtractableRecord[];
  }

  if (entityLike) {
    return {
      record_name: entityLike.record_name ?? 'mock',
      username: entityLike.username ?? 'mock',
      authorized_by: entityLike.authorized_by ?? 'mock',
      authorized_at: entityLike.authorized_at ?? new Date(),
    } as ExtractableRecord;
  }

  return {
    record_name: 'mock',
    username: 'mock',
    authorized_by: 'mock',
    authorized_at: new Date(),
  } as ExtractableRecord;
};

const mockExtractableCreate = mockExtractableCreateImpl as unknown as Repository<ExtractableRecord>['create'];

const mockAuditFind: jest.MockedFunction<(criteria?: unknown) => Promise<AuditLog[]>> = jest.fn();

const mockExtractableSave: jest.MockedFunction<
  <T extends DeepPartial<ExtractableRecord>>(entityOrEntities: T | T[], options?: SaveOptions) => Promise<T | T[]>
> = jest.fn();

const mockExtractableDelete: jest.MockedFunction<
  (criteria: string | number | Date | FindOptionsWhere<ExtractableRecord> | FindOptionsWhere<ExtractableRecord>[] | object) => Promise<DeleteResult>
> = jest.fn();

const mockExtractableRepoInternal: Partial<Repository<ExtractableRecord>> = {
  find: mockExtractableFind,
  findOne: mockExtractableFindOne,
  create: mockExtractableCreate,
  save: mockExtractableSave,
  delete: mockExtractableDelete,
};

const mockAuditSave: jest.MockedFunction<<T extends DeepPartial<AuditLog>>(entityOrEntities: T | T[], options?: SaveOptions) => Promise<T | T[]>> =
  jest.fn();

const mockAuditCreateImpl = (entityLike?: DeepPartial<AuditLog> | DeepPartial<AuditLog>[]): AuditLog | AuditLog[] => {
  if (Array.isArray(entityLike)) {
    return entityLike.map((e) => ({
      id: e.id ?? 1,
      record_name: e.record_name ?? 'mock',
      username: e.username ?? 'mock',
      authorized_by: e.authorized_by ?? 'mock',
      authorized_at: e.authorized_at ?? new Date(),
    })) as AuditLog[];
  }

  if (entityLike) {
    return {
      id: entityLike.id ?? 1,
      record_name: entityLike.record_name ?? 'mock',
      username: entityLike.username ?? 'mock',
      authorized_by: entityLike.authorized_by ?? 'mock',
      authorized_at: entityLike.authorized_at ?? new Date(),
    } as AuditLog;
  }

  return {
    id: 1,
    record_name: 'mock',
    username: 'mock',
    authorized_by: 'mock',
    authorized_at: new Date(),
  } as AuditLog;
};

const mockAuditCreate = mockAuditCreateImpl as unknown as Repository<AuditLog>['create'];

const mockAuditRepoInternal: Partial<Repository<AuditLog>> = {
  find: mockAuditFind,
  save: mockAuditSave,
  create: mockAuditCreate,
};

const resetRepoMocks = (): void => {
  jest.clearAllMocks();

  mockExtractableFind.mockReset();
  mockExtractableFindOne.mockReset();
  mockExtractableSave.mockReset();
  mockExtractableDelete.mockReset();

  mockAuditSave.mockReset();
  mockAuditFind.mockReset();
};

export { mockExtractableFind, mockExtractableFindOne, mockExtractableCreate, mockExtractableSave, mockExtractableDelete };
export { mockExtractableRepoInternal as mockExtractableRepo };
export { mockAuditSave, mockAuditCreate };
export { mockAuditFind };
export { mockAuditRepoInternal as mockAuditRepo };
export { resetRepoMocks };

export const mockCatalogCall = {
  findPublishedRecord: jest.fn<Promise<boolean>, [string]>().mockResolvedValue(true),
};
