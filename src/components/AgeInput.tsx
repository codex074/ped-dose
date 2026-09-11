import { useId, useState } from 'react';
import { useT } from '@/i18n';
import { useCalculator } from '@/state/CalculatorProvider';

/**
 * The primary age field: a free-form decimal-years entry bound directly to
 * `ageInput`/`setAgeInput`/`ageError` from `useCalculator()`, always showing the same float the
 * dose engine uses. Below it sits a collapsible "years + months" helper — two integer inputs
 * that call `setAgeFromYearsMonths(years, months)`, which in turn updates `ageInput` so this
 * field's own value reflects the computed float (e.g. 2 yr + 6 mo -> "2.5").
 */
export function AgeInput() {
  const t = useT();
  const { ageInput, setAgeInput, setAgeFromYearsMonths, ageError } = useCalculator();
  const [helperOpen, setHelperOpen] = useState(false);
  const [helperYears, setHelperYears] = useState('');
  const [helperMonths, setHelperMonths] = useState('');

  const inputId = useId();
  const errorId = useId();
  const helperPanelId = useId();
  const helperYearsId = useId();
  const helperMonthsId = useId();

  function applyHelper(yearsStr: string, monthsStr: string) {
    const y = yearsStr.trim() === '' ? 0 : Number(yearsStr);
    const m = monthsStr.trim() === '' ? 0 : Number(monthsStr);
    if (Number.isNaN(y) || Number.isNaN(m)) return;
    setAgeFromYearsMonths(y, m);
  }

  return (
    <div>
      <div className="mb-1 flex items-center gap-1">
        <span aria-hidden="true" className="text-base leading-none">
          👶
        </span>
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {t('patient.age')}
        </label>
      </div>
      <div className="relative">
        <input
          id={inputId}
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          max="18"
          placeholder={t('patient.agePlaceholder')}
          value={ageInput}
          onChange={(e) => setAgeInput(e.target.value)}
          aria-invalid={ageError}
          aria-describedby={ageError ? errorId : undefined}
          className={`h-11 w-full min-w-0 rounded-2xl border bg-white pl-3 pr-10 font-num text-base text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-deep ${
            ageError ? 'border-status-danger' : 'border-line'
          }`}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-ink-muted"
        >
          {t('patient.ageYears')}
        </span>
      </div>
      {ageError && (
        <p id={errorId} role="alert" className="thai-safe mt-1 text-xs text-status-dangerText">
          {t('patient.ageError')}
        </p>
      )}

      <button
        type="button"
        aria-expanded={helperOpen}
        aria-controls={helperPanelId}
        onClick={() => setHelperOpen((open) => !open)}
        className="mt-2 inline-flex h-11 items-center gap-1 rounded-2xl px-2 text-sm font-medium text-sky-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-deep"
      >
        <span aria-hidden="true">{helperOpen ? '▲' : '▼'}</span>
        {t('patient.ageHelperToggle')}
      </button>

      {helperOpen && (
        <div id={helperPanelId} className="mt-2 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor={helperYearsId} className="mb-1 block text-xs text-ink-muted">
              {t('patient.ageYears')}
            </label>
            <input
              id={helperYearsId}
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              max="18"
              value={helperYears}
              onChange={(e) => {
                setHelperYears(e.target.value);
                applyHelper(e.target.value, helperMonths);
              }}
              className="h-11 w-20 rounded-2xl border border-line bg-white px-3 font-num text-base text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-deep"
            />
          </div>
          <div>
            <label htmlFor={helperMonthsId} className="mb-1 block text-xs text-ink-muted">
              {t('patient.ageMonths')}
            </label>
            <input
              id={helperMonthsId}
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              max="11"
              value={helperMonths}
              onChange={(e) => {
                setHelperMonths(e.target.value);
                applyHelper(helperYears, e.target.value);
              }}
              className="h-11 w-20 rounded-2xl border border-line bg-white px-3 font-num text-base text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-deep"
            />
          </div>
        </div>
      )}

      <p className="thai-safe mt-1 text-xs text-ink-muted">{t('patient.ageHelper')}</p>
    </div>
  );
}
