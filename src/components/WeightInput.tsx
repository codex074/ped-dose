import { useId } from 'react';
import { useT } from '@/i18n';
import { useCalculator } from '@/state/CalculatorProvider';

/**
 * The primary weight field: a free-form decimal kg entry bound directly to
 * `weightInput`/`setWeightInput`/`weightError` from `useCalculator()`. The `kg` unit sits inside
 * the field as a suffix per DESIGN.md §12.2 ("Weight [ 18.0 ] kg").
 */
export function WeightInput() {
  const t = useT();
  const { weightInput, setWeightInput, weightError } = useCalculator();
  const inputId = useId();
  const errorId = useId();

  return (
    <div>
      <div className="mb-1 flex items-center gap-1">
        <span aria-hidden="true" className="text-base leading-none">
          ⚖️
        </span>
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {t('patient.weight')}
        </label>
      </div>
      <div className="relative">
        <input
          id={inputId}
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          max="120"
          placeholder={t('patient.weightPlaceholder')}
          value={weightInput}
          onChange={(e) => setWeightInput(e.target.value)}
          aria-invalid={weightError}
          aria-describedby={weightError ? errorId : undefined}
          className={`h-11 w-full min-w-0 rounded-2xl border bg-white pl-3 pr-10 font-num text-base text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-deep ${
            weightError ? 'border-status-danger' : 'border-line'
          }`}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-ink-muted"
        >
          {t('patient.weightUnit')}
        </span>
      </div>
      {weightError && (
        <p id={errorId} role="alert" className="thai-safe mt-1 text-xs text-status-dangerText">
          {t('patient.weightError')}
        </p>
      )}
    </div>
  );
}
