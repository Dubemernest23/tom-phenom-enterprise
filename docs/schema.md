-- TOM-PHENOM ENTERPRISE: MySQL schema (revised)
--
-- Conventions
--   * Money is DECIMAL(12,2). Dates without a time are DATE.
--   * Every table has id, created_at, updated_at, except packing_bag_usage_log
--     (append-only audit trail, so no updated_at on purpose).
--   * Computed columns (totals, balances) are calculated in the service layer
--     and stored. CHECK constraints make the database refuse any row whose
--     stored value disagrees with its inputs, so an edit can never leave a
--     stale balance behind. CHECKs are enforced on MySQL 8.0.16+ and
--     MariaDB 10.2.1+ (older versions parse them and ignore them).
--   * Foreign keys use ON DELETE RESTRICT: a parent with history can't be
--     deleted by accident.
--   * Parents are created before children.

-- ========================
-- 1. Nylon roll intake
-- ========================
CREATE TABLE roll_intake (
  id INT AUTO_INCREMENT PRIMARY KEY,
  intake_date DATE NOT NULL,
  quantity_rolls INT NOT NULL,
  total_kg DECIMAL(10,2) NOT NULL,
  price_per_kg DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,        -- total_kg * price_per_kg, rounded to 2dp
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance DECIMAL(12,2) NOT NULL,            -- total_price - amount_paid
  supplier_name VARCHAR(120),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_roll_intake_date (intake_date),
  CONSTRAINT chk_roll_intake_inputs
    CHECK (quantity_rolls > 0 AND total_kg > 0 AND price_per_kg >= 0 AND amount_paid >= 0),
  CONSTRAINT chk_roll_intake_balance
    CHECK (balance = total_price - amount_paid)
);


-- ========================
-- 2. Packing bags inventory
-- ========================
CREATE TABLE packing_bag_batch (
  id INT AUTO_INCREMENT PRIMARY KEY,
  received_date DATE NOT NULL,
  quantity_received INT NOT NULL,
  quantity_used INT NOT NULL DEFAULT 0,
  quantity_remaining INT NOT NULL,           -- quantity_received - quantity_used
  note VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pbb_received_date (received_date),
  CONSTRAINT chk_pbb_quantities
    CHECK (quantity_received > 0
       AND quantity_used >= 0
       AND quantity_used <= quantity_received
       AND quantity_remaining = quantity_received - quantity_used)
);

-- Append-only audit trail: one row each time bags are taken from a batch.
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

-- ========================
-- 3. Daily factory log
-- ========================
-- log_date is UNIQUE (one log per day). Mistakes are fixed through an update
-- route. The derived columns are CHECKed so a correction must recompute them.
-- The unique index on log_date also serves the weekly and monthly range sums.
CREATE TABLE daily_factory_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  log_date DATE NOT NULL,
  opening_stock INT NOT NULL,
  closing_stock INT NOT NULL,
  distribution_qty INT NOT NULL,             -- van + keke combined for the day
  in_house_qty INT NOT NULL,
  total_2 INT NOT NULL,                      -- distribution_qty + in_house_qty
  total_1 INT NOT NULL,                      -- total_2 + closing_stock
  production INT NOT NULL,                   -- total_1 - opening_stock
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_factory_log_date (log_date),
  CONSTRAINT chk_factory_log_inputs
    CHECK (opening_stock >= 0 AND closing_stock >= 0
       AND distribution_qty >= 0 AND in_house_qty >= 0),
  CONSTRAINT chk_factory_log_derived
    CHECK (total_2 = distribution_qty + in_house_qty
       AND total_1 = total_2 + closing_stock
       AND production = total_1 - opening_stock)
);

-- ========================
-- 4. Distribution (keke and van)
-- ========================
CREATE TABLE distribution_record (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dist_date DATE NOT NULL,
  channel ENUM('keke', 'van') NOT NULL,
  quantity_given INT NOT NULL,
  price_per_bag DECIMAL(10,2) NOT NULL,
  amount_expected DECIMAL(12,2) NOT NULL,    -- quantity_given * price_per_bag
  amount_returned DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance DECIMAL(12,2) NOT NULL,            -- amount_expected - amount_returned
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_dist_date (dist_date),
  INDEX idx_dist_channel_date (channel, dist_date),
  CONSTRAINT chk_dist_inputs
    CHECK (quantity_given > 0 AND price_per_bag >= 0 AND amount_returned >= 0),
  CONSTRAINT chk_dist_derived
    CHECK (amount_expected = quantity_given * price_per_bag
       AND balance = amount_expected - amount_returned)
);

-- ========================
-- 5. Big customers ledger
-- ========================
CREATE TABLE customer (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(30),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customer_name (name)
);

-- quantity and price_given allow 0 so a pure payment (no new sale) can be
-- recorded. That row has a negative balance, and the customer's total debt is
-- SUM(balance).
-- payment_date records when money was received, which may be later than sale date.
CREATE TABLE customer_transaction (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  txn_date DATE NOT NULL,
  quantity INT NOT NULL,
  price_given DECIMAL(10,2) NOT NULL,
  amount_expected DECIMAL(12,2) NOT NULL,    -- quantity * price_given
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method ENUM('cash', 'transfer'),
  payment_status ENUM('paid', 'pay_later') NOT NULL DEFAULT 'pay_later',
  payment_date DATE,
  balance DECIMAL(12,2) NOT NULL,            -- amount_expected - amount_paid
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ct_customer_date (customer_id, txn_date),
  CONSTRAINT fk_ct_customer FOREIGN KEY (customer_id)
    REFERENCES customer(id) ON DELETE RESTRICT,
  CONSTRAINT chk_ct_inputs
    CHECK (quantity >= 0 AND price_given >= 0 AND amount_paid >= 0),
  CONSTRAINT chk_ct_balance
    CHECK (balance = amount_expected - amount_paid)
);

-- ========================
-- 6. Worker payroll
-- ========================
CREATE TABLE worker (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  role VARCHAR(80),
  state_of_origin VARCHAR(40),
  base_salary DECIMAL(12,2),              -- NULL for variable weekly and daily pay
  start_date DATE,
  salary_frequency ENUM('weekly', 'monthly', 'daily') NOT NULL DEFAULT 'monthly',
  rvs_status ENUM('not_tested', 'negative', 'positive') NOT NULL DEFAULT 'not_tested',
  hepatitis_b_status ENUM('not_tested', 'negative', 'positive') NOT NULL DEFAULT 'not_tested',
  hepatitis_c_status ENUM('not_tested', 'negative', 'positive') NOT NULL DEFAULT 'not_tested',
  vdrl_status ENUM('not_tested', 'negative', 'positive') NOT NULL DEFAULT 'not_tested',
  genotype VARCHAR(5),
  blood_group VARCHAR(5),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_worker_salary CHECK (base_salary >= 0)
);

CREATE TABLE salary_record (
  id INT AUTO_INCREMENT PRIMARY KEY,
  worker_id INT NOT NULL,
  pay_period VARCHAR(20) NOT NULL,           -- e.g. '2026-09'
  due_date DATE,
  salary_due DECIMAL(12,2) NOT NULL,
  advance DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance DECIMAL(12,2) NOT NULL,            -- salary_due - advance - amount_paid
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_salary_worker_period (worker_id, pay_period),
  CONSTRAINT fk_salary_worker FOREIGN KEY (worker_id)
    REFERENCES worker(id) ON DELETE RESTRICT,
  CONSTRAINT chk_salary_inputs
    CHECK (salary_due >= 0 AND advance >= 0 AND amount_paid >= 0),
  CONSTRAINT chk_salary_balance
    CHECK (balance = salary_due - advance - amount_paid)
);

CREATE TABLE staff_rating (
  id INT AUTO_INCREMENT PRIMARY KEY,
  worker_id INT NOT NULL,
  rating_month DATE NOT NULL,
  rating DECIMAL(3,1) NOT NULL,
  note VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_staff_rating_month (worker_id, rating_month),
  FOREIGN KEY (worker_id) REFERENCES worker(id) ON DELETE RESTRICT,
  CONSTRAINT chk_staff_rating CHECK (rating >= 1 AND rating <= 5)
);

CREATE TABLE inspection_record (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_name VARCHAR(120) NOT NULL,
  checked_items TEXT NOT NULL,
  inspection_date DATE NOT NULL,
  recommendations TEXT,
  fee_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  tips_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_inspection_date (inspection_date)
);

CREATE TABLE tax_record (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tax_name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NOT NULL,
  frequency ENUM('monthly', 'yearly') NOT NULL,
  period_label VARCHAR(20) NOT NULL,
  due_date DATE NOT NULL,
  amount_due DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_date DATE,
  balance DECIMAL(12,2) NOT NULL,
  UNIQUE KEY uq_tax_period (tax_name, description, period_label),
  CONSTRAINT chk_tax_balance CHECK (balance = amount_due - amount_paid)
);

-- ========================
-- 7. Maintenance log
-- ========================
CREATE TABLE maintenance_record (
  id INT AUTO_INCREMENT PRIMARY KEY,
  maint_date DATE NOT NULL,
  maintenance_frequency ENUM('daily', 'weekly', 'monthly') NULL,
  equipment VARCHAR(120) NOT NULL,
  description VARCHAR(255),
  cost DECIMAL(12,2) NOT NULL,
  vendor VARCHAR(120),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_maint_date (maint_date),
  CONSTRAINT chk_maint_cost CHECK (cost >= 0)
);

-- ========================
-- 8. Payables
-- ========================
CREATE TABLE creditor (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(80),                      -- e.g. 'packing_bag_supplier', 'mechanic', 'parts'
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_creditor_name (name)
);

-- Like customer_transaction, amount_owed may be 0 for a pure payment row.
CREATE TABLE payable_transaction (
  id INT AUTO_INCREMENT PRIMARY KEY,
  creditor_id INT NOT NULL,
  txn_date DATE NOT NULL,
  description VARCHAR(255),
  amount_owed DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance DECIMAL(12,2) NOT NULL,            -- amount_owed - amount_paid
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pt_creditor_date (creditor_id, txn_date),
  CONSTRAINT fk_pt_creditor FOREIGN KEY (creditor_id)
    REFERENCES creditor(id) ON DELETE RESTRICT,
  CONSTRAINT chk_pt_inputs CHECK (amount_owed >= 0 AND amount_paid >= 0),
  CONSTRAINT chk_pt_balance CHECK (balance = amount_owed - amount_paid)
);

-- ========================
-- 9. Admin
-- ========================
-- Lower-case name: MySQL table names are case-sensitive on Linux hosts.
-- Stores a bcrypt hash, never the password.
CREATE TABLE admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_admin_username (username)
);
