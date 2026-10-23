import type { Kysely } from 'kysely';
import { db } from '../../config/db.js';
import type { Customer, CustomerTransaction, Database, NewCustomer, NewCustomerTransaction } from '../../database/types.js';

export class CustomersRepository {
  constructor(private readonly database: Kysely<Database>) {}

  list() {
    return this.database.selectFrom('customer as c')
      .leftJoin('customer_transaction as t', 't.customer_id', 'c.id')
      .select(['c.id', 'c.name', 'c.phone', 'c.created_at', 'c.updated_at'])
      .select((eb) => eb.fn.coalesce(eb.fn.sum('t.balance'), eb.val('0')).as('balance'))
      .groupBy(['c.id', 'c.name', 'c.phone', 'c.created_at', 'c.updated_at'])
      .orderBy('balance', 'desc').orderBy('c.name', 'asc').execute();
  }

  findById(id: number): Promise<Customer | undefined> {
    return this.database.selectFrom('customer').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async detail(id: number) {
    const customer = await this.findById(id);
    if (!customer) return undefined;
    const transactions = await this.database.selectFrom('customer_transaction').selectAll()
      .where('customer_id', '=', id).orderBy('txn_date', 'desc').orderBy('id', 'desc').execute();
    const [aggregate] = await this.database.selectFrom('customer_transaction')
      .select((eb) => eb.fn.coalesce(eb.fn.sum('balance'), eb.val('0')).as('balance'))
      .where('customer_id', '=', id).execute();
    return { ...customer, balance: aggregate?.balance ?? '0.00', transactions };
  }

  async create(input: NewCustomer): Promise<Customer> {
    const result = await this.database.insertInto('customer').values(input).executeTakeFirstOrThrow();
    return (await this.findById(Number(result.insertId)))!;
  }

  async addTransaction(input: NewCustomerTransaction): Promise<CustomerTransaction> {
    const result = await this.database.insertInto('customer_transaction').values(input).executeTakeFirstOrThrow();
    return this.database.selectFrom('customer_transaction').selectAll()
      .where('id', '=', Number(result.insertId)).executeTakeFirstOrThrow();
  }

  async updateTransaction(customerId: number, transactionId: number, changes: Partial<NewCustomerTransaction>) {
    const result = await this.database.updateTable('customer_transaction').set(changes)
      .where('customer_id', '=', customerId).where('id', '=', transactionId).executeTakeFirst();
    if (Number(result.numUpdatedRows) === 0) return undefined;
    return this.database.selectFrom('customer_transaction').selectAll()
      .where('customer_id', '=', customerId).where('id', '=', transactionId).executeTakeFirst();
  }
}

export const customersRepository = new CustomersRepository(db);
