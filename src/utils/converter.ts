import type { AuditLog } from '@src/DAL/entities/auditLog.entity';
import type { ExtractableRecord } from '@src/DAL/entities/extractableRecord.entity';

interface CamelAuditLog {
  id: number;
  recordName: string;
  username: string;
  authorizedBy: string;
  action: 'CREATE' | 'DELETE';
  authorizedAt?: string;
}

interface CamelExtractableRecord {
  id: number;
  recordName: string;
  username: string;
  authorizedBy: string;
  data?: Record<string, unknown>;
  authorizedAt?: string;
}

export const mapAuditLogToCamelCase = (record: AuditLog): CamelAuditLog => ({
  id: record.id,
  recordName: record.record_name,
  username: record.username,
  authorizedBy: record.authorized_by,
  action: record.action,
  authorizedAt: record.authorized_at?.toISOString(),
});

export const mapExtractableRecordToCamelCase = (record: ExtractableRecord): CamelExtractableRecord => ({
  id: record.id,
  recordName: record.record_name,
  username: record.username,
  authorizedBy: record.authorized_by,
  data: record.data,
  authorizedAt: record.authorized_at?.toISOString(),
});
