import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExtractablesRecords1769604587925 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "extractable_records" ("id" SERIAL NOT NULL, "recordName" character varying NOT NULL, "username" character varying NOT NULL, "authorizedBy" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "data" jsonb, CONSTRAINT "UQ_42902340436742c17f9ab11cdf0" UNIQUE ("recordName"), CONSTRAINT "PK_385f1225e7bd0f97310a094d78f" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "idx_created_at" ON "extractable_records" ("createdAt") `);
    await queryRunner.query(`CREATE INDEX "idx_username" ON "extractable_records" ("username") `);
    await queryRunner.query(`CREATE INDEX "idx_record_name" ON "extractable_records" ("recordName") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_record_name"`);
    await queryRunner.query(`DROP INDEX "public"."idx_username"`);
    await queryRunner.query(`DROP INDEX "public"."idx_created_at"`);
    await queryRunner.query(`DROP TABLE "extractable_records"`);
  }
}
