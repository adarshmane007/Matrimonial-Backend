import { DISTRICTS, EDUCATION_LEVELS } from '../constants.js';

const DISTRICT_ALIASES = DISTRICTS.flatMap((d) => [
  { value: d.value, tokens: [d.value, d.labelEn.toLowerCase(), d.labelMr] },
]);

const EDU_RULES = [
  { level: 'med', patterns: [/mbbs/i, /md\b/i, /medical/i, /doctor/i, /वैद्यक/i] },
  { level: 'mba', patterns: [/mba/i, /m\.?\s*b\.?\s*a/i] },
  { level: 'eng', patterns: [/\bbe\b/i, /b\.?\s*e\.?/i, /btech/i, /b\.?\s*tech/i, /engineering/i, /अभियांत्रिक/i] },
  { level: 'pg', patterns: [/m\.?\s*sc/i, /msc/i, /m\.?\s*com/i, /post\s*grad/i, /pg\b/i, /पदव्युत्तर/i] },
  { level: 'grad', patterns: [/graduate/i, /b\.?\s*a\.?/i, /ba\b/i, /bcom/i, /ca\b/i, /chartered/i, /पदवी/i] },
];

function normalizeDigits(text) {
  const mr = '०१२३४५६७८९';
  const en = '0123456789';
  return text.replace(/[०-९]/g, (c) => en[mr.indexOf(c)] ?? c);
}

function firstMatch(text, regex) {
  const m = text.match(regex);
  return m ? m[1].trim() : null;
}

function matchDistrict(text) {
  const lower = text.toLowerCase();
  for (const { value, tokens } of DISTRICT_ALIASES) {
    for (const token of tokens) {
      if (token.length < 3) continue;
      if (lower.includes(token.toLowerCase())) return value;
    }
  }
  return null;
}

function matchEducationLevel(text) {
  for (const rule of EDU_RULES) {
    if (rule.patterns.some((p) => p.test(text))) return rule.level;
  }
  return null;
}

function parseGender(text) {
  const lower = text.toLowerCase();
  if (/\b(bride|female|daughter|girl|vadhu|वधू|मुलगी)\b/i.test(lower)) return 'bride';
  if (/\b(groom|male|son|boy|var\b|वर\b|मुलगा)\b/i.test(lower)) return 'groom';
  return null;
}

function parseAge(text) {
  const t = normalizeDigits(text);
  let m =
    t.match(/(?:age|वय)[:\s]*(\d{2})\b/i) ||
    t.match(/\b(\d{2})\s*(?:years?|yrs?|वर्षे?)\b/i);
  if (m) {
    const age = Number(m[1]);
    if (age >= 18 && age <= 80) return age;
  }
  return null;
}

function parseHeight(text) {
  const m =
    text.match(/(\d\s*['′]\s*\d{1,2})/) ||
    text.match(/(\d\s*ft\s*\d{1,2})/i) ||
    text.match(/(?:height|उंची)[:\s]*([0-9'′″\s.]+)/i);
  if (m) return m[1].replace(/\s+/g, '').trim();
  return null;
}

function parseName(text) {
  const labeled =
    firstMatch(text, /(?:name|नाव|full\s*name)[:\s*]+([^\n,]+)/i) ||
    firstMatch(text, /(?:नाव)[:\s]+([^\n,]+)/i);
  if (labeled && labeled.length >= 2 && labeled.length <= 80) {
    return labeled.replace(/\*+/g, '').trim();
  }

  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && l.length < 60);
  const skip = /^(biodata|profile|matrimonial|वैवाहिक|परिचय)/i;
  for (const line of lines) {
    if (skip.test(line)) continue;
    if (/^[\d\s'′.:|-]+$/.test(line)) continue;
    if (/^(age|वय|height|उंची|education|शिक्षण)/i.test(line)) continue;
    return line.replace(/^[*•-]+\s*/, '');
  }
  return null;
}

function parseKul(text) {
  const labeled = firstMatch(text, /(?:kul|कुळ|caste|जात)[:\s*]+([^\n,]+)/i);
  if (labeled) return labeled.length <= 60 ? labeled : null;

  const m = text.match(/\b([A-Za-z]+)\s+Kul\b/i);
  if (m) return `${m[1]} Kul`;
  return null;
}

function parseOccupation(text) {
  return (
    firstMatch(text, /(?:occupation|व्यवसाय|job|profession|working\s*as)[:\s*]+([^\n,]+)/i) ||
    null
  );
}

function parseEducationText(text) {
  return firstMatch(text, /(?:education|शिक्षण|qualification)[:\s*]+([^\n,]+)/i);
}

function parseCity(text, district) {
  const labeled = firstMatch(text, /(?:city|place|location|ठिकाण|गाव|city)[:\s*]+([^\n,]+)/i);
  if (labeled) return labeled;
  if (district) {
    const d = DISTRICTS.find((x) => x.value === district);
    return d?.labelEn ?? null;
  }
  return null;
}

/**
 * Rule-based biodata parser (no external AI). Returns fields for profile registration.
 */
export function parseBiodata(rawText) {
  const bio = String(rawText || '').trim();
  const warnings = [];

  if (bio.length < 20) {
    return {
      parsed: null,
      warnings: ['Please paste a longer biodata (at least a few lines).'],
    };
  }

  const text = normalizeDigits(bio);
  const gender = parseGender(text);
  const age = parseAge(text);
  const district = matchDistrict(text);
  const educationLevel = matchEducationLevel(text);
  const education = parseEducationText(text);
  const fullName = parseName(text);
  const height = parseHeight(text);
  const kul = parseKul(text);
  const occupation = parseOccupation(text);
  const city = parseCity(text, district);

  if (!fullName) warnings.push('Name not detected — please enter manually.');
  if (!age) warnings.push('Age not detected — please enter manually.');
  if (!district) warnings.push('District not detected — please select manually.');
  if (!gender) warnings.push('Gender not detected — please select Bride or Groom.');

  const parsed = {
    fullName: fullName || '',
    gender: gender || 'bride',
    age: age || 25,
    district: district || 'pune',
    city: city || '',
    education: education || (educationLevel ? EDUCATION_LEVELS.find((e) => e.value === educationLevel)?.labelEn : '') || '',
    educationLevel: educationLevel || '',
    occupation: occupation || '',
    height: height || '',
    kul: kul || '',
    bio,
  };

  return { parsed, warnings };
}
