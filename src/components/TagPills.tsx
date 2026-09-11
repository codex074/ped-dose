import { useT } from '@/i18n';

const PILL_ORDER = ['emergency', 'rsi', 'common'] as const;

const PILL_CLASS: Record<(typeof PILL_ORDER)[number], string> = {
  emergency: 'bg-status-cautionSoft text-status-cautionText',
  rsi: 'bg-status-cautionSoft text-status-cautionText',
  common: 'bg-mint-soft text-ink',
};

/**
 * Small badge row for the `emergency` / `rsi` / `common` tags, in that fixed order — mirrors
 * upstream's hard-coded tag-pill sequence. Renders nothing when none of those tags are present.
 */
export function TagPills({ tags }: { tags?: string[] }) {
  const t = useT();
  const present = new Set(tags ?? []);
  const active = PILL_ORDER.filter((tag) => present.has(tag));
  if (active.length === 0) return null;

  return (
    <span className="flex flex-wrap items-center gap-1">
      {active.map((tag) => (
        <span
          key={tag}
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PILL_CLASS[tag]}`}
        >
          {t(`card.tag.${tag}`)}
        </span>
      ))}
    </span>
  );
}
