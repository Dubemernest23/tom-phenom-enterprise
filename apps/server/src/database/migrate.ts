import { promises as fs } from 'node:fs';
import path from 'node:path';
import { FileMigrationProvider, Migrator } from 'kysely/migration';

import { db } from '../config/db.js';
import { WindowsSafeMigrationProvider } from './windows-safe-migration-provider.js';

const migrationFolder = path.join(
  process.cwd(),
  'src',
  'database',
  'migrations',
);

const runMigrations = async (): Promise<void> => {

  const migrationProvider = new WindowsSafeMigrationProvider(migrationFolder);

  const migrator = new Migrator({
    db,
    provider: migrationProvider,
  });

  const { error, results } = await migrator.migrateToLatest();

  if (results) {
    for (const result of results) {
      if (result.status === 'Success') {
        console.log(`Migration "${result.migrationName}" executed successfully.`);
      } else if (result.status === 'Error') {
        console.error(`Migration "${result.migrationName}" failed.`);
      }
    }
  }

  if (error) {
    console.error('Migration failed:', error);
    throw error;
  }

  console.log('All migrations completed successfully.');
};

runMigrations()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });