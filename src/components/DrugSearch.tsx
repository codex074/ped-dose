import { useCallback, useRef, type ChangeEvent } from 'react';
import { useT } from '@/i18n';
import { useCalculator } from '@/state/CalculatorProvider';

/**
 * Free-text search pill bound to `useCalculator().search`. Every keystroke updates state
 * directly (no debounce — filtering downstream is cheap). The clear button only renders once
 * there is text to clear, and refocuses the input afterwards so keyboard/typing users don't lose
 * their place.
 */
export function DrugSearch() {
  const t = useT();
  const { search, setSearch } = useCalculator();
  const inputRef = useRef<HTMLInputElement>(null);
  const placeholder = t('search.placeholder');

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
    },
    [setSearch],
  );

  const handleClear = useCallback(() => {
    setSearch('');
    inputRef.current?.focus();
  }, [setSearch]);

  return (
    <div className="flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-4 shadow-soft focus-within:ring-2 focus-within:ring-sky-deep">
      <span aria-hidden="true" className="shrink-0 text-lg leading-none">
        🔍
      </span>
      <input
        ref={inputRef}
        type="search"
        inputMode="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={search}
        onChange={handleChange}
        className="min-w-0 flex-1 border-none bg-transparent py-2 text-ink outline-none placeholder:text-ink-muted focus:outline-none focus-visible:outline-none [&::-webkit-search-cancel-button]:appearance-none"
      />
      {search !== '' && (
        <button
          type="button"
          aria-label={t('search.clear')}
          onClick={handleClear}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors duration-fast hover:bg-sky-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-deep"
        >
          <span aria-hidden="true">✕</span>
        </button>
      )}
    </div>
  );
}
