/** Public profile shape (privacy-safe for listings). */
import {
  MARITAL_STATUS,
  DIET_OPTIONS,
  MANGALIK_OPTIONS,
  EMPLOYMENT_TYPES,
  MOTHER_TONGUES,
  FAMILY_TYPES,
  INCOME_BRACKETS,
  EDUCATION_LEVELS,
  PROFILE_CREATORS,
} from '../constants.js';
import { cmToDisplay } from './heightUtils.js';
import { formatCityLabel, formatStateLabel } from '../locations.js';

function labelFor(list, value, lang) {
  if (!value) return null;
  const item = list.find((x) => x.value === value);
  if (!item) return value;
  return lang === 'mr' ? item.labelMr : item.labelEn;
}

export function toPublicProfile(row, lang = 'en', { includeBiodata = false } = {}) {
  const state = row.state || 'mh';
  const districtLabel = formatCityLabel(state, row.district, row.city, lang);
  const stateLabel = formatStateLabel(state, lang);
  const heightDisplay = row.height || (row.height_cm ? cmToDisplay(row.height_cm) : null);
  const incomeLabel =
    labelFor(INCOME_BRACKETS, row.income_bracket, lang) || row.salary || null;

  const subParts = [
    lang === 'mr' ? `${row.age} वर्षे` : `${row.age} years`,
    districtLabel,
    row.occupation || row.education || '',
  ].filter(Boolean);

  const tags = [
    row.education,
    heightDisplay,
    row.kul,
    labelFor(MARITAL_STATUS, row.marital_status, lang),
    labelFor(DIET_OPTIONS, row.diet, lang),
  ].filter(Boolean);

  return {
    id: row.id,
    displayName: row.display_name,
    gender: row.gender,
    profileCreator: row.profile_creator || null,
    profileCreatorLabel: labelFor(PROFILE_CREATORS, row.profile_creator, lang),
    age: row.age,
    state,
    stateLabel,
    district: row.district,
    districtLabel,
    city: row.city || districtLabel,
    nativePlace: row.native_place,
    education: row.education,
    educationLevel: row.education_level,
    educationLabel: labelFor(EDUCATION_LEVELS, row.education_level, lang),
    occupation: row.occupation,
    height: heightDisplay,
    heightCm: row.height_cm,
    kul: row.kul,
    bio: row.bio,
    salary: row.salary,
    incomeBracket: row.income_bracket,
    incomeLabel,
    maritalStatus: row.marital_status,
    maritalStatusLabel: labelFor(MARITAL_STATUS, row.marital_status, lang),
    diet: row.diet,
    dietLabel: labelFor(DIET_OPTIONS, row.diet, lang),
    manglik: row.manglik,
    manglikLabel: labelFor(MANGALIK_OPTIONS, row.manglik, lang),
    employmentType: row.employment_type,
    employmentLabel: labelFor(EMPLOYMENT_TYPES, row.employment_type, lang),
    motherTongue: row.mother_tongue,
    motherTongueLabel: labelFor(MOTHER_TONGUES, row.mother_tongue, lang),
    familyType: row.family_type,
    familyTypeLabel: labelFor(FAMILY_TYPES, row.family_type, lang),
    fatherOccupation: row.father_occupation,
    photoUrl: row.photo_url,
    biodataUrl: includeBiodata ? row.biodata_url || null : null,
    hasBiodata: includeBiodata ? Boolean(row.biodata_url) : false,
    isVerified: Boolean(row.is_verified),
    isOnline: Boolean(row.is_online),
    isFeatured: Boolean(row.is_featured),
    subtitle: subParts.join(' • '),
    tags,
    createdAt: row.created_at,
  };
}

export function formatDistrict(code, lang = 'en') {
  return formatCityLabel('mh', code, null, lang);
}
