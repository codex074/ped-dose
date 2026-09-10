import { ruleToUpstreamText } from '@/clinical/ruleText';

test('band_label renders its literal label', () => {
  expect(ruleToUpstreamText({ kind: 'band_label', label: '5 mg/dose' })).toBe('5 mg/dose');
});

test('mg_per_kg_per_dose renders a bare low-high range with no min/max suffix', () => {
  expect(ruleToUpstreamText({ kind: 'mg_per_kg_per_dose', low: 0.25, high: 0.5 })).toBe(
    '0.25-0.5 mg/kg/dose',
  );
});

test('mg_per_kg_per_dose renders min and max suffixes when present', () => {
  expect(
    ruleToUpstreamText({
      kind: 'mg_per_kg_per_dose',
      low: 0.02,
      high: 0.02,
      minMg: 0.1,
      maxMg: 0.5,
    }),
  ).toBe('0.02 mg/kg/dose (min 0.1 mg) (max 0.5 mg/dose)');
});
