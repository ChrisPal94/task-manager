import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1712300000000 implements MigrationInterface {
  name = 'CreateUsersTable1712300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id"         TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        "email"      TEXT NOT NULL UNIQUE,
        "password"   TEXT NOT NULL,
        "name"       TEXT NOT NULL,
        "created_at" DATETIME NOT NULL DEFAULT (datetime('now')),
        "updated_at" DATETIME NOT NULL DEFAULT (datetime('now'))
      )
    `);

    await queryRunner.query(`
      CREATE TRIGGER IF NOT EXISTS "trg_users_updated_at"
      AFTER UPDATE ON "users"
      FOR EACH ROW
      BEGIN
        UPDATE "users" SET "updated_at" = datetime('now') WHERE "id" = OLD."id";
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS "trg_users_updated_at"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
