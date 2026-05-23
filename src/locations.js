/** Indian states and cities for profile location selects. */

export const CITY_OTHER = '__other__';

export const STATES = [
  { value: 'mh', labelEn: 'Maharashtra', labelMr: 'महाराष्ट्र' },
  { value: 'dl', labelEn: 'Delhi', labelMr: 'दिल्ली' },
  { value: 'ka', labelEn: 'Karnataka', labelMr: 'कर्नाटक' },
  { value: 'gj', labelEn: 'Gujarat', labelMr: 'गुजरात' },
  { value: 'tn', labelEn: 'Tamil Nadu', labelMr: 'तमिळनाडू' },
  { value: 'ts', labelEn: 'Telangana', labelMr: 'तेलंगणा' },
  { value: 'ap', labelEn: 'Andhra Pradesh', labelMr: 'आंध्र प्रदेश' },
  { value: 'kl', labelEn: 'Kerala', labelMr: 'केरळ' },
  { value: 'ga', labelEn: 'Goa', labelMr: 'गोवा' },
  { value: 'mp', labelEn: 'Madhya Pradesh', labelMr: 'मध्य प्रदेश' },
  { value: 'rj', labelEn: 'Rajasthan', labelMr: 'राजस्थान' },
  { value: 'up', labelEn: 'Uttar Pradesh', labelMr: 'उत्तर प्रदेश' },
  { value: 'uk', labelEn: 'Uttarakhand', labelMr: 'उत्तराखंड' },
  { value: 'pb', labelEn: 'Punjab', labelMr: 'पंजाब' },
  { value: 'hr', labelEn: 'Haryana', labelMr: 'हरियाणा' },
  { value: 'hp', labelEn: 'Himachal Pradesh', labelMr: 'हिमाचल प्रदेश' },
  { value: 'jk', labelEn: 'Jammu & Kashmir', labelMr: 'जम्मू आणि काश्मीर' },
  { value: 'br', labelEn: 'Bihar', labelMr: 'बिहार' },
  { value: 'jh', labelEn: 'Jharkhand', labelMr: 'झारखंड' },
  { value: 'wb', labelEn: 'West Bengal', labelMr: 'पश्चिम बंगाल' },
  { value: 'or', labelEn: 'Odisha', labelMr: 'ओडिशा' },
  { value: 'cg', labelEn: 'Chhattisgarh', labelMr: 'छत्तीसगड' },
  { value: 'as', labelEn: 'Assam', labelMr: 'आसाम' },
  { value: 'mn', labelEn: 'Manipur', labelMr: 'मणिपूर' },
  { value: 'ml', labelEn: 'Meghalaya', labelMr: 'मेघालय' },
  { value: 'mz', labelEn: 'Mizoram', labelMr: 'मिझोराम' },
  { value: 'nl', labelEn: 'Nagaland', labelMr: 'नागालंड' },
  { value: 'sk', labelEn: 'Sikkim', labelMr: 'सिक्कीम' },
  { value: 'tr', labelEn: 'Tripura', labelMr: 'त्रिपुरा' },
  { value: 'ar', labelEn: 'Arunachal Pradesh', labelMr: 'अरुणाचल प्रदेश' },
  { value: 'py', labelEn: 'Puducherry', labelMr: 'पुडुचेरी' },
  { value: 'ch', labelEn: 'Chandigarh', labelMr: 'चंडीगड' },
  { value: 'an', labelEn: 'Andaman & Nicobar', labelMr: 'अंदमान आणि निकोबार' },
  { value: 'la', labelEn: 'Ladakh', labelMr: 'लडाख' },
];

const MH_CITIES = [
  ['mumbai', 'Mumbai', 'मुंबई'],
  ['mumbai_suburban', 'Mumbai Suburban', 'मुंबई उपनगर'],
  ['pune', 'Pune', 'पुणे'],
  ['pimpri_chinchwad', 'Pimpri-Chinchwad', 'पिंपरी-चिंचवड'],
  ['nashik', 'Nashik', 'नाशिक'],
  ['nagpur', 'Nagpur', 'नागपूर'],
  ['aurangabad', 'Chhatrapati Sambhajinagar (Aurangabad)', 'औरंगाबाद'],
  ['kolhapur', 'Kolhapur', 'कोल्हापूर'],
  ['sangli', 'Sangli', 'सांगली'],
  ['satara', 'Satara', 'सातारा'],
  ['solapur', 'Solapur', 'सोलापूर'],
  ['thane', 'Thane', 'ठाणे'],
  ['palghar', 'Palghar', 'पालघर'],
  ['raigad', 'Raigad', 'रायगड'],
  ['ratnagiri', 'Ratnagiri', 'रत्नागिरी'],
  ['sindhudurg', 'Sindhudurg', 'सिंधुदुर्ग'],
  ['ahmednagar', 'Ahmednagar', 'अहमदनगर'],
  ['akola', 'Akola', 'अकोला'],
  ['amravati', 'Amravati', 'अमरावती'],
  ['beed', 'Beed', 'बीड'],
  ['bhandara', 'Bhandara', 'भंडारा'],
  ['buldhana', 'Buldhana', 'बुलढाणा'],
  ['chandrapur', 'Chandrapur', 'चंद्रपूर'],
  ['dhule', 'Dhule', 'धुळे'],
  ['gadchiroli', 'Gadchiroli', 'गडचिरोली'],
  ['gondia', 'Gondia', 'गोंदिया'],
  ['hingoli', 'Hingoli', 'हिंगोली'],
  ['jalgaon', 'Jalgaon', 'जळगाव'],
  ['jalna', 'Jalna', 'जालना'],
  ['latur', 'Latur', 'लातूर'],
  ['nanded', 'Nanded', 'नांदेड'],
  ['nandurbar', 'Nandurbar', 'नंदुरबार'],
  ['osmanabad', 'Dharashiv (Osmanabad)', 'उस्मानाबाद'],
  ['parbhani', 'Parbhani', 'परभणी'],
  ['wardha', 'Wardha', 'वर्धा'],
  ['washim', 'Washim', 'वाशिम'],
  ['yavatmal', 'Yavatmal', 'यवतमाळ'],
  ['panvel', 'Panvel', 'पनवेल'],
  ['ulhasnagar', 'Ulhasnagar', 'उल्हासनगर'],
  ['kalyan_dombivli', 'Kalyan-Dombivli', 'कल्याण-डोंबिवली'],
  ['vasai_virar', 'Vasai-Virar', 'वसई-विरार'],
  ['navi_mumbai', 'Navi Mumbai', 'नवी मुंबई'],
];

function cities(...rows) {
  return rows.map(([value, labelEn, labelMr]) => ({ value, labelEn, labelMr: labelMr || labelEn }));
}

export const CITIES_BY_STATE = {
  mh: cities(...MH_CITIES),
  dl: cities(
    ['new_delhi', 'New Delhi', 'नवी दिल्ली'],
    ['delhi', 'Delhi', 'दिल्ली'],
    ['dwarka', 'Dwarka', 'द्वारका'],
    ['rohini', 'Rohini', 'रोहिणी'],
    ['south_delhi', 'South Delhi', 'दक्षिण दिल्ली'],
    ['north_delhi', 'North Delhi', 'उत्तर दिल्ली'],
    ['east_delhi', 'East Delhi', 'पूर्व दिल्ली'],
    ['west_delhi', 'West Delhi', 'पश्चिम दिल्ली']
  ),
  ka: cities(
    ['bengaluru', 'Bengaluru', 'बेंगळुरू'],
    ['mysuru', 'Mysuru', 'मैसूर'],
    ['mangaluru', 'Mangaluru', 'मंगळुरू'],
    ['hubballi', 'Hubballi', 'हुब्बळी'],
    ['belagavi', 'Belagavi', 'बेळगाव'],
    ['kalaburagi', 'Kalaburagi', 'कलबुरगी'],
    ['davanagere', 'Davanagere', 'दावणगेरे'],
    ['ballari', 'Ballari', 'बल्लारी'],
    ['tumakuru', 'Tumakuru', 'तुमकूर'],
    ['shivamogga', 'Shivamogga', 'शिवमोग्गा']
  ),
  gj: cities(
    ['ahmedabad', 'Ahmedabad', 'अहमदाबाद'],
    ['surat', 'Surat', 'सूरत'],
    ['vadodara', 'Vadodara', 'वडोदरा'],
    ['rajkot', 'Rajkot', 'राजकोट'],
    ['bhavnagar', 'Bhavnagar', 'भावनगर'],
    ['jamnagar', 'Jamnagar', 'जामनगर'],
    ['gandhinagar', 'Gandhinagar', 'गांधीनगर'],
    ['junagadh', 'Junagadh', 'जूनागड']
  ),
  tn: cities(
    ['chennai', 'Chennai', 'चेन्नई'],
    ['coimbatore', 'Coimbatore', 'कोइंबतूर'],
    ['madurai', 'Madurai', 'मदुरै'],
    ['tiruchirappalli', 'Tiruchirappalli', 'तिरुचिरापल्ली'],
    ['salem', 'Salem', 'सेलम'],
    ['tirunelveli', 'Tirunelveli', 'तिरुनेलवेली'],
    ['erode', 'Erode', 'इरोड'],
    ['vellore', 'Vellore', 'वेल्लोर']
  ),
  ts: cities(
    ['hyderabad', 'Hyderabad', 'हैदराबाद'],
    ['warangal', 'Warangal', 'वारंगल'],
    ['nizamabad', 'Nizamabad', 'निजामाबाद'],
    ['karimnagar', 'Karimnagar', 'करीमनगर'],
    ['khammam', 'Khammam', 'खम्मम'],
    ['secunderabad', 'Secunderabad', 'सिकंदराबाद']
  ),
  ap: cities(
    ['visakhapatnam', 'Visakhapatnam', 'विशाखापट्टणम'],
    ['vijayawada', 'Vijayawada', 'विजयवाडा'],
    ['guntur', 'Guntur', 'गुंटूर'],
    ['nellore', 'Nellore', 'नेल्लोर'],
    ['tirupati', 'Tirupati', 'तिरुपती'],
    ['kakinada', 'Kakinada', 'काकिनाडा']
  ),
  kl: cities(
    ['thiruvananthapuram', 'Thiruvananthapuram', 'तिरुवनंतपुरम'],
    ['kochi', 'Kochi', 'कोची'],
    ['kozhikode', 'Kozhikode', 'कोझिकोड'],
    ['thrissur', 'Thrissur', 'त्रिशूर'],
    ['kollam', 'Kollam', 'कोल्लम'],
    ['kannur', 'Kannur', 'कन्नूर']
  ),
  goa: cities(
    ['panaji', 'Panaji', 'पणजी'],
    ['margao', 'Margao', 'मडगाव'],
    ['vasco_da_gama', 'Vasco da Gama', 'वास्को'],
    ['mapusa', 'Mapusa', 'मापुसा']
  ),
  ga: cities(
    ['panaji', 'Panaji', 'पणजी'],
    ['margao', 'Margao', 'मडगाव'],
    ['vasco_da_gama', 'Vasco da Gama', 'वास्को'],
    ['mapusa', 'Mapusa', 'मापुसा']
  ),
  mp: cities(
    ['bhopal', 'Bhopal', 'भोपाळ'],
    ['indore', 'Indore', 'इंदूर'],
    ['gwalior', 'Gwalior', 'ग्वालियर'],
    ['jabalpur', 'Jabalpur', 'जबलपूर'],
    ['ujjain', 'Ujjain', 'उज्जैन'],
    ['sagar', 'Sagar', 'सागर']
  ),
  rj: cities(
    ['jaipur', 'Jaipur', 'जयपूर'],
    ['jodhpur', 'Jodhpur', 'जोधपूर'],
    ['udaipur', 'Udaipur', 'उदयपूर'],
    ['kota', 'Kota', 'कोटा'],
    ['ajmer', 'Ajmer', 'अजमेर'],
    ['bikaner', 'Bikaner', 'बिकानेर']
  ),
  up: cities(
    ['lucknow', 'Lucknow', 'लखनऊ'],
    ['kanpur', 'Kanpur', 'कानपूर'],
    ['varanasi', 'Varanasi', 'वाराणसी'],
    ['agra', 'Agra', 'आग्रा'],
    ['meerut', 'Meerut', 'मेरठ'],
    ['noida', 'Noida', 'नोएडा'],
    ['ghaziabad', 'Ghaziabad', 'गाझियाबाद'],
    ['prayagraj', 'Prayagraj', 'प्रयागराज']
  ),
  uk: cities(
    ['dehradun', 'Dehradun', 'देहरादून'],
    ['haridwar', 'Haridwar', 'हरिद्वार'],
    ['roorkee', 'Roorkee', 'रुर्की'],
    ['haldwani', 'Haldwani', 'हल्द्वानी'],
    ['nainital', 'Nainital', 'नैनीताल']
  ),
  pb: cities(
    ['chandigarh_pb', 'Chandigarh', 'चंडीगड'],
    ['ludhiana', 'Ludhiana', 'लुधियाना'],
    ['amritsar', 'Amritsar', 'अमृतसर'],
    ['jalandhar', 'Jalandhar', 'जालंधर'],
    ['patiala', 'Patiala', 'पटियाला']
  ),
  hr: cities(
    ['gurugram', 'Gurugram', 'गुरुग्राम'],
    ['faridabad', 'Faridabad', 'फरीदाबाद'],
    ['panipat', 'Panipat', 'पानीपत'],
    ['ambala', 'Ambala', 'अंबाला'],
    ['karnal', 'Karnal', 'करनाल'],
    ['hisar', 'Hisar', 'हिसार']
  ),
  hp: cities(
    ['shimla', 'Shimla', 'शिमला'],
    ['dharamshala', 'Dharamshala', 'धर्मशाला'],
    ['solan', 'Solan', 'सोलन'],
    ['mandi', 'Mandi', 'मंडी']
  ),
  jk: cities(
    ['srinagar', 'Srinagar', 'श्रीनगर'],
    ['jammu', 'Jammu', 'जम्मू'],
    ['anantnag', 'Anantnag', 'अनंतनाग']
  ),
  br: cities(
    ['patna', 'Patna', 'पटणा'],
    ['gaya', 'Gaya', 'गया'],
    ['muzaffarpur', 'Muzaffarpur', 'मुजफ्फरपूर'],
    ['bhagalpur', 'Bhagalpur', 'भागलपूर']
  ),
  jh: cities(
    ['ranchi', 'Ranchi', 'रांची'],
    ['jamshedpur', 'Jamshedpur', 'जमशेदपूर'],
    ['dhanbad', 'Dhanbad', 'धनबाद'],
    ['bokaro', 'Bokaro', 'बोकारो']
  ),
  wb: cities(
    ['kolkata', 'Kolkata', 'कोलकाता'],
    ['howrah', 'Howrah', 'हावडा'],
    ['durgapur', 'Durgapur', 'दुर्गापूर'],
    ['siliguri', 'Siliguri', 'सिलिगुडी'],
    ['asansol', 'Asansol', 'आसनसोल']
  ),
  or: cities(
    ['bhubaneswar', 'Bhubaneswar', 'भुवनेश्वर'],
    ['cuttack', 'Cuttack', 'कटक'],
    ['rourkela', 'Rourkela', 'राउरकेला'],
    ['puri', 'Puri', 'पुरी']
  ),
  cg: cities(
    ['raipur', 'Raipur', 'रायपूर'],
    ['bilaspur', 'Bilaspur', 'बिलासपूर'],
    ['bhilai', 'Bhilai', 'भिलाई'],
    ['durg', 'Durg', 'दुर्ग']
  ),
  as: cities(
    ['guwahati', 'Guwahati', 'गुवाहाटी'],
    ['dibrugarh', 'Dibrugarh', 'डिब्रूगड'],
    ['jorhat', 'Jorhat', 'जोरहाट'],
    ['silchar', 'Silchar', 'सिलचर']
  ),
  mn: cities([['imphal', 'Imphal', 'इंफाळ']]),
  ml: cities([['shillong', 'Shillong', 'शिलाँग']]),
  mz: cities([['aizawl', 'Aizawl', 'ऐझवाल']]),
  nl: cities([['kohima', 'Kohima', 'कोहिमा']]),
  sk: cities([['gangtok', 'Gangtok', 'गंगटोक']]),
  tr: cities([['agartala', 'Agartala', 'अगरतला']]),
  ar: cities([['itanagar', 'Itanagar', 'ईटानगर']]),
  py: cities([['puducherry', 'Puducherry', 'पुडुचेरी']]),
  ch: cities([['chandigarh', 'Chandigarh', 'चंडीगड']]),
  an: cities([['port_blair', 'Port Blair', 'पोर्ट ब्लेअर']]),
  la: cities([['leh', 'Leh', 'लेह']]),
};

// Fix goa duplicate key - remove goa, keep ga
delete CITIES_BY_STATE.goa;

const CITY_LOOKUP = new Map();
for (const [state, list] of Object.entries(CITIES_BY_STATE)) {
  for (const c of list) {
    CITY_LOOKUP.set(`${state}:${c.value}`, c);
    CITY_LOOKUP.set(c.value, { ...c, state });
  }
}

const LEGACY_MH_DISTRICTS = new Set(MH_CITIES.map((r) => r[0]));

export function getStateList(lang = 'en') {
  return STATES.map((s) => ({
    value: s.value,
    label: lang === 'mr' ? s.labelMr : s.labelEn,
  }));
}

export function getCitiesForState(stateCode, lang = 'en') {
  const list = CITIES_BY_STATE[stateCode] || [];
  return list.map((c) => ({
    value: c.value,
    label: lang === 'mr' ? c.labelMr : c.labelEn,
  }));
}

export function findCity(stateCode, cityKey) {
  if (!stateCode || !cityKey) return null;
  return CITY_LOOKUP.get(`${stateCode}:${cityKey}`) || CITY_LOOKUP.get(cityKey) || null;
}

export function inferStateFromDistrict(district) {
  if (!district) return 'mh';
  if (CITY_LOOKUP.get(district)?.state) return CITY_LOOKUP.get(district).state;
  if (LEGACY_MH_DISTRICTS.has(district)) return 'mh';
  return 'mh';
}

export function formatCityLabel(stateCode, district, cityText, lang = 'en') {
  const found = findCity(stateCode, district);
  if (found) return lang === 'mr' ? found.labelMr : found.labelEn;
  if (cityText) return cityText;
  return district || '';
}

export function formatStateLabel(stateCode, lang = 'en') {
  const s = STATES.find((x) => x.value === stateCode);
  if (!s) return stateCode || '';
  return lang === 'mr' ? s.labelMr : s.labelEn;
}

function slugify(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 60);
}

/** Normalize API body fields into state, district (slug), city (display name). */
export function normalizeLocationInput(body = {}) {
  let state = body.state?.trim() || inferStateFromDistrict(body.district);
  const cityKey = body.cityKey?.trim();
  const cityCustom = body.cityCustom?.trim() || body.city?.trim();

  if (cityKey && cityKey !== CITY_OTHER) {
    const info = findCity(state, cityKey);
    return {
      state,
      district: cityKey,
      city: info ? info.labelEn : cityCustom || cityKey,
    };
  }

  if (cityCustom) {
    const slug = slugify(cityCustom) || 'other';
    return { state, district: slug, city: cityCustom };
  }

  if (body.district?.trim()) {
    const d = body.district.trim();
    const info = findCity(state, d);
    return {
      state,
      district: d,
      city: info ? info.labelEn : cityCustom || d,
    };
  }

  return { state: state || 'mh', district: 'pune', city: 'Pune' };
}

/** Values for profile form from DB row. */
export function locationFromProfile(row) {
  const state = row.state || inferStateFromDistrict(row.district);
  const district = row.district || '';
  const inList = Boolean(findCity(state, district));
  return {
    state,
    cityKey: inList ? district : CITY_OTHER,
    cityCustom: inList ? '' : row.city || district,
    cityLabel: formatCityLabel(state, district, row.city, 'en'),
  };
}

/** Flat list for legacy district search dropdowns. */
export function getAllCitiesFlat(lang = 'en') {
  const out = [];
  for (const s of STATES) {
    for (const c of CITIES_BY_STATE[s.value] || []) {
      out.push({
        value: c.value,
        state: s.value,
        label: `${lang === 'mr' ? c.labelMr : c.labelEn} (${lang === 'mr' ? s.labelMr : s.labelEn})`,
      });
    }
  }
  return out;
}
