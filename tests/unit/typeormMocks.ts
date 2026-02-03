import { Repository, DeepPartial, SaveOptions, DeleteResult } from 'typeorm';
import { ExtractableRecord } from '@src/DAL/entities/extractableRecord.entity';
import { AuditLog } from '@src/DAL/entities/auditLog.entity';

/**
 * Generic helper for simple jest mocks like find/findOne/create
 */
function createSimpleMock<T extends (...args: unknown[]) => unknown>(fn?: T): jest.MockedFunction<T> {
  return (fn ?? jest.fn()) as jest.MockedFunction<T>;
}

// --------------------- ExtractableRecord Repository Mocks ---------------------
export const mockExtractableFind = createSimpleMock<() => Promise<ExtractableRecord[]>>();
export const mockExtractableFindOne = createSimpleMock<(criteria?: unknown) => Promise<ExtractableRecord | null>>();
export const mockExtractableCreate = createSimpleMock<Repository<ExtractableRecord>['create']>();

// save supports both single entity and array overloads
export const mockExtractableSave: jest.MockedFunction<
  <T extends DeepPartial<ExtractableRecord>>(entityOrEntities: T | T[], options?: SaveOptions) => Promise<T | T[]>
> = jest.fn();

// delete expects criteria or array of criteria
export const mockExtractableDelete: jest.MockedFunction<
  (criteria: string | number | Date | Record<string, unknown> | (string | number | Date | Record<string, unknown>)[]) => Promise<DeleteResult>
> = jest.fn();

// The mocked repository
export const mockExtractableRepo: Partial<Repository<ExtractableRecord>> = {
  find: mockExtractableFind,
  findOne: mockExtractableFindOne,
  create: mockExtractableCreate,
  save: mockExtractableSave,
  delete: mockExtractableDelete,
};

// --------------------- AuditLog Repository Mocks ---------------------
// save supports both single entity and array overloads
export const mockAuditSave: jest.MockedFunction<
  <T extends DeepPartial<AuditLog>>(entityOrEntities: T | T[], options?: SaveOptions) => Promise<T | T[]>
> = jest.fn();

export const mockAuditRepo: Partial<Repository<AuditLog>> = {
  save: mockAuditSave,
};

// --------------------- Reset all mocks ---------------------
export const resetRepoMocks = (): void => {
  jest.clearAllMocks();

  mockExtractableFind.mockReset();
  mockExtractableFindOne.mockReset();
  mockExtractableCreate.mockReset();
  mockExtractableSave.mockReset();
  mockExtractableDelete.mockReset();

  mockAuditSave.mockReset();
};
