import { calcDose } from '@/clinical/calcDose';
import type { Drug } from '@/clinical/types';
import dataset from '../../public/data/peds_drugs.json';

const drugs = dataset.drugs as Drug[];
const byId = (id: string) => drugs.find((d) => d.id === id)!;

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
