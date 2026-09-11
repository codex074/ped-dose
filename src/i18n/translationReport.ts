/**
 * Pure core of the translation coverage/integrity report. `scripts/translation-report.ts` is a
 * thin CLI wrapper around `reportProblems`; this module has no filesystem or process
 * dependencies so it can be exercised directly by tests.
 */
import type { Drug, DrugDataset, PalsAlgorithm, SeAlgorithm } from '@/clinical/types';
import type { PalsTranslation, SeTranslation } from './algorithms/types';
import type { DrugTranslation } from './drugs/types';
import { checkNumericPreservation, checkSeverity } from './numericPreservation';
import {
  drugLeaves,
  drugTranslationLeaves,
  palsLeaves,
  palsTranslationLeaves,
  seLeaves,
  seTranslationLeaves,
} from './translationLeaves';
import type { Lang } from './types';

export interface Problem {
  /** Drug id, PALS algorithm id, or `'se'` for the SE algorithm. */
  id: string;
  lang: Lang;
  /** Leaf path within the entry, e.g. `indications[0].route`, or `'(id)'` for an id-level problem. */
  path: string;
  message: string;
}

export interface AlgorithmTranslations {
  pals: Record<string, PalsTranslation>;
  se: SeTranslation | undefined;
}

interface ArrayCheck {
  path: string;
  canonicalLen: number | undefined;
  translatedLen: number | undefined;
}

function checkArrayLengths(id: string, lang: Lang, checks: ArrayCheck[], out: Problem[]): void {
  for (const c of checks) {
    if (c.translatedLen === undefined) continue; // not translated at all -> nothing to check
    if (c.canonicalLen === undefined || c.canonicalLen !== c.translatedLen) {
      out.push({
        id,
        lang,
        path: c.path,
        message: `array length mismatch — canonical ${c.canonicalLen ?? 0}, translated ${c.translatedLen}`,
      });
    }
  }
}

/** A contraindication's `severity` leaf is checked against the required UI string, not against
 * numeric-preservation (translators are expected to rewrite it entirely). */
function isSeverityPath(path: string): boolean {
  return path.startsWith('contraindications[') && path.endsWith('.severity');
}

function checkLeafPairs(
  id: string,
  lang: Lang,
  sourceLeaves: { path: string; source: string }[],
  translatedLeaves: { path: string; value: string }[],
  out: Problem[],
): void {
  const sourceByPath = new Map(sourceLeaves.map((l) => [l.path, l.source]));
  for (const t of translatedLeaves) {
    const source = sourceByPath.get(t.path);
    if (source === undefined) continue; // no canonical leaf at this path (e.g. stale/extra key)

    if (isSeverityPath(t.path)) {
      if (!checkSeverity(source, t.value, lang)) {
        out.push({
          id,
          lang,
          path: t.path,
          message: `severity '${source}' -> '${t.value}' does not match the required UI string`,
        });
      }
      continue;
    }

    const r = checkNumericPreservation(source, t.value);
    if (!r.ok) {
      for (const p of r.problems) out.push({ id, lang, path: t.path, message: p });
    }
  }
}

function drugArrayChecks(drug: Drug, tr: DrugTranslation): ArrayCheck[] {
  const checks: ArrayCheck[] = [
    { path: 'warnings', canonicalLen: drug.warnings?.length, translatedLen: tr.warnings?.length },
    {
      path: 'contraindications',
      canonicalLen: drug.contraindications?.length,
      translatedLen: tr.contraindications?.length,
    },
    {
      path: 'indications',
      canonicalLen: drug.indications?.length,
      translatedLen: tr.indications?.length,
    },
    {
      path: 'bands',
      canonicalLen: (drug.calc?.bands as unknown[] | undefined)?.length,
      translatedLen: tr.bands?.length,
    },
  ];
  drug.indications?.forEach((ind, i) => {
    const canonicalBands = (ind.calc as { bands?: unknown[] } | undefined)?.bands;
    // Matches the `indications[i].bands[j]` path from translationLeaves.ts — read `bands`
    // directly off the translated indication, not nested under a `calc` key.
    const translatedBands = (tr.indications?.[i] as { bands?: unknown[] } | undefined)?.bands;
    if (canonicalBands || translatedBands) {
      checks.push({
        path: `indications[${i}].bands`,
        canonicalLen: canonicalBands?.length,
        translatedLen: translatedBands?.length,
      });
    }
  });
  return checks;
}

function palsArrayChecks(algo: PalsAlgorithm, tr: PalsTranslation): ArrayCheck[] {
  return [
    {
      path: 'steps_initial',
      canonicalLen: algo.steps_initial.length,
      translatedLen: tr.steps_initial?.length,
    },
    {
      path: 'decision_tree.yes.actions',
      canonicalLen: algo.decision_tree.yes.actions?.length,
      translatedLen: tr.decision_tree?.yes?.actions?.length,
    },
    {
      path: 'decision_tree.yes.branches',
      canonicalLen: algo.decision_tree.yes.branches?.length,
      translatedLen: tr.decision_tree?.yes?.branches?.length,
    },
    {
      path: 'decision_tree.no.actions',
      canonicalLen: algo.decision_tree.no.actions?.length,
      translatedLen: tr.decision_tree?.no?.actions?.length,
    },
    {
      path: 'decision_tree.no.branches',
      canonicalLen: algo.decision_tree.no.branches?.length,
      translatedLen: tr.decision_tree?.no?.branches?.length,
    },
    {
      path: 'energy_doses',
      canonicalLen: algo.energy_doses?.length,
      translatedLen: tr.energy_doses?.length,
    },
    {
      path: 'high_quality_cpr',
      canonicalLen: algo.high_quality_cpr?.length,
      translatedLen: tr.high_quality_cpr?.length,
    },
    {
      path: 'reversible_causes.h',
      canonicalLen: algo.reversible_causes?.h.length,
      translatedLen: tr.reversible_causes?.h?.length,
    },
    {
      path: 'reversible_causes.t',
      canonicalLen: algo.reversible_causes?.t.length,
      translatedLen: tr.reversible_causes?.t?.length,
    },
    {
      path: 'differentiation.sinus_tach.criteria',
      canonicalLen: algo.differentiation?.sinus_tach.criteria.length,
      translatedLen: tr.differentiation?.sinus_tach?.criteria?.length,
    },
    {
      path: 'differentiation.svt.criteria',
      canonicalLen: algo.differentiation?.svt.criteria.length,
      translatedLen: tr.differentiation?.svt?.criteria?.length,
    },
    {
      path: 'possible_causes',
      canonicalLen: algo.possible_causes?.length,
      translatedLen: tr.possible_causes?.length,
    },
  ];
}

function seArrayChecks(se: SeAlgorithm, tr: SeTranslation): ArrayCheck[] {
  const checks: ArrayCheck[] = [
    {
      path: 'time_stages',
      canonicalLen: se.time_stages.length,
      translatedLen: tr.time_stages?.length,
    },
  ];
  se.time_stages.forEach((s, i) => {
    checks.push({
      path: `time_stages[${i}].actions`,
      canonicalLen: s.actions.length,
      translatedLen: tr.time_stages?.[i]?.actions?.length,
    });
  });
  return checks;
}

/**
 * Checks every translated drug/algorithm entry against its canonical source: array lengths must
 * match (a mismatch is an error, reported with its path), numbers/units/operators/route tokens
 * must survive translation (`checkNumericPreservation`), contraindication severities must map to
 * the required UI string (`checkSeverity`), and every translated id must exist canonically
 * (orphan ids are errors too). Returns the full list of problems found across both languages;
 * an empty array means the translations are clean.
 */
export function reportProblems(
  canonicalDataset: DrugDataset,
  thMap: Record<string, DrugTranslation>,
  enMap: Record<string, DrugTranslation>,
  algoTh: AlgorithmTranslations,
  algoEn: AlgorithmTranslations,
): Problem[] {
  const out: Problem[] = [];

  const drugLangs: { lang: Lang; map: Record<string, DrugTranslation> }[] = [
    { lang: 'th', map: thMap },
    { lang: 'en', map: enMap },
  ];
  const algoLangs: { lang: Lang; algo: AlgorithmTranslations }[] = [
    { lang: 'th', algo: algoTh },
    { lang: 'en', algo: algoEn },
  ];

  const canonicalDrugIds = new Set(canonicalDataset.drugs.map((d) => d.id));
  for (const { lang, map } of drugLangs) {
    for (const id of Object.keys(map)) {
      if (!canonicalDrugIds.has(id)) {
        out.push({
          id,
          lang,
          path: '(id)',
          message: 'orphan translation id: no canonical drug with this id',
        });
      }
    }
  }

  for (const drug of canonicalDataset.drugs) {
    for (const { lang, map } of drugLangs) {
      const tr = map[drug.id];
      if (!tr) continue;
      checkArrayLengths(drug.id, lang, drugArrayChecks(drug, tr), out);
      checkLeafPairs(drug.id, lang, drugLeaves(drug), drugTranslationLeaves(tr), out);
    }
  }

  const canonicalPalsIds = new Set<string>(canonicalDataset.pals_algorithms.map((a) => a.id));
  for (const { lang, algo } of algoLangs) {
    for (const id of Object.keys(algo.pals)) {
      if (!canonicalPalsIds.has(id)) {
        out.push({
          id,
          lang,
          path: '(id)',
          message: 'orphan PALS translation id: no canonical algorithm with this id',
        });
      }
    }
  }

  for (const algo of canonicalDataset.pals_algorithms) {
    for (const { lang, algo: algoMap } of algoLangs) {
      const tr = algoMap.pals[algo.id];
      if (!tr) continue;
      checkArrayLengths(algo.id, lang, palsArrayChecks(algo, tr), out);
      checkLeafPairs(algo.id, lang, palsLeaves(algo), palsTranslationLeaves(tr), out);
    }
  }

  for (const { lang, algo: algoMap } of algoLangs) {
    const tr = algoMap.se;
    if (!tr) continue;
    const se = canonicalDataset.se_algorithm;
    checkArrayLengths('se', lang, seArrayChecks(se, tr), out);
    checkLeafPairs('se', lang, seLeaves(se), seTranslationLeaves(tr), out);
  }

  return out;
}
