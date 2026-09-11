import { useT } from '@/i18n';
import type { DatasetError } from '@/state/DatasetProvider';

/**
 * Shown in place of the main content when the dataset failed to load or validate. Never conveys
 * the failure by color alone: the heading text and a leading glyph both carry the meaning.
 */
export function ErrorCard({ error }: { error: DatasetError }) {
  const t = useT();
  return (
    <div
      role="alert"
      data-testid="error-card"
      className="animate-fade-up rounded-2xl border border-line bg-white p-4 shadow-soft"
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-status-dangerText">
        <span aria-hidden="true">⚠️</span>
        {t('error.dataLoad')}
      </p>
      <p className="thai-safe mt-1 text-sm text-ink-muted">{error.message}</p>
      {error.errors && error.errors.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-ink-muted">
          {error.errors.slice(0, 10).map((e, i) => (
            <li key={i}>
              {e.drugId ? `${e.drugId}: ` : ''}
              {e.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
