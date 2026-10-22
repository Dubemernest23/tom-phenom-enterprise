import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE maintenance_record
    ADD COLUMN maintenance_frequency ENUM('daily', 'weekly', 'monthly') NULL AFTER maint_date`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE maintenance_record DROP COLUMN maintenance_frequency`.execute(db);
}
