// Generates src/i18n/drugs.skeleton.json and src/i18n/algorithms.skeleton.json: every
// translatable leaf, keyed exactly like the real translation files, filled with the canonical
// (zh) source string so a translator can copy an id range out and fill in TH/EN values in place.
//
// The leaf list itself comes from src/i18n/translationLeaves.ts — the same module the
// coverage/integrity report (src/i18n/translationReport.ts) and tests/i18n/translationLeaves.test.ts
// use — so the skeleton can never drift out of sync with what the report actually checks.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Drug, DrugDataset, PalsAlgorithm, SeAlgorithm } from '../src/clinical/types';
import { drugLeaves, palsLeaves, seLeaves, type Leaf } from '../src/i18n/translationLeaves';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const dataset = JSON.parse(
  readFileSync(join(ROOT, 'public/data/peds_drugs.json'), 'utf8'),
) as DrugDataset;

const DRAFT_META = { status: 'draft' as const, reviewedBy: null };

/** Parses one path segment: either a plain key (`brand`) or an indexed key (`warnings[0]`). */
const INDEXED_SEGMENT = /^([a-zA-Z_][a-zA-Z0-9_]*)\[(\d+)\]$/;

/** Writes `leaf.source` into `root` at the nested location described by `leaf.path`, creating
 * intermediate objects/arrays as needed. Path grammar: dot-separated segments, each either a
 * plain object key or `key[index]` for an array element — exactly what `translationLeaves.ts`
 * produces. This is the single place that turns a flat leaf list back into the nested JSON shape
 * translators actually edit. */
function setNested(root: Record<string, unknown>, path: string, value: string): void {
  const segments = path.split('.');
  let cur: Record<string, unknown> = root;

  segments.forEach((segment, i) => {
    const isLast = i === segments.length - 1;
    const match = INDEXED_SEGMENT.exec(segment);

    if (match) {
      const [, key, indexStr] = match;
      const index = Number(indexStr);
      if (!Array.isArray(cur[key!])) cur[key!] = [];
      const arr = cur[key!] as unknown[];
      while (arr.length <= index) arr.push(undefined);
      if (isLast) {
        arr[index] = value;
      } else {
        if (typeof arr[index] !== 'object' || arr[index] === null) arr[index] = {};
        cur = arr[index] as Record<string, unknown>;
      }
    } else {
      if (isLast) {
        cur[segment] = value;
      } else {
        if (typeof cur[segment] !== 'object' || cur[segment] === null) cur[segment] = {};
        cur = cur[segment] as Record<string, unknown>;
      }
    }
  });
}

function buildSkeletonEntry(leaves: Leaf[]): Record<string, unknown> {
  const entry: Record<string, unknown> = {};
  for (const leaf of leaves) setNested(entry, leaf.path, leaf.source);
  return entry;
}

function drugSkeleton(drug: Drug): Record<string, unknown> {
  return { _meta: { ...DRAFT_META }, ...buildSkeletonEntry(drugLeaves(drug)) };
}

const drugsSkeleton: Record<string, unknown> = {
  _meta: { status: 'draft', generatedFrom: dataset._meta.version },
};
for (const drug of dataset.drugs) drugsSkeleton[drug.id] = drugSkeleton(drug);

writeFileSync(
  join(ROOT, 'src/i18n/drugs.skeleton.json'),
  JSON.stringify(drugsSkeleton, null, 2) + '\n',
);

function palsSkeleton(algo: PalsAlgorithm): Record<string, unknown> {
  return buildSkeletonEntry(palsLeaves(algo));
}

function seSkeleton(se: SeAlgorithm): Record<string, unknown> {
  return buildSkeletonEntry(seLeaves(se));
}

const algorithmsSkeleton: Record<string, unknown> = {
  _meta: { status: 'draft', generatedFrom: dataset._meta.version },
  pals: Object.fromEntries(dataset.pals_algorithms.map((a) => [a.id, palsSkeleton(a)])),
  se: seSkeleton(dataset.se_algorithm),
};

writeFileSync(
  join(ROOT, 'src/i18n/algorithms.skeleton.json'),
  JSON.stringify(algorithmsSkeleton, null, 2) + '\n',
);

console.log('Wrote src/i18n/drugs.skeleton.json and src/i18n/algorithms.skeleton.json');
