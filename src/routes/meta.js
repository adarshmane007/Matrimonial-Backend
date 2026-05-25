import { Router } from 'express';
import {
  DISTRICTS,
  EDUCATION_LEVELS,
  GENDERS,
  PROFILE_CREATORS,
  MARITAL_STATUS,
  DIET_OPTIONS,
  MANGALIK_OPTIONS,
  EMPLOYMENT_TYPES,
  MOTHER_TONGUES,
  FAMILY_TYPES,
  INCOME_BRACKETS,
  HEIGHT_CM_OPTIONS,
} from '../constants.js';
import {
  getStateList,
  getCitiesForState,
  getAllCitiesFlat,
  CITY_OTHER,
} from '../locations.js';

const router = Router();

function mapOptions(list, lang, anyValue, anyLabel) {
  const label = (item) => (lang === 'mr' ? item.labelMr : item.labelEn);
  const base = anyValue
    ? [{ value: anyValue, label: anyLabel }]
    : [];
  return [
    ...base,
    ...list.map((item) => ({ value: item.value, label: label(item) })),
  ];
}

router.get('/', (req, res) => {
  const lang = req.query.lang === 'mr' ? 'mr' : 'en';

  res.json({
    success: true,
    data: {
      states: getStateList(lang),
      cityOtherValue: CITY_OTHER,
      districts: mapOptions(
        DISTRICTS,
        lang,
        'all',
        lang === 'mr' ? 'संपूर्ण महाराष्ट्र' : 'All Maharashtra'
      ),
      allCities: [
        { value: 'all', label: lang === 'mr' ? 'सर्व शहरे' : 'All cities' },
        ...getAllCitiesFlat(lang),
      ],
      educationLevels: mapOptions(
        EDUCATION_LEVELS,
        lang,
        'any',
        lang === 'mr' ? 'कोणतेही शिक्षण' : 'Any Education'
      ),
      genders: mapOptions(GENDERS, lang),
      profileCreators: mapOptions(PROFILE_CREATORS, lang),
      maritalStatuses: mapOptions(
        MARITAL_STATUS,
        lang,
        'any',
        lang === 'mr' ? 'कोणतीही' : 'Any'
      ),
      diets: mapOptions(DIET_OPTIONS, lang, 'any', lang === 'mr' ? 'कोणतेही' : 'Any'),
      manglikOptions: mapOptions(
        MANGALIK_OPTIONS,
        lang,
        'any',
        lang === 'mr' ? 'कोणतेही' : 'Any'
      ),
      employmentTypes: mapOptions(
        EMPLOYMENT_TYPES,
        lang,
        'any',
        lang === 'mr' ? 'कोणतेही' : 'Any'
      ),
      motherTongues: mapOptions(
        MOTHER_TONGUES,
        lang,
        'any',
        lang === 'mr' ? 'कोणतीही' : 'Any'
      ),
      familyTypes: mapOptions(
        FAMILY_TYPES,
        lang,
        'any',
        lang === 'mr' ? 'कोणतेही' : 'Any'
      ),
      incomeBrackets: mapOptions(
        INCOME_BRACKETS,
        lang,
        'any',
        lang === 'mr' ? 'कोणतेही उत्पन्न' : 'Any Income'
      ),
      heights: [
        { value: '', label: lang === 'mr' ? 'कोणतीही' : 'Any' },
        ...HEIGHT_CM_OPTIONS.map((h) => ({
          value: String(h.value),
          label: lang === 'mr' ? h.labelMr : h.labelEn,
        })),
      ],
      minAge: 18,
      maxAge: 80,
      sortOptions: [
        { value: 'recent', label: lang === 'mr' ? 'नुकतेच' : 'Recently joined' },
        { value: 'age_asc', label: lang === 'mr' ? 'वय — कमी ते जास्त' : 'Age — low to high' },
        { value: 'age_desc', label: lang === 'mr' ? 'वय — जास्त ते कमी' : 'Age — high to low' },
      ],
    },
  });
});

router.get('/cities', (req, res) => {
  const lang = req.query.lang === 'mr' ? 'mr' : 'en';
  const state = String(req.query.state || '').trim();
  if (!state) {
    return res.status(400).json({ success: false, message: 'state query required' });
  }
  const cities = getCitiesForState(state, lang);
  res.json({
    success: true,
    data: [
      ...cities,
      { value: CITY_OTHER, label: lang === 'mr' ? 'इतर (इतर शहर टाइप करा)' : 'Other (type city name)' },
    ],
  });
});

export default router;
