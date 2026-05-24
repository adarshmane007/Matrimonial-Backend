function parseBool(value, defaultValue) {
  if (value === undefined || value === '') return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function parseIntEnv(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export const otpConfig = {
  enabled: parseBool(process.env.OTP_ENABLED, false),
  awsRegion: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-south-1',
  expiryMinutes: parseIntEnv(process.env.OTP_EXPIRY_MINUTES, 10),
  codeLength: parseIntEnv(process.env.OTP_LENGTH, 6),
  maxVerifyAttempts: parseIntEnv(process.env.OTP_MAX_VERIFY_ATTEMPTS, 5),
  resendCooldownSeconds: parseIntEnv(process.env.OTP_RESEND_COOLDOWN_SECONDS, 60),
  defaultCountryCode: process.env.DEFAULT_COUNTRY_CODE || '91',
  /** Log OTP to server console instead of SNS (local dev only). */
  devLogCode: parseBool(process.env.OTP_DEV_LOG_CODE, false),
};

export function getPublicOtpConfig() {
  return {
    enabled: otpConfig.enabled,
    expiryMinutes: otpConfig.expiryMinutes,
    resendCooldownSeconds: otpConfig.resendCooldownSeconds,
  };
}
