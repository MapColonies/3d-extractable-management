import { readPackageJsonSync } from '@map-colonies/read-pkg';
import type { components } from '@openapi';

export const SERVICE_NAME = readPackageJsonSync().name ?? 'unknown_service';
export const DEFAULT_SERVER_PORT = 80;

export const IGNORED_OUTGOING_TRACE_ROUTES = [/^.*\/v1\/metrics.*$/];
export const IGNORED_INCOMING_TRACE_ROUTES = [/^.*\/docs.*$/];

/* eslint-disable @typescript-eslint/naming-convention */
export const SERVICES = {
  LOGGER: Symbol('Logger'),
  CONFIG: Symbol('Config'),
  TRACER: Symbol('Tracer'),
  METRICS: Symbol('METRICS'),
  HEALTH_CHECK: Symbol('HealthCheck'),
  EXTRACTABLE_RECORD_REPOSITORY: Symbol('ExtractableRecordRepository'),
  AUDIT_LOG_REPOSITORY: Symbol('AuditLogRepository'),
  CONNECTION_MANAGER: Symbol('ConnectionManager'),
} satisfies Record<string, symbol>;
/* eslint-enable @typescript-eslint/naming-convention */

export type IExtractableRecord = components['schemas']['extractable-record'];

export type IAuthPayloadWithRecord = components['schemas']['auth-payload-with-record'];

export type IAuthPayload = components['schemas']['auth-payload'];

export type IValidateResponse = components['schemas']['validateResponse'];

export const DB_TIMEOUT = 5000;

export const MAX_CONNECT_RETRIES = 3;
