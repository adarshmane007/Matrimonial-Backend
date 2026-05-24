import { query } from '../db/database.js';

export const OTP_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS phone_otp_requests (
  id SERIAL PRIMARY KEY,
  mobile_e164 TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verify_attempts INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_otp_mobile ON phone_otp_requests (mobile_e164, created_at DESC);

CREATE TABLE IF NOT EXISTS phone_verification_tokens (
  id SERIAL PRIMARY KEY,
  mobile_e164 TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_verify_token_expires ON phone_verification_tokens (expires_at);
`;

export async function initOtpSchema() {
  await query(OTP_SCHEMA_SQL);
}
