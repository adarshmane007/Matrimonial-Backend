import { otpConfig } from './config.js';

/** Normalize to E.164 (+91...) for India-first apps. */
export function normalizeMobileE164(input) {
  if (!input || typeof input !== 'string') return null;
  let digits = input.replace(/\s/g, '').replace(/[^\d+]/g, '');
  if (!digits) return null;

  if (digits.startsWith('+')) {
    const rest = digits.slice(1).replace(/\D/g, '');
    if (rest.length < 10 || rest.length > 15) return null;
    return `+${rest}`;
  }

  digits = digits.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);

  const cc = String(otpConfig.defaultCountryCode || '91').replace(/\D/g, '');
  if (digits.length === 10 && cc === '91') return `+91${digits}`;
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;

  return null;
}
