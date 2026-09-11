import { useT } from '@/i18n';
import { AgeInput } from './AgeInput';
import { WeightInput } from './WeightInput';

/**
 * Friendly "patient information" card (DESIGN.md §12): weight and age entry side by side on
 * wider screens, stacked on mobile. Purely a layout shell — all state lives behind
 * `WeightInput`/`AgeInput` via `useCalculator()`.
 */
export function PatientInput() {
  const t = useT();

  return (
    <section className="rounded-2xl bg-white p-4 shadow-soft" aria-labelledby="patient-input-title">
      <h2 id="patient-input-title" className="thai-safe mb-3 text-sm font-semibold text-ink">
        {t('patient.title')}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <WeightInput />
        <AgeInput />
      </div>
    </section>
  );
}
