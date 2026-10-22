import type { Kysely } from 'kysely';
import { db } from '../../config/db.js';
import type { CreditorTable, Database, NewPayableTransaction, PayableTransaction } from '../../database/types.js';

export class PayablesRepository {
  constructor(private readonly database: Kysely<Database>) {}
  list() {
    return this.database.selectFrom('creditor as c').leftJoin('payable_transaction as t', 't.creditor_id', 'c.id')
      .select(['c.id', 'c.name', 'c.category', 'c.created_at', 'c.updated_at'])
      .select((eb) => eb.fn.coalesce(eb.fn.sum('t.balance'), eb.val('0')).as('balance'))
      .groupBy(['c.id', 'c.name', 'c.category', 'c.created_at', 'c.updated_at'])
      .orderBy('balance', 'desc').orderBy('c.name', 'asc').execute();
  }
  findCreditor(id: number) { return this.database.selectFrom('creditor').selectAll().where('id', '=', id).executeTakeFirst(); }
  async detail(id: number) {
    const creditor = await this.findCreditor(id);
    if (!creditor) return undefined;
    const transactions = await this.database.selectFrom('payable_transaction').selectAll().where('creditor_id', '=', id)
      .orderBy('txn_date', 'desc').orderBy('id', 'desc').execute();
    const [sum] = await this.database.selectFrom('payable_transaction').select((eb) => eb.fn.coalesce(eb.fn.sum('balance'), eb.val('0')).as('balance'))
      .where('creditor_id', '=', id).execute();
    return { ...creditor, balance: sum?.balance ?? '0.00', transactions };
  }
  async create(input: Omit<CreditorTable, 'id' | 'created_at' | 'updated_at'>) {
    const result = await this.database.insertInto('creditor').values(input).executeTakeFirstOrThrow();
    return this.findCreditor(Number(result.insertId));
  }
  async addTransaction(input: NewPayableTransaction): Promise<PayableTransaction> {
    const result = await this.database.insertInto('payable_transaction').values(input).executeTakeFirstOrThrow();
    return this.database.selectFrom('payable_transaction').selectAll().where('id', '=', Number(result.insertId)).executeTakeFirstOrThrow();
  }
}
export const payablesRepository = new PayablesRepository(db);
