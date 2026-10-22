import type { Kysely } from 'kysely';
import type { Database, DailyFactoryLog, NewDailyFactoryLog, UpdateDailyFactoryLog } from '../../database/types.js';
import { db } from '../../config/db.js';

export class FactoryLogRepository {
  constructor(private readonly database: Kysely<Database>) {}

  list(): Promise<DailyFactoryLog[]> {
    return this.database.selectFrom('daily_factory_log').selectAll()
      .orderBy('log_date', 'desc').orderBy('id', 'desc').execute();
  }

  async create(record: NewDailyFactoryLog): Promise<DailyFactoryLog> {
    const result = await this.database.insertInto('daily_factory_log')
      .values(record).executeTakeFirstOrThrow();
    return this.database.selectFrom('daily_factory_log').selectAll()
      .where('id', '=', Number(result.insertId)).executeTakeFirstOrThrow();
  }

  findById(id: number): Promise<DailyFactoryLog | undefined> {
    return this.database.selectFrom('daily_factory_log').selectAll()
      .where('id', '=', id).executeTakeFirst();
  }

  async update(id: number, changes: UpdateDailyFactoryLog): Promise<DailyFactoryLog | undefined> {
    await this.database.updateTable('daily_factory_log').set(changes)
      .where('id', '=', id).execute();
    return this.findById(id);
  }
}

export const factoryLogRepository = new FactoryLogRepository(db);
