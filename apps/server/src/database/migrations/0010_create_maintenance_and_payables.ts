import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE maintenance_record (
    id INT AUTO_INCREMENT PRIMARY KEY,
    maint_date DATE NOT NULL,
    equipment VARCHAR(120) NOT NULL,
    description VARCHAR(255) NULL,
    cost DECIMAL(12,2) NOT NULL,
    vendor VARCHAR(120) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_maint_date (maint_date),
    CONSTRAINT chk_maint_cost CHECK (cost >= 0)
  )`.execute(db);
  await sql`CREATE TABLE creditor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    category VARCHAR(80) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_creditor_name (name)
  )`.execute(db);
  await sql`CREATE TABLE payable_transaction (
    id INT AUTO_INCREMENT PRIMARY KEY,
    creditor_id INT NOT NULL,
    txn_date DATE NOT NULL,
    description VARCHAR(255) NULL,
    amount_owed DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
    balance DECIMAL(12,2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pt_creditor_date (creditor_id, txn_date),
    CONSTRAINT fk_pt_creditor FOREIGN KEY (creditor_id) REFERENCES creditor(id) ON DELETE RESTRICT,
    CONSTRAINT chk_pt_inputs CHECK (amount_owed >= 0 AND amount_paid >= 0),
    CONSTRAINT chk_pt_balance CHECK (balance = amount_owed - amount_paid)
  )`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('payable_transaction').ifExists().execute();
  await db.schema.dropTable('creditor').ifExists().execute();
  await db.schema.dropTable('maintenance_record').ifExists().execute();
}
