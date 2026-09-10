import { expect, test, vi } from 'vitest';
import th from '@/i18n/ui.th.json';
import en from '@/i18n/ui.en.json';
import { translate } from '@/i18n';

test('TH and EN UI files have identical key sets', () => {
  expect(Object.keys(th).sort()).toEqual(Object.keys(en).sort());
});

test('no empty UI strings', () => {
  for (const [k, v] of Object.entries({ ...th, ...en })) expect(v, k).not.toBe('');
});

test('missing key falls back to the key itself', () => {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    expect(translate('th', 'missing.key')).toBe('missing.key');
  } finally {
    warnSpy.mockRestore();
  }
});
