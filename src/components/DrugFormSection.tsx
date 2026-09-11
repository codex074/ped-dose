import { checkContraindication } from '@/clinical/contraindications';
import type { Drug, SeverityBucket } from '@/clinical/types';
import { useCalculator } from '@/state/CalculatorProvider';
import { useT } from '@/i18n';
import { useDrugText } from '@/i18n/useDrugText';
import { MetaRow } from './MetaRow';
import { MiniDoseLine } from './MiniDoseLine';

const SEVERITY_ICON: Record<SeverityBucket, string> = {
  severe: '🚫',
  moderate: '⚠️',
  mild: 'ℹ️',
};

const SEVERITY_CLASS: Record<SeverityBucket, string> = {
  severe: 'bg-status-dangerSoft text-status-dangerText',
  moderate: 'bg-status-cautionSoft text-status-cautionText',
  mild: 'bg-status-infoSoft text-status-infoText',
};

const URGENCY_CLASS_ACUTE = 'bg-status-cautionSoft text-status-cautionText';
const URGENCY_CLASS_OTHER = 'bg-sky-soft text-sky-deep';

/**
 * One dosage form's compact body, reused by both `DrugCard` (single form) and `DrugGroupCard`
 * (one per member): translated brand, urgency badge, `MetaRow`, a compact contraindication
 * marker, and one `MiniDoseLine` per calc/indication. Deliberately does NOT render full dose
 * rows, notes, warnings, or the clinical accordion — those live in `SelectedDrugPanel` (Task 18).
 *
 * `drug` must be the CANONICAL (untranslated) record: `checkContraindication`/`severityBucket`
 * compare against the raw upstream severity strings, so translating first would break the match.
 * Display text is derived here via `useDrugText()`.
 */
export function DrugFormSection({ drug, className }: { drug: Drug; className?: string }) {
  const t = useT();
  const drugText = useDrugText();
  const localized = drugText(drug);
  const { weight, age } = useCalculator();
  const hit = checkContraindication(drug, weight, age);

  const urgencyClass = drug.urgency === 'acute' ? URGENCY_CLASS_ACUTE : URGENCY_CLASS_OTHER;

  const severityLabel = hit
    ? hit.severity === 'severe'
      ? t('contra.severe')
      : hit.severity === 'moderate'
        ? t('contra.moderate')
        : (localized.contraindications?.[hit.index]?.severity ?? hit.contraindication.severity)
    : null;

  return (
    <div
      className={`flex flex-col gap-1${className ? ` ${className}` : ''}`}
      data-testid={`drug-form-${drug.id}`}
    >
      {localized.urgency_label && (
        <span
          className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${urgencyClass}`}
        >
          {localized.urgency_label}
        </span>
      )}
      {localized.brand && (
        <div className="break-words text-sm font-medium text-ink">{localized.brand}</div>
      )}
      <MetaRow drug={localized} />
      {hit && (
        <div
          role="note"
          className={`flex w-fit items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] ${SEVERITY_CLASS[hit.severity]}`}
        >
          <span aria-hidden="true">{SEVERITY_ICON[hit.severity]}</span>
          <span>{severityLabel}</span>
        </div>
      )}
      {localized.indications && localized.indications.length > 0 ? (
        <div className="flex flex-col gap-0.5">
          {localized.indications.map((ind, i) => (
            <div
              key={i}
              className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5"
            >
              <span className="break-words text-xs text-ink-muted">{ind.label}</span>
              <MiniDoseLine drug={localized} calc={ind.calc} />
            </div>
          ))}
        </div>
      ) : (
        localized.calc && <MiniDoseLine drug={localized} calc={localized.calc} />
      )}
    </div>
  );
}
