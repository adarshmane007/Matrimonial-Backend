import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '../db/database.js';
import { otpConfig } from './config.js';

function randomDigits(length) {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += String(crypto.randomInt(0, 10));
  }
  return out;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function cleanupExpiredOtps() {
  await query(
    `DELETE FROM phone_otp_requests WHERE expires_at < NOW() - INTERVAL '1 day'`
  );
  await query(`DELETE FROM phone_verification_tokens WHERE expires_at < NOW()`);
}

export async function getLatestOtpRequest(mobileE164) {
  return queryOne(
    `SELECT * FROM phone_otp_requests
     WHERE mobile_e164 = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [mobileE164]
  );
}

export async function createAndStoreOtp(mobileE164) {
  const code = randomDigits(otpConfig.codeLength);
  const codeHash = bcrypt.hashSync(code, 10);
  const expiresAt = new Date(Date.now() + otpConfig.expiryMinutes * 60 * 1000);

  await query(`DELETE FROM phone_otp_requests WHERE mobile_e164 = $1`, [mobileE164]);

  await query(
    `INSERT INTO phone_otp_requests (mobile_e164, code_hash, expires_at, verify_attempts, last_sent_at)
     VALUES ($1, $2, $3, 0, NOW())`,
    [mobileE164, codeHash, expiresAt]
  );

  return { code, expiresAt };
}

export async function verifyOtpCode(mobileE164, code) {
  const row = await getLatestOtpRequest(mobileE164);
  if (!row) {
    return { ok: false, reason: 'no_otp' };
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: 'expired' };
  }

  if (row.verify_attempts >= otpConfig.maxVerifyAttempts) {
    return { ok: false, reason: 'too_many_attempts' };
  }

  const match = bcrypt.compareSync(String(code).trim(), row.code_hash);
  await query(
    `UPDATE phone_otp_requests SET verify_attempts = verify_attempts + 1 WHERE id = $1`,
    [row.id]
  );

  if (!match) {
    return { ok: false, reason: 'invalid' };
  }

  await query(`DELETE FROM phone_otp_requests WHERE mobile_e164 = $1`, [mobileE164]);
  return { ok: true };
}

export async function issueVerificationToken(mobileE164) {
  const token = crypto.randomBytes(24).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + otpConfig.expiryMinutes * 60 * 1000);

  await query(
    `INSERT INTO phone_verification_tokens (mobile_e164, token_hash, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (mobile_e164) DO UPDATE SET
       token_hash = EXCLUDED.token_hash,
       expires_at = EXCLUDED.expires_at,
       created_at = NOW()`,
    [mobileE164, tokenHash, expiresAt]
  );

  return { token, expiresAt };
}

export async function consumeVerificationToken(mobileE164, token) {
  const row = await queryOne(
    `SELECT * FROM phone_verification_tokens WHERE mobile_e164 = $1`,
    [mobileE164]
  );
  if (!row) return false;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await query(`DELETE FROM phone_verification_tokens WHERE mobile_e164 = $1`, [mobileE164]);
    return false;
  }

  const tokenHash = hashToken(String(token).trim());
  if (tokenHash !== row.token_hash) return false;

  await query(`DELETE FROM phone_verification_tokens WHERE mobile_e164 = $1`, [mobileE164]);
  return true;
}
