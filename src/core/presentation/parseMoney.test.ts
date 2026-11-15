import { describe, expect, it } from 'vitest';
import { parseMoney } from './parseMoney';

describe('parseMoney', () => {
  it.each([
    ['12,50', 12.5],
    ['12.50', 12.5],
    ['1.234,56', 1234.56],
    ['R$ 99,90', 99.9],
    ['  7  ', 7],
    ['0,05', 0.05],
  ])('interpreta "%s" como %s', (text, expected) => {
    expect(parseMoney(text)).toBe(expected);
  });

  it.each(['', '   ', 'abc', '-5', '1e5', '12,3,4', '12,50abc', '--'])('retorna NaN para "%s"', (text) => {
    expect(parseMoney(text)).toBeNaN();
  });
});
