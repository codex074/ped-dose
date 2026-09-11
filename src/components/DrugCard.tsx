import type { KeyboardEvent } from 'react';
import type { Drug } from '@/clinical/types';
import { useT } from '@/i18n';
import { useDrugText } from '@/i18n/useDrugText';
import { DrugFormSection } from './DrugFormSection';
import { StarButton } from './StarButton';
import { TagPills } from './TagPills';

export interface DrugCardProps {
  drug: Drug;
  starred: ReadonlySet<string>;
  onToggleStar: (id: string) => void;
  selected: boolean;
  onSelect: (id: string) => void;
}

/**
 * Compact card for a drug with a single dosage form (no `group_id`, or a `group_id` it doesn't
 * share with any sibling in the current list). Header = canonical generic name (never
 * translated) + `TagPills` + one `StarButton`; body = one `DrugFormSection`.
 */
export function DrugCard({ drug, starred, onToggleStar, selected, onSelect }: DrugCardProps) {
  const t = useT();
  const drugText = useDrugText();
  const localized = drugText(drug);
  const isStarred = starred.has(drug.id);
  const isEmergency = (drug.tags ?? []).some((tag) => tag === 'emergency' || tag === 'rsi');

  const borderClass = isStarred
    ? 'border-l-4 border-l-butter'
    : isEmergency
      ? 'border-l-4 border-l-peach'
      : 'border-l-4 border-l-transparent';
  const selectedClass = selected
    ? 'ring-2 ring-sky border-sky bg-sky-soft/40'
    : 'border-transparent';

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    onSelect(drug.id);
  };

  return (
    <article
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={() => onSelect(drug.id)}
      onKeyDown={handleKeyDown}
      data-testid={`drug-card-${drug.id}`}
      className={`animate-fade-up rounded-2xl border bg-white p-3 shadow-soft transition duration-normal hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-deep ${borderClass} ${selectedClass}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="break-words font-semibold text-ink">{drug.generic}</span>
          <TagPills tags={drug.tags} />
          {selected && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky px-2 py-0.5 text-[11px] font-medium text-white">
              ✓ {t('card.selected')}
            </span>
          )}
        </div>
        <StarButton
          starred={isStarred}
          name={localized.brand || drug.generic}
          onToggle={() => onToggleStar(drug.id)}
        />
      </div>
      <DrugFormSection drug={drug} className="mt-1" />
    </article>
  );
}
