import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogs1769604292852 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "audit_log" ("id" SERIAL NOT NULL, "recordName" character varying NOT NULL, "username" character varying NOT NULL, "authorizedBy" character varying NOT NULL, "action" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "data" jsonb, CONSTRAINT "PK_1d3d120ddaf7bc9b1ed68ed463a" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "idx_audit_action" ON "audit_log" ("action") `);
    await queryRunner.query(`CREATE INDEX "idx_audit_created_at" ON "audit_log" ("createdAt") `);
    await queryRunner.query(`CREATE INDEX "idx_audit_username" ON "audit_log" ("username") `);
    await queryRunner.query(`CREATE INDEX "idx_audit_record_name" ON "audit_log" ("recordName") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_audit_record_name"`);
    await queryRunner.query(`DROP INDEX "public"."idx_audit_username"`);
    await queryRunner.query(`DROP INDEX "public"."idx_audit_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."idx_audit_action"`);
    await queryRunner.query(`DROP TABLE "audit_log"`);
  }
}
