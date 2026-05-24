import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.dbSsl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export async function query(text, params = []) {
  return pool.query(text, params);
}

export async function queryOne(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows[0] ?? null;
}

export async function queryAll(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows;
}

/** Run multiple statements in a single transaction. */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function healthCheck() {
  await pool.query('SELECT 1');
}

export async function closePool() {
  await pool.end();
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE,
  mobile TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (email IS NOT NULL OR mobile IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  gender TEXT NOT NULL CHECK (gender IN ('bride', 'groom')),
  display_name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 80),
  district TEXT NOT NULL,
  city TEXT,
  education TEXT,
  education_level TEXT CHECK (education_level IN ('grad', 'pg', 'eng', 'med', 'mba') OR education_level IS NULL),
  occupation TEXT,
  height TEXT,
  kul TEXT,
  bio TEXT,
  salary TEXT,
  income_bracket TEXT,
  marital_status TEXT DEFAULT 'never_married',
  diet TEXT,
  manglik TEXT,
  employment_type TEXT,
  mother_tongue TEXT DEFAULT 'marathi',
  family_type TEXT,
  native_place TEXT,
  father_occupation TEXT,
  height_cm INTEGER,
  photo_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  visibility TEXT NOT NULL DEFAULT 'members' CHECK (visibility IN ('public', 'members', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_search
  ON profiles (gender, district, age, education_level, is_verified);

CREATE TABLE IF NOT EXISTS interests (
  id SERIAL PRIMARY KEY,
  from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_user_id, to_profile_id)
);

CREATE TABLE IF NOT EXISTS testimonials (
  id SERIAL PRIMARY KEY,
  couple_names TEXT NOT NULL,
  location TEXT NOT NULL,
  story_en TEXT NOT NULL,
  story_mr TEXT,
  married_year INTEGER,
  rating INTEGER NOT NULL DEFAULT 5,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_requests (
  id SERIAL PRIMARY KEY,
  from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_user_id, to_user_id)
);

CREATE TABLE IF NOT EXISTS chat_conversations (
  id SERIAL PRIMARY KEY,
  user_one_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_two_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_one_id, user_two_id),
  CHECK (user_one_id < user_two_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation
  ON chat_messages (conversation_id, created_at);
`;

const MIGRATIONS_SQL = `
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS salary TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS income_bracket TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marital_status TEXT DEFAULT 'never_married';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS diet TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS manglik TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employment_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mother_tongue TEXT DEFAULT 'marathi';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS family_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS native_place TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS father_occupation TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height_cm INTEGER;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'mh';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS biodata_url TEXT;

CREATE TABLE IF NOT EXISTS shortlisted_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_shortlisted_user ON shortlisted_profiles (user_id, created_at DESC);

ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMPTZ;
`;

export async function initDatabase() {
  await pool.query(SCHEMA_SQL);
  await pool.query(MIGRATIONS_SQL);
}
