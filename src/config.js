import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

function parseBool(value, defaultValue) {
  if (value === undefined || value === '') return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

const jwtSecret = process.env.JWT_SECRET || (isProduction ? '' : 'dev-secret-change-in-production');
const databaseUrl =
  process.env.DATABASE_URL ||
  (isProduction ? '' : 'postgresql://postgres:postgres@127.0.0.1:5432/matrimonial');

if (isProduction && !jwtSecret) {
  console.error('FATAL: JWT_SECRET is required when NODE_ENV=production');
  process.exit(1);
}

if (isProduction && !databaseUrl) {
  console.error('FATAL: DATABASE_URL is required when NODE_ENV=production');
  process.exit(1);
}

/** RDS often needs SSL; set DB_SSL=true in ECS if required. */
const dbSsl =
  parseBool(process.env.DB_SSL, isProduction) ? { rejectUnauthorized: false } : false;

export const config = {
  port: Number(process.env.PORT) || 3001,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv,
  isProduction,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  databaseUrl,
  dbSsl,
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:5500', 'http://127.0.0.1:5173', 'http://127.0.0.1:5500'],
  seedOnStartup: parseBool(process.env.SEED_ON_STARTUP, !isProduction),
  trustProxy: parseBool(process.env.TRUST_PROXY, isProduction),
};
