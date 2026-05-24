import { queryOne } from '../db/database.js';
import { otpConfig } from './config.js';
import { normalizeMobileE164 } from './normalizeMobile.js';
import {
  cleanupExpiredOtps,
  createAndStoreOtp,
  getLatestOtpRequest,
  issueVerificationToken,
  verifyOtpCode,
} from './store.js';
import { sendOtpSms } from './sns.js';

const MESSAGES = {
  invalid_mobile: 'Invalid mobile number. Use 10 digits or +91 format.',
  cooldown: 'Please wait before requesting another code.',
  send_failed: 'Could not send verification code. Try again later.',
  no_otp: 'No verification code found. Request a new code.',
  expired: 'Verification code expired. Request a new code.',
  too_many_attempts: 'Too many attempts. Request a new code.',
  invalid: 'Incorrect verification code.',
  already_registered: 'This mobile number is already registered.',
  not_verified: 'Mobile number must be verified with OTP before registration.',
  invalid_token: 'Invalid or expired mobile verification. Verify OTP again.',
};

export async function sendOtpForMobile(rawMobile) {
  if (!otpConfig.enabled) {
    return { ok: false, status: 503, message: 'OTP verification is not enabled' };
  }

  const mobileE164 = normalizeMobileE164(rawMobile);
  if (!mobileE164) {
    return { ok: false, status: 400, message: MESSAGES.invalid_mobile };
  }

  const existingUser = await queryOne('SELECT id FROM users WHERE mobile = $1', [mobileE164]);
  if (existingUser) {
    return { ok: false, status: 409, message: MESSAGES.already_registered };
  }

  await cleanupExpiredOtps();

  const latest = await getLatestOtpRequest(mobileE164);
  if (latest?.last_sent_at) {
    const elapsed = (Date.now() - new Date(latest.last_sent_at).getTime()) / 1000;
    if (elapsed < otpConfig.resendCooldownSeconds) {
      const wait = Math.ceil(otpConfig.resendCooldownSeconds - elapsed);
      return {
        ok: false,
        status: 429,
        message: `${MESSAGES.cooldown} (${wait}s)`,
        retryAfterSeconds: wait,
      };
    }
  }

  try {
    const { code, expiresAt } = await createAndStoreOtp(mobileE164);
    await sendOtpSms(mobileE164, code);
    return {
      ok: true,
      mobile: mobileE164,
      expiresAt: expiresAt.toISOString(),
      message: 'Verification code sent',
    };
  } catch (err) {
    console.error('[OTP] send failed:', err);
    return { ok: false, status: 502, message: MESSAGES.send_failed };
  }
}

export async function verifyOtpForMobile(rawMobile, code) {
  if (!otpConfig.enabled) {
    return { ok: false, status: 503, message: 'OTP verification is not enabled' };
  }

  const mobileE164 = normalizeMobileE164(rawMobile);
  if (!mobileE164) {
    return { ok: false, status: 400, message: MESSAGES.invalid_mobile };
  }

  await cleanupExpiredOtps();

  const result = await verifyOtpCode(mobileE164, code);
  if (!result.ok) {
    const message = MESSAGES[result.reason] || MESSAGES.invalid;
    return { ok: false, status: 400, message };
  }

  const { token, expiresAt } = await issueVerificationToken(mobileE164);
  return {
    ok: true,
    mobile: mobileE164,
    mobileVerificationToken: token,
    expiresAt: expiresAt.toISOString(),
    message: 'Mobile number verified',
  };
}

export { MESSAGES as otpMessages };
