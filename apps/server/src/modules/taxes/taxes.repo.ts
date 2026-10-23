import type { Kysely } from 'kysely';
import { db } from '../../config/db.js';
import type { Database, NewTaxRecord } from '../../database/types.js';
export class TaxesRepository {
  constructor(private readonly database: Kysely<Database>) {}
  list() { return this.database.selectFrom('tax_record').selectAll().orderBy('due_date', 'asc').orderBy('id', 'desc').execute(); }
  find(id: number) { return this.database.selectFrom('tax_record').selectAll().where('id', '=', id).executeTakeFirst(); }
  findPeriod(taxName: string, description: string, period: string, exceptId?: number) {
    let query = this.database.selectFrom('tax_record').select('id')
      .where('tax_name', '=', taxName).where('description', '=', description).where('period_label', '=', period);
    if (exceptId !== undefined) query = query.where('id', '!=', exceptId);
    return query.executeTakeFirst();
  }
  async create(input: NewTaxRecord) {
    const result = await this.database.insertInto('tax_record').values(input).executeTakeFirstOrThrow();
    return this.find(Number(result.insertId));
  }
  async update(id: number, input: Partial<NewTaxRecord>) {
    await this.database.updateTable('tax_record').set(input).where('id', '=', id).execute();
    return this.find(id);
  }
}
export const taxesRepository = new TaxesRepository(db);
