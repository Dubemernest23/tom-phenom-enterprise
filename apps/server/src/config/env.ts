import dotenv from 'dotenv';

dotenv.config();

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeOrigin = (value: string): string | undefined => {
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
};

const configuredCorsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const defaultCorsOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://dashboard-tomphenomenterprise.onrender.com',
  'https://dashboard.tomphenomenterprise.com',
  'https://dashboard.tomphenomenterprise.onrender.com',
];

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 4000),
  corsOrigins: [...new Set([...defaultCorsOrigins, ...configuredCorsOrigins]
    .map(normalizeOrigin)
    .filter((origin): origin is string => Boolean(origin)))],
  databaseUrl: process.env.DATABASE_URL,
  mysqlCaCert: process.env.MYSQL_CA_CERT,
  mysqlCaCertPath: process.env.MYSQL_CA_CERT_PATH,
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  ownerUsername: process.env.OWNER_USERNAME || 'owner',
  ownerPassword: process.env.OWNER_PASSWORD || 'change-me',
};
