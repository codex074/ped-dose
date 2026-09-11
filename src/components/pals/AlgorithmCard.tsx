import type { PalsAlgorithm } from '@/clinical/types';
import { useT } from '@/i18n';
import { useCalculator } from '@/state/CalculatorProvider';
import { DecisionTreeView } from './DecisionTreeView';
import { DrugMiniRow } from './DrugMiniRow';
import { EnergyRow } from './EnergyRow';

const SECTION_HEADING = 'text-sm font-semibold uppercase tracking-wide text-sky-deep';

/**
 * One PALS algorithm card. Section order mirrors upstream `renderPALSAlgorithm()` and
 * `docs/upstream-analysis/ui-and-strings.md` §8: title/subtitle, initial steps, tachy
 * differentiation, decision tree, drug doses, shock energy, CPR checklist, reversible causes,
 * possible causes, refractory banner, figure link, citation. `algo` must already be localized
 * (via `localizePals`) by the caller.
 */
export function AlgorithmCard({ algo }: { algo: PalsAlgorithm }) {
  const { weight } = useCalculator();
  const t = useT();
  const appliedWeight = weight != null ? t('pals.appliedWeight', { weight }) : null;

  return (
    <section className="rounded-3xl bg-white p-5 shadow-soft" data-testid={`pals-card-${algo.id}`}>
      <h2 className="thai-safe flex items-center gap-2 break-words text-lg font-semibold text-ink">
        <span aria-hidden="true">{algo.icon || '🚨'}</span>
        {algo.title}
      </h2>
      {algo.subtitle && (
        <p className="thai-safe mt-0.5 break-words text-sm text-ink-muted">{algo.subtitle}</p>
      )}

      {algo.steps_initial.length > 0 && (
        <div className="mt-4">
          <div className={SECTION_HEADING}>{t('pals.initialSteps')}</div>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink">
            {algo.steps_initial.map((s, i) => (
              <li key={i} className="thai-safe break-words">
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}

      {algo.differentiation && (
        <div className="mt-4">
          <div className={SECTION_HEADING}>{algo.differentiation.title}</div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {[algo.differentiation.sinus_tach, algo.differentiation.svt].map((d, i) => (
              <div key={i} className="rounded-2xl bg-mint-soft/60 p-3">
                <div className="thai-safe break-words text-sm font-semibold text-ink">
                  {d.label}
                </div>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-ink-muted">
                  {d.criteria.map((c, j) => (
                    <li key={j} className="thai-safe break-words">
                      {c}
                    </li>
                  ))}
                </ul>
                {d.action && (
                  <div className="thai-safe mt-1 break-words text-sm font-medium text-sky-deep">
                    → {d.action}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <div className={SECTION_HEADING}>{t('pals.decision')}</div>
        <div className="mt-2">
          <DecisionTreeView tree={algo.decision_tree} />
        </div>
      </div>

      {algo.drugs.length > 0 && (
        <div className="mt-4">
          <div className={SECTION_HEADING}>
            {t('pals.drugs')}
            {appliedWeight && (
              <span className="ml-1 font-normal normal-case text-ink-muted">{appliedWeight}</span>
            )}
          </div>
          <div className="mt-2 space-y-2">
            {algo.drugs.map((id) => (
              <DrugMiniRow key={id} drugId={id} />
            ))}
          </div>
        </div>
      )}

      {algo.energy_doses && algo.energy_doses.length > 0 && (
        <div className="mt-4">
          <div className={SECTION_HEADING}>
            {t('pals.energy')}
            {appliedWeight && (
              <span className="ml-1 font-normal normal-case text-ink-muted">{appliedWeight}</span>
            )}
          </div>
          <div className="mt-2 space-y-2">
            {algo.energy_doses.map((e, i) => (
              <EnergyRow key={i} e={e} />
            ))}
          </div>
        </div>
      )}

      {algo.high_quality_cpr && algo.high_quality_cpr.length > 0 && (
        <div className="mt-4">
          <div className={SECTION_HEADING}>{t('pals.cpr')}</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
            {algo.high_quality_cpr.map((s, i) => (
              <li key={i} className="thai-safe break-words">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {algo.reversible_causes && (
        <div className="mt-4">
          <div className={SECTION_HEADING}>{algo.reversible_causes.title}</div>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-ink">
                {algo.reversible_causes.h.length}H
              </div>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-ink">
                {algo.reversible_causes.h.map((x, i) => (
                  <li key={i} className="thai-safe break-words">
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-ink">
                {algo.reversible_causes.t.length}T
              </div>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-ink">
                {algo.reversible_causes.t.map((x, i) => (
                  <li key={i} className="thai-safe break-words">
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {algo.possible_causes && algo.possible_causes.length > 0 && (
        <div className="mt-4">
          <div className={SECTION_HEADING}>{t('pals.possibleCauses')}</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
            {algo.possible_causes.map((x, i) => (
              <li key={i} className="thai-safe break-words">
                {x}
              </li>
            ))}
          </ul>
        </div>
      )}

      {algo.refractory_note && (
        <div className="mt-4">
          <div className={SECTION_HEADING}>{t('pals.refractory')}</div>
          <div className="thai-safe mt-2 break-words rounded-2xl bg-status-cautionSoft px-3 py-2 text-sm text-status-cautionText">
            ⚠️ {algo.refractory_note}
          </div>
        </div>
      )}

      <div className="mt-4 text-center">
        <a
          href={algo.figure_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full px-4 text-sm font-semibold text-sky-deep underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-deep"
        >
          {algo.figure_label || t('pals.viewFigure')}
        </a>
      </div>

      <p className="thai-safe mt-3 break-words border-t border-line pt-3 text-xs text-ink-muted">
        📚 {t('pals.citation')}
      </p>
    </section>
  );
}
