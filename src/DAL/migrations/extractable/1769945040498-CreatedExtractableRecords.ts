/* istanbul ignore file */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatedExtractableRecords1769945040498 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "extractable_records" ("id" SERIAL NOT NULL, "recordName" character varying NOT NULL, "username" character varying NOT NULL, "authorizedBy" character varying NOT NULL, "authorizedAt" TIMESTAMP NOT NULL DEFAULT now(), "data" jsonb, CONSTRAINT "UQ_42902340436742c17f9ab11cdf0" UNIQUE ("recordName"), CONSTRAINT "PK_385f1225e7bd0f97310a094d78f" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "idx_authorized_at" ON "extractable_records" ("authorizedAt") `);
    await queryRunner.query(`CREATE INDEX "idx_username" ON "extractable_records" ("username") `);
    await queryRunner.query(`CREATE INDEX "idx_record_name" ON "extractable_records" ("recordName") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_record_name"`);
    await queryRunner.query(`DROP INDEX "public"."idx_username"`);
    await queryRunner.query(`DROP INDEX "public"."idx_authorized_at"`);
    await queryRunner.query(`DROP TABLE "extractable_records"`);
  }
}
