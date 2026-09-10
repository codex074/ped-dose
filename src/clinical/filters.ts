import type { Lang } from '@/i18n/types';
import type { Category, Drug } from './types';

export type ViewId =
  | 'all'
  | 'starred'
  | 'uri'
  | 'age'
  | 'antipyretic'
  | 'ml_only'
  | 'antibiotic'
  | 'flu'
  | 'sedation'
  | 'seizure'
  | 'se'
  | 'emergency'
  | 'pals';

export const VIEW_ORDER: readonly ViewId[] = [
  'all',
  'starred',
  'uri',
  'age',
  'antipyretic',
  'ml_only',
  'antibiotic',
  'flu',
  'sedation',
  'seizure',
  'se',
  'emergency',
  'pals',
];

export const VIEW_EMOJI: Record<ViewId, string> = {
  all: '🗂️',
  starred: '⭐',
  uri: '🤧',
  age: '🤢',
  antipyretic: '🤒',
  ml_only: '💧',
  antibiotic: '🦠',
  flu: '🤧',
  sedation: '😴',
  seizure: '🫨',
  se: '⚡',
  emergency: '🚨',
  pals: '🫀',
};

/** 高醫實際備有的口服水劑（含缺藥但仍會在外面購買者） — verbatim from upstream getFiltered. */
export const ORAL_LIQUIDS_WHITELIST: ReadonlySet<string> = new Set([
  'antiphen_syrup',
  'idefen_syrup',
  'cypromin_syrup',
  'cetirizine_syrup',
  'zithromax_susp',
  'curam_susp',
]);

/**
 * Upstream `getFiltered` view branch, verbatim (see tests/upstream/index.html lines ~1077-1125).
 * `se` and `pals` are dedicated views rendered elsewhere and never show a drug list.
 */
export function filterByView(drugs: Drug[], view: ViewId, starred: ReadonlySet<string>): Drug[] {
  if (view === 'all') return drugs.slice();
  if (view === 'starred') return drugs.filter((d) => starred.has(d.id));
  if (view === 'uri') return drugs.filter((d) => (d.tags ?? []).includes('uri'));
  if (view === 'age') return drugs.filter((d) => (d.tags ?? []).includes('age'));
  if (view === 'flu')
    return drugs.filter((d) => d.category === 'flu' || (d.tags ?? []).includes('flu'));
  if (view === 'emergency')
    return drugs.filter((d) =>
      (d.tags ?? []).some((t) => t === 'emergency' || t === 'rsi' || t === 'seizure_first_line'),
    );
  if (view === 'sedation') return drugs.filter((d) => d.category === 'sedation');
  if (view === 'seizure') return drugs.filter((d) => d.category === 'seizure');
  if (view === 'antibiotic') return drugs.filter((d) => d.category === 'antibiotic');
  if (view === 'antipyretic') return drugs.filter((d) => d.category === 'antipyretic');
  if (view === 'ml_only') return drugs.filter((d) => ORAL_LIQUIDS_WHITELIST.has(d.id));
  // 'se' / 'pals' — dedicated views, no drug list
  return [];
}

export interface SearchIndexEntry {
  id: string;
  haystack: string;
}

/**
 * Haystack per drug: generic, brand (translated if provided else canonical), id, translated
 * category label, all tags, translated indication labels (else canonical), plus any aliases for
 * that id. `kmuh_code`/`kmuh_detail` are deliberately excluded (upstream searches kmuh_code; the
 * port does not). Lower-cased, space-joined.
 */
export function buildSearchIndex(
  drugs: Drug[],
  _lang: Lang,
  categoryLabel: (id: string) => string,
  drugText: (id: string) => { brand?: string; indicationLabels?: string[] },
  aliases: Record<string, string[]>,
): SearchIndexEntry[] {
  return drugs.map((d) => {
    const text = drugText(d.id);
    const brand = text.brand ?? d.brand;
    const indicationLabels = text.indicationLabels ?? (d.indications ?? []).map((i) => i.label);
    const parts = [
      d.generic,
      brand,
      d.id,
      categoryLabel(d.category),
      ...(d.tags ?? []),
      ...indicationLabels,
      ...(aliases[d.id] ?? []),
    ];
    const haystack = parts
      .filter((p): p is string => Boolean(p))
      .join(' ')
      .toLowerCase();
    return { id: d.id, haystack };
  });
}

/** Case-insensitive substring match over the pre-built haystack. Empty query is a no-op. */
export function searchDrugs(drugs: Drug[], query: string, index: SearchIndexEntry[]): Drug[] {
  const q = query.trim().toLowerCase();
  if (!q) return drugs;
  const matchIds = new Set(index.filter((e) => e.haystack.includes(q)).map((e) => e.id));
  return drugs.filter((d) => matchIds.has(d.id));
}

/** Consecutive-merge by group_id, exactly like upstream `renderDrugList`. */
function mergeConsecutiveGroups(list: Drug[]): Drug[][] {
  const blocks: Drug[][] = [];
  const seenGroups = new Set<string>();
  for (const d of list) {
    if (d.group_id) {
      if (seenGroups.has(d.group_id)) continue;
      seenGroups.add(d.group_id);
      blocks.push(list.filter((x) => x.group_id === d.group_id));
    } else {
      blocks.push([d]);
    }
  }
  return blocks;
}

/**
 * Starred first (grouped independently), then others grouped by category (sorted by
 * `Category.order`, unknown categories last), each group consecutive-merged by `group_id`
 * exactly like upstream `renderDrugList`/`render`.
 */
export function groupForDisplay(
  drugs: Drug[],
  categories: Category[],
  starred: ReadonlySet<string>,
): { starred: Drug[][]; byCategory: { categoryId: string; groups: Drug[][] }[] } {
  const starredDrugs = drugs.filter((d) => starred.has(d.id));
  const others = drugs.filter((d) => !starred.has(d.id));

  const byCat = new Map<string, Drug[]>();
  for (const d of others) {
    const list = byCat.get(d.category);
    if (list) list.push(d);
    else byCat.set(d.category, [d]);
  }

  const order = new Map<string, number>();
  categories.forEach((c, i) => order.set(c.id, c.order ?? i));
  const catIds = [...byCat.keys()].sort((a, b) => (order.get(a) ?? 999) - (order.get(b) ?? 999));

  return {
    starred: mergeConsecutiveGroups(starredDrugs),
    byCategory: catIds.map((categoryId) => ({
      categoryId,
      groups: mergeConsecutiveGroups(byCat.get(categoryId)!),
    })),
  };
}
