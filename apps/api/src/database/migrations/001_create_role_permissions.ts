import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRolePermissions1700000000001 implements MigrationInterface {
  name = 'CreateRolePermissions1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the junction table with explicit UUID types
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "role_permissions" (
        "role_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY ("role_id", "permission_id"),
        CONSTRAINT "fk_role_permissions_role"
          FOREIGN KEY ("role_id") REFERENCES "roles"("role_id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "fk_role_permissions_permission"
          FOREIGN KEY ("permission_id") REFERENCES "permissions"("permission_id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_role_permissions_role_id" ON "role_permissions"("role_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_role_permissions_permission_id" ON "role_permissions"("permission_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
  }
}
