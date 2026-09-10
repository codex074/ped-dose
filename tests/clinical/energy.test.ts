import { energyJoules } from '@/clinical/energy';
test('energy multiplies without ceiling', () => {
  expect(energyJoules({ label: 'x', j_per_kg: 4 }, 40)).toEqual({ low: 160, high: null });
  expect(energyJoules({ label: 'x', j_per_kg: 0.5, high_j_per_kg: 1 }, 12)).toEqual({
    low: 6,
    high: 12,
  });
});
