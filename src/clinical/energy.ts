import type { EnergyDose } from './types';
export function energyJoules(e: EnergyDose, weight: number): { low: number; high: number | null } {
  return { low: e.j_per_kg * weight, high: e.high_j_per_kg ? e.high_j_per_kg * weight : null };
}
