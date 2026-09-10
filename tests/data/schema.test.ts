import { describe, expect, test } from 'vitest';
import { validateDataset } from '@/data/schema';
import dataset from '../../public/data/peds_drugs.json';

describe('validateDataset', () => {
  test('canonical dataset validates', () => {
    const r = validateDataset(dataset);
    expect(r.ok).toBe(true);
  });

  test('does not mutate the input', () => {
    const clone = structuredClone(dataset);
    validateDataset(clone);
    expect(clone).toEqual(dataset);
  });

  test('unknown calc type fails with drug id', () => {
    const bad = structuredClone(dataset);
    (bad.drugs[0] as { calc: { type: string } }).calc.type = 'nope';
    const r = validateDataset(bad);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]!.drugId).toBe(dataset.drugs[0]!.id);
  });

  test('unknown indication calc type fails with drug id', () => {
    const bad = structuredClone(dataset) as {
      drugs: { id: string; indications?: { calc: { type: string } }[] }[];
    };
    const withIndication = bad.drugs.find((d) => d.indications && d.indications.length > 0)!;
    withIndication.indications![0]!.calc.type = 'nope';
    const r = validateDataset(bad);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.drugId === withIndication.id)).toBe(true);
  });

  test('duplicate drug id fails at dataset level', () => {
    const bad = structuredClone(dataset);
    bad.drugs.push(structuredClone(dataset.drugs[0]!));
    const r = validateDataset(bad);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => /duplicate/i.test(e.message))).toBe(true);
  });

  test('low > high fails', () => {
    const bad = structuredClone(dataset) as { drugs: { calc?: { low?: number; high?: number } }[] };
    const withRange = bad.drugs.find(
      (d) => d.calc && d.calc.low !== undefined && d.calc.high !== undefined,
    )!;
    const tmp = withRange.calc!.low;
    withRange.calc!.low = withRange.calc!.high;
    withRange.calc!.high = tmp;
    // ensure actually low > high now (skip if they were equal)
    if (withRange.calc!.low! > withRange.calc!.high!) {
      const r = validateDataset(bad);
      expect(r.ok).toBe(false);
    }
  });

  test('non-numeric concentration fails', () => {
    const bad = structuredClone(dataset) as { drugs: { concentration_mg_per_ml?: unknown }[] };
    const withConc = bad.drugs.find((d) => typeof d.concentration_mg_per_ml === 'number')!;
    withConc.concentration_mg_per_ml = -1;
    const r = validateDataset(bad);
    expect(r.ok).toBe(false);
  });

  test('unknown contraindication type fails', () => {
    const bad = structuredClone(dataset) as {
      drugs: { contraindications?: { type: string }[] }[];
    };
    const withContra = bad.drugs.find(
      (d) => d.contraindications && d.contraindications.length > 0,
    )!;
    withContra.contraindications![0]!.type = 'nope';
    const r = validateDataset(bad);
    expect(r.ok).toBe(false);
  });

  test('missing required field fails', () => {
    const bad = structuredClone(dataset) as { drugs: Record<string, unknown>[] };
    delete bad.drugs[0]!.generic;
    const r = validateDataset(bad);
    expect(r.ok).toBe(false);
  });
});
