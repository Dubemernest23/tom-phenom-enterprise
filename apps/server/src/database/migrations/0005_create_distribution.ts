import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE distribution_record (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dist_date DATE NOT NULL,
      channel ENUM('keke', 'van') NOT NULL,
      quantity_given INT NOT NULL,
      price_per_bag DECIMAL(10,2) NOT NULL,
      amount_expected DECIMAL(12,2) NOT NULL,
      amount_returned DECIMAL(12,2) NOT NULL DEFAULT 0,
      balance DECIMAL(12,2) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_dist_date (dist_date),
      INDEX idx_dist_channel_date (channel, dist_date),
      CONSTRAINT chk_dist_inputs CHECK (
        quantity_given > 0 AND price_per_bag >= 0 AND amount_returned >= 0
      ),
      CONSTRAINT chk_dist_derived CHECK (
        amount_expected = quantity_given * price_per_bag AND
        balance = amount_expected - amount_returned
      )
    );
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('distribution_record').ifExists().execute();
}
