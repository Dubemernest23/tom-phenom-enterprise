import bcrypt from 'bcrypt';
import type { Kysely } from 'kysely';
import type { Database } from '../types.js';

export async function seedAdmin(
  db: Kysely<Database>,
): Promise<void> {
  const passwordHash = await bcrypt.hash(
    'change-this-password',
    12,
  );

  await db
    .insertInto('admin')
    .values({
      username: 'admin',
      password: passwordHash,
      role: 'ADMIN',
    })
    .execute();
}