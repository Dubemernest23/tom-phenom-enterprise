import { Kysely, MysqlDialect } from 'kysely';
import mysql from 'mysql2/promise';

import { env } from '../config/env.js';

import path from 'node:path';
import fs from 'node:fs';

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
    ssl: {
      ca: fs.readFileSync(
        path.join(__dirname, '../../ca.pem'),
      ).toString(),
    },
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

export const db = new Kysely({
  dialect: new MysqlDialect({
    pool: getPool(),
  }),
});