/* istanbul ignore file */
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity({ name: 'audit_log' })
@Index('idx_audit_record_name', ['recordName'])
@Index('idx_audit_username', ['username'])
@Index('idx_audit_authorized_at', ['authorizedAt'])
@Index('idx_audit_action', ['action'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ type: 'varchar' })
  public recordName!: string;

  @Column({ type: 'varchar' })
  public username!: string;

  @Column({ type: 'varchar' })
  public authorizedBy!: string;

  @Column({ type: 'varchar' })
  public action!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public authorizedAt!: Date;

  @Column({ type: 'jsonb', nullable: true })
  public data?: Record<string, unknown>;
}
