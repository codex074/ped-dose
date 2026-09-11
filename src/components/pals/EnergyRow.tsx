import type { ReactNode } from 'react';
import { formatNumber } from '@/clinical/formatNumber';
import { energyJoules } from '@/clinical/energy';
import type { EnergyDose } from '@/clinical/types';
import { useCalculator } from '@/state/CalculatorProvider';

/**
 * One shock-energy row. Mirrors upstream `renderEnergy()`: without a weight it shows the
 * J/kg range only; with a weight it shows the small J/kg range next to the label plus the
 * computed J value (via `energyJoules` + `formatNumber`), with the translated note beneath.
 */
export function EnergyRow({ e }: { e: EnergyDose }) {
  const { weight } = useCalculator();

  let labelNode: ReactNode = e.label;
  let valueNode: string;

  if (weight == null) {
    valueNode = e.high_j_per_kg ? `${e.j_per_kg}-${e.high_j_per_kg} J/kg` : `${e.j_per_kg} J/kg`;
  } else {
    const { low, high } = energyJoules(e, weight);
    valueNode =
      high !== null ? `${formatNumber(low)}-${formatNumber(high)} J` : `${formatNumber(low)} J`;
    const rangeSmall = `(${e.j_per_kg}${e.high_j_per_kg ? `-${e.high_j_per_kg}` : ''} J/kg)`;
    labelNode = (
      <>
        {e.label} <small className="font-normal text-ink-muted">{rangeSmall}</small>
      </>
    );
  }

  return (
    <div className="mb-1.5 last:mb-0">
      <div className="flex items-center justify-between gap-3 rounded-xl bg-peach-soft/50 px-2.5 py-1.5">
        <span className="thai-safe break-words text-sm font-medium text-ink">{labelNode}</span>
        <span className="font-num shrink-0 tabular-nums text-sm font-semibold text-ink">
          {valueNode}
        </span>
      </div>
      {e.note && (
        <div className="thai-safe break-words px-1 pt-0.5 text-xs text-ink-muted">{e.note}</div>
      )}
    </div>
  );
}
