import { useCallback, useMemo } from 'react';
import { buildSearchIndex, filterByView, groupForDisplay, searchDrugs } from '@/clinical/filters';
import type { Drug } from '@/clinical/types';
import { useStarred } from '@/hooks/useStarred';
import { useT, useLang } from '@/i18n';
import { useDrugText } from '@/i18n/useDrugText';
import searchAliasesTh from '@/i18n/searchAliases.th.json';
import { useCalculator } from '@/state/CalculatorProvider';
import { useDataset } from '@/state/DatasetProvider';
import { DrugCard } from './DrugCard';
import { DrugGroupCard } from './DrugGroupCard';
import { EmptyState } from './EmptyState';

const SEARCH_ALIASES = (searchAliasesTh as { aliases: Record<string, string[]> }).aliases;

/**
 * Renders one group block (a `group_id`-merged block of 1+ drugs) as either a `DrugGroupCard`
 * (more than one member, or a single member that still carries a `group_id`) or a `DrugCard`.
 * Mirrors upstream `renderDrugList`'s per-block dispatch.
 */
function DrugBlock({
  group,
  starred,
  onToggleStar,
  selectedDrugId,
  onSelect,
}: {
  group: Drug[];
  starred: ReadonlySet<string>;
  onToggleStar: (id: string) => void;
  selectedDrugId: string | null;
  onSelect: (id: string) => void;
}) {
  const first = group[0];
  if (!first) return null;
  const isGroupCard = group.length > 1 || Boolean(first.group_id);
  if (isGroupCard) {
    return (
      <DrugGroupCard
        group={group}
        starred={starred}
        onToggleStar={onToggleStar}
        selectedDrugId={selectedDrugId}
        onSelect={onSelect}
      />
    );
  }
  return (
    <DrugCard
      drug={first}
      starred={starred}
      onToggleStar={onToggleStar}
      selected={selectedDrugId === first.id}
      onSelect={onSelect}
    />
  );
}

/**
 * Single owner of starred state (`useStarred`) and the filter → search → group pipeline. Renders
 * nothing for the `pals`/`se` views (those get dedicated renderers in `App`) and nothing while
 * the dataset isn't ready — `App` only mounts this once `dataset.status === 'ready'`, but the
 * guard keeps this component safe to render standalone (as tests do).
 */
export function DrugList() {
  const dataset = useDataset();
  const { view, search, selectedDrugId, selectDrug } = useCalculator();
  const t = useT();
  const { lang } = useLang();
  const drugText = useDrugText();

  const drugs = useMemo(() => (dataset.status === 'ready' ? dataset.data.drugs : []), [dataset]);
  const categories = useMemo(
    () => (dataset.status === 'ready' ? dataset.data.categories : []),
    [dataset],
  );

  const { starred, toggle } = useStarred(drugs);

  const categoryLabel = useCallback((id: string) => t(`category.${id}`), [t]);

  const drugById = useMemo(() => new Map(drugs.map((d) => [d.id, d] as const)), [drugs]);

  const drugTextLookup = useCallback(
    (id: string): { brand?: string; indicationLabels?: string[] } => {
      const d = drugById.get(id);
      if (!d) return {};
      const localized = drugText(d);
      return {
        brand: localized.brand,
        indicationLabels: localized.indications?.map((ind) => ind.label),
      };
    },
    [drugById, drugText],
  );

  const searchIndex = useMemo(
    () => buildSearchIndex(drugs, lang, categoryLabel, drugTextLookup, SEARCH_ALIASES),
    [drugs, lang, categoryLabel, drugTextLookup],
  );

  const filtered = filterByView(drugs, view, starred);
  const searched = searchDrugs(filtered, search, searchIndex);
  const grouped = groupForDisplay(searched, categories, starred);

  if (view === 'pals' || view === 'se') return null;
  if (dataset.status !== 'ready') return null;

  const isEmpty =
    grouped.starred.length === 0 && grouped.byCategory.every((c) => c.groups.length === 0);
  if (isEmpty) return <EmptyState />;

  return (
    <section className="flex flex-col gap-4">
      {grouped.starred.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-ink">{t('card.starredGroup')}</h2>
          <div className="flex flex-col gap-3">
            {grouped.starred.map((group) => (
              <DrugBlock
                key={group[0]!.group_id ?? group[0]!.id}
                group={group}
                starred={starred}
                onToggleStar={toggle}
                selectedDrugId={selectedDrugId}
                onSelect={selectDrug}
              />
            ))}
          </div>
        </div>
      )}
      {grouped.byCategory.map(({ categoryId, groups }) => {
        if (groups.length === 0) return null;
        const count = groups.reduce((acc, g) => acc + g.length, 0);
        return (
          <div key={categoryId} className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-ink">
              {t(`category.${categoryId}`)}{' '}
              <span className="font-normal text-ink-muted">({count})</span>
            </h2>
            <div className="flex flex-col gap-3">
              {groups.map((group) => (
                <DrugBlock
                  key={group[0]!.group_id ?? group[0]!.id}
                  group={group}
                  starred={starred}
                  onToggleStar={toggle}
                  selectedDrugId={selectedDrugId}
                  onSelect={selectDrug}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
