import { useCallback, type KeyboardEvent } from 'react';
import { useLang, useT, type Lang } from '@/i18n';

const OPTIONS: { value: Lang; labelKey: string }[] = [
  { value: 'th', labelKey: 'lang.th' },
  { value: 'en', labelKey: 'lang.en' },
];

/**
 * Pill segmented control, `role="radiogroup"` of two `role="radio"` buttons. Only calls
 * `setLang` — never touches calculator state — so switching language can't disturb the patient's
 * inputs or selection.
 */
export function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const t = useT();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const idx = OPTIONS.findIndex((o) => o.value === lang);
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const next = OPTIONS[(idx + dir + OPTIONS.length) % OPTIONS.length];
      if (next) setLang(next.value);
    },
    [lang, setLang],
  );

  return (
    <div
      role="radiogroup"
      aria-label={t('lang.switchLabel')}
      className="inline-flex items-center gap-1 rounded-full bg-white/80 p-1 shadow-soft"
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === lang;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setLang(opt.value)}
            onKeyDown={handleKeyDown}
            className={`h-11 min-w-11 rounded-full px-3 text-sm font-medium transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-deep ${
              active ? 'bg-sky text-white shadow-soft' : 'text-ink-muted'
            }`}
          >
            {t(opt.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
