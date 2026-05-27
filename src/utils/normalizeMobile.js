/** Normalize to E.164 (+91...) for India-first apps. */
export function normalizeMobileE164(input, defaultCountryCode = '91') {
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

  const cc = String(defaultCountryCode || '91').replace(/\D/g, '');
  if (digits.length === 10 && cc === '91') return `+91${digits}`;
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;

  return null;
}

/** All stored/login lookup variants for duplicate checks. */
export function mobileLookupVariants(input, defaultCountryCode = '91') {
  const e164 = normalizeMobileE164(input, defaultCountryCode);
  if (!e164) return [];

  const digits = e164.replace(/\D/g, '');
  const variants = new Set([e164]);
  if (digits.startsWith('91') && digits.length >= 12) {
    variants.add(digits.slice(2));
    variants.add(`+${digits}`);
    variants.add(digits);
  }
  const raw = String(input).replace(/\s/g, '');
  if (raw) variants.add(raw);
  return [...variants];
}
