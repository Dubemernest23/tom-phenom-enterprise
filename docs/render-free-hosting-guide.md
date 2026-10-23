# Hosting this project on Render's Free tier

This guide deploys the existing frontend and API as two Render services and keeps the application's MySQL database on a MySQL-compatible provider. The project is a monorepo; its frontend is a plain static site and its backend is an Express service.

## Before starting

1. Push the project to a GitHub repository that Render can access.
2. Have a reachable MySQL database ready. This application uses MySQL-specific SQL and a MySQL connection URL, so Render's free PostgreSQL database is not a drop-in replacement.
3. Have the database host, database name, and user credentials ready. The server uses TLS with Node's trusted certificate authorities by default. If your MySQL provider uses a private CA, get its PEM certificate and add it as a Render Secret File.
4. Buy or use a domain name through a domain registrar. The domain registration itself is separate from Render; Render supports attaching domains and issuing TLS certificates.

## 1. Deploy the API as a free web service

1. Sign in to Render and choose **New → Web Service**. Connect the GitHub repository and select the branch to deploy.
2. Leave **Root Directory** blank so the service can use the monorepo root package and lockfile.
3. Set **Runtime** to Node.
4. Set the build command to:

   ```sh
   npm ci --include=dev && npm run build:server
   ```

   Keep `--include=dev`: the server build needs TypeScript and the `@types/*` packages declared in `apps/server`'s development dependencies. With `NODE_ENV=production`, plain `npm ci` omits those packages and TypeScript reports missing declarations for Express, CORS, Morgan, bcrypt, and JWT.

5. Set the start command to:

   ```sh
   npm --prefix apps/server start
   ```

6. Choose the **Free** instance type. Render provides a public `onrender.com` URL after the first deployment. The service uses Render's injected `PORT` setting.
7. Add these environment variables in the service's **Environment** settings:

   | Variable | Value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | Your MySQL connection URL, for example `mysql://USER:PASSWORD@HOST:PORT/DATABASE` (URL-encode special characters in credentials) |
   | `MYSQL_CA_CERT_PATH` | Optional path to the MySQL provider's private CA certificate. For a Render Secret File named `mysql-ca.pem`, set this to `/etc/secrets/mysql-ca.pem`. Leave unset when the provider certificate chains to a system trusted CA. |
   | `JWT_SECRET` | A long, random secret; do not reuse the development value |
   | `CORS_ORIGIN` | The frontend's exact HTTPS origin; fill this in after step 2, e.g. `https://your-frontend.onrender.com` |
   | `OWNER_USERNAME` | The initial admin username you will seed once |
   | `OWNER_PASSWORD` | A strong, unique initial admin password you will seed once |

   Do not put quotes around the CORS origin. If you later attach a custom frontend domain, add its exact origin to this comma-separated setting and redeploy the API.

   To add a private CA, open the API service's **Environment** page, upload the PEM under **Secret Files** with filename `mysql-ca.pem`, then set `MYSQL_CA_CERT_PATH` to `/etc/secrets/mysql-ca.pem`. Render makes secret files available at `/etc/secrets/<filename>` and redeploys the service after saving. The path setting takes precedence over `MYSQL_CA_CERT` and the local `apps/server/ca.pem` fallback.

8. Click **Create Web Service** and wait for the build and deploy to finish. Open `https://YOUR-API.onrender.com/health`; confirm the response says the service is healthy and the database reports `ok: true`.

## 2. Deploy the frontend as a free static site

1. Choose **New → Static Site**, connect the same repository and branch.
2. Set **Root Directory** to `apps/frontend`.
3. Set the build command to:

   ```sh
   npm ci && npm run build && printf "export const API_BASE_URL = '%s';\n" "$API_BASE_URL" > src/config.js
   ```

   This project serves its source modules directly, so publish the frontend root directory after the Tailwind CSS build.

4. Set **Publish Directory** to `.`
5. Add the static site's build environment variable:

   | Variable | Value |
   | --- | --- |
   | `API_BASE_URL` | `https://YOUR-API.onrender.com/api` |

6. Create the static site. Open its `onrender.com` URL, sign in, and confirm that dashboard data loads. The API's `CORS_ORIGIN` must exactly match this site's origin, with no `/api` suffix.

## 3. Run database migrations and seed the first admin

The repository's migrations create and update the tables. Run migrations against the production MySQL database before using the deployed app. Render Free web services do not offer dashboard Shell or SSH access, so run database commands from a trusted computer with network access to the database, not from a Render service shell. See Render's [shell-access compatibility table](https://render.com/docs/ssh).

In PowerShell, enter production credentials only into the prompts; do not save them in the repository:

```powershell
$env:DATABASE_URL = Read-Host 'Production MySQL DATABASE_URL'
npm --prefix apps/server run db:migrate

$env:OWNER_USERNAME = Read-Host 'Initial admin username'
$securePassword = Read-Host 'Initial admin password' -AsSecureString
$env:OWNER_PASSWORD = [System.Net.NetworkCredential]::new('', $securePassword).Password
npm --prefix apps/server run db:seed

Remove-Item Env:DATABASE_URL, Env:OWNER_USERNAME, Env:OWNER_PASSWORD
```

Run the seed command only once for a new database. It inserts the initial `ADMIN` account using `OWNER_USERNAME` and `OWNER_PASSWORD`; after that, use the **Access accounts** page to create manager and supervisor accounts. The password variables are read by the seed command from the environment and are not needed by the running service.

If you intentionally want to clear an existing installation and reseed a fresh admin, use the guarded procedure in [Database reset and fresh admin](database-reset.md). It deletes all operational records and all existing logins, then inserts the new admin in one transaction.

If the database provider restricts inbound connections, configure it to accept connections from Render. Keep the database on a persistent MySQL-compatible service; do not store production data on a Render service's local filesystem.

## 4. Connect your own domain to the frontend

1. In the Render Dashboard, open the frontend **Static Site → Settings → Custom Domains** and add the domain you want people to use, such as `example.com` or `www.example.com`.
2. Render shows the DNS records required for that specific service. At your domain registrar, add those exact records. Do not guess the target values. Remove conflicting `AAAA` records while setting up the domain, as Render's custom-domain routing uses IPv4.
3. Return to Render and click **Verify**. DNS propagation can take time. Once verified, Render automatically issues and renews the TLS certificate and redirects HTTP to HTTPS.
4. Add the final site origin to the backend's `CORS_ORIGIN`, for example `https://example.com`, then redeploy the backend. Include both `www` and apex origins only if both will be used as origins.
5. Update the static site's `API_BASE_URL` only if you also choose to attach a custom domain to the API. The API can remain on its Render URL while the frontend uses your domain.

Render may automatically add and redirect between the matching `www` and root domain when either is configured. Follow the DNS targets shown in the Render service settings for the actual domain and registrar.

## 5. Verify the live app

1. Open the custom frontend domain over HTTPS.
2. Sign in with the admin credentials seeded in step 3. Use the eye button to check the password as you type.
3. Visit the dashboard and open one record page to confirm both frontend and API connectivity.
4. From **Access accounts**, create manager and supervisor accounts and verify each has its intended read access.
5. Check the Render API logs and `/health` if database requests fail. Recheck `DATABASE_URL`, MySQL TLS/CA setup, database network access, and the exact `CORS_ORIGIN` when troubleshooting.
6. Set up regular database backups with the MySQL provider and periodically confirm that a backup can be restored.

## Free-tier behavior to plan around

- Render's free web services spin down after 15 minutes without inbound traffic. The first request after idle can take about a minute while the API wakes.
- Free web services have an ephemeral filesystem. This app's records live in MySQL, so keep the database external and persistent.
- Free services have monthly usage limits and can be suspended if workspace usage is exhausted. Check the Render dashboard's usage page.
- Render documents its free services as appropriate for prototypes and previews, and advises against using Free instances for production. This panel holds business, payroll, and staff-health data; choose an appropriate paid service and managed database before relying on it for business-critical production.
- Render's free PostgreSQL databases expire after 30 days and this app requires MySQL, so do not use that database as the production store for this project.

## Render references

- [Render free services and their limits](https://render.com/docs/free)
- [Render static sites](https://render.com/docs/static-sites)
- [Render web services](https://render.com/docs/web-services)
- [Render's first deployment guide](https://render.com/docs/your-first-deploy)
- [Render custom domains and DNS verification](https://render.com/docs/custom-domains)
- [Managed TLS certificates](https://render.com/docs/tls)
- [Free PostgreSQL expiration notice](https://render.com/changelog/free-postgresql-instances-now-expire-after-30-days-previously-90)
