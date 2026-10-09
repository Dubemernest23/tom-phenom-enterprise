// apps/server/src/database/windows-safe-migration-provider.ts
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Migration, MigrationProvider } from 'kysely/migration';

export class WindowsSafeMigrationProvider implements MigrationProvider {
  constructor(private migrationFolder: string) {}

  async getMigrations(): Promise<Record<string, Migration>> {
    const migrations: Record<string, Migration> = {};
    const files = await fs.readdir(this.migrationFolder);

    for (const fileName of files) {
      if (!fileName.endsWith('.ts') && !fileName.endsWith('.js')) continue;

      const filePath = path.join(this.migrationFolder, fileName);
      const fileUrl = pathToFileURL(filePath).href; // the actual fix — real file:// URL
      const migration = await import(fileUrl);

      const migrationKey = fileName.substring(0, fileName.lastIndexOf('.'));
      migrations[migrationKey] = migration;
    }

    return migrations;
  }
}