import { describe, expect, it } from 'vitest';
import { formatIsoDateForDisplay, fromIsoDate, toLocalIsoDate } from './dates';

describe('datas locais', () => {
  it('toLocalIsoDate usa o calendário local (sem deslocamento de fuso)', () => {
    expect(toLocalIsoDate(new Date(2026, 2, 5, 0, 0, 0))).toBe('2026-03-05');
    expect(toLocalIsoDate(new Date(2026, 11, 31, 23, 59, 59))).toBe('2026-12-31');
  });

  it('fromIsoDate e toLocalIsoDate são inversas', () => {
    expect(toLocalIsoDate(fromIsoDate('2024-02-29'))).toBe('2024-02-29');
  });

  it('formata para exibição em pt-BR', () => {
    expect(formatIsoDateForDisplay('2026-03-05')).toBe('05/03/2026');
    expect(formatIsoDateForDisplay('lixo')).toBe('lixo');
  });
});
