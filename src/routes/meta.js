import { Router } from 'express';
import { DISTRICTS, EDUCATION_LEVELS, GENDERS } from '../constants.js';

const router = Router();

router.get('/', (req, res) => {
  const lang = req.query.lang === 'mr' ? 'mr' : 'en';
  const label = (item) => (lang === 'mr' ? item.labelMr : item.labelEn);

  res.json({
    success: true,
    data: {
      districts: [{ value: 'all', label: lang === 'mr' ? 'संपूर्ण महाराष्ट्र' : 'All Maharashtra' }, ...DISTRICTS.map((d) => ({ value: d.value, label: label(d) }))],
      educationLevels: [{ value: 'any', label: lang === 'mr' ? 'कोणतेही शिक्षण' : 'Any Education' }, ...EDUCATION_LEVELS.map((e) => ({ value: e.value, label: label(e) }))],
      genders: GENDERS.map((g) => ({ value: g.value, label: label(g) })),
      minAge: 18,
      maxAge: 80,
    },
  });
});

export default router;
