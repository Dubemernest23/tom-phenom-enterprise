import type { Kysely } from 'kysely';
import { db } from '../../config/db.js';
import type { Database, NewInspectionRecord } from '../../database/types.js';
export class InspectionsRepository {
  constructor(private readonly database: Kysely<Database>) {}
  list() { return this.database.selectFrom('inspection_record').selectAll().orderBy('inspection_date', 'desc').orderBy('id', 'desc').execute(); }
  find(id: number) { return this.database.selectFrom('inspection_record').selectAll().where('id', '=', id).executeTakeFirst(); }
  async create(input: NewInspectionRecord) {
    const result = await this.database.insertInto('inspection_record').values(input).executeTakeFirstOrThrow();
    return this.find(Number(result.insertId));
  }
  async update(id: number, input: Partial<NewInspectionRecord>) {
    await this.database.updateTable('inspection_record').set(input).where('id', '=', id).execute();
    return this.find(id);
  }
}
export const inspectionsRepository = new InspectionsRepository(db);
