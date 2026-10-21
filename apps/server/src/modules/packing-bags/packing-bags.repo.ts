import type { Kysely } from 'kysely';
import type { Database, NewPackingBagBatch, PackingBagBatch } from '../../database/types.js';
import { db } from '../../config/db.js';

export class PackingBagsRepository {
  constructor(private readonly database: Kysely<Database>) {}

  async list(): Promise<PackingBagBatch[]> {
    return this.database.selectFrom('packing_bag_batch').selectAll()
      .orderBy('received_date', 'desc').orderBy('id', 'desc').execute();
  }

  async create(batch: NewPackingBagBatch): Promise<PackingBagBatch> {
    const result = await this.database.insertInto('packing_bag_batch').values(batch).executeTakeFirstOrThrow();
    return this.database.selectFrom('packing_bag_batch').selectAll()
      .where('id', '=', Number(result.insertId)).executeTakeFirstOrThrow();
  }

  async useBatch(id: number, usageDate: string, quantity: number): Promise<
    | { status: 'not_found' }
    | { status: 'insufficient'; remaining: number }
    | { status: 'used'; batch: PackingBagBatch }
  > {
    return this.database.transaction().execute(async (trx) => {
      const batch = await trx.selectFrom('packing_bag_batch').selectAll()
        .where('id', '=', id).forUpdate().executeTakeFirst();
      if (!batch) return { status: 'not_found' };
      if (quantity > batch.quantity_remaining) {
        return { status: 'insufficient', remaining: batch.quantity_remaining };
      }

      await trx.updateTable('packing_bag_batch').set({
        quantity_used: batch.quantity_used + quantity,
        quantity_remaining: batch.quantity_remaining - quantity,
      }).where('id', '=', id).execute();
      await trx.insertInto('packing_bag_usage_log').values({
        batch_id: id,
        usage_date: usageDate,
        quantity_used: quantity,
      }).execute();

      const updated = await trx.selectFrom('packing_bag_batch').selectAll()
        .where('id', '=', id).executeTakeFirst();
      if (!updated) throw new Error('Packing bag batch disappeared during usage update');
      return { status: 'used', batch: updated };
    });
  }
}

export const packingBagsRepository = new PackingBagsRepository(db);
