import type { Kysely } from 'kysely';
import { db } from '../../config/db.js';
import type { Database, NewMaintenanceRecord } from '../../database/types.js';

export class MaintenanceRepository {
  constructor(private readonly database: Kysely<Database>) {}
  list() { return this.database.selectFrom('maintenance_record').selectAll().orderBy('maint_date', 'desc').orderBy('id', 'desc').execute(); }
  async create(input: NewMaintenanceRecord) {
    const result = await this.database.insertInto('maintenance_record').values(input).executeTakeFirstOrThrow();
    return this.database.selectFrom('maintenance_record').selectAll().where('id', '=', Number(result.insertId)).executeTakeFirstOrThrow();
  }
}
export const maintenanceRepository = new MaintenanceRepository(db);
