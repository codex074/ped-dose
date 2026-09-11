import { useLang, useT } from '@/i18n';
import { localizeSe } from '@/i18n/useAlgorithmText';
import { useDataset } from '@/state/DatasetProvider';
import { StageCard } from './StageCard';

/**
 * Status-epilepticus timeline: title/subtitle from `localizeSe`, then a vertical timeline of
 * `StageCard`s separated by a "does the seizure continue?" divider, then the figure link and
 * citation. Mirrors upstream `renderSEView()` / `docs/upstream-analysis/ui-and-strings.md` §7.
 */
export function SEView() {
  const { lang } = useLang();
  const t = useT();
  const dataset = useDataset();

  const canonical = dataset.status === 'ready' ? dataset.data.se_algorithm : undefined;

  if (!canonical) {
    return (
      <div
        className="rounded-2xl bg-white p-4 text-sm text-ink-muted shadow-soft"
        data-testid="se-empty"
      >
        {t('se.empty')}
      </div>
    );
  }

  const algo = localizeSe(canonical, lang);

  return (
    <section className="rounded-3xl bg-white p-5 shadow-soft" data-testid="se-view">
      <h2 className="thai-safe flex items-center gap-2 break-words text-lg font-semibold text-ink">
        <span aria-hidden="true">{algo.icon || '⚡'}</span>
        {algo.title}
      </h2>
      {algo.subtitle && (
        <p className="thai-safe mt-0.5 break-words text-sm text-ink-muted">{algo.subtitle}</p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {algo.time_stages.map((stage, i) => (
          <div key={i}>
            <StageCard stage={stage} index={i} />
            {i < algo.time_stages.length - 1 && (
              <div className="thai-safe mt-2 break-words text-center text-xs font-medium text-ink-muted">
                ▼ {t('se.decision')}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <a
          href={algo.figure_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full px-4 text-sm font-semibold text-sky-deep underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-deep"
        >
          {algo.figure_label || t('se.viewFigure')}
        </a>
      </div>

      {algo.citation && (
        <p className="thai-safe mt-3 break-words border-t border-line pt-3 text-xs text-ink-muted">
          📚 {algo.citation}
        </p>
      )}
    </section>
  );
}
