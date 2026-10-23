import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE customer_transaction
    ADD COLUMN payment_method ENUM('cash', 'transfer') NULL AFTER amount_paid,
    ADD COLUMN payment_status ENUM('paid', 'pay_later') NOT NULL DEFAULT 'pay_later' AFTER payment_method`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE customer_transaction
    DROP COLUMN payment_status,
    DROP COLUMN payment_method`.execute(db);
}
