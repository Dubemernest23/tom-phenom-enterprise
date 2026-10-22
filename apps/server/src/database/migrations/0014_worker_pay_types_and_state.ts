import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE worker
    MODIFY COLUMN base_salary DECIMAL(12,2) NULL,
    MODIFY COLUMN salary_frequency ENUM('weekly', 'monthly', 'daily') NOT NULL DEFAULT 'monthly',
    ADD COLUMN state_of_origin VARCHAR(40) NULL AFTER role`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`UPDATE worker SET base_salary = 0 WHERE base_salary IS NULL`.execute(db);
  await sql`UPDATE worker SET salary_frequency = 'weekly' WHERE salary_frequency = 'daily'`.execute(db);
  await sql`ALTER TABLE worker
    DROP COLUMN state_of_origin,
    MODIFY COLUMN salary_frequency ENUM('weekly', 'monthly') NOT NULL DEFAULT 'monthly',
    MODIFY COLUMN base_salary DECIMAL(12,2) NOT NULL`.execute(db);
}
