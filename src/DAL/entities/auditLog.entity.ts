/* istanbul ignore file */
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';
import { IAuditAction } from '../../common/interfaces';

@Entity({ name: 'audit_log' })
@Index('idx_audit_record_name', ['recordName'])
@Index('idx_audit_username', ['username'])
@Index('idx_audit_authorized_at', ['authorizedAt'])
@Index('idx_audit_action', ['action'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ type: 'varchar', nullable: false })
  public recordName!: string;

  @Column({ type: 'varchar', nullable: false })
  public username!: string;

  @Column({ type: 'varchar', nullable: false })
  public authorizedBy!: string;

  @Column({ type: 'enum', enum: IAuditAction, nullable: false })
  public action!: IAuditAction;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  public authorizedAt!: Date;
}
