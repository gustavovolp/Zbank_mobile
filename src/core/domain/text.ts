const COMBINING_MARKS_START = String.fromCharCode(0x0300);
const COMBINING_MARKS_END = String.fromCharCode(0x036f);
const DIACRITICS = new RegExp(`[${COMBINING_MARKS_START}-${COMBINING_MARKS_END}]`, 'g');

export function normalizeText(text: string): string {
  return text.trim().toLowerCase().normalize('NFD').replace(DIACRITICS, '');
}
