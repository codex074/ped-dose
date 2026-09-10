import { formatRule } from '@/i18n/formatRule';
import { doseRows } from '@/i18n/formatDose';
import { translate } from '@/i18n';
import type { Drug, DoseResult } from '@/clinical/types';

const tEn = (k: string, p?: Record<string, string | number>) => translate('en', k, p);
const tTh = (k: string, p?: Record<string, string | number>) => translate('th', k, p);

test('rule text is language specific but numeric-identical', () => {
  const r = { kind: 'mg_per_kg_per_dose', low: 10, high: 15, maxMg: 1000 } as const;
  expect(formatRule(r, tEn)).toBe('10-15 mg/kg/dose (max 1000 mg/dose)');
  expect(formatRule(r, tTh)).toContain('10-15 mg/kg/dose');
});

test('doseRows numeric values are identical across languages', () => {
  const drug = {
    id: 'x',
    generic: 'X',
    brand: 'X syrup',
    concentration_mg_per_ml: 24,
    form: 'syrup',
  } as never;
  const result: DoseResult = {
    kind: 'dose',
    mgRange: [100, 150],
    mlRange: [4.1666, 6.25],
    rule: { kind: 'mg_per_kg_per_dose', low: 10, high: 15 },
  };
  const en = doseRows(drug, result, tEn);
  const th = doseRows(drug, result, tTh);
  expect(en.map((r) => r.value)).toEqual(th.map((r) => r.value));
  expect(en[0]!.value).toBe('100-150');
  expect(en[1]!.value).toBe('4.17-6.25');
  expect(en[1]!.emphasis).toBe(true);
});

test('mL row label is dose.draw for ampoule forms', () => {
  const drug = {
    id: 'y',
    generic: 'Y',
    brand: 'Y Amp',
    concentration_mg_per_ml: 1,
    form: 'amp',
  } as never;
  const result: DoseResult = {
    kind: 'dose',
    mgRange: [1, 2],
    mlRange: [1, 2],
    rule: { kind: 'ml_per_kg_per_dose', low: 0.1, high: 0.2 },
  };
  const rows = doseRows(drug as Drug, result, tEn);
  const mlRow = rows.find((r) => r.id === 'ml');
  expect(mlRow?.label).toBe(tEn('dose.draw'));
});

test('band row falls back to noMatchingBand when unmatched', () => {
  const drug = { id: 'z', generic: 'Z', brand: 'Z', form: 'tab' } as never;
  const result: DoseResult = { kind: 'band', matched: false, rule: { kind: 'weight_band' } };
  const rows = doseRows(drug as Drug, result, tEn);
  expect(rows[0]?.value).toBe(tEn('dose.noMatchingBand'));
});

test('needs_weight and needs_age produce a single labeled row', () => {
  const drug = { id: 'z', generic: 'Z', brand: 'Z', form: 'tab' } as never;
  expect(doseRows(drug as Drug, { kind: 'needs_weight' }, tEn)[0]).toMatchObject({
    id: 'needsWeight',
    value: '',
    unit: '',
  });
  expect(doseRows(drug as Drug, { kind: 'needs_age' }, tEn)[0]).toMatchObject({
    id: 'needsAge',
    value: '',
    unit: '',
  });
});
