import type { AgeBand, Calc, Drug, Indication, WeightBand } from '@/clinical/types';
import { useDoseResult } from '@/hooks/useDoseResult';
import { useT, type TFn } from '@/i18n';
import { doseRows } from '@/i18n/formatDose';
import { useDrugText } from '@/i18n/useDrugText';
import { DoseRowView } from './DoseRowView';

const CHIP =
  'inline-flex items-center rounded-full bg-sky-soft px-2 py-0.5 text-xs font-medium text-sky-deep';

/**
 * One `drug.calc`-driven dose block: rows from `doseRows`. The mg/mcg row's `sub` text already
 * carries the per-dose max/min ceiling notice (built from `rule.maxMg`/`rule.minMg` via the
 * `rule.max`/`rule.min` translation keys inside `formatRule`) — see `src/i18n/formatDose.ts` /
 * `src/i18n/formatRule.ts`, both frozen (Task 11). No separate pill is rendered here: that would
 * just repeat the same sentence a second time.
 */
function CalcBlock({
  drug,
  calc,
  localizedBands,
  frequency,
  t,
}: {
  drug: Drug;
  calc: Calc;
  localizedBands?: (WeightBand | AgeBand)[];
  frequency?: string;
  t: TFn;
}) {
  const result = useDoseResult(drug, calc);
  const bandText =
    result.kind === 'band' && result.matched
      ? ((localizedBands?.[result.bandIndex] as WeightBand | undefined)?.dose ?? result.bandText)
      : undefined;
  const rows = doseRows(drug, result, t, { bandText, frequency });

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <DoseRowView key={row.id} row={row} />
      ))}
    </div>
  );
}

/** One per-indication block: translated label/route/onset/duration/notes, plus that indication's
 * own dose rows. Per-indication `calc.bands` have no translated counterpart in `useDrugText`, so
 * band text here stays canonical (see task notes). */
function IndicationBlock({
  drug,
  canonicalIndication,
  localizedIndication,
  t,
}: {
  drug: Drug;
  canonicalIndication: Indication;
  localizedIndication: Indication;
  t: TFn;
}) {
  const result = useDoseResult(drug, canonicalIndication.calc);
  const rows = doseRows(drug, result, t, { frequency: localizedIndication.frequency });
  // Brief order: label / route / frequency / onset / duration / notes. `doseRows`'s `frequency`
  // option is currently unused by the frozen formatDose.ts (Task 11), so frequency is rendered
  // here explicitly rather than relying on it to appear inside a row.
  const meta = [
    localizedIndication.route,
    localizedIndication.frequency,
    localizedIndication.onset,
    localizedIndication.duration,
  ].filter((v): v is string => !!v);

  return (
    <div className="rounded-2xl bg-sky-soft/40 p-3">
      <p className="thai-safe text-sm font-semibold text-sky-deep">{localizedIndication.label}</p>
      {meta.length > 0 && (
        <p className="thai-safe mt-1 text-xs text-ink-muted">{meta.join(' · ')}</p>
      )}
      <div className="mt-2 space-y-2">
        {rows.map((row) => (
          <DoseRowView key={row.id} row={row} />
        ))}
      </div>
      {localizedIndication.notes && (
        <p className="thai-safe mt-2 text-xs text-ink-muted">{localizedIndication.notes}</p>
      )}
    </div>
  );
}

/**
 * The most important card in the app: drug name → brand → dose rows → frequency/route chips →
 * (rule sub-text lives inside the mg/mcg row itself) (DESIGN.md §16.3: name, calculated dose,
 * mL/tablet amount, frequency, max dose, notes, reference). Takes the *canonical* `Drug` (calc
 * math always runs on canonical data — see `useDoseResult`/`doseRows`/`checkContraindication`
 * contracts) and localizes display text internally.
 */
export function DoseResultCard({ drug }: { drug: Drug }) {
  const t = useT();
  const localizeDrug = useDrugText();
  const localized = localizeDrug(drug);
  const hasIndications = !!drug.indications && drug.indications.length > 0;

  return (
    <div
      className="animate-fade-up rounded-3xl bg-white p-5 shadow-lift"
      data-testid="dose-result-card"
      data-drug-id={drug.id}
    >
      <h3 className="thai-safe text-xl font-semibold text-ink">{drug.generic}</h3>
      {localized.brand && <p className="thai-safe text-sm text-ink-muted">{localized.brand}</p>}
      <div className="mt-4 space-y-3">
        {hasIndications
          ? drug.indications!.map((canonicalIndication, i) => (
              <IndicationBlock
                key={i}
                drug={drug}
                canonicalIndication={canonicalIndication}
                localizedIndication={localized.indications![i]!}
                t={t}
              />
            ))
          : drug.calc && (
              <CalcBlock
                drug={drug}
                calc={drug.calc}
                localizedBands={localized.calc?.bands}
                frequency={localized.frequency}
                t={t}
              />
            )}
      </div>
      {/* Drug-level route/frequency chips: only meaningful when the card isn't already showing
          per-indication route/frequency above (a drug with `indications` carries that info per
          block instead). */}
      {!hasIndications && (drug.route || localized.frequency) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {drug.route && <span className={CHIP}>{drug.route}</span>}
          {localized.frequency && <span className={CHIP}>{localized.frequency}</span>}
        </div>
      )}
    </div>
  );
}
