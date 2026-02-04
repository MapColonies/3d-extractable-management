/* istanbul ignore file */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterAuthorizedAtToTimeStamptz1770136414640 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "extractable_records" ALTER COLUMN "authorizedAt" TYPE TIMESTAMPTZ`);
    await queryRunner.query(`ALTER TABLE "audit_log" ALTER COLUMN "authorizedAt" TYPE TIMESTAMPTZ`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "extractable_records" ALTER COLUMN "authorizedAt" TYPE TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "audit_log" ALTER COLUMN "authorizedAt" TYPE TIMESTAMP`);
  }
}
