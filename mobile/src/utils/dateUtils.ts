/**
 * Strips timezone suffix from ISO string.
 * "2026-05-29T02:35:00+00:00" → "2026-05-29T02:35:00"
 * "2026-05-29T02:35:00Z" → "2026-05-29T02:35:00"
 * "2026-05-29T02:35:00.000Z" → "2026-05-29T02:35:00.000"
 */
function stripTimezone(isoString: string): string {
  let s = isoString.replace('Z', '');
  s = s.replace(/[+-]\d{2}:\d{2}$/, '');
  return s;
}

/**
 * Extracts time (HH:mm) from an ISO datetime string WITHOUT timezone conversion.
 */
export function extractTime(isoString: string): string {
  const s = stripTimezone(isoString);
  if (s.includes('T')) {
    return s.split('T')[1].slice(0, 5);
  }
  const match = s.match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : isoString;
}

/**
 * Extracts date and time (DD/MM/YYYY HH:mm) from an ISO datetime string WITHOUT timezone conversion.
 */
export function extractDateTime(isoString: string): string {
  const s = stripTimezone(isoString);
  if (s.includes('T')) {
    const [datePart, timePart] = s.split('T');
    const [year, month, day] = datePart.split('-');
    const time = timePart.slice(0, 5);
    return `${day}/${month}/${year} ${time}`;
  }
  return isoString;
}

/**
 * Extracts date (DD/MM/YYYY) from an ISO datetime string WITHOUT timezone conversion.
 */
export function extractDate(isoString: string): string {
  const s = stripTimezone(isoString);
  const datePart = s.split('T')[0];
  const [year, month, day] = datePart.split('-');
  return `${day}/${month}/${year}`;
}
