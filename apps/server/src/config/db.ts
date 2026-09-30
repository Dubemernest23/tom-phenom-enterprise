// apps/server/src/config/db.ts
// import mysql from 'mysql2/promise';
// import fs from 'fs';
// import path from 'path';
// import { env } from './env.js';

// let pool: mysql.Pool | null = null;

// const buildPoolConfig = (): mysql.PoolOptions => {
//   const url = new URL(env.databaseUrl!);
//   return {
//     host: url.hostname,
//     port: Number(url.port),
//     user: decodeURIComponent(url.username),
//     password: decodeURIComponent(url.password),
//     database: url.pathname.replace(/^\//, ''),
//     ssl: {
//       ca: fs.readFileSync(path.join(__dirname, '../../ca.pem')).toString(),
//     },
//   };
// };

// export const getPool = (): mysql.Pool => {
//   if (!env.databaseUrl) {
//     throw new Error('DATABASE_URL is not configured.');
//   }
//   if (!pool) {
//     pool = mysql.createPool(buildPoolConfig());
//   }
//   return pool;
// };

// export const checkDatabase = async (): Promise<{ configured: boolean; ok: boolean }> => {
//   if (!env.databaseUrl) {
//     return { configured: false, ok: false };
//   }
//   const connection = await getPool().getConnection();
//   try {
//     await connection.ping();
//     return { configured: true, ok: true };
//   } finally {
//     connection.release();
//   }
// };