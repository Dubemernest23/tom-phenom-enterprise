# Reset application data and seed a fresh admin

`apps/server/src/database/reset-and-seed.ts` clears every application table in one database transaction, then inserts one fresh `ADMIN` account. It retains the schema and Kysely migration history, so it does not need to rerun migrations. Existing admin, manager, and supervisor accounts are deleted too.

## Before you run it

- Take a database backup if any records might be needed later.
- Confirm `DATABASE_URL` points at the intended database.
- Set `OWNER_USERNAME` and `OWNER_PASSWORD` to the new admin credentials. The password must be unique and at least 12 characters. The script does not print the password.
- Run from a trusted machine that can connect to the MySQL database. Render Free web services do not provide dashboard Shell or SSH access.

## Run from PowerShell

From the project root, set the database URL and credentials in the current PowerShell session. Use private prompts so secrets do not appear in command history:

```powershell
$env:DATABASE_URL = Read-Host 'MySQL DATABASE_URL'
$env:OWNER_USERNAME = Read-Host 'New admin username'
$securePassword = Read-Host 'New admin password (12+ characters)' -AsSecureString
$env:OWNER_PASSWORD = [System.Net.NetworkCredential]::new('', $securePassword).Password

npm --prefix apps/server run db:reset-and-seed -- --confirm-reset

Remove-Item Env:DATABASE_URL, Env:OWNER_USERNAME, Env:OWNER_PASSWORD
Remove-Variable securePassword
```

The command prints the target database host and name. It then requires you to type the exact confirmation shown, in the form `RESET host/database`. If it does not match, no rows are deleted. The reset and new admin insert run in a transaction; if any step fails, the transaction rolls back.

After a successful reset, sign in with the new admin account. Create manager and supervisor accounts again from **Access accounts** if needed. Do not run `db:seed` afterward; the reset command already seeds the replacement admin.

## Tables cleared

The script deletes records from packing-bag use and batches, distribution transfers and records, customer transactions and customers, salary records and staff ratings and workers, payable transactions and creditors, roll intake, factory logs, maintenance, inspections, taxes, and admin accounts.

The `kysely_migration` and `kysely_migration_lock` tables are retained. This keeps the existing schema version so the next server start does not try to recreate tables.
