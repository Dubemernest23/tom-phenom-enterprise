import type { 
  Generated,
  ColumnType,
  Insertable,
  Selectable,
  Updateable,
} from 'kysely';

type Money = ColumnType<string,string | number,string | number>;

type DateOnly = ColumnType<string,string,string>;

export interface RollIntakeTable {
  id: Generated<number>;
  intake_date: DateOnly;
  quantity_rolls: Money;
  total_kg: Money;
  price_per_kg: Money;
  total_price: Money;
  amount_paid: Money;
  balance: Money;
  supplier_name: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface PackingBagBatchTable {
  id: Generated<number>;
  received_date: DateOnly;
  quantity_received: number;
  quantity_used: number;
  quantity_remaining: number;
  note: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface PackingBagUsageLogTable {
  id: Generated<number>;
  batch_id: number;
  usage_date: DateOnly;
  quantity_used: number;
  created_at: Generated<Date>;
}

export interface DailyFactoryLogTable {
  id: Generated<number>;
  log_date: DateOnly;
  opening_stock: number;
  closing_stock: number;
  distribution_qty: number;
  in_house_qty: number;
  total_2: number;
  total_1: number;
  production: number;
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
  packing_bag_usage_log: PackingBagUsageLogTable;
  daily_factory_log: DailyFactoryLogTable;
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

export type RollIntake = Selectable<RollIntakeTable>;
export type NewRollIntake = Insertable<RollIntakeTable>
export type UpdateRollIntake = Updateable<RollIntakeTable>
export type PackingBagBatch = Selectable<PackingBagBatchTable>;
export type NewPackingBagBatch = Insertable<PackingBagBatchTable>;
export type PackingBagUsageLog = Selectable<PackingBagUsageLogTable>;
export type NewPackingBagUsageLog = Insertable<PackingBagUsageLogTable>;
export type DailyFactoryLog = Selectable<DailyFactoryLogTable>;
export type NewDailyFactoryLog = Insertable<DailyFactoryLogTable>;
