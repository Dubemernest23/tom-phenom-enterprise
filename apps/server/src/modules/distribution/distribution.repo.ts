import type { Kysely } from 'kysely';
import type { Database, DistributionRecord, DistributionTransfer, NewDistributionRecord, NewDistributionTransfer } from '../../database/types.js';
import { db } from '../../config/db.js';

export class DistributionRepository {
  constructor(private readonly database: Kysely<Database>) {}

  list(channel?: 'keke' | 'van'): Promise<DistributionRecord[]> {
    let query = this.database.selectFrom('distribution_record').selectAll();
    if (channel) query = query.where('channel', '=', channel);
    return query.orderBy('dist_date', 'desc').orderBy('id', 'desc').execute();
  }

  findById(id: number): Promise<DistributionRecord | undefined> {
    return this.database.selectFrom('distribution_record').selectAll()
      .where('id', '=', id).executeTakeFirst();
  }

  async findDetail(id: number): Promise<{ record: DistributionRecord; transfers: DistributionTransfer[] } | undefined> {
    const record = await this.findById(id);
    if (!record) return undefined;
    const transfers = await this.database.selectFrom('distribution_transfer').selectAll()
      .where('distribution_id', '=', id)
      .orderBy('transfer_date', 'desc').orderBy('id', 'desc').execute();
    return { record, transfers };
  }

  async create(record: NewDistributionRecord): Promise<DistributionRecord> {
    const result = await this.database.insertInto('distribution_record')
      .values(record).executeTakeFirstOrThrow();
    return this.database.selectFrom('distribution_record').selectAll()
      .where('id', '=', Number(result.insertId)).executeTakeFirstOrThrow();
  }

  async update(id: number, changes: Partial<NewDistributionRecord>): Promise<DistributionRecord | undefined> {
    await this.database.updateTable('distribution_record').set(changes).where('id', '=', id).execute();
    return this.findById(id);
  }

  async addTransfer(transfer: NewDistributionTransfer): Promise<DistributionTransfer> {
    const result = await this.database.insertInto('distribution_transfer').values(transfer).executeTakeFirstOrThrow();
    return this.database.selectFrom('distribution_transfer').selectAll()
      .where('id', '=', Number(result.insertId)).executeTakeFirstOrThrow();
  }

  async updateBalance(id: number, balance: string): Promise<DistributionRecord | undefined> {
    await this.database.updateTable('distribution_record').set({ balance }).where('id', '=', id).execute();
    return this.findById(id);
  }
}

export const distributionRepository = new DistributionRepository(db);
