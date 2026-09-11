import { useEffect, useRef, type KeyboardEvent } from 'react';
import { VIEW_EMOJI, VIEW_ORDER, type ViewId } from '@/clinical/filters';
import { useT } from '@/i18n';
import { useCalculator } from '@/state/CalculatorProvider';

/**
 * `VIEW_ORDER` rendered as a `role="tablist"` of pill tabs, horizontally scrollable on narrow
 * screens with a hidden scrollbar (`.no-scrollbar`, defined in `src/index.css`). Follows the
 * standard roving-tabIndex pattern: only the active tab is in the tab order, and
 * ArrowLeft/ArrowRight/Home/End move both focus and selection (clicking any tab selects it
 * directly). The active tab scrolls itself into view whenever `view` changes.
 */
export function CategoryChips() {
  const t = useT();
  const { view, setView } = useCalculator();
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = VIEW_ORDER.indexOf(view);

  useEffect(() => {
    buttonRefs.current[activeIndex]?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [activeIndex]);

  const selectByIndex = (index: number): void => {
    const len = VIEW_ORDER.length;
    const nextIndex = (index + len) % len;
    const next: ViewId | undefined = VIEW_ORDER[nextIndex];
    if (!next) return;
    setView(next);
    buttonRefs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        selectByIndex(index + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        selectByIndex(index - 1);
        break;
      case 'Home':
        e.preventDefault();
        selectByIndex(0);
        break;
      case 'End':
        e.preventDefault();
        selectByIndex(VIEW_ORDER.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div role="tablist" className="no-scrollbar flex gap-2 overflow-x-auto py-1">
      {VIEW_ORDER.map((v, index) => {
        const active = v === view;
        return (
          <button
            key={v}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => setView(v)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-medium transition duration-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-deep ${
              active
                ? 'scale-[1.03] bg-sky text-white shadow-soft'
                : 'border border-line bg-white text-ink hover:bg-sky-soft'
            }`}
          >
            <span aria-hidden="true">{VIEW_EMOJI[v]}</span>
            {t(`tabs.${v}`)}
          </button>
        );
      })}
    </div>
  );
}
