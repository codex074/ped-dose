import { formatNumber, formatRange } from '@/clinical/formatNumber';

test.each([
  [null, '—'],
  [undefined, '—'],
  [NaN, '—'],
  [0, '0'],
  [100, '100'],
  [100.5, '101'],
  [99.999, '100'],
  [150.4, '150'],
  [10, '10'],
  [12.5, '12.5'],
  [12.04, '12'],
  [12.96, '13'],
  [1, '1'],
  [1.5, '1.5'],
  [1.234, '1.23'],
  [4.166666, '4.17'],
  [9.999, '10'],
  [0.5, '0.5'],
  [0.73, '0.73'],
  [0.999999, '1'],
  [0.004, '0'],
])('formatNumber(%s) = %s', (input, expected) => {
  expect(formatNumber(input as number)).toBe(expected);
});

test('formatRange collapses equal ends', () => {
  expect(formatRange(150, 150)).toBe('150');
  expect(formatRange(100, 150)).toBe('100-150');
});
