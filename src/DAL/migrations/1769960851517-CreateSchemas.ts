/* istanbul ignore file */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSchemasMigration1769960851517 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "extractable_records" (
                "id" SERIAL NOT NULL,
                "recordName" character varying NOT NULL,
                "username" character varying NOT NULL,
                "authorizedBy" character varying NOT NULL,
                "authorizedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "data" jsonb,
                CONSTRAINT "UQ_42902340436742c17f9ab11cdf0" UNIQUE ("recordName"),
                CONSTRAINT "PK_385f1225e7bd0f97310a094d78f" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`CREATE INDEX "idx_extractable_authorized_at" ON "extractable_records" ("authorizedAt")`);
    await queryRunner.query(`CREATE INDEX "idx_extractable_username" ON "extractable_records" ("username")`);
    await queryRunner.query(`CREATE INDEX "idx_extractable_record_name" ON "extractable_records" ("recordName")`);

    await queryRunner.query(`
            CREATE TABLE "audit_log" (
                "id" SERIAL NOT NULL,
                "recordName" character varying NOT NULL,
                "username" character varying NOT NULL,
                "authorizedBy" character varying NOT NULL,
                "action" character varying NOT NULL,
                "authorizedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "data" jsonb,
                CONSTRAINT "PK_audit_log_id" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`CREATE INDEX "idx_audit_action" ON "audit_log" ("action")`);
    await queryRunner.query(`CREATE INDEX "idx_audit_authorized_at" ON "audit_log" ("authorizedAt")`);
    await queryRunner.query(`CREATE INDEX "idx_audit_username" ON "audit_log" ("username")`);
    await queryRunner.query(`CREATE INDEX "idx_audit_record_name" ON "audit_log" ("recordName")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_audit_record_name"`);
    await queryRunner.query(`DROP INDEX "public"."idx_audit_username"`);
    await queryRunner.query(`DROP INDEX "public"."idx_audit_authorized_at"`);
    await queryRunner.query(`DROP INDEX "public"."idx_audit_action"`);
    await queryRunner.query(`DROP TABLE "audit_log"`);

    await queryRunner.query(`DROP INDEX "public"."idx_extractable_record_name"`);
    await queryRunner.query(`DROP INDEX "public"."idx_extractable_username"`);
    await queryRunner.query(`DROP INDEX "public"."idx_extractable_authorized_at"`);
    await queryRunner.query(`DROP TABLE "extractable_records"`);
  }
}
