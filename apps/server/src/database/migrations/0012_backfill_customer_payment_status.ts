import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`UPDATE customer_transaction
    SET payment_status = CASE WHEN balance <= 0 THEN 'paid' ELSE 'pay_later' END,
        payment_date = CASE WHEN amount_paid > 0 THEN txn_date ELSE NULL END`.execute(db);
}

export async function down(_db: Kysely<any>): Promise<void> {}
