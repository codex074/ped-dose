import { useT } from '@/i18n';
import { useCalculator } from '@/state/CalculatorProvider';
import { formatNumber } from '@/clinical/formatNumber';

/**
 * Mint pill mirroring upstream's `#weight-summary`: renders nothing until the clinician has
 * entered a weight or an age, then echoes back exactly what the dose engine is using via
 * `patient.summary`. `{weight}`/`{age}` are interpolated via `formatNumber` (never
 * `toLocaleString`/`Intl.NumberFormat`), which also gives a graceful "—" fallback instead of the
 * literal string "null" for the one field the clinician hasn't entered yet.
 */
export function PatientSummaryBanner() {
  const t = useT();
  const { weight, age } = useCalculator();

  if (weight == null && age == null) return null;

  return (
    <div className="mt-4 flex first:mt-0">
      <span
        role="status"
        className="thai-safe inline-flex items-center rounded-full bg-mint-soft px-3 py-1 text-sm text-ink"
      >
        {t('patient.summary', { weight: formatNumber(weight), age: formatNumber(age) })}
      </span>
    </div>
  );
}
