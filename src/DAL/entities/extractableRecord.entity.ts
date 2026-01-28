import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn } from 'typeorm';

@Entity({ name: 'extractable_records' })
@Index('idx_record_name', ['recordName'])
@Index('idx_username', ['username'])
@Index('idx_created_at', ['createdAt'])
export class ExtractableRecord {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ type: 'varchar', unique: true })
  public recordName!: string;

  @Column({ type: 'varchar' })
  public username!: string;

  @Column({ type: 'varchar' })
  public authorizedBy!: string;

  @CreateDateColumn()
  public createdAt!: Date;

  @Column({ type: 'jsonb', nullable: true })
  public data?: Record<string, unknown>;
}
