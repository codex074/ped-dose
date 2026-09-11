import { useT } from '@/i18n';

/**
 * Light-weight provenance block shared by every card in the selected-drug panel. `sources`
 * should already be de-duplicated, translated strings (see `SelectedDrugPanel`).
 */
export function ReferenceInfo({ sources }: { sources: string[] }) {
  const t = useT();
  if (sources.length === 0) return null;

  return (
    <div className="rounded-2xl bg-sky-soft/50 p-3 text-sm" data-testid="reference-info">
      <p className="font-semibold text-ink">{t('reference.title')}</p>
      <ul className="mt-1 space-y-0.5 text-ink-muted">
        {sources.map((source) => (
          <li key={source} className="thai-safe">
            {source}
          </li>
        ))}
      </ul>
      <p className="thai-safe mt-2 text-xs text-ink-muted">{t('reference.upstreamNote')}</p>
    </div>
  );
}
