import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

@Entity({ name: 'audit' })
@Index('idx_audit_record_name', ['recordName'])
@Index('idx_audit_username', ['username'])
@Index('idx_audit_created_at', ['createdAt'])
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

  @CreateDateColumn()
  public createdAt!: Date;

  @Column({ type: 'jsonb', nullable: true })
  public data?: Record<string, unknown>;
}
