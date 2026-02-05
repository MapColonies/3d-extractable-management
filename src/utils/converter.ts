import type { AuditLog } from '@src/DAL/entities/auditLog.entity';
import type { ExtractableRecord } from '@src/DAL/entities/extractableRecord.entity';
import { IExtractableRecord, IAuditLog } from '@src/common/constants';

export const mapAuditLogToCamelCase = (record: AuditLog): IAuditLog => ({
  id: record.id,
  recordName: record.record_name,
  username: record.username,
  authorizedBy: record.authorized_by,
  action: record.action,
  authorizedAt: record.authorized_at?.toISOString(),
});

export const mapExtractableRecordToCamelCase = (record: ExtractableRecord): IExtractableRecord => ({
  id: record.id,
  recordName: record.record_name,
  username: record.username,
  authorizedBy: record.authorized_by,
  data: record.data,
  authorizedAt: record.authorized_at?.toISOString(),
});
