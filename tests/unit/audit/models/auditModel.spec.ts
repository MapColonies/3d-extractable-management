import 'reflect-metadata';
import config from 'config';
import jsLogger from '@map-colonies/js-logger';
import { Repository, DeleteResult, EntityManager } from 'typeorm';
import { AuditManager } from '@src/audit_logs/models/auditManager';
import { ValidationsManager } from '@src/validations/models/validationsManager';
import { AuditLog } from '@src/DAL/entities/auditLog.entity';
import { invalidCredentials, recordInstance, validCredentials } from '@tests/mocks/generalMocks';
import { mockExtractableRepo, mockAuditFind, resetRepoMocks, mockAuditRepo } from '@tests/mocks/unitMocks';
import { IAuditAction } from '@src/common/interfaces';

IAuditAction;
jest.mock('config');
const mockedConfig = config as jest.Mocked<typeof config>;

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

    mockedConfig.get.mockReturnValue([{ username: validCredentials.username, password: validCredentials.password }]);

    auditManager = new AuditManager(jsLogger({ enabled: false }), auditRepo);
  });

  afterEach(() => {
    resetRepoMocks();
    jest.resetAllMocks();
  });

  describe('#getAuditLogs', () => {
    it('should return audit logs by record name', async () => {
      const auditLog: AuditLog = {
        ...recordInstance,
        username: validCredentials.username,
        action: IAuditAction.CREATE,
        authorized_at: new Date(),
      };

      mockAuditFind.mockResolvedValue([auditLog]);

      const result = await auditManager.getAuditLogs(auditLog.record_name);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        record_name: auditLog.record_name,
        username: auditLog.username,
        action: IAuditAction.CREATE,
      });
    });

    it('should return empty array when no audit logs found', async () => {
      mockAuditFind.mockResolvedValue([]);

      const result = await auditManager.getAuditLogs(invalidCredentials.record_name);

      expect(result).toEqual([]);
    });
  });
});
