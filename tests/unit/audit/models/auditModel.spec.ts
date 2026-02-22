/* eslint-disable @typescript-eslint/naming-convention */
import 'reflect-metadata';
import jsLogger from '@map-colonies/js-logger';
import { Repository, EntityManager } from 'typeorm';
import { AuditManager } from '@src/audit_logs/models/auditManager';
import { AuditLog } from '@src/DAL/entities/auditLog.entity';
import { invalidCredentials, recordInstance, validCredentials } from '@tests/mocks/generalMocks';
import { mockExtractableRepo, resetRepoMocks, mockAuditRepo, mockAuditFindAndCount } from '@tests/mocks/unitMocks';
import { IAuditAction } from '@src/common/interfaces';
import { mapAuditLogToCamelCase } from '@src/utils/converter';

let auditManager: AuditManager;

describe('RecordsManager & ValidationsManager', () => {
  beforeEach(() => {
    const auditRepo = mockAuditRepo as unknown as Repository<AuditLog>;

    const repoMap = new Map<unknown, unknown>([
      [AuditLog, mockExtractableRepo],
      [AuditLog, mockAuditRepo],
    ]);

    const fakeEntityManager: Pick<EntityManager, 'getRepository'> = {
      getRepository: <T extends object>(entity: new () => T): Repository<T> => {
        const repo = repoMap.get(entity);
        if (repo === undefined) {
          const entityName = 'name' in entity ? (entity as { name: string }).name : String(entity);
          throw new Error(`No mock defined for repository: ${entityName}`);
        }
        return repo as Repository<T>;
      },
    };

    type MockEntityManager = Pick<EntityManager, 'transaction' | 'getRepository'>;

    (auditRepo as unknown as { manager?: MockEntityManager }).manager = {
      transaction: jest.fn().mockImplementation(async <T>(runInTransaction: (manager: EntityManager) => Promise<T>) => {
        return runInTransaction(fakeEntityManager as EntityManager);
      }),
      getRepository: fakeEntityManager.getRepository,
    };

    auditManager = new AuditManager(jsLogger({ enabled: false }), auditRepo);
  });

  afterEach(() => {
    resetRepoMocks();
    jest.resetAllMocks();
  });

  describe('#getAuditLogs', () => {
    it('should return paginated audit logs by record name', async () => {
      const dbAuditLog: AuditLog = {
        id: 1,
        record_name: recordInstance.recordName,
        username: validCredentials.username,
        authorized_by: recordInstance.authorizedBy,
        action: IAuditAction.CREATE,
        authorized_at: new Date(),
      };

      mockAuditFindAndCount.mockResolvedValueOnce([[dbAuditLog], 1]);

      const result = await auditManager.getAuditLogs(dbAuditLog.record_name, 1, 10);

      expect(result).toEqual({
        numberOfRecords: 1,
        numberOfRecordsReturned: 1,
        nextRecord: 0,
        records: [mapAuditLogToCamelCase(dbAuditLog)],
      });
    });

    it('should return empty array when no audit logs found', async () => {
      mockAuditFindAndCount.mockResolvedValueOnce([[], 0]);

      const result = await auditManager.getAuditLogs(invalidCredentials.recordName, 1, 10);

      expect(result).toEqual({
        numberOfRecords: 0,
        numberOfRecordsReturned: 0,
        nextRecord: 0,
        records: [],
      });
    });

    it('should return nextRecord when more audit logs exist', async () => {
      const dbAuditLog: AuditLog = {
        id: 1,
        record_name: recordInstance.recordName,
        username: validCredentials.username,
        authorized_by: recordInstance.authorizedBy,
        action: IAuditAction.CREATE,
        authorized_at: new Date(),
      };

      mockAuditFindAndCount.mockResolvedValueOnce([[dbAuditLog], 25]);

      const result = await auditManager.getAuditLogs(recordInstance.recordName, 1, 10);

      expect(result).toEqual({
        numberOfRecords: 25,
        numberOfRecordsReturned: 1,
        nextRecord: 2,
        records: [mapAuditLogToCamelCase(dbAuditLog)],
      });
    });
  });
});
