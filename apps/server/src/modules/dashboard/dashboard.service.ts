import type { Kysely } from 'kysely';
import { Decimal } from 'decimal.js';
import { db } from '../../config/db.js';
import type { Database } from '../../database/types.js';

function businessDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dateShift(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function startOfWeek(date: string): string {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return dateShift(date, -((day + 6) % 7));
}

const emptyChannel = () => ({ quantity: '0', expected: '0.00', received: '0.00' });

export class DashboardService {
  constructor(private readonly database: Kysely<Database>) {}

  async summary() {
    const today = businessDate();
    const weekStart = startOfWeek(today);
    const monthStart = `${today.slice(0, 7)}-01`;
    const [factory, customerBalance, payableBalance, salaryBalance, rolls, bags, customerWeek, distributionWeek, distributionDay, salaryRows, taxRows] = await Promise.all([
      this.database.selectFrom('daily_factory_log').select('production').where('log_date', '=', today).executeTakeFirst(),
      this.database.selectFrom('customer_transaction').select((eb) => eb.fn.coalesce(eb.fn.sum('balance'), eb.val('0')).as('value')).executeTakeFirstOrThrow(),
      this.database.selectFrom('payable_transaction').select((eb) => eb.fn.coalesce(eb.fn.sum('balance'), eb.val('0')).as('value')).executeTakeFirstOrThrow(),
      this.database.selectFrom('salary_record').select((eb) => eb.fn.coalesce(eb.fn.sum('balance'), eb.val('0')).as('value')).executeTakeFirstOrThrow(),
      this.database.selectFrom('roll_intake').select((eb) => eb.fn.coalesce(eb.fn.sum('total_kg'), eb.val('0')).as('value'))
        .where('intake_date', '>=', monthStart).where('intake_date', '<=', today).executeTakeFirstOrThrow(),
      this.database.selectFrom('packing_bag_batch').select((eb) => eb.fn.coalesce(eb.fn.sum('quantity_remaining'), eb.val('0')).as('value')).executeTakeFirstOrThrow(),
      this.customerTotals(weekStart, today),
      this.distributionTotals(weekStart, today),
      this.distributionTotals(today, today),
      this.database.selectFrom('salary_record as s').innerJoin('worker as w', 'w.id', 's.worker_id')
        .select(['s.id', 's.worker_id', 's.pay_period', 's.due_date', 's.balance', 'w.name', 'w.salary_frequency'])
        .where('s.balance', '>', '0').where('s.due_date', '<=', today).orderBy('s.due_date', 'asc').execute(),
      this.database.selectFrom('tax_record').select(['id', 'tax_name', 'description', 'frequency', 'period_label', 'due_date', 'balance'])
        .where('balance', '>', '0').where('due_date', '<=', today).orderBy('due_date', 'asc').execute(),
    ]);
    return {
      todayProduction: factory?.production ?? 0,
      owedToUs: customerBalance.value,
      weOwe: new Decimal(payableBalance.value).plus(salaryBalance.value).toFixed(2),
      salaryLiability: salaryBalance.value,
      rollsThisMonthKg: rolls.value,
      bagsRemaining: bags.value,
      customerSalesThisWeek: customerWeek,
      distributionThisWeek: distributionWeek,
      distributionToday: distributionDay,
      salaryAlerts: salaryRows.map((record) => ({ ...record, status: record.due_date === today ? 'due' : 'overdue' })),
      taxAlerts: taxRows.map((record) => ({ ...record, status: record.due_date === today ? 'due' : 'overdue' })),
      weekStart,
      weekEnd: today,
      today,
    };
  }

  private async customerTotals(from: string, to: string) {
    const salesQuery = this.database.selectFrom('customer_transaction')
      .select((eb) => [
        eb.fn.coalesce(eb.fn.sum('quantity'), eb.val('0')).as('quantity'),
        eb.fn.coalesce(eb.fn.sum('amount_expected'), eb.val('0')).as('expected'),
        eb.fn.coalesce(eb.fn.sum('balance'), eb.val('0')).as('balance'),
      ]).where('txn_date', '>=', from).where('txn_date', '<=', to).executeTakeFirstOrThrow();
    const receivedQuery = this.database.selectFrom('customer_transaction')
      .select((eb) => eb.fn.coalesce(eb.fn.sum('amount_paid'), eb.val('0')).as('received'))
      .where('payment_date', '>=', from).where('payment_date', '<=', to).executeTakeFirstOrThrow();
    const [row, received] = await Promise.all([salesQuery, receivedQuery]);
    return { ...row, received: received.received };
  }

  private async distributionTotals(from: string, to: string) {
    const rows = await this.database.selectFrom('distribution_record as d')
      .select('d.channel')
      .select((eb) => [
        eb.fn.coalesce(eb.fn.sum('d.quantity_given'), eb.val('0')).as('quantity'),
        eb.fn.coalesce(eb.fn.sum('d.amount_expected'), eb.val('0')).as('expected'),
        eb.fn.coalesce(eb.fn.sum('d.amount_returned'), eb.val('0')).as('cash_received'),
      ]).where('d.dist_date', '>=', from).where('d.dist_date', '<=', to).groupBy('d.channel').execute();
    const transferRows = await this.database.selectFrom('distribution_transfer as t')
      .innerJoin('distribution_record as d', 'd.id', 't.distribution_id')
      .select('d.channel').select((eb) => eb.fn.sum('t.amount').as('transfers_received'))
      .where('t.transfer_date', '>=', from).where('t.transfer_date', '<=', to).groupBy('d.channel').execute();
    const result = { keke: emptyChannel(), van: emptyChannel() } as Record<'keke' | 'van', { quantity: string; expected: string; received: string }>;
    for (const row of rows) {
      result[row.channel] = {
        quantity: String(row.quantity), expected: String(row.expected),
        received: new Decimal(row.cash_received).toFixed(2),
      };
    }
    for (const row of transferRows) {
      result[row.channel].received = new Decimal(result[row.channel].received).plus(row.transfers_received).toFixed(2);
    }
    return result;
  }
}

export const dashboardService = new DashboardService(db);
