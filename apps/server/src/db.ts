import mysql from 'mysql2/promise';
import { env } from './config/env';

let pool: mysql.Pool | null = null;

export const getPool = (): mysql.Pool => {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is not configured.');
  }

  if (!pool) {
    pool = mysql.createPool(env.databaseUrl);
  }

  return pool;
};

export const checkDatabase = async (): Promise<{ configured: boolean; ok: boolean }> => {
  if (!env.databaseUrl) {
    return { configured: false, ok: false };
  }

  const connection = await getPool().getConnection();
  try {
    await connection.ping();
    return { configured: true, ok: true };
  } finally {
    connection.release();
  }
};
