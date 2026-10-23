import { Decimal } from 'decimal.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/appError.js';
import { payrollRepository, type PayrollRepository } from './payroll.repo.js';
import type { CreateSalaryRecordInput, CreateWorkerInput } from './payroll.val.js';

const MAX_BALANCE = new Decimal('9999999999.99');

function lagosDate(): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export class PayrollService {
  constructor(private readonly repo: PayrollRepository) {}
  async list() {
    const workers = await this.repo.listWorkers();
    return Promise.all(workers.map(async (worker) => {
      const unpaidDue = await this.repo.nextUnpaidSalaryDue(worker.id);
      const latestDue = unpaidDue ? null : await this.repo.latestSalaryDueDate(worker.id);
      return { ...worker, ...await this.nextPayInfo(worker, unpaidDue, latestDue) };
    }));
  }
  async getById(id: number) {
    const worker = await this.repo.detail(id);
    if (!worker) throw new NotFoundError('Worker not found');
    const unpaidDue = await this.repo.nextUnpaidSalaryDue(worker.id);
    const latestDue = unpaidDue ? null : await this.repo.latestSalaryDueDate(worker.id);
    return { ...worker, ...await this.nextPayInfo(worker, unpaidDue, latestDue) };
  }
  create(input: CreateWorkerInput) {
    return this.repo.createWorker({
      ...input, role: input.role || null, state_of_origin: input.state_of_origin || null,
      genotype: input.genotype || null, blood_group: input.blood_group || null,
      base_salary: input.salary_frequency === 'monthly' ? String(input.base_salary) : null,
    });
  }

  private async nextPayInfo(worker: { id: number; start_date: string | null; salary_frequency: 'monthly' | 'weekly' | 'daily' }, unpaidDue: string | null, latestDue: string | null) {
    if (worker.salary_frequency === 'daily') return { next_pay_date: null, days_until_next_pay: null, next_pay_label: 'Paid per workday' };
    const nextDate = unpaidDue || this.scheduledPayDate(latestDue || worker.start_date, worker.salary_frequency);
    if (!nextDate) return { next_pay_date: null, days_until_next_pay: null, next_pay_label: 'Set a start date' };
    const todayDate = new Date(`${lagosDate()}T00:00:00Z`);
    const target = new Date(`${String(nextDate).slice(0, 10)}T00:00:00Z`);
    const days = Math.round((target.getTime() - todayDate.getTime()) / 86_400_000);
    return { next_pay_date: String(nextDate).slice(0, 10), days_until_next_pay: days,
      next_pay_label: days < 0 ? `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue` : days === 0 ? 'Due today' : `${days} day${days === 1 ? '' : 's'} left` };
  }

  private scheduledPayDate(anchorDate: string | null, frequency: 'monthly' | 'weekly'): string | null {
    if (!anchorDate) return null;
    const current = new Date(`${lagosDate()}T00:00:00Z`);
    const anchor = new Date(`${String(anchorDate).slice(0, 10)}T00:00:00Z`);
    const anchorDay = anchor.getUTCDate();
    let periods = 1;
    const dueDate = () => {
      if (frequency === 'weekly') return new Date(anchor.getTime() + periods * 7 * 86_400_000);
      const monthIndex = anchor.getUTCMonth() + periods;
      const year = anchor.getUTCFullYear() + Math.floor(monthIndex / 12);
      const month = monthIndex % 12;
      const maxDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      return new Date(Date.UTC(year, month, Math.min(anchorDay, maxDay)));
    };
    let due = dueDate();
    while (due < current) { periods += 1; due = dueDate(); }
    return due.toISOString().slice(0, 10);
  }
  async addRecord(id: number, input: CreateSalaryRecordInput) {
    const worker = await this.repo.findWorker(id);
    if (!worker) throw new NotFoundError('Worker not found');
    const periodMatches = this.validPeriod(worker.salary_frequency, input.pay_period);
    if (!periodMatches) throw new BadRequestError(`Pay period must match the worker's ${worker.salary_frequency} schedule.`);
    if (await this.repo.findSalaryPeriod(id, input.pay_period)) throw new ConflictError('A salary record already exists for this pay period. Edit the existing record.');
    const balance = new Decimal(input.salary_due).minus(input.advance).minus(input.amount_paid);
    if (balance.abs().gt(MAX_BALANCE)) throw new BadRequestError('Salary balance exceeds the supported amount.');
    return this.repo.addRecord({
      worker_id: id, pay_period: input.pay_period, due_date: input.due_date, salary_due: String(input.salary_due),
      advance: String(input.advance), amount_paid: String(input.amount_paid), balance: balance.toFixed(2),
    });
  }

  async updateRecord(id: number, recordId: number, input: CreateSalaryRecordInput) {
    const worker = await this.repo.findWorker(id);
    if (!worker) throw new NotFoundError('Worker not found');
    if (!(await this.repo.findSalaryRecord(id, recordId))) throw new NotFoundError('Salary record not found');
    const periodMatches = this.validPeriod(worker.salary_frequency, input.pay_period);
    if (!periodMatches) throw new BadRequestError(`Pay period must match the worker's ${worker.salary_frequency} schedule.`);
    const duplicate = await this.repo.findSalaryPeriod(id, input.pay_period);
    if (duplicate && Number(duplicate.id) !== recordId) throw new ConflictError('A salary record already exists for this pay period.');
    const balance = new Decimal(input.salary_due).minus(input.advance).minus(input.amount_paid);
    if (balance.abs().gt(MAX_BALANCE)) throw new BadRequestError('Salary balance exceeds the supported amount.');
    const updated = await this.repo.updateRecord(id, recordId, {
      pay_period: input.pay_period, due_date: input.due_date, salary_due: String(input.salary_due),
      advance: String(input.advance), amount_paid: String(input.amount_paid), balance: balance.toFixed(2),
    });
    if (!updated) throw new NotFoundError('Salary record not found');
    return updated;
  }

  private validPeriod(frequency: 'monthly' | 'weekly' | 'daily', period: string) {
    if (frequency === 'monthly') return /^\d{4}-(0[1-9]|1[0-2])$/.test(period);
    if (frequency === 'weekly') return /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/.test(period);
    if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(period)) return false;
    const date = new Date(`${period}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === period;
  }
}

export const payrollService = new PayrollService(payrollRepository);
