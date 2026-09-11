import { screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { translate } from '@/i18n';
import type { DoseResult } from '@/clinical/types';
import { MiniDoseLine, miniDoseText } from '@/components/MiniDoseLine';
import { renderWithProviders, realDataset } from '../utils';

const enT = (key: string, params?: Record<string, string | number>) => translate('en', key, params);
const thT = (key: string, params?: Record<string, string | number>) => translate('th', key, params);

describe('miniDoseText', () => {
  test('mg range + mL range', () => {
    const result: DoseResult = {
      kind: 'dose',
      mgRange: [100, 150],
      mlRange: [4.166666666666667, 6.25],
      rule: { kind: 'mg_per_kg_per_dose', low: 10, high: 15 },
    };
    expect(miniDoseText(result, enT)).toBe('100-150 mg (4.17-6.25 mL)');
  });

  test('mg only, equal ends', () => {
    const result: DoseResult = {
      kind: 'dose',
      mgRange: [5, 5],
      rule: { kind: 'mg_per_kg_per_dose', low: 1, high: 1 },
    };
    expect(miniDoseText(result, enT)).toBe('5 mg');
  });

  test('mcg range + mL range', () => {
    const result: DoseResult = {
      kind: 'dose',
      mcgRange: [50, 75],
      mlRange: [1, 2],
      rule: { kind: 'mcg_per_kg_per_dose', low: 5, high: 7.5 },
    };
    expect(miniDoseText(result, enT)).toBe('50-75 mcg (1-2 mL)');
  });

  test('unit range only, with custom unit', () => {
    const result: DoseResult = {
      kind: 'dose',
      unitRange: [1, 2],
      rule: { kind: 'supp_by_weight', divLow: 5, divHigh: 10 },
    };
    expect(miniDoseText(result, enT, { unit: 'tab' })).toBe('1-2 tab');
  });

  test('unit range only, default unit fallback', () => {
    const result: DoseResult = {
      kind: 'dose',
      unitRange: [1, 2],
      rule: { kind: 'supp_by_weight', divLow: 5, divHigh: 10 },
    };
    expect(miniDoseText(result, enT)).toBe('1-2 #');
  });

  test('packs per dose', () => {
    const result: DoseResult = {
      kind: 'dose',
      packsPerDose: 1.5,
      rule: { kind: 'pack_per_30kg_per_dose' },
    };
    expect(miniDoseText(result, enT)).toBe('1.5 pack/dose');
  });

  test('band matched uses result bandText by default', () => {
    const result: DoseResult = {
      kind: 'band',
      matched: true,
      bandIndex: 0,
      bandText: '5 mL',
      rule: { kind: 'weight_band' },
    };
    expect(miniDoseText(result, enT)).toBe('5 mL');
  });

  test('band matched honors opts.bandText override', () => {
    const result: DoseResult = {
      kind: 'band',
      matched: true,
      bandIndex: 0,
      bandText: '5 mL',
      rule: { kind: 'weight_band' },
    };
    expect(miniDoseText(result, enT, { bandText: 'override' })).toBe('override');
  });

  test('band unmatched', () => {
    const result: DoseResult = { kind: 'band', matched: false, rule: { kind: 'weight_band' } };
    expect(miniDoseText(result, enT)).toBe(enT('dose.noMatchingBand'));
  });

  test('rate', () => {
    const result: DoseResult = {
      kind: 'rate',
      rate: 40,
      rule: { kind: 'fluid_421' },
    };
    expect(miniDoseText(result, enT)).toBe('40 mL/hr');
  });

  test('dilution', () => {
    const result: DoseResult = {
      kind: 'dilution',
      startLow: 2,
      startHigh: 4,
      max: 10,
      note: 'slow push',
    };
    expect(miniDoseText(result, enT)).toBe(
      enT('dose.dilution', { start: '2-4', max: '10', note: 'slow push' }),
    );
  });

  test('needs_weight uses EN string', () => {
    const result: DoseResult = { kind: 'needs_weight' };
    expect(miniDoseText(result, enT)).toBe('Enter weight to calculate');
  });

  test('needs_age uses EN string', () => {
    const result: DoseResult = { kind: 'needs_age' };
    expect(miniDoseText(result, enT)).toBe('Enter age to calculate');
  });

  test('numeric mg (mL) portion is language-independent', () => {
    const result: DoseResult = {
      kind: 'dose',
      mgRange: [100, 150],
      mlRange: [4.166666666666667, 6.25],
      rule: { kind: 'mg_per_kg_per_dose', low: 10, high: 15 },
    };
    expect(miniDoseText(result, enT)).toBe(miniDoseText(result, thT));
  });
});

describe('MiniDoseLine', () => {
  const antiphen = realDataset.drugs.find((d) => d.id === 'antiphen_syrup')!;

  test('renders computed mg (mL) text when weight is set', () => {
    renderWithProviders(<MiniDoseLine drug={antiphen} calc={antiphen.calc!} />, {
      lang: 'en',
      calculator: { weight: 10, weightInput: '10', age: 2, ageInput: '2' },
    });
    expect(screen.getByTestId('mini-dose-line')).toHaveTextContent('100-150 mg (4.17-6.25 mL)');
  });

  test('renders needs-weight text when weight is missing', () => {
    renderWithProviders(<MiniDoseLine drug={antiphen} calc={antiphen.calc!} />, {
      lang: 'en',
      calculator: { weight: null, weightInput: '', age: 2, ageInput: '2' },
    });
    expect(screen.getByTestId('mini-dose-line')).toHaveTextContent('Enter weight to calculate');
  });
});
