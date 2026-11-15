export function parseMoney(text: string): number {
  const cleaned = text.replace(/\s/g, '').replace(/^R\$/i, '');
  if (!cleaned) return Number.NaN;

  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
  if (!/^\d+(\.\d+)?$/.test(normalized)) return Number.NaN;

  return Number(normalized);
}
