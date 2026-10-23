import type { Kysely } from 'kysely';
import { db } from '../../config/db.js';
import type { Database, NewSalaryRecord, NewStaffRating, NewWorker, SalaryRecord, StaffRating, Worker } from '../../database/types.js';

export class PayrollRepository {
  constructor(private readonly database: Kysely<Database>) {}

  listWorkers() {
    return this.database.selectFrom('worker as w')
      .leftJoin('salary_record as s', 's.worker_id', 'w.id')
      .select(['w.id', 'w.name', 'w.role', 'w.state_of_origin', 'w.base_salary', 'w.start_date', 'w.salary_frequency', 'w.created_at', 'w.updated_at'])
      .select((eb) => eb.fn.coalesce(eb.fn.sum('s.balance'), eb.val('0')).as('balance'))
      .groupBy(['w.id', 'w.name', 'w.role', 'w.state_of_origin', 'w.base_salary', 'w.start_date', 'w.salary_frequency', 'w.created_at', 'w.updated_at'])
      .orderBy('w.name', 'asc').execute();
  }

  findWorker(id: number): Promise<Worker | undefined> {
    return this.database.selectFrom('worker').selectAll().where('id', '=', id).executeTakeFirst();
  }

  latestRating(workerId: number) {
    return this.database.selectFrom('staff_rating').select(['rating', 'rating_month'])
      .where('worker_id', '=', workerId).orderBy('rating_month', 'desc').executeTakeFirst();
  }

  async detail(id: number) {
    const worker = await this.findWorker(id);
    if (!worker) return undefined;
    const records = await this.database.selectFrom('salary_record').selectAll()
      .where('worker_id', '=', id).orderBy('pay_period', 'desc').orderBy('id', 'desc').execute();
    const [aggregate] = await this.database.selectFrom('salary_record')
      .select((eb) => eb.fn.coalesce(eb.fn.sum('balance'), eb.val('0')).as('balance'))
      .where('worker_id', '=', id).execute();
    const ratings = await this.database.selectFrom('staff_rating').selectAll().where('worker_id', '=', id)
      .orderBy('rating_month', 'desc').execute();
    return { ...worker, balance: aggregate?.balance ?? '0.00', records, ratings };
  }

  async createWorker(input: NewWorker): Promise<Worker> {
    const result = await this.database.insertInto('worker').values(input).executeTakeFirstOrThrow();
    return (await this.findWorker(Number(result.insertId)))!;
  }

  async updateWorker(id: number, changes: Partial<NewWorker>): Promise<Worker | undefined> {
    await this.database.updateTable('worker').set(changes).where('id', '=', id).execute();
    return this.findWorker(id);
  }

  async saveRating(input: NewStaffRating): Promise<StaffRating> {
    await this.database.insertInto('staff_rating').values(input)
      .onDuplicateKeyUpdate({ rating: input.rating, note: input.note }).execute();
    return this.database.selectFrom('staff_rating').selectAll()
      .where('worker_id', '=', input.worker_id).where('rating_month', '=', input.rating_month).executeTakeFirstOrThrow();
  }

  async addRecord(input: NewSalaryRecord): Promise<SalaryRecord> {
    const result = await this.database.insertInto('salary_record').values(input).executeTakeFirstOrThrow();
    return this.database.selectFrom('salary_record').selectAll()
      .where('id', '=', Number(result.insertId)).executeTakeFirstOrThrow();
  }

  findSalaryPeriod(workerId: number, payPeriod: string) {
    return this.database.selectFrom('salary_record').select('id')
      .where('worker_id', '=', workerId).where('pay_period', '=', payPeriod).executeTakeFirst();
  }

  async nextUnpaidSalaryDue(workerId: number): Promise<string | null> {
    const record = await this.database.selectFrom('salary_record').select('due_date')
      .where('worker_id', '=', workerId).where('balance', '>', '0').where('due_date', 'is not', null)
      .orderBy('due_date', 'asc').executeTakeFirst();
    return record?.due_date ? String(record.due_date).slice(0, 10) : null;
  }

  async latestSalaryDueDate(workerId: number): Promise<string | null> {
    const record = await this.database.selectFrom('salary_record').select('due_date')
      .where('worker_id', '=', workerId).where('due_date', 'is not', null)
      .orderBy('due_date', 'desc').orderBy('id', 'desc').executeTakeFirst();
    return record?.due_date ? String(record.due_date).slice(0, 10) : null;
  }

  findSalaryRecord(workerId: number, recordId: number) {
    return this.database.selectFrom('salary_record').selectAll()
      .where('worker_id', '=', workerId).where('id', '=', recordId).executeTakeFirst();
  }

  async updateRecord(workerId: number, recordId: number, changes: Partial<NewSalaryRecord>) {
    await this.database.updateTable('salary_record').set(changes)
      .where('worker_id', '=', workerId).where('id', '=', recordId).execute();
    return this.database.selectFrom('salary_record').selectAll()
      .where('worker_id', '=', workerId).where('id', '=', recordId).executeTakeFirst();
  }
}

export const payrollRepository = new PayrollRepository(db);
