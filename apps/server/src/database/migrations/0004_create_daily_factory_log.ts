import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE daily_factory_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      log_date DATE NOT NULL,
      opening_stock INT NOT NULL,
      closing_stock INT NOT NULL,
      distribution_qty INT NOT NULL,
      in_house_qty INT NOT NULL,
      total_2 INT NOT NULL,
      total_1 INT NOT NULL,
      production INT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_factory_log_date (log_date),
      CONSTRAINT chk_factory_log_inputs CHECK (
        opening_stock >= 0 AND closing_stock >= 0 AND
        distribution_qty >= 0 AND in_house_qty >= 0
      ),
      CONSTRAINT chk_factory_log_derived CHECK (
        total_2 = distribution_qty + in_house_qty AND
        total_1 = total_2 + closing_stock AND
        production = total_1 - opening_stock
      )
    );
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('daily_factory_log').ifExists().execute();
}
