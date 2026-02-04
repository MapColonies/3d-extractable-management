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
      recordName: e.recordName ?? 'mock',
      username: e.username ?? 'mock',
      authorizedBy: e.authorizedBy ?? 'mock',
      authorizedAt: e.authorizedAt ?? new Date(),
    })) as ExtractableRecord[];
  }

  if (entityLike) {
    return {
      recordName: entityLike.recordName ?? 'mock',
      username: entityLike.username ?? 'mock',
      authorizedBy: entityLike.authorizedBy ?? 'mock',
      authorizedAt: entityLike.authorizedAt ?? new Date(),
    } as ExtractableRecord;
  }

  return {
    recordName: 'mock',
    username: 'mock',
    authorizedBy: 'mock',
    authorizedAt: new Date(),
  } as ExtractableRecord;
};

const mockExtractableCreate = mockExtractableCreateImpl as unknown as Repository<ExtractableRecord>['create'];

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

// Mock create() - plain function
const mockAuditCreateImpl = (entityLike?: DeepPartial<AuditLog> | DeepPartial<AuditLog>[]): AuditLog | AuditLog[] => {
  if (Array.isArray(entityLike)) {
    return entityLike.map((e) => ({
      id: e.id ?? 1,
      recordName: e.recordName ?? 'mock',
      username: e.username ?? 'mock',
      authorizedBy: e.authorizedBy ?? 'mock',
      authorizedAt: e.authorizedAt ?? new Date(),
    })) as AuditLog[];
  }

  if (entityLike) {
    return {
      id: entityLike.id ?? 1,
      recordName: entityLike.recordName ?? 'mock',
      username: entityLike.username ?? 'mock',
      authorizedBy: entityLike.authorizedBy ?? 'mock',
      authorizedAt: entityLike.authorizedAt ?? new Date(),
    } as AuditLog;
  }

  return {
    id: 1,
    recordName: 'mock',
    username: 'mock',
    authorizedBy: 'mock',
    authorizedAt: new Date(),
  } as AuditLog;
};

const mockAuditCreate = mockAuditCreateImpl as unknown as Repository<AuditLog>['create'];

const mockAuditRepoInternal: Partial<Repository<AuditLog>> = {
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
};

export { mockExtractableFind, mockExtractableFindOne, mockExtractableCreate, mockExtractableSave, mockExtractableDelete };
export { mockExtractableRepoInternal as mockExtractableRepo };
export { mockAuditSave, mockAuditCreate };
export { mockAuditRepoInternal as mockAuditRepo };
export { resetRepoMocks };
