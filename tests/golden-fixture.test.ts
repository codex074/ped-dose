import { readFileSync } from 'node:fs';
import type { GoldenFile } from '../scripts/golden-types';
const golden = JSON.parse(
  readFileSync('tests/fixtures/upstream-golden.json', 'utf8'),
) as GoldenFile;

test('golden fixture covers every drug and indication', () => {
  const ids = new Set(golden.cases.map((c) => c.drugId));
  expect(ids.size).toBe(67);
  const adenosine = golden.cases.filter((c) => c.drugId === 'adenosine');
  expect(new Set(adenosine.map((c) => c.indicationIndex))).toEqual(new Set([0, 1]));
});

test('golden fixture contains known upstream behaviors', () => {
  const find = (drugId: string, weight: number | null, age: number | null) =>
    golden.cases.find(
      (c) =>
        c.drugId === drugId && c.indicationIndex === null && c.weight === weight && c.age === age,
    )!;
  expect(find('antiphen_syrup', 10, 2.5).formatted.mg).toBe('100-150');
  expect(find('antiphen_syrup', 10, 2.5).formatted.ml).toBe('4.17-6.25');
  expect(find('mgo_tab', 20, 5.5).raw.bandText).toBe('無相符區間');
  expect(find('taita1', 10, 1).raw.rate).toBe(40);
  expect(find('taita1', 20.5, 1).raw.rate).toBe(60.5);
  expect(find('antiphen_syrup', null, 2.5).raw.needs_weight).toBe(true);
  expect(find('idefen_syrup', 5, 0.1).contra?.severityClass).toBe('severe');
});
