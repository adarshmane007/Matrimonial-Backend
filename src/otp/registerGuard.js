import { queryOne } from '../db/database.js';
import { otpConfig } from './config.js';
import { normalizeMobileE164 } from './normalizeMobile.js';
import { consumeVerificationToken } from './store.js';
import { otpMessages } from './service.js';

/**
 * When OTP is enabled and user supplies a mobile on register, require a valid verification token.
 * Returns null if OK, or { status, message } to send as HTTP error.
 */
export async function validateMobileForRegister({ mobile, mobileVerificationToken }) {
  if (!otpConfig.enabled) return null;

  const normalized = normalizeMobileE164(mobile);
  if (!mobile?.trim()) return null;
  if (!normalized) {
    return { status: 400, message: otpMessages.invalid_mobile };
  }

  if (!mobileVerificationToken?.trim()) {
    return { status: 400, message: otpMessages.not_verified };
  }

  const valid = await consumeVerificationToken(normalized, mobileVerificationToken.trim());
  if (!valid) {
    return { status: 400, message: otpMessages.invalid_token };
  }

  const exists = await queryOne('SELECT id FROM users WHERE mobile = $1', [normalized]);
  if (exists) {
    return { status: 409, message: otpMessages.already_registered };
  }

  return null;
}

export function normalizedMobileForRegister(mobile) {
  if (!mobile) return null;
  return normalizeMobileE164(mobile);
}
