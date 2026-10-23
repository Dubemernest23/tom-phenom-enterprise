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

export interface DistributionRecordTable {
  id: Generated<number>;
  dist_date: DateOnly;
  channel: 'keke' | 'van';
  recipient_name: string | null;
  quantity_given: number;
  price_per_bag: Money;
  amount_expected: Money;
  amount_returned: Money;
  balance: Money;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface DistributionTransferTable {
  id: Generated<number>;
  distribution_id: number;
  transfer_date: DateOnly;
  amount: Money;
  note: string | null;
  created_at: Generated<Date>;
}

export interface AdminTable {
    id: Generated<number>;
    username: string;
    password: string;
    role: string;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
}

export interface CustomerTable {
  id: Generated<number>;
  name: string;
  phone: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface CustomerTransactionTable {
  id: Generated<number>;
  customer_id: number;
  txn_date: DateOnly;
  quantity: number;
  price_given: Money;
  amount_expected: Money;
  amount_paid: Money;
  payment_method: 'cash' | 'transfer' | null;
  payment_status: 'paid' | 'pay_later';
  payment_date: DateOnly | null;
  balance: Money;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface WorkerTable {
  id: Generated<number>;
  name: string;
  role: string | null;
  base_salary: Money | null;
  state_of_origin: string | null;
  start_date: DateOnly | null;
  salary_frequency: 'weekly' | 'monthly' | 'daily';
  rvs_status: 'not_tested' | 'negative' | 'positive';
  hepatitis_b_status: 'not_tested' | 'negative' | 'positive';
  hepatitis_c_status: 'not_tested' | 'negative' | 'positive';
  vdrl_status: 'not_tested' | 'negative' | 'positive';
  genotype: string | null;
  blood_group: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface SalaryRecordTable {
  id: Generated<number>;
  worker_id: number;
  pay_period: string;
  due_date: DateOnly | null;
  salary_due: Money;
  advance: Money;
  amount_paid: Money;
  balance: Money;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface StaffRatingTable {
  id: Generated<number>;
  worker_id: number;
  rating_month: DateOnly;
  rating: number;
  note: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface InspectionRecordTable {
  id: Generated<number>;
  agency_name: string;
  checked_items: string;
  inspection_date: DateOnly;
  recommendations: string | null;
  fee_paid: Money;
  tips_paid: Money;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface TaxRecordTable {
  id: Generated<number>;
  tax_name: string;
  description: string;
  frequency: 'monthly' | 'yearly';
  period_label: string;
  due_date: DateOnly;
  amount_due: Money;
  amount_paid: Money;
  payment_date: DateOnly | null;
  balance: Money;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface MaintenanceRecordTable {
  id: Generated<number>;
  maint_date: DateOnly;
  maintenance_frequency: 'daily' | 'weekly' | 'monthly' | null;
  equipment: string;
  description: string | null;
  cost: Money;
  vendor: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface CreditorTable {
  id: Generated<number>;
  name: string;
  category: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface PayableTransactionTable {
  id: Generated<number>;
  creditor_id: number;
  txn_date: DateOnly;
  description: string | null;
  amount_owed: Money;
  amount_paid: Money;
  balance: Money;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface Database {
  roll_intake: RollIntakeTable;
  packing_bag_batch: PackingBagBatchTable;
  packing_bag_usage_log: PackingBagUsageLogTable;
  daily_factory_log: DailyFactoryLogTable;
  distribution_record: DistributionRecordTable;
  distribution_transfer: DistributionTransferTable;
  customer: CustomerTable;
  customer_transaction: CustomerTransactionTable;
  worker: WorkerTable;
  salary_record: SalaryRecordTable;
  staff_rating: StaffRatingTable;
  inspection_record: InspectionRecordTable;
  tax_record: TaxRecordTable;
  maintenance_record: MaintenanceRecordTable;
  creditor: CreditorTable;
  payable_transaction: PayableTransactionTable;
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
export type UpdateDailyFactoryLog = Updateable<DailyFactoryLogTable>;
export type DistributionRecord = Selectable<DistributionRecordTable>;
export type NewDistributionRecord = Insertable<DistributionRecordTable>;
export type DistributionTransfer = Selectable<DistributionTransferTable>;
export type NewDistributionTransfer = Insertable<DistributionTransferTable>;
export type UpdateDistributionRecord = Updateable<DistributionRecordTable>;
export type Customer = Selectable<CustomerTable>;
export type NewCustomer = Insertable<CustomerTable>;
export type CustomerTransaction = Selectable<CustomerTransactionTable>;
export type NewCustomerTransaction = Insertable<CustomerTransactionTable>;
export type Worker = Selectable<WorkerTable>;
export type NewWorker = Insertable<WorkerTable>;
export type SalaryRecord = Selectable<SalaryRecordTable>;
export type NewSalaryRecord = Insertable<SalaryRecordTable>;
export type StaffRating = Selectable<StaffRatingTable>;
export type NewStaffRating = Insertable<StaffRatingTable>;
export type InspectionRecord = Selectable<InspectionRecordTable>;
export type NewInspectionRecord = Insertable<InspectionRecordTable>;
export type TaxRecord = Selectable<TaxRecordTable>;
export type NewTaxRecord = Insertable<TaxRecordTable>;
export type MaintenanceRecord = Selectable<MaintenanceRecordTable>;
export type NewMaintenanceRecord = Insertable<MaintenanceRecordTable>;
export type Creditor = Selectable<CreditorTable>;
export type NewCreditor = Insertable<CreditorTable>;
export type PayableTransaction = Selectable<PayableTransactionTable>;
export type NewPayableTransaction = Insertable<PayableTransactionTable>;
