import { calcDose } from '@/clinical/calcDose';
import type { Drug } from '@/clinical/types';
import dataset from '../../public/data/peds_drugs.json';

const drugs = dataset.drugs as Drug[];
const byId = (id: string) => drugs.find((d) => d.id === id)!;

function syntheticDrug(overrides: Partial<Drug>): Drug {
  return {
    id: 'synthetic',
    generic: 'synthetic',
    brand: 'synthetic',
    kmuh_code: null,
    category: 'synthetic',
    form: 'synthetic',
    route: 'synthetic',
    source: 'synthetic',
    kmuh_detail: {},
    ...overrides,
  };
}

test('mg_per_kg_per_dose with mL conversion', () => {
  const d = byId('antiphen_syrup');
  const r = calcDose(d, d.calc!, 10, 2);
  expect(r).toMatchObject({ kind: 'dose', mgRange: [100, 150] });
  if (r.kind === 'dose') expect(r.mlRange![0]).toBeCloseTo(4.1667, 4);
});

test('max_dose_mg collapses the range', () => {
  const d = byId('antiphen_syrup');
  const r = calcDose(d, d.calc!, 90, 8);
  expect(r).toMatchObject({ kind: 'dose', mgRange: [900, 1000] });
});

test('needs_weight when weight is null', () => {
  const d = byId('antiphen_syrup');
  expect(calcDose(d, d.calc!, null, 2)).toEqual({ kind: 'needs_weight' });
});

test('age_band gap returns unmatched band', () => {
  const d = byId('mgo_tab');
  expect(calcDose(d, d.calc!, 20, 5.5)).toEqual({
    kind: 'band',
    matched: false,
    rule: { kind: 'age_band' },
  });
});

test('age_band matched free text', () => {
  const d = byId('mgo_tab');
  const r = calcDose(d, d.calc!, 20, 3);
  expect(r).toMatchObject({
    kind: 'band',
    matched: true,
    bandIndex: 1,
    bandText: '0.5-1 # TID-QID',
  });
});

test('age_band checks age before weight', () => {
  const d = byId('cetirizine_syrup');
  expect(calcDose(d, d.calc!, 15, null)).toEqual({ kind: 'needs_age' });
});

test('fluid_421_rule tiers', () => {
  const d = byId('taita1');
  expect(calcDose(d, d.calc!, 10, 1)).toMatchObject({ kind: 'rate', rate: 40 });
  expect(calcDose(d, d.calc!, 20.5, 1)).toMatchObject({ kind: 'rate', rate: 60.5 });
});

test('dilution special', () => {
  const d = byId('citosol');
  const r = calcDose(d, d.calc!, 12, 5);
  expect(r).toMatchObject({ kind: 'dilution', startLow: 3, startHigh: 4, max: 12 });
});

test('indication calc (adenosine 2nd dose cap)', () => {
  const d = byId('adenosine');
  const r = calcDose(d, d.indications![1]!.calc, 70, 16);
  expect(r).toMatchObject({ kind: 'dose', mgRange: [12, 12] });
});

test('age_band fixed-dose sub-branch with label produces band_label rule', () => {
  const d = byId('cetirizine_syrup');
  const r = calcDose(d, d.calc!, 15, 4);
  expect(r).toMatchObject({ kind: 'dose', mgRange: [5, 5] });
  if (r.kind === 'dose') {
    expect(r.rule.kind).toBe('band_label');
    if (r.rule.kind === 'band_label') expect(r.rule.label).toBe('3-6y · 5 mg QD（或 2.5 mg BID）');
  }
});

test('age_band mg_per_dose sub-branch without label uses literal "N mg/dose" text', () => {
  const d = syntheticDrug({
    concentration_mg_per_ml: 1,
    calc: { type: 'age_band', bands: [{ age_low: 2, age_high: 6, mg_per_dose: 5 }] },
  });
  const r = calcDose(d, d.calc!, null, 4);
  expect(r).toStrictEqual({
    kind: 'dose',
    mgRange: [5, 5],
    mlRange: [5, 5],
    rule: { kind: 'band_label', label: '5 mg/dose' },
  });
});

test('age_band mg_per_kg_per_dose sub-branch without label has no minMg/maxMg keys', () => {
  const d = syntheticDrug({
    calc: {
      type: 'age_band',
      bands: [{ age_low: 0, age_high: 2, mg_per_kg_per_dose: 0.25, max_mg_per_dose: 5 }],
    },
  });
  const r = calcDose(d, d.calc!, 30, 1);
  expect(r).toStrictEqual({
    kind: 'dose',
    mgRange: [5, 5],
    rule: { kind: 'mg_per_kg_per_dose', low: 0.25, high: 0.25 },
  });
});

test('age_band mg_per_kg_per_dose_high sub-branch produces asymmetric range', () => {
  const d = syntheticDrug({
    calc: {
      type: 'age_band',
      bands: [
        {
          age_low: 0,
          age_high: 2,
          mg_per_kg_per_dose: 0.25,
          mg_per_kg_per_dose_high: 0.5,
          max_mg_per_dose: 5,
        },
      ],
    },
  });
  const r = calcDose(d, d.calc!, 4, 1);
  expect(r).toStrictEqual({
    kind: 'dose',
    mgRange: [1, 2],
    rule: { kind: 'mg_per_kg_per_dose', low: 0.25, high: 0.5 },
  });
});
