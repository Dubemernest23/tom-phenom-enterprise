import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE worker (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    role VARCHAR(80) NULL,
    base_salary DECIMAL(12,2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_worker_salary CHECK (base_salary >= 0)
  )`.execute(db);
  await sql`CREATE TABLE salary_record (
    id INT AUTO_INCREMENT PRIMARY KEY,
    worker_id INT NOT NULL,
    pay_period VARCHAR(20) NOT NULL,
    salary_due DECIMAL(12,2) NOT NULL,
    advance DECIMAL(12,2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
    balance DECIMAL(12,2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_salary_worker_period (worker_id, pay_period),
    CONSTRAINT fk_salary_worker FOREIGN KEY (worker_id) REFERENCES worker(id) ON DELETE RESTRICT,
    CONSTRAINT chk_salary_inputs CHECK (salary_due >= 0 AND advance >= 0 AND amount_paid >= 0),
    CONSTRAINT chk_salary_balance CHECK (balance = salary_due - advance - amount_paid)
  )`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('salary_record').ifExists().execute();
  await db.schema.dropTable('worker').ifExists().execute();
}
