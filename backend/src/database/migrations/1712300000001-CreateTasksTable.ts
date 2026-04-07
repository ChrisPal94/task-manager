import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTasksTable1712300000001 implements MigrationInterface {
  name = 'CreateTasksTable1712300000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id"          TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        "title"       TEXT NOT NULL,
        "description" TEXT,
        "status"      TEXT NOT NULL DEFAULT 'pending'    CHECK("status"   IN ('pending','in_progress','completed')),
        "priority"    TEXT NOT NULL DEFAULT 'medium'     CHECK("priority" IN ('low','medium','high')),
        "due_date"    DATE,
        "owner_id"    TEXT NOT NULL,
        "created_at"  DATETIME NOT NULL DEFAULT (datetime('now')),
        "updated_at"  DATETIME NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "fk_tasks_owner" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_tasks_owner_id" ON "tasks"("owner_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_tasks_status"   ON "tasks"("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_tasks_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_tasks_owner_id"`);
    await queryRunner.query(`DROP TABLE  IF EXISTS "tasks"`);
  }
}
