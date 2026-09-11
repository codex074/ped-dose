import { useMemo } from 'react';
import { calcDose } from '@/clinical';
import type { Calc, Drug, DoseResult } from '@/clinical/types';
import { useCalculator } from '@/state/CalculatorProvider';

/**
 * The one sanctioned entry point into `calcDose` for components. Reads weight/age from
 * `useCalculator()` so every dose-rendering component shares the same patient context.
 */
export function useDoseResult(drug: Drug, calc: Calc): DoseResult {
  const { weight, age } = useCalculator();
  return useMemo(() => calcDose(drug, calc, weight, age), [drug, calc, weight, age]);
}
