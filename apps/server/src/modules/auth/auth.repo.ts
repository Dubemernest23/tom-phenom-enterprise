import type { Kysely } from 'kysely';
import type { Database } from '../../database/types.js';

const adminColumns = [
  'id',
  'username',
  'password',
  'role',
  'created_at',
  'updated_at',
] as const;

export class AdminRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findById(id: number) {
    return this.db
      .selectFrom('admin')
      .select(adminColumns)
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async findByUsername(username: string) {
    return this.db
      .selectFrom('admin')
      .select(adminColumns)
      .where('username', '=', username)
      .executeTakeFirst();
  }

  async updatePassword(id: number, passwordHash: string): Promise<boolean> {
    const result = await this.db
      .updateTable('admin')
      .set({ password: passwordHash })
      .where('id', '=', id)
      .executeTakeFirst();

    return Number(result.numUpdatedRows) > 0;
  }
}