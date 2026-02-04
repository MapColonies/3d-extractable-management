/* istanbul ignore file */
import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn } from 'typeorm';

@Entity({ name: 'extractable_records' })
@Index('idx_extractable_record_name', ['recordName'])
@Index('idx_extractable_username', ['username'])
@Index('idx_extractable_authorized_at', ['authorizedAt'])
export class ExtractableRecord {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ type: 'varchar', unique: true, nullable: false })
  public recordName!: string;

  @Column({ type: 'varchar', nullable: false })
  public username!: string;

  @Column({ type: 'varchar', nullable: false })
  public authorizedBy!: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  public authorizedAt!: Date;

  @Column({ type: 'jsonb', nullable: true })
  public data?: Record<string, unknown>;
}
