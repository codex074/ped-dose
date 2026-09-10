import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const UPSTREAM_JSON_SHA256 = '52c9ddcc16ba189f13b3468637aa512ae1018b8c8263a9693d5ae586ea01ac33';

test('canonical dataset is byte-identical to upstream baseline', () => {
  const buf = readFileSync('public/data/peds_drugs.json');
  expect(createHash('sha256').update(buf).digest('hex')).toBe(UPSTREAM_JSON_SHA256);
});

test('canonical dataset has expected top-level shape', () => {
  const d = JSON.parse(readFileSync('public/data/peds_drugs.json', 'utf8'));
  expect(d._meta.version).toBe('2.5');
  expect(d.drugs).toHaveLength(67);
  expect(d.categories).toHaveLength(17);
  expect(d.pals_algorithms.map((a: { id: string }) => a.id)).toEqual(['cardiac_arrest', 'tachy_pulse', 'brady_pulse']);
  expect(d.se_algorithm.id).toBe('convulsive_se');
});
