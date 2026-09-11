import { useLayoutEffect, useRef, useState } from 'react';
import { CLINICAL_KEY_ORDER, type ClinicalKey } from '@/i18n/clinicalKeys';
import { useT } from '@/i18n';
import { useCalculator } from '@/state/CalculatorProvider';

export interface ClinicalInfoAccordionProps {
  drugId: string;
  clinical: Record<ClinicalKey, string>;
  monitoring?: string;
}

/**
 * Collapsed-by-default accordion over the drug's `kmuh_detail` fields (in `CLINICAL_KEY_ORDER`)
 * plus `monitoring` when present. Expanded state lives in `CalculatorProvider.expandedDetails`,
 * keyed by drug id, so it survives re-renders (e.g. language switch) without local state.
 *
 * The panel animates via `max-height` (binding constraint: motion only via
 * transform/opacity/max-height), measured from the content's actual `scrollHeight` rather than a
 * fixed cap — several `kmuh_detail` fields (adverse effects, warnings...) run long in Thai, and a
 * fixed cap risks silently clipping contraindication/warning text in a dosing app. Re-measures on
 * every render so a language switch (different text length) keeps the expanded height correct.
 */
export function ClinicalInfoAccordion({
  drugId,
  clinical,
  monitoring,
}: ClinicalInfoAccordionProps) {
  const t = useT();
  const { expandedDetails, toggleDetail } = useCalculator();
  const expanded = expandedDetails.has(drugId);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  // `clinical`/`monitoring` are fresh object/string references on every render (the caller
  // re-localizes the drug each render, uncached), so this effectively re-measures whenever the
  // rendered content could have changed size — including a language switch, which also changes
  // `t`/`expanded`.
  useLayoutEffect(() => {
    if (contentRef.current) setContentHeight(contentRef.current.scrollHeight);
  }, [clinical, monitoring, t, expanded]);

  const fields = CLINICAL_KEY_ORDER.filter((key) => clinical[key]);
  if (fields.length === 0 && !monitoring) return null;

  const buttonId = `clinical-info-trigger-${drugId}`;
  const panelId = `clinical-info-panel-${drugId}`;

  return (
    <div
      className="overflow-hidden rounded-2xl bg-lavender-soft"
      data-testid="clinical-info-accordion"
    >
      <button
        type="button"
        id={buttonId}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => toggleDetail(drugId)}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-deep"
      >
        <span>{t('clinical.title')}</span>
        <span
          aria-hidden="true"
          className={`transition-transform duration-fast ${expanded ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        aria-hidden={!expanded}
        style={{ maxHeight: expanded ? contentHeight : 0 }}
        className="overflow-hidden transition-[max-height] duration-slow ease-out"
      >
        <div ref={contentRef}>
          <dl className="thai-safe space-y-3 px-4 pb-4 text-sm">
            {fields.map((key) => (
              <div key={key}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {t(`clinical.${key}`)}
                </dt>
                <dd className="mt-0.5 text-ink">{clinical[key]}</dd>
              </div>
            ))}
            {monitoring && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {t('clinical.monitoring')}
                </dt>
                <dd className="mt-0.5 text-ink">{monitoring}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
