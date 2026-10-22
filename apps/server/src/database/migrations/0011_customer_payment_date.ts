import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE customer_transaction ADD COLUMN payment_date DATE NULL AFTER payment_status, ADD INDEX idx_ct_payment_date (payment_date)`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE customer_transaction DROP INDEX idx_ct_payment_date, DROP COLUMN payment_date`.execute(db);
}
