/* istanbul ignore file */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSchemas1770305673603 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- Extractable Records Table ---
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "extractable_records" (
        "id" SERIAL NOT NULL,
        "record_name" character varying NOT NULL,
        "username" character varying NOT NULL,
        "authorized_by" character varying NOT NULL,
        "authorized_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "data" jsonb,
        CONSTRAINT "UQ_extractable_record_name" UNIQUE ("record_name"),
        CONSTRAINT "PK_extractable_records_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_extractable_record_name"
      ON "extractable_records" ("record_name")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_extractable_username"
      ON "extractable_records" ("username")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_extractable_authorized_at"
      ON "extractable_records" ("authorized_at")
    `);

    // --- Audit Log Table ---
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_log" (
        "id" SERIAL NOT NULL,
        "record_name" character varying NOT NULL,
        "username" character varying NOT NULL,
        "authorized_by" character varying NOT NULL,
        "action" character varying NOT NULL,
        "authorized_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_log_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_audit_record_name"
      ON "audit_log" ("record_name")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_audit_username"
      ON "audit_log" ("username")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_audit_authorized_at"
      ON "audit_log" ("authorized_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_authorized_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_username"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_record_name"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_log"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_extractable_authorized_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_extractable_username"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_extractable_record_name"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "extractable_records"`);
  }
}
