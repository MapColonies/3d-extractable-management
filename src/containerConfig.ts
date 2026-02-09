import { getOtelMixin } from '@map-colonies/telemetry';
import { trace } from '@opentelemetry/api';
import { Registry } from 'prom-client';
import { DependencyContainer } from 'tsyringe/dist/typings/types';
import { Repository } from 'typeorm';
import jsLogger from '@map-colonies/js-logger';
import { InjectionObject, registerDependencies } from '@common/dependencyRegistration';
import { SERVICES, SERVICE_NAME } from '@common/constants';
import { getTracing } from '@common/tracing';
import { recordsRouterFactory, RECORDS_ROUTER_SYMBOL } from './records/routes/recordsRouter';
import { usersRouterFactory, USERS_ROUTER_SYMBOL } from './users/routes/usersRouter';
import { auditRouterFactory, AUDIT_ROUTER_SYMBOL } from './audit_logs/routes/auditRouter';
import { ConnectionManager } from './DAL/connectionManager';
import { getConfig } from './common/config';
import { AuditLog } from './DAL/entities/auditLog.entity';
import { ExtractableRecord } from './DAL/entities/extractableRecord.entity';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = async (options?: RegisterOptions): Promise<DependencyContainer> => {
  const configInstance = getConfig();

  const loggerConfig = configInstance.get('telemetry.logger');

  const logger = jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, mixin: getOtelMixin() });

  const tracer = trace.getTracer(SERVICE_NAME);
  const metricsRegistry = new Registry();
  configInstance.initializeMetrics(metricsRegistry);

  const connectionManager = new ConnectionManager(logger);
  await connectionManager.init();

  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: configInstance } },
    { token: SERVICES.LOGGER, provider: { useValue: logger } },
    { token: SERVICES.TRACER, provider: { useValue: tracer } },
    { token: SERVICES.METRICS, provider: { useValue: metricsRegistry } },
    { token: RECORDS_ROUTER_SYMBOL, provider: { useFactory: recordsRouterFactory } },
    { token: USERS_ROUTER_SYMBOL, provider: { useFactory: usersRouterFactory } },
    { token: AUDIT_ROUTER_SYMBOL, provider: { useFactory: auditRouterFactory } },
    {
      token: SERVICES.HEALTH_CHECK,
      provider: {
        useFactory: (dependencyContainer: DependencyContainer): (() => Promise<void>) => {
          const connectionManager = dependencyContainer.resolve(ConnectionManager);
          return async () => {
            await Promise.resolve(connectionManager.healthCheck());
          };
        },
      },
    },
    { token: SERVICES.CONNECTION_MANAGER, provider: { useValue: connectionManager } },
    {
      token: SERVICES.EXTRACTABLE_RECORD_REPOSITORY,
      provider: {
        useFactory: (): Repository<ExtractableRecord> => {
          return connectionManager.getDataSourceConnection().getRepository(ExtractableRecord);
        },
      },
    },
    {
      token: SERVICES.AUDIT_LOG_REPOSITORY,
      provider: {
        useFactory: (): Repository<AuditLog> => {
          return connectionManager.getDataSourceConnection().getRepository(AuditLog);
        },
      },
    },
    {
      token: 'onSignal',
      provider: {
        useValue: async (): Promise<void> => {
          await Promise.all([getTracing().stop()]);
        },
      },
    },
  ];

  return Promise.resolve(registerDependencies(dependencies, options?.override, options?.useChild));
};
