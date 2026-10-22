import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE customer (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(30) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customer_name (name)
  )`.execute(db);
  await sql`CREATE TABLE customer_transaction (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    txn_date DATE NOT NULL,
    quantity INT NOT NULL,
    price_given DECIMAL(10,2) NOT NULL,
    amount_expected DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
    balance DECIMAL(12,2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ct_customer_date (customer_id, txn_date),
    CONSTRAINT fk_ct_customer FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE RESTRICT,
    CONSTRAINT chk_ct_inputs CHECK (quantity >= 0 AND price_given >= 0 AND amount_expected >= 0 AND amount_paid >= 0),
    CONSTRAINT chk_ct_balance CHECK (balance = amount_expected - amount_paid)
  )`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('customer_transaction').ifExists().execute();
  await db.schema.dropTable('customer').ifExists().execute();
}
