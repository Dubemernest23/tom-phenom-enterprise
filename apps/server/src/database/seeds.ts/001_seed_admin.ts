import type { Kysely } from 'kysely';
import type { Database } from '../types.js';

export async function seedUsers(
  db: Kysely<Database>,
): Promise<void> {
  await db
    .insertInto('users')
    .values([
      {
        name: 'System Administrator',
        email: 'admin@example.com',
        password_hash: 'REPLACE_WITH_HASH',
        role: 'admin',
      },
      {
        name: 'John Doe',
        email: 'john@example.com',
        password_hash: 'REPLACE_WITH_HASH',
        role: 'user',
      },
    ])
    .execute();
}