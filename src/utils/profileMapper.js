/** Public profile shape (privacy-safe for listings). */
export function toPublicProfile(row, lang = 'en') {
  const districtLabel = formatDistrict(row.district, lang);
  const sub =
    lang === 'mr'
      ? `${row.age} वर्षे • ${districtLabel} • ${row.occupation || row.education || ''}`
      : `${row.age} years • ${districtLabel} • ${row.occupation || row.education || ''}`;

  return {
    id: row.id,
    displayName: row.display_name,
    gender: row.gender,
    age: row.age,
    district: row.district,
    districtLabel,
    city: row.city,
    education: row.education,
    educationLevel: row.education_level,
    occupation: row.occupation,
    height: row.height,
    kul: row.kul,
    bio: row.bio,
    photoUrl: row.photo_url,
    isVerified: Boolean(row.is_verified),
    isOnline: Boolean(row.is_online),
    isFeatured: Boolean(row.is_featured),
    subtitle: sub.trim(),
    tags: [row.education, row.height, row.kul].filter(Boolean),
    createdAt: row.created_at,
  };
}

const DISTRICT_LABELS = {
  en: {
    pune: 'Pune',
    mumbai: 'Mumbai',
    nashik: 'Nashik',
    kolhapur: 'Kolhapur',
    satara: 'Satara',
    sangli: 'Sangli',
    aurangabad: 'Aurangabad',
    nagpur: 'Nagpur',
  },
  mr: {
    pune: 'पुणे',
    mumbai: 'मुंबई',
    nashik: 'नाशिक',
    kolhapur: 'कोल्हापूर',
    satara: 'सातारा',
    sangli: 'सांगली',
    aurangabad: 'औरंगाबाद',
    nagpur: 'नागपूर',
  },
};

export function formatDistrict(code, lang = 'en') {
  const dict = DISTRICT_LABELS[lang === 'mr' ? 'mr' : 'en'];
  return dict[code] || code;
}
