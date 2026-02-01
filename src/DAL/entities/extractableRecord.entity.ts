/* istanbul ignore file */
import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity({ name: 'extractable_records' })
@Index('idx_record_name', ['recordName'])
@Index('idx_username', ['username'])
@Index('idx_authorized_at', ['authorizedAt'])
export class ExtractableRecord {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ type: 'varchar', unique: true })
  public recordName!: string;

  @Column({ type: 'varchar' })
  public username!: string;

  @Column({ type: 'varchar' })
  public authorizedBy!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public authorizedAt!: Date;

  @Column({ type: 'jsonb', nullable: true })
  public data?: Record<string, unknown>;
}
