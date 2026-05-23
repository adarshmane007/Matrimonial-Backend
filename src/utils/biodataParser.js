import { DISTRICTS, EDUCATION_LEVELS } from '../constants.js';
import { parseHeightToCm } from './heightUtils.js';

const DISTRICT_ALIASES = DISTRICTS.flatMap((d) => [
  { value: d.value, tokens: [d.value, d.labelEn.toLowerCase(), d.labelMr] },
]);

const EDU_RULES = [
  { level: 'med', patterns: [/mbbs/i, /md\b/i, /medical/i, /doctor/i, /वैद्यक/i, /डॉ\./i] },
  { level: 'mba', patterns: [/mba/i, /m\.?\s*b\.?\s*a/i, /एम\.?\s*बी\.?\s*ए/i] },
  { level: 'eng', patterns: [/\bbe\b/i, /b\.?\s*e\.?/i, /btech/i, /b\.?\s*tech/i, /engineering/i, /अभियांत्रिक/i, /इंजिनिअर/i] },
  { level: 'pg', patterns: [/m\.?\s*sc/i, /msc/i, /m\.?\s*com/i, /post\s*grad/i, /pg\b/i, /पदव्युत्तर/i, /एम\.?\s*ए/i] },
  { level: 'grad', patterns: [/graduate/i, /b\.?\s*a\.?/i, /ba\b/i, /bcom/i, /ca\b/i, /chartered/i, /पदवी/i, /पदवीधर/i] },
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

function isDevanagari(str) {
  return /[\u0900-\u097F]/.test(str);
}

function matchDistrict(text) {
  const lower = text.toLowerCase();
  for (const { value, tokens } of DISTRICT_ALIASES) {
    for (const token of tokens) {
      if (!token || token.length < 2) continue;
      if (isDevanagari(token)) {
        if (text.includes(token)) return value;
      } else if (lower.includes(token.toLowerCase())) {
        return value;
      }
    }
  }
  const labeled = firstMatch(
    text,
    /(?:जिल्हा|district|ठिकाण)[:\s*]+([^\n,]+)/i
  );
  if (labeled) return matchDistrict(labeled) || null;
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
  if (/\b(bride|female|daughter|girl|vadhu|वधू|मुलगी|स्त्री|कन्या)\b/i.test(lower)) return 'bride';
  if (/\b(groom|male|son|boy|var\b|वर\b|मुलगा|पुरुष)\b/i.test(lower)) return 'groom';
  if (/लिंग[:\s]*(वधू|स्त्री|मुलगी)/i.test(text)) return 'bride';
  if (/लिंग[:\s]*(वर|पुरुष|मुलगा)/i.test(text)) return 'groom';
  return null;
}

function parseAge(text) {
  const t = normalizeDigits(text);
  let m =
    t.match(/(?:age|वय|वर्ष)[:\s]*(\d{2})\b/i) ||
    t.match(/\b(\d{2})\s*(?:years?|yrs?|वर्षे?|वर्ष)\b/i) ||
    t.match(/(?:जन्म|birth)[^\d]*(\d{4})/i);
  if (m) {
    if (m[1].length === 4) {
      const birthYear = Number(m[1]);
      const age = new Date().getFullYear() - birthYear;
      if (age >= 18 && age <= 80) return age;
    } else {
      const age = Number(m[1]);
      if (age >= 18 && age <= 80) return age;
    }
  }
  return null;
}

function parseHeight(text) {
  const t = normalizeDigits(text);
  const m =
    t.match(/(\d\s*['′]\s*\d{1,2})/) ||
    t.match(/(\d\s*ft\s*\d{1,2})/i) ||
    t.match(/(?:height|उंची|उंचाई)[:\s]*([0-9'′″\s.फू]+)/i) ||
    t.match(/(\d{3})\s*(?:cm|से\.?मी|सेंटी)/i) ||
    t.match(/(\d)\s*(?:ft|फूट)\s*(\d{1,2})/i);
  if (m) {
    if (m[2]) return `${m[1]}'${m[2]}`;
    return m[1].replace(/\s+/g, '').trim();
  }
  return null;
}

function parseName(text) {
  const labeled =
    firstMatch(text, /(?:name|नाव|पूर्ण\s*नाव|full\s*name)[:\s*]+([^\n,|]+)/i) ||
    firstMatch(text, /(?:नाव)[:\s]+([^\n,|]+)/i);
  if (labeled && labeled.length >= 2 && labeled.length <= 80) {
    return labeled.replace(/\*+/g, '').trim();
  }

  const sonOf = text.match(/(?:पुत्र|पुत्री|son\s*of|daughter\s*of)[:\s]+([^\n,]+)/i);
  if (sonOf) {
    const parent = sonOf[1].trim();
    const nameBefore = text.split(/(?:पुत्र|पुत्री|son\s*of)/i)[0];
    const lines = nameBefore
      .split(/\n/)
      .map((l) => l.trim())
      .filter((l) => l.length >= 2 && l.length < 60);
    if (lines.length) return lines[lines.length - 1].replace(/^[*•-]+\s*/, '');
    if (parent.length <= 80) return null;
  }

  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && l.length < 60);
  const skip = /^(biodata|profile|matrimonial|वैवाहिक|परिचय|बायोडेटा|resume)/i;
  for (const line of lines) {
    if (skip.test(line)) continue;
    if (/^[\d\s'′.:|-]+$/.test(line)) continue;
    if (/^(age|वय|height|उंची|education|शिक्षण|mobile|मोबाइल)/i.test(line)) continue;
    if (/^(पुत्र|पुत्री|son\s*of)/i.test(line)) continue;
    return line.replace(/^[*•-]+\s*/, '');
  }
  return null;
}

function parseKul(text) {
  const labeled = firstMatch(text, /(?:kul|कुळ|caste|जात|gotra|गोत्र)[:\s*]+([^\n,]+)/i);
  if (labeled) return labeled.length <= 60 ? labeled : null;

  const m = text.match(/\b([A-Za-z\u0900-\u097F]+)\s+Kul\b/i) || text.match(/([^\n,]+)\s+कुळ\b/);
  if (m) return m[1].includes('Kul') ? m[0].trim() : `${m[1].trim()} Kul`;
  return null;
}

function parseOccupation(text) {
  return (
    firstMatch(text, /(?:occupation|व्यवसाय|नोकरी|job|profession|working\s*as|कार्य)[:\s*]+([^\n,]+)/i) ||
    null
  );
}

function parseSalary(text) {
  return (
    firstMatch(
      text,
      /(?:salary|annual\s*income|income|पगार|वार्षिक\s*उत्पन्न|मासिक\s*पगार)[:\s*]+([^\n,]+)/i
    ) || null
  );
}

function parseMaritalStatus(text) {
  const lower = text.toLowerCase();
  if (/\b(divorced|घटस्फोटित|घटस्फोट)\b/i.test(lower)) return 'divorced';
  if (/\b(widow|widower|widowed|वैधव्य|विधुर|विधवा)\b/i.test(lower)) return 'widowed';
  if (/\b(unmarried|never\s*married|अविवाहित|अविवाहीत)\b/i.test(lower)) return 'never_married';
  if (/वैवाहिक\s*स्थिती[:\s]*(अविवाहित)/i.test(text)) return 'never_married';
  return null;
}

function parseDiet(text) {
  const lower = text.toLowerCase();
  if (/\b(veg|vegetarian|शाकाहारी|शाकाहार)\b/i.test(lower) && !/non[\s-]*veg|मांसाहारी/i.test(lower))
    return 'veg';
  if (/\b(non[\s-]*veg|मांसाहारी)\b/i.test(lower)) return 'non_veg';
  if (/\b(eggetarian|अंडाहारी)\b/i.test(lower)) return 'eggetarian';
  return null;
}

function parseManglik(text) {
  if (/\b(manglik|मंगळ|मांगलिक)\b/i.test(text) && !/non[\s-]*manglik|नॉन[\s-]*मंगळ|नॉनमंगळ/i.test(text))
    return 'yes';
  if (/\b(non[\s-]*manglik|नॉन[\s-]*मंगळ|नॉनमंगळ)\b/i.test(text)) return 'no';
  return null;
}

function parseEmploymentType(text) {
  const labeled = firstMatch(
    text,
    /(?:employed\s*in|working\s*in|sector|नोकरी\s*प्रकार)[:\s*]+([^\n,]+)/i
  );
  const lower = (labeled || text).toLowerCase();
  if (/\b(govt|government|सरकारी|शासकीय)\b/i.test(lower)) return 'govt';
  if (/\b(business|self[\s-]*employ|व्यवसाय|स्वयंरोजगार)\b/i.test(lower)) return 'business';
  if (/\b(private|खाजगी)\b/i.test(lower)) return 'private';
  return null;
}

function parseNativePlace(text) {
  return firstMatch(
    text,
    /(?:native|birth\s*place|मूळ\s*ठिकाण|गाव|जन्म\s*ठिकाण)[:\s*]+([^\n,]+)/i
  );
}

function parseFatherOccupation(text) {
  return firstMatch(
    text,
    /(?:father'?s?\s*occupation|वडिलांचा\s*व्यवसाय|वडील\s*व्यवसाय|father)[:\s*]+([^\n,]+)/i
  );
}

function parseEducationText(text) {
  return firstMatch(
    text,
    /(?:education|शिक्षण|qualification|पात्रता|अभ्यास)[:\s*]+([^\n,]+)/i
  );
}

function parseCity(text, district) {
  const labeled = firstMatch(
    text,
    /(?:city|place|location|ठिकाण|गाव|शहर|राहण्याचे\s*ठिकाण)[:\s*]+([^\n,]+)/i
  );
  if (labeled) return labeled;
  if (district) {
    const d = DISTRICTS.find((x) => x.value === district);
    return d?.labelEn ?? null;
  }
  return null;
}

function parseMotherTongue(text) {
  const labeled = firstMatch(text, /(?:mother\s*tongue|मातृभाषा|भाषा)[:\s*]+([^\n,]+)/i);
  if (labeled) {
    if (/मराठी|marathi/i.test(labeled)) return 'marathi';
    if (/हिंदी|hindi/i.test(labeled)) return 'hindi';
  }
  if (/\bमराठी\b/.test(text)) return 'marathi';
  return null;
}

function parseFamilyType(text) {
  const lower = text.toLowerCase();
  if (/\b(joint|संयुक्त)\b/i.test(lower)) return 'joint';
  if (/\b(nuclear|विस्तारित|छोटे)\b/i.test(lower)) return 'nuclear';
  return null;
}

function parseBioSnippet(text) {
  const about = firstMatch(
    text,
    /(?:about|self|introduction|परिचय|स्वत:बद्दल|वैयक्तिक)[:\s*]+([\s\S]{20,800})/i
  );
  if (about) return about.trim().slice(0, 2000);
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
  const salary = parseSalary(text);
  const maritalStatus = parseMaritalStatus(text);
  const diet = parseDiet(text);
  const manglik = parseManglik(text);
  const employmentType = parseEmploymentType(text);
  const nativePlace = parseNativePlace(text);
  const fatherOccupation = parseFatherOccupation(text);
  const city = parseCity(text, district);
  const motherTongue = parseMotherTongue(text);
  const familyType = parseFamilyType(text);
  const aboutBio = parseBioSnippet(text);

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
    salary: salary || '',
    maritalStatus: maritalStatus || 'never_married',
    diet: diet || '',
    manglik: manglik || '',
    employmentType: employmentType || '',
    nativePlace: nativePlace || '',
    fatherOccupation: fatherOccupation || '',
    motherTongue: motherTongue || '',
    familyType: familyType || '',
    height: height || '',
    heightCm: height ? parseHeightToCm(height) : null,
    kul: kul || '',
    bio: aboutBio || bio.slice(0, 2000),
  };

  return { parsed, warnings };
}
