import type { Kysely } from 'kysely';
import type { Database } from '../types.js';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('id', 'integer', column =>
      column
        .autoIncrement()
        .primaryKey(),
    )
    .addColumn('name', 'varchar(100)', column =>
      column.notNull(),
    )
    .addColumn('email', 'varchar(255)', column =>
      column
        .notNull()
        .unique(),
    )
    .addColumn('password_hash', 'varchar(255)', column =>
      column.notNull(),
    )
    .addColumn('role', 'varchar(20)', column =>
      column
        .notNull()
        .defaultTo('user'),
    )
    .addColumn('created_at', 'timestamp', column =>
      column
        .notNull()
        .defaultTo(db.fn.now()),
    )
    .addColumn('updated_at', 'timestamp', column =>
      column
        .notNull()
        .defaultTo(db.fn.now()),
    )
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .dropTable('users')
    .execute();
}