import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';
import { env } from '../config/env.js';

const RESET_TABLES = [
  'packing_bag_usage_log',
  'packing_bag_batch',
  'distribution_transfer',
  'distribution_record',
  'customer_transaction',
  'customer',
  'salary_record',
  'staff_rating',
  'worker',
  'payable_transaction',
  'creditor',
  'roll_intake',
  'daily_factory_log',
  'maintenance_record',
  'inspection_record',
  'tax_record',
  'admin',
] as const;

async function main() {
  if (!process.argv.includes('--confirm-reset')) {
    throw new Error('This deletes ALL application records and admin accounts. Re-run with --confirm-reset to continue.');
  }
  if (!env.databaseUrl) throw new Error('DATABASE_URL is required.');
  if (!env.ownerUsername || env.ownerUsername.trim().length < 3) throw new Error('Set OWNER_USERNAME to the new admin username.');
  if (!env.ownerPassword || env.ownerPassword === 'change-me' || env.ownerPassword.trim().length < 12) {
    throw new Error('Set OWNER_PASSWORD to a new, unique password with at least 12 characters.');
  }

  const databaseUrl = new URL(env.databaseUrl);
  const databaseName = decodeURIComponent(databaseUrl.pathname.replace(/^\//, ''));
  const confirmation = `RESET ${databaseUrl.hostname}/${databaseName}`;
  console.log('WARNING: This permanently clears every application table and replaces all admin accounts.');
  console.log(`Target database: ${databaseUrl.hostname}/${databaseName}`);
  console.log(`The schema and migration history are kept. A new ADMIN account will be seeded as "${env.ownerUsername}".`);

  const prompt = createInterface({ input: stdin, output: stdout });
  let answer: string;
  try {
    answer = (await prompt.question(`Type exactly "${confirmation}" to proceed: `)).trim();
  } finally {
    prompt.close();
  }
  if (answer !== confirmation) throw new Error('Confirmation did not match. No database changes were made.');

  const passwordHash = await bcrypt.hash(env.ownerPassword, 12);
  const deleted = await db.transaction().execute(async (trx) => {
    const counts: Record<string, number> = {};
    for (const table of RESET_TABLES) {
      const result = await trx.deleteFrom(table).executeTakeFirst();
      counts[table] = Number(result.numDeletedRows || 0);
    }
    await trx.insertInto('admin').values({
      username: env.ownerUsername.trim(),
      password: passwordHash,
      role: 'ADMIN',
    }).executeTakeFirstOrThrow();
    return counts;
  });

  console.log('Application data cleared and new admin seeded. Deleted row counts:');
  for (const [table, count] of Object.entries(deleted)) console.log(`  ${table}: ${count}`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
