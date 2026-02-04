/* istanbul ignore file */
import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn } from 'typeorm';

@Entity({ name: 'extractable_records' })
@Index('idx_extractable_record_name', ['record_name'])
@Index('idx_extractable_username', ['username'])
@Index('idx_extractable_authorized_at', ['authorized_at'])
export class ExtractableRecord {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ type: 'varchar', unique: true, nullable: false })
  public record_name!: string;

  @Column({ type: 'varchar', nullable: false })
  public username!: string;

  @Column({ type: 'varchar', nullable: false })
  public authorized_by!: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  public authorized_at!: Date;

  @Column({ type: 'jsonb', nullable: true })
  public data?: Record<string, unknown>;
}
