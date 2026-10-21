import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE packing_bag_batch (
      id INT AUTO_INCREMENT PRIMARY KEY,
      received_date DATE NOT NULL,
      quantity_received INT NOT NULL,
      quantity_used INT NOT NULL DEFAULT 0,
      quantity_remaining INT NOT NULL,
      note VARCHAR(255),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_pbb_received_date (received_date),
      CONSTRAINT chk_pbb_quantities CHECK (
        quantity_received > 0 AND quantity_used >= 0 AND
        quantity_used <= quantity_received AND
        quantity_remaining = quantity_received - quantity_used
      )
    );
  `.execute(db);
  await sql`
    CREATE TABLE packing_bag_usage_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      batch_id INT NOT NULL,
      usage_date DATE NOT NULL,
      quantity_used INT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_pbul_batch_date (batch_id, usage_date),
      CONSTRAINT fk_pbul_batch FOREIGN KEY (batch_id)
        REFERENCES packing_bag_batch(id) ON DELETE RESTRICT,
      CONSTRAINT chk_pbul_quantity CHECK (quantity_used > 0)
    );
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('packing_bag_usage_log').ifExists().execute();
  await db.schema.dropTable('packing_bag_batch').ifExists().execute();
}
