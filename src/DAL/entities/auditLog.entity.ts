/* istanbul ignore file */
/* eslint-disable @typescript-eslint/naming-convention */
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';
import { IAuditAction } from '../../common/interfaces';

@Entity({ name: 'audit_log' })
@Index('idx_audit_record_name', ['record_name'])
@Index('idx_audit_username', ['username'])
@Index('idx_audit_authorized_at', ['authorized_at'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ type: 'varchar', nullable: false })
  public record_name!: string;

  @Column({ type: 'varchar', nullable: false })
  public username!: string;

  @Column({ type: 'varchar', nullable: false })
  public authorized_by!: string;

  @Column({ type: 'enum', enum: IAuditAction, nullable: false })
  public action!: IAuditAction;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  public authorized_at?: Date;
}
