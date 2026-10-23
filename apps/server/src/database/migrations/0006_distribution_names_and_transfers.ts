import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE distribution_record DROP CHECK chk_dist_derived`.execute(db);
  await sql`ALTER TABLE distribution_record ADD COLUMN recipient_name VARCHAR(120) NULL AFTER channel`.execute(db);
  await sql`
    ALTER TABLE distribution_record
    ADD CONSTRAINT chk_dist_expected CHECK (amount_expected = quantity_given * price_per_bag)
  `.execute(db);
  await sql`
    CREATE TABLE distribution_transfer (
      id INT AUTO_INCREMENT PRIMARY KEY,
      distribution_id INT NOT NULL,
      transfer_date DATE NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      note VARCHAR(255),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_distribution_transfer_date (distribution_id, transfer_date),
      CONSTRAINT fk_distribution_transfer_record FOREIGN KEY (distribution_id)
        REFERENCES distribution_record(id) ON DELETE RESTRICT,
      CONSTRAINT chk_distribution_transfer_amount CHECK (amount > 0)
    );
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('distribution_transfer').ifExists().execute();
  await sql`ALTER TABLE distribution_record DROP CHECK chk_dist_expected`.execute(db);
  await sql`ALTER TABLE distribution_record DROP COLUMN recipient_name`.execute(db);
  await sql`
    UPDATE distribution_record SET balance = amount_expected - amount_returned
  `.execute(db);
  await sql`
    ALTER TABLE distribution_record
    ADD CONSTRAINT chk_dist_derived CHECK (
      amount_expected = quantity_given * price_per_bag AND
      balance = amount_expected - amount_returned
    )
  `.execute(db);
}
