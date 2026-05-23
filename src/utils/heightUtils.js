/** Parse height string to centimetres for search/filtering. */
export function parseHeightToCm(heightStr) {
  if (!heightStr) return null;
  const t = String(heightStr).trim();
  const ftIn = t.match(/(\d)\s*['′]\s*(\d{1,2})/);
  if (ftIn) {
    const feet = Number(ftIn[1]);
    const inches = Number(ftIn[2]);
    if (feet >= 4 && feet <= 7) return Math.round(feet * 30.48 + inches * 2.54);
  }
  const cm = t.match(/(\d{3})\s*cm/i);
  if (cm) {
    const n = Number(cm[1]);
    if (n >= 140 && n <= 220) return n;
  }
  return null;
}

export function cmToDisplay(cm) {
  if (!cm) return '';
  const totalIn = Math.round(cm / 2.54);
  const feet = Math.floor(totalIn / 12);
  const inches = totalIn % 12;
  return `${feet}'${inches}"`;
}
