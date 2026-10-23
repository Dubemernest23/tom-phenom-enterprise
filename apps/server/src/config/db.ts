import { Kysely, MysqlDialect } from 'kysely';
import mysql from 'mysql2/promise';

import { env } from './env.js';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { Database } from '../database/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getMysqlTlsOptions = (): mysql.PoolOptions['ssl'] => {
  if (env.mysqlCaCertPath) {
    return { ca: fs.readFileSync(env.mysqlCaCertPath, 'utf8') };
  }

  if (env.mysqlCaCert) {
    return { ca: env.mysqlCaCert.replace(/\\n/g, '\n') };
  }

  const bundledCaPath = path.join(__dirname, '../../ca.pem');
  if (fs.existsSync(bundledCaPath)) {
    return { ca: fs.readFileSync(bundledCaPath, 'utf8') };
  }

  // Keep TLS enabled and certificate verification on, using Node's trusted roots.
  // Providers with a private CA can supply MYSQL_CA_CERT through the environment.
  return {};
};


let pool: mysql.Pool | null = null;

const buildPoolConfig = (): mysql.PoolOptions => {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }

  const url = new URL(env.databaseUrl);

  return {
    host: url.hostname,
    port: Number(url.port),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    dateStrings: ['DATE'],
    timezone: 'Z',
    ssl: getMysqlTlsOptions(),
  };
};

export const getPool = (): mysql.Pool => {
  if (!pool) {
    pool = mysql.createPool(buildPoolConfig());
  }

  return pool;
};

export const checkDatabase = async (): Promise<{
  configured: boolean;
  ok: boolean;
}> => {
  if (!env.databaseUrl) {
    return {
      configured: false,
      ok: false,
    };
  }

  const connection = await getPool().getConnection();

  try {
    await connection.ping();

    return {
      configured: true,
      ok: true,
    };
  } finally {
    connection.release();
  }
};

export const db = new Kysely<Database>({
  dialect: new MysqlDialect({
    pool: getPool().pool,
  }),
});
