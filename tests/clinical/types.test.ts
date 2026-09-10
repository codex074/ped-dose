import type { DoseResult, Drug } from '@/clinical/types';
import { CALC_TYPES } from '@/clinical/types';
import dataset from '../../public/data/peds_drugs.json';

test('CALC_TYPES matches every type present in the dataset', () => {
  const found = new Set<string>();
  for (const d of dataset.drugs as Drug[]) {
    if (d.calc) found.add(d.calc.type);
    for (const i of d.indications ?? []) found.add(i.calc.type);
  }
  expect([...found].sort()).toEqual([...CALC_TYPES].sort());
});

test('DoseResult discriminant compiles', () => {
  const r: DoseResult = { kind: 'needs_weight' };
  expect(r.kind).toBe('needs_weight');
});
