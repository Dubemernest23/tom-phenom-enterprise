import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE worker
    ADD COLUMN start_date DATE NULL,
    ADD COLUMN salary_frequency ENUM('weekly', 'monthly') NOT NULL DEFAULT 'monthly',
    ADD COLUMN rvs_status ENUM('not_tested', 'negative', 'positive') NOT NULL DEFAULT 'not_tested',
    ADD COLUMN hepatitis_b_status ENUM('not_tested', 'negative', 'positive') NOT NULL DEFAULT 'not_tested',
    ADD COLUMN hepatitis_c_status ENUM('not_tested', 'negative', 'positive') NOT NULL DEFAULT 'not_tested',
    ADD COLUMN vdrl_status ENUM('not_tested', 'negative', 'positive') NOT NULL DEFAULT 'not_tested',
    ADD COLUMN genotype VARCHAR(5) NULL,
    ADD COLUMN blood_group VARCHAR(5) NULL`.execute(db);
  await sql`UPDATE worker SET start_date = DATE(created_at) WHERE start_date IS NULL`.execute(db);
  await sql`ALTER TABLE salary_record ADD COLUMN due_date DATE NULL AFTER pay_period`.execute(db);
  await sql`UPDATE salary_record s JOIN worker w ON w.id = s.worker_id
    SET s.due_date = LAST_DAY(CONCAT(s.pay_period, '-01')) WHERE w.salary_frequency = 'monthly'`.execute(db);
  await sql`CREATE TABLE staff_rating (
    id INT AUTO_INCREMENT PRIMARY KEY,
    worker_id INT NOT NULL,
    rating_month DATE NOT NULL,
    rating DECIMAL(3,1) NOT NULL,
    note VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_staff_rating_month (worker_id, rating_month),
    CONSTRAINT fk_staff_rating_worker FOREIGN KEY (worker_id) REFERENCES worker(id) ON DELETE RESTRICT,
    CONSTRAINT chk_staff_rating CHECK (rating >= 1 AND rating <= 5)
  )`.execute(db);
  await sql`CREATE TABLE inspection_record (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_name VARCHAR(120) NOT NULL,
    checked_items TEXT NOT NULL,
    inspection_date DATE NOT NULL,
    recommendations TEXT NULL,
    fee_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
    tips_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_inspection_date (inspection_date),
    CONSTRAINT chk_inspection_fees CHECK (fee_paid >= 0 AND tips_paid >= 0)
  )`.execute(db);
  await sql`CREATE TABLE tax_record (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tax_name VARCHAR(120) NOT NULL,
    description VARCHAR(255) NOT NULL,
    frequency ENUM('monthly', 'yearly') NOT NULL,
    period_label VARCHAR(20) NOT NULL,
    due_date DATE NOT NULL,
    amount_due DECIMAL(12,2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_date DATE NULL,
    balance DECIMAL(12,2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tax_due_date (due_date),
    UNIQUE KEY uq_tax_period (tax_name, description, period_label),
    CONSTRAINT chk_tax_amounts CHECK (amount_due >= 0 AND amount_paid >= 0),
    CONSTRAINT chk_tax_balance CHECK (balance = amount_due - amount_paid)
  )`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('tax_record').ifExists().execute();
  await db.schema.dropTable('inspection_record').ifExists().execute();
  await db.schema.dropTable('staff_rating').ifExists().execute();
  await sql`ALTER TABLE salary_record DROP COLUMN due_date`.execute(db);
  await sql`ALTER TABLE worker
    DROP COLUMN start_date, DROP COLUMN salary_frequency,
    DROP COLUMN rvs_status, DROP COLUMN hepatitis_b_status,
    DROP COLUMN hepatitis_c_status, DROP COLUMN vdrl_status,
    DROP COLUMN genotype, DROP COLUMN blood_group`.execute(db);
}
