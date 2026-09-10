import { checkContraindication, severityBucket } from '@/clinical/contraindications';
import type { Drug } from '@/clinical/types';
import dataset from '../../public/data/peds_drugs.json';
const byId = (id: string) => (dataset.drugs as Drug[]).find((d) => d.id === id)!;

test('severity buckets are lossy exactly like upstream', () => {
  expect(severityBucket('禁用')).toBe('severe');
  expect(severityBucket('不建議')).toBe('moderate');
  expect(severityBucket('慎用')).toBe('mild');
  expect(severityBucket('建議改膠囊')).toBe('mild');
});

test('idefen_syrup is contraindicated under 6 months', () => {
  const hit = checkContraindication(byId('idefen_syrup'), 5, 0.1);
  expect(hit?.severity).toBe('severe');
  expect(checkContraindication(byId('idefen_syrup'), 5, 1)).toBeNull();
});

test('no age → no age-based hit', () => {
  expect(checkContraindication(byId('idefen_syrup'), 5, null)).toBeNull();
});
