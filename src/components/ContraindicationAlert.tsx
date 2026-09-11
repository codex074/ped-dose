import type { ContraindicationHit, SeverityBucket } from '@/clinical/types';
import { useT } from '@/i18n';

export interface ContraindicationAlertProps {
  hit: ContraindicationHit;
  /** Translated: `contra.severe`/`contra.moderate` for severe/moderate, or the raw translated
   * severity string (e.g. 慎用) for mild — computed by the caller, which has access to the
   * localized drug's `contraindications` array. */
  severityLabel: string;
  /** Translated `contraindications[hit.index].reason`. */
  reason: string;
}

const STYLES: Record<SeverityBucket, string> = {
  severe: 'border-status-danger bg-status-dangerSoft text-status-dangerText',
  moderate: 'border-status-caution bg-status-cautionSoft text-status-cautionText',
  mild: 'border-status-info bg-status-infoSoft text-status-infoText',
};

const ICONS: Record<SeverityBucket, string> = {
  severe: '🚫',
  moderate: '⚠️',
  mild: 'ℹ️',
};

/**
 * Safety-critical alert. Meaning is always carried by icon + text together, never by color
 * alone, per DESIGN.md §17.3. `role="alert"` only for `severe` (interrupts assistive tech
 * immediately); `moderate`/`mild` use `role="status"` (polite).
 */
export function ContraindicationAlert({ hit, severityLabel, reason }: ContraindicationAlertProps) {
  const t = useT();
  const { severity } = hit;

  return (
    <div
      role={severity === 'severe' ? 'alert' : 'status'}
      data-testid="contraindication-alert"
      className={`animate-fade-up rounded-2xl border p-3 ${STYLES[severity]}`}
    >
      <p className="flex items-center gap-2 text-sm font-semibold">
        <span aria-hidden="true">{ICONS[severity]}</span>
        <span className="thai-safe">
          {t('contra.title')}: {severityLabel}
        </span>
      </p>
      <p className="thai-safe mt-1 text-sm">{reason}</p>
    </div>
  );
}
