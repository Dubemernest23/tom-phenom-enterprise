import type { Generated } from 'kysely';

export interface RollIntakeTable {
  id: Generated<number>;
  intake_date: Date;
  quantity_rolls: number;
  total_kg: number;
  price_per_kg: number;
  total_price: number;
  amount_paid: number;
  balance: number;
  supplier_name: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface PackingBagBatchTable {
  id: Generated<number>;
  received_date: Date;
  quantity_received: number;
  quantity_used: number;
  quantity_remaining: number;
  note: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface AdminTable {
    id: Generated<number>;
    username: string;
    password: string;
    role: string;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
}

export interface Database {
  roll_intake: RollIntakeTable;
  packing_bag_batch: PackingBagBatchTable;
//   packing_bag_usage_log: PackingBagUsageLogTable;
//   daily_factory_log: DailyFactoryLogTable;
//   distribution_record: DistributionRecordTable;
//   customer: CustomerTable;
//   customer_transaction: CustomerTransactionTable;
//   worker: WorkerTable;
//   salary_record: SalaryRecordTable;
//   maintenance_record: MaintenanceRecordTable;
//   creditor: CreditorTable;
//   payable_transaction: PayableTransactionTable;
  admin: AdminTable;
}