# Database Schema — MySQL

Conventions:
- All monetary values stored as `DECIMAL(12,2)` (naira and kobo).
- All tables have `id INT AUTO_INCREMENT PRIMARY KEY`, `created_at`, `updated_at`.
- Computed fields (balances, totals) are **not** stored as generated columns by
  default — they're calculated in the application layer on read/write, so the
  logic lives in one place (the Express service layer) rather than split
  between SQL and code. You can switch specific ones to generated columns later
  if you want the DB to enforce it.

```sql
-- ========================
-- 1. Nylon Roll Intake
-- ========================
CREATE TABLE roll_intake (
  id INT AUTO_INCREMENT PRIMARY KEY,
  intake_date DATE NOT NULL,
  quantity_rolls INT NOT NULL,
  total_kg DECIMAL(10,2) NOT NULL,
  price_per_kg DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,        -- total_kg * price_per_kg
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance DECIMAL(12,2) NOT NULL,            -- total_price - amount_paid
  supplier_name VARCHAR(120),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ========================
-- 2. Packing Bags Inventory
-- ========================
CREATE TABLE packing_bag_batch (
  id INT AUTO_INCREMENT PRIMARY KEY,
  received_date DATE NOT NULL,
  quantity_received INT NOT NULL,
  quantity_used INT NOT NULL DEFAULT 0,
  quantity_remaining INT NOT NULL,           -- quantity_received - quantity_used
  note VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Audit trail every time a batch is updated (the "update route" usage log)
CREATE TABLE packing_bag_usage_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  batch_id INT NOT NULL,
  usage_date DATE NOT NULL,
  quantity_used INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES packing_bag_batch(id)
);

-- ========================
-- 3. Daily Factory Log
-- ========================
CREATE TABLE daily_factory_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  log_date DATE NOT NULL UNIQUE,
  opening_stock INT NOT NULL,
  closing_stock INT NOT NULL,
  distribution_qty INT NOT NULL,             -- van + keke combined for the day
  in_house_qty INT NOT NULL,
  total_2 INT NOT NULL,                      -- distribution_qty + in_house_qty
  total_1 INT NOT NULL,                      -- total_2 + closing_stock
  production INT NOT NULL,                   -- total_1 - opening_stock
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ========================
-- 4. Distribution (Keke & Van)
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ========================
-- 5. Big Customers Ledger
-- ========================
CREATE TABLE customer (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(30),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customer_transaction (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  txn_date DATE NOT NULL,
  quantity INT NOT NULL,
  price_given DECIMAL(10,2) NOT NULL,
  amount_expected DECIMAL(12,2) NOT NULL,    -- quantity * price_given (or entered)
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance DECIMAL(12,2) NOT NULL,            -- amount_expected - amount_paid
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customer(id)
);

-- ========================
-- 6. Worker Payroll
-- ========================
CREATE TABLE worker (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  role VARCHAR(80),
  base_salary DECIMAL(12,2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE salary_record (
  id INT AUTO_INCREMENT PRIMARY KEY,
  worker_id INT NOT NULL,
  pay_period VARCHAR(20) NOT NULL,           -- e.g. '2026-09'
  salary_due DECIMAL(12,2) NOT NULL,
  advance DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance DECIMAL(12,2) NOT NULL,            -- salary_due - advance - amount_paid
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (worker_id) REFERENCES worker(id)
);

-- ========================
-- 7. Maintenance Log
-- ========================
CREATE TABLE maintenance_record (
  id INT AUTO_INCREMENT PRIMARY KEY,
  maint_date DATE NOT NULL,
  equipment VARCHAR(120) NOT NULL,
  description VARCHAR(255),
  cost DECIMAL(12,2) NOT NULL,
  vendor VARCHAR(120),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 8. Payables
-- ========================
CREATE TABLE creditor (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(80),                      -- e.g. 'nylon_supplier', 'mechanic', 'parts'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payable_transaction (
  id INT AUTO_INCREMENT PRIMARY KEY,
  creditor_id INT NOT NULL,
  txn_date DATE NOT NULL,
  description VARCHAR(255),
  amount_owed DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance DECIMAL(12,2) NOT NULL,            -- amount_owed - amount_paid
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creditor_id) REFERENCES creditor(id)
);
-- =====
-- ADMIN
-- ========
CREATE TABLE Admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(255) DEFAULT ADMIN, 
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

```
## Notes on relationships
- `packing_bag_usage_log` → `packing_bag_batch` (many logs per batch, audit trail).
- `customer_transaction` → `customer` (many transactions per customer).
- `salary_record` → `worker` (many pay periods per worker).
- `payable_transaction` → `creditor` (many payments/charges per creditor).
- `distribution_record` and `daily_factory_log` are date-based facts, not
  linked by FK, but the app layer should be able to cross-check that a given
  day's `distribution_qty` in the factory log roughly matches the sum of that
  day's `distribution_record.quantity_given` — good candidate for the
  "flag when books don't balance" stretch feature.