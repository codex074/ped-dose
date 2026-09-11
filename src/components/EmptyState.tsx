import { useT } from '@/i18n';

/**
 * Friendly empty state for "no drugs match this view/search" (DESIGN.md §20.1: illustration +
 * warm copy, not a bare error). The illustration is purely decorative — hidden from AT — so the
 * text alone (`search.empty`) carries the meaning.
 */
export function EmptyState() {
  const t = useT();

  return (
    <div className="flex animate-fade-up flex-col items-center gap-3 rounded-2xl bg-white px-6 py-12 text-center shadow-soft">
      <svg
        aria-hidden="true"
        viewBox="0 0 64 64"
        className="h-16 w-16 text-sky"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 40a10 10 0 0 1 1.1-19.9A13 13 0 0 1 46 24.6 9 9 0 0 1 44 42H20a2 2 0 0 1 0-2Z"
          fill="currentColor"
          opacity="0.35"
        />
        <path
          d="M20 40a10 10 0 0 1 1.1-19.9A13 13 0 0 1 46 24.6 9 9 0 0 1 44 42H20Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M50 12l1.6 3.6L55 17l-3.4 1.4L50 22l-1.6-3.6L45 17l3.4-1.4L50 12Z"
          fill="currentColor"
          className="text-butter"
        />
      </svg>
      <p className="max-w-xs text-sm text-ink-muted">{t('search.empty')}</p>
    </div>
  );
}
