/** True if string contains Devanagari characters. */
export function hasDevanagari(text) {
  return /[\u0900-\u097F]/.test(String(text || ''));
}

export function displayNameForLang(row, lang = 'en') {
  const en = row.display_name || '';
  const mr = row.display_name_mr || '';
  if (lang === 'mr') {
    if (mr) return mr;
    if (hasDevanagari(en)) return en;
  }
  return en;
}
