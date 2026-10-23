import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
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
      `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropTable('roll_intake')
    .execute();
}