import { useEffect, useRef } from 'react';
import { checkContraindication } from '@/clinical';
import { useT } from '@/i18n';
import { useDrugText } from '@/i18n/useDrugText';
import { useCalculator } from '@/state/CalculatorProvider';
import { useDataset } from '@/state/DatasetProvider';
import { ClinicalInfoAccordion } from './ClinicalInfoAccordion';
import { ContraindicationAlert } from './ContraindicationAlert';
import { DoseResultCard } from './DoseResultCard';
import { ReferenceInfo } from './ReferenceInfo';
import { WarningPanel } from './WarningPanel';

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * The only place full clinical content renders: the selected drug plus every other member of
 * its `group_id` (dataset order), each with its own dose card, contraindication alert, notes,
 * warnings, clinical-info accordion, and reference block. `ReferenceInfo` is rendered per member
 * (not once for the whole group): group members frequently cite different sources (e.g. the
 * `nac` group's `actein_granule` cites 高醫速算表 while `acc_effervescent` cites 高醫藥品庫 +
 * Lexicomp), so a merged/deduplicated list would lose which source backs which form's dosing.
 * `App.tsx` places this in a `lg:sticky` aside; on mobile it smooth-scrolls into view whenever
 * the selection changes.
 */
export function SelectedDrugPanel() {
  const { selectedDrugId, weight, age } = useCalculator();
  const dataset = useDataset();
  const t = useT();
  const localizeDrug = useDrugText();
  const sectionRef = useRef<HTMLElement>(null);

  const drugs = dataset.status === 'ready' ? dataset.data.drugs : [];
  const selected = selectedDrugId ? (drugs.find((d) => d.id === selectedDrugId) ?? null) : null;
  const group = selected
    ? selected.group_id
      ? drugs.filter((d) => d.group_id === selected.group_id)
      : [selected]
    : [];

  useEffect(() => {
    if (!selectedDrugId) return;
    const el = sectionRef.current;
    if (!el || typeof el.scrollIntoView !== 'function') return;
    if (typeof window === 'undefined' || window.innerWidth >= 1024) return;
    el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }, [selectedDrugId]);

  if (!selected) {
    return (
      <section
        ref={sectionRef}
        aria-labelledby="selected-drug-panel-empty-message"
        data-testid="selected-drug-panel-empty"
        className="animate-fade-up rounded-2xl bg-white p-6 text-center shadow-soft"
      >
        <p aria-hidden="true" className="text-4xl">
          💊
        </p>
        <p id="selected-drug-panel-empty-message" className="thai-safe mt-2 text-sm text-ink-muted">
          {t('panel.empty')}
        </p>
      </section>
    );
  }

  const headingId = 'selected-drug-panel-heading';
  const localizedSelected = localizeDrug(selected);

  return (
    <section ref={sectionRef} aria-labelledby={headingId} className="flex flex-col gap-4">
      <h2 id={headingId} className="sr-only">
        {localizedSelected.generic}
      </h2>
      {group.map((drug) => {
        const localized = localizeDrug(drug);
        const hit = checkContraindication(drug, weight, age);
        const severityLabel = hit
          ? hit.severity === 'severe'
            ? t('contra.severe')
            : hit.severity === 'moderate'
              ? t('contra.moderate')
              : (localized.contraindications?.[hit.index]?.severity ?? '')
          : '';
        const reason = hit ? (localized.contraindications?.[hit.index]?.reason ?? '') : '';

        return (
          <div key={drug.id} className="flex flex-col gap-3">
            <DoseResultCard drug={drug} />
            {hit && (
              <ContraindicationAlert hit={hit} severityLabel={severityLabel} reason={reason} />
            )}
            {localized.notes && (
              <div className="rounded-2xl bg-mint-soft/60 p-3 text-sm" data-testid="drug-notes">
                <p className="font-semibold text-ink">{t('notes.title')}</p>
                <p className="thai-safe mt-1 text-ink-muted">{localized.notes}</p>
              </div>
            )}
            {localized.warnings && localized.warnings.length > 0 && (
              <WarningPanel warnings={localized.warnings} />
            )}
            <ClinicalInfoAccordion
              drugId={drug.id}
              clinical={localized.clinical}
              monitoring={localized.monitoring}
            />
            <ReferenceInfo sources={localized.source ? [localized.source] : []} />
          </div>
        );
      })}
    </section>
  );
}
