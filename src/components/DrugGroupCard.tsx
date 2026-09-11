import type { KeyboardEvent } from 'react';
import type { Drug } from '@/clinical/types';
import { useT } from '@/i18n';
import { DrugFormSection } from './DrugFormSection';
import { StarButton } from './StarButton';
import { TagPills } from './TagPills';

export interface DrugGroupCardProps {
  /** Members sharing a `group_id`, in dataset order. */
  group: Drug[];
  starred: ReadonlySet<string>;
  onToggleStar: (id: string) => void;
  selectedDrugId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Compact card for multiple dosage forms sharing one `group_id` (e.g. Acetaminophen syrup +
 * tablet). Header = canonical generic name (never translated) + union of member `TagPills` + one
 * `StarButton` per member; body = one `DrugFormSection` per member, divided by a hairline.
 * Clicking the card (or a member's star excepted) selects the FIRST member's id.
 */
export function DrugGroupCard({
  group,
  starred,
  onToggleStar,
  selectedDrugId,
  onSelect,
}: DrugGroupCardProps) {
  const t = useT();
  const first = group[0]!;
  const allTags = [...new Set(group.flatMap((d) => d.tags ?? []))];
  const isStarred = group.some((d) => starred.has(d.id));
  const isEmergency = allTags.some((tag) => tag === 'emergency' || tag === 'rsi');
  const selected = group.some((d) => d.id === selectedDrugId);

  const borderClass = isStarred
    ? 'border-l-4 border-l-butter'
    : isEmergency
      ? 'border-l-4 border-l-peach'
      : 'border-l-4 border-l-transparent';
  const selectedClass = selected
    ? 'ring-2 ring-sky border-sky bg-sky-soft/40'
    : 'border-transparent';

  const handleSelect = () => onSelect(first.id);
  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    handleSelect();
  };

  return (
    <article
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      data-testid={`drug-group-card-${first.group_id ?? first.id}`}
      className={`animate-fade-up rounded-2xl border bg-white p-3 shadow-soft transition duration-normal hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-deep ${borderClass} ${selectedClass}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="break-words font-semibold text-ink">{first.generic}</span>
          <TagPills tags={allTags} />
          {selected && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky px-2 py-0.5 text-[11px] font-medium text-white">
              ✓ {t('card.selected')}
            </span>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          {group.map((d) => (
            <StarButton
              key={d.id}
              starred={starred.has(d.id)}
              name={d.generic}
              onToggle={() => onToggleStar(d.id)}
            />
          ))}
        </div>
      </div>
      <div className="mt-1 flex flex-col divide-y divide-line">
        {group.map((d) => (
          <DrugFormSection key={d.id} drug={d} className="py-1.5 first:pt-1 last:pb-0" />
        ))}
      </div>
    </article>
  );
}
