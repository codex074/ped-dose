import { useT } from '@/i18n';
import { useDataset } from '@/state/DatasetProvider';
import { LanguageSwitcher } from './LanguageSwitcher';

/**
 * Sticky top bar: logo tile + app name/subtitle + data version badge on the left,
 * `LanguageSwitcher` on the right. Soft gradient with two decorative blurred blobs; stays
 * compact (≤ 72px) on mobile.
 */
export function AppHeader() {
  const t = useT();
  const dataset = useDataset();
  const version = dataset.status === 'ready' ? dataset.data._meta.version : null;

  return (
    <header
      role="banner"
      className="sticky top-0 z-20 overflow-hidden bg-gradient-to-r from-sky-soft via-cream to-lavender-soft"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full bg-sky/40 opacity-60 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-lavender/40 opacity-60 blur-2xl"
      />
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 md:py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-soft text-xl shadow-soft"
          >
            💊
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-lg font-semibold text-ink">{t('app.name')}</span>
              {version && (
                <span className="rounded-full bg-white/70 px-2 text-xs text-ink-muted">
                  v{version}
                </span>
              )}
            </div>
            <p className="thai-safe truncate text-xs text-ink-muted">{t('app.subtitle')}</p>
          </div>
        </div>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
