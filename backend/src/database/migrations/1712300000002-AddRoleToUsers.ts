import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoleToUsers1712300000002 implements MigrationInterface {
  name = 'AddRoleToUsers1712300000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // SQLite does not support DROP COLUMN directly — recreate table without role
    await queryRunner.query(`
      CREATE TABLE "users_backup" AS SELECT "id","email","password","name","created_at","updated_at" FROM "users"
    `);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`ALTER TABLE "users_backup" RENAME TO "users"`);
  }
}
