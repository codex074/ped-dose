import { describe, expect, test } from 'vitest';
import {
  ORAL_LIQUIDS_WHITELIST,
  VIEW_EMOJI,
  VIEW_ORDER,
  buildSearchIndex,
  filterByView,
  groupForDisplay,
  searchDrugs,
} from '@/clinical/filters';
import type { Category, Drug } from '@/clinical/types';
import dataset from '../../public/data/peds_drugs.json';

const drugs = dataset.drugs as unknown as Drug[];
const categories = dataset.categories as unknown as Category[];

describe('VIEW_ORDER / VIEW_EMOJI', () => {
  test('has 13 views in upstream tab order', () => {
    expect(VIEW_ORDER).toEqual([
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
    ]);
  });
  test('every view has an emoji', () => {
    for (const v of VIEW_ORDER) expect(VIEW_EMOJI[v]).toBeTruthy();
  });
});

describe('filterByView', () => {
  test('all returns everything', () => {
    expect(filterByView(drugs, 'all', new Set()).length).toBe(drugs.length);
  });
  test('starred uses the passed set', () => {
    const some = new Set([drugs[0]!.id, drugs[1]!.id]);
    const res = filterByView(drugs, 'starred', some);
    expect(res.map((d) => d.id).sort()).toEqual([drugs[0]!.id, drugs[1]!.id].sort());
  });
  test('uri filters by tag', () => {
    const res = filterByView(drugs, 'uri', new Set());
    expect(res.every((d) => (d.tags ?? []).includes('uri'))).toBe(true);
    expect(res.length).toBeGreaterThan(0);
  });
  test('age filters by tag', () => {
    const res = filterByView(drugs, 'age', new Set());
    expect(res.every((d) => (d.tags ?? []).includes('age'))).toBe(true);
    expect(res.length).toBeGreaterThan(0);
  });
  test('antipyretic filters by category', () => {
    const res = filterByView(drugs, 'antipyretic', new Set());
    expect(res.every((d) => d.category === 'antipyretic')).toBe(true);
    expect(res.length).toBeGreaterThan(0);
  });
  test('ml_only whitelist has 6 ids', () =>
    expect(
      filterByView(drugs, 'ml_only', new Set())
        .map((d) => d.id)
        .sort(),
    ).toEqual([...ORAL_LIQUIDS_WHITELIST].sort()));
  test('ORAL_LIQUIDS_WHITELIST has exactly 6 ids', () => {
    expect(ORAL_LIQUIDS_WHITELIST.size).toBe(6);
  });
  test('antibiotic filters by category', () => {
    const res = filterByView(drugs, 'antibiotic', new Set());
    expect(res.every((d) => d.category === 'antibiotic')).toBe(true);
    expect(res.length).toBeGreaterThan(0);
  });
  test('flu filters by category OR tag', () => {
    const res = filterByView(drugs, 'flu', new Set());
    expect(res.every((d) => d.category === 'flu' || (d.tags ?? []).includes('flu'))).toBe(true);
    expect(res.length).toBeGreaterThan(0);
  });
  test('sedation filters by category', () => {
    const res = filterByView(drugs, 'sedation', new Set());
    expect(res.every((d) => d.category === 'sedation')).toBe(true);
    expect(res.length).toBeGreaterThan(0);
  });
  test('seizure filters by category', () => {
    const res = filterByView(drugs, 'seizure', new Set());
    expect(res.every((d) => d.category === 'seizure')).toBe(true);
    expect(res.length).toBeGreaterThan(0);
  });
  test('emergency view includes rsi and seizure_first_line tags', () => {
    const res = filterByView(drugs, 'emergency', new Set());
    expect(res.length).toBeGreaterThan(0);
    expect(
      res.every((d) =>
        (d.tags ?? []).some((x) => ['emergency', 'rsi', 'seizure_first_line'].includes(x)),
      ),
    ).toBe(true);
  });
  test('se and pals return empty (dedicated views)', () => {
    expect(filterByView(drugs, 'se', new Set())).toEqual([]);
    expect(filterByView(drugs, 'pals', new Set())).toEqual([]);
  });
});

describe('search index / searchDrugs', () => {
  test('search ignores kmuh_code', () => {
    const idx = buildSearchIndex(
      drugs,
      'en',
      () => '',
      () => ({}),
      {},
    );
    expect(searchDrugs(drugs, '1ANT60', idx)).toHaveLength(0);
    expect(searchDrugs(drugs, 'acetaminophen', idx).length).toBeGreaterThan(0);
  });
  test('empty/whitespace query returns input list unchanged', () => {
    const idx = buildSearchIndex(
      drugs,
      'en',
      () => '',
      () => ({}),
      {},
    );
    expect(searchDrugs(drugs, '', idx)).toBe(drugs);
    expect(searchDrugs(drugs, '   ', idx)).toBe(drugs);
  });
  test('is case-insensitive', () => {
    const idx = buildSearchIndex(
      drugs,
      'en',
      () => '',
      () => ({}),
      {},
    );
    const lower = searchDrugs(drugs, 'acetaminophen', idx);
    const upper = searchDrugs(drugs, 'ACETAMINOPHEN', idx);
    expect(upper.map((d) => d.id).sort()).toEqual(lower.map((d) => d.id).sort());
  });
  test('matches translated brand and indication labels via drugText callback', () => {
    const target = drugs.find((d) => d.id === 'antiphen_syrup')!;
    const idx = buildSearchIndex(
      drugs,
      'th',
      () => '',
      (id) =>
        id === target.id ? { brand: 'ยาน้ำมหัศจรรย์', indicationLabels: ['ลดไข้พิเศษ'] } : {},
      {},
    );
    expect(searchDrugs(drugs, 'มหัศจรรย์', idx).map((d) => d.id)).toContain(target.id);
    expect(searchDrugs(drugs, 'ลดไข้พิเศษ', idx).map((d) => d.id)).toContain(target.id);
  });
  test('matches aliases', () => {
    const target = drugs[0]!;
    const idx = buildSearchIndex(
      drugs,
      'en',
      () => '',
      () => ({}),
      { [target.id]: ['zzz-alias-xyz'] },
    );
    expect(searchDrugs(drugs, 'zzz-alias-xyz', idx).map((d) => d.id)).toEqual([target.id]);
  });
});

describe('groupForDisplay', () => {
  test('categories sorted by order, only non-empty categories included', () => {
    const g = groupForDisplay(drugs, categories, new Set());
    expect(g.byCategory[0]!.categoryId).toBe('antipyretic');
    const orderById = new Map(categories.map((c) => [c.id, c.order]));
    const orders = g.byCategory.map((c) => orderById.get(c.categoryId)!);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
  test('merges consecutive group_id members into one group', () => {
    const g = groupForDisplay(drugs, categories, new Set());
    const allGroups = g.byCategory.flatMap((c) => c.groups);
    expect(allGroups.some((grp) => grp.length > 1)).toBe(true);
    const acetGroup = allGroups.find((grp) => grp.some((d) => d.id === 'acetaminophen_tab'));
    expect(acetGroup?.map((d) => d.id).sort()).toEqual(['acetaminophen_tab', 'antiphen_syrup']);
  });
  test('starred drugs appear in starred groups, not in byCategory', () => {
    const starred = new Set(['antiphen_syrup']);
    const g = groupForDisplay(drugs, categories, starred);
    expect(g.starred.flat().map((d) => d.id)).toContain('antiphen_syrup');
    const inCategory = g.byCategory.flatMap((c) => c.groups.flat()).map((d) => d.id);
    expect(inCategory).not.toContain('antiphen_syrup');
  });
  test('starred group_id sibling not starred still appears alone in its category', () => {
    // antiphen_syrup and acetaminophen_tab share group_id "acetaminophen"; starring only one
    // means the category listing shows the other alone (matches upstream renderDrugList).
    const starred = new Set(['antiphen_syrup']);
    const g = groupForDisplay(drugs, categories, starred);
    const inCategory = g.byCategory.flatMap((c) => c.groups);
    const sibling = inCategory.find((grp) => grp.some((d) => d.id === 'acetaminophen_tab'));
    expect(sibling?.map((d) => d.id)).toEqual(['acetaminophen_tab']);
  });
});
