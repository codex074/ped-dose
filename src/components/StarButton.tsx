import { useT } from '@/i18n';

export interface StarButtonProps {
  /** Whether this specific drug id is currently starred. */
  starred: boolean;
  /** Brand (preferred) or generic name, appended to the aria-label so multi-star groups are distinguishable. */
  name: string;
  onToggle: () => void;
}

/**
 * ★/☆ pin toggle. Always ≥ 44×44px (a11y tap target). Stops propagation so clicking it inside a
 * card never also triggers the card's own `selectDrug` click handler.
 */
export function StarButton({ starred, name, onToggle }: StarButtonProps) {
  const t = useT();
  const label = `${t(starred ? 'card.unpin' : 'card.pin')} ${name}`.trim();

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={starred}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl text-ink-muted transition-colors duration-fast hover:bg-butter/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-deep"
    >
      <span aria-hidden="true">{starred ? '★' : '☆'}</span>
    </button>
  );
}
