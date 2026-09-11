/**
 * Single source of truth for "every translatable leaf" on a canonical `Drug` / `PalsAlgorithm` /
 * `SeAlgorithm` and on the corresponding translation-file shapes. `gen-translation-skeleton.ts`,
 * `translationReport.ts`, and `tests/i18n/translationLeaves.test.ts` all iterate the same leaf
 * list produced here, so a field can never be silently added to one and forgotten in the others.
 *
 * Each `*Leaves(canonical)` function returns `{ path, source }` for every leaf whose canonical
 * value is present (top-level scalar fields skip the empty string, matching the pre-refactor
 * skeleton generator's behavior; nested/array leaves are included whenever defined, even if
 * empty, since upstream data never leaves those blank).
 *
 * Each `*TranslationLeaves(tr)` function walks the same paths over a *translation* object
 * (`DrugTranslation` / `PalsTranslation` / `SeTranslation`), which is always partial — only
 * defined values are returned. Paths align by index into the *translation's own* arrays; whether
 * that index count matches the canonical array length is checked separately (array-length
 * mismatches are a distinct problem type, not a per-leaf one).
 */
import type { Drug, Indication, PalsAlgorithm, SeAlgorithm } from '@/clinical/types';
import { CLINICAL_KEY_MAP, CLINICAL_KEY_ORDER } from './clinicalKeys';
import type { DrugTranslation } from './drugs/types';
import type { PalsTranslation, SeTranslation } from './algorithms/types';

export interface Leaf {
  path: string;
  source: string;
}

export interface TranslatedLeaf {
  path: string;
  value: string;
}

function scalar(out: Leaf[], path: string, value: string | undefined, skipEmpty = false): void {
  if (typeof value !== 'string') return;
  if (skipEmpty && value === '') return;
  out.push({ path, source: value });
}

function scalarT(out: TranslatedLeaf[], path: string, value: string | undefined): void {
  if (typeof value === 'string') out.push({ path, value });
}

function stringArray(out: Leaf[], path: string, arr: string[] | undefined): void {
  arr?.forEach((v, i) => scalar(out, `${path}[${i}]`, v));
}

function stringArrayT(out: TranslatedLeaf[], path: string, arr: string[] | undefined): void {
  arr?.forEach((v, i) => scalarT(out, `${path}[${i}]`, v));
}

/** Some `Indication.calc` objects may (in principle) carry their own `bands`, distinct from the
 * drug-level `calc.bands`. No entry in the current dataset does, but the shape is `Calc['bands']`
 * so we walk it defensively via a loose cast rather than assuming it can never happen. Reported
 * under path `indications[i].bands[j]`, parallel to the drug-level `bands[i]` path (which mirrors
 * the top-level `bands` field of `DrugTranslation`, not the canonical `drug.calc.bands` nesting). */
function indicationBands(ind: Indication): { dose?: string; label?: string }[] | undefined {
  return (ind.calc as { bands?: { dose?: string; label?: string }[] } | undefined)?.bands;
}

function translatedIndicationBands(
  tr: NonNullable<DrugTranslation['indications']>[number],
): { dose?: string; label?: string }[] | undefined {
  // Read from `bands` directly, matching the `indications[i].bands[j]` path emitted above (and
  // by extension what the skeleton generator's `setNested` reconstructs) — not a `calc.bands`
  // nesting, which would silently disagree with the path this function is keyed by.
  return (tr as { bands?: { dose?: string; label?: string }[] }).bands;
}

// ---------------------------------------------------------------------------------------------
// Drugs
// ---------------------------------------------------------------------------------------------

export function drugLeaves(drug: Drug): Leaf[] {
  const out: Leaf[] = [];

  scalar(out, 'brand', drug.brand, true);
  scalar(out, 'notes', drug.notes, true);
  scalar(out, 'frequency', drug.frequency, true);
  scalar(out, 'source', drug.source, true);
  scalar(out, 'package', drug.package, true);
  scalar(out, 'unit', drug.unit, true);
  scalar(out, 'urgency_label', drug.urgency_label, true);
  scalar(out, 'concentration_note', drug.concentration_note, true);
  scalar(out, 'duration_note', drug.duration_note, true);
  scalar(out, 'max_per_day_note', drug.max_per_day_note, true);
  scalar(out, 'monitoring', drug.monitoring, true);

  stringArray(out, 'warnings', drug.warnings);

  drug.contraindications?.forEach((c, i) => {
    scalar(out, `contraindications[${i}].severity`, c.severity);
    scalar(out, `contraindications[${i}].reason`, c.reason);
  });

  drug.indications?.forEach((ind, i) => {
    scalar(out, `indications[${i}].label`, ind.label);
    scalar(out, `indications[${i}].notes`, ind.notes);
    scalar(out, `indications[${i}].frequency`, ind.frequency);
    scalar(out, `indications[${i}].onset`, ind.onset);
    scalar(out, `indications[${i}].duration`, ind.duration);
    scalar(out, `indications[${i}].route`, ind.route);
    indicationBands(ind)?.forEach((band, j) => {
      scalar(out, `indications[${i}].bands[${j}].dose`, band.dose);
      scalar(out, `indications[${i}].bands[${j}].label`, band.label);
    });
  });

  const drugBands = drug.calc?.bands as { dose?: string; label?: string }[] | undefined;
  drugBands?.forEach((band, i) => {
    scalar(out, `bands[${i}].dose`, band.dose);
    scalar(out, `bands[${i}].label`, band.label);
  });

  for (const [zhKey, text] of Object.entries(drug.kmuh_detail)) {
    const key = CLINICAL_KEY_MAP[zhKey];
    if (key) scalar(out, `clinical.${key}`, text);
  }

  return out;
}

export function drugTranslationLeaves(tr: DrugTranslation): TranslatedLeaf[] {
  const out: TranslatedLeaf[] = [];

  scalarT(out, 'brand', tr.brand);
  scalarT(out, 'notes', tr.notes);
  scalarT(out, 'frequency', tr.frequency);
  scalarT(out, 'source', tr.source);
  scalarT(out, 'package', tr.package);
  scalarT(out, 'unit', tr.unit);
  scalarT(out, 'urgency_label', tr.urgency_label);
  scalarT(out, 'concentration_note', tr.concentration_note);
  scalarT(out, 'duration_note', tr.duration_note);
  scalarT(out, 'max_per_day_note', tr.max_per_day_note);
  scalarT(out, 'monitoring', tr.monitoring);

  stringArrayT(out, 'warnings', tr.warnings);

  tr.contraindications?.forEach((c, i) => {
    scalarT(out, `contraindications[${i}].severity`, c.severity);
    scalarT(out, `contraindications[${i}].reason`, c.reason);
  });

  tr.indications?.forEach((ind, i) => {
    scalarT(out, `indications[${i}].label`, ind.label);
    scalarT(out, `indications[${i}].notes`, ind.notes);
    scalarT(out, `indications[${i}].frequency`, ind.frequency);
    scalarT(out, `indications[${i}].onset`, ind.onset);
    scalarT(out, `indications[${i}].duration`, ind.duration);
    scalarT(out, `indications[${i}].route`, ind.route);
    translatedIndicationBands(ind)?.forEach((band, j) => {
      scalarT(out, `indications[${i}].bands[${j}].dose`, band.dose);
      scalarT(out, `indications[${i}].bands[${j}].label`, band.label);
    });
  });

  tr.bands?.forEach((band, i) => {
    scalarT(out, `bands[${i}].dose`, band.dose);
    scalarT(out, `bands[${i}].label`, band.label);
  });

  if (tr.clinical) {
    for (const key of CLINICAL_KEY_ORDER) {
      scalarT(out, `clinical.${key}`, tr.clinical[key]);
    }
  }

  return out;
}

// ---------------------------------------------------------------------------------------------
// PALS algorithms
// ---------------------------------------------------------------------------------------------

const DECISION_BRANCHES = ['yes', 'no'] as const;
const DIFF_BRANCHES = ['sinus_tach', 'svt'] as const;

export function palsLeaves(algo: PalsAlgorithm): Leaf[] {
  const out: Leaf[] = [];

  scalar(out, 'title', algo.title, true);
  scalar(out, 'subtitle', algo.subtitle, true);
  stringArray(out, 'steps_initial', algo.steps_initial);
  scalar(out, 'decision_tree.question', algo.decision_tree.question, true);

  for (const branch of DECISION_BRANCHES) {
    const node = algo.decision_tree[branch];
    scalar(out, `decision_tree.${branch}.label`, node.label, true);
    stringArray(out, `decision_tree.${branch}.actions`, node.actions);
    node.branches?.forEach((b, i) => {
      scalar(out, `decision_tree.${branch}.branches[${i}].qrs`, b.qrs);
      scalar(out, `decision_tree.${branch}.branches[${i}].label`, b.label);
      scalar(out, `decision_tree.${branch}.branches[${i}].action`, b.action);
    });
  }

  algo.energy_doses?.forEach((d, i) => {
    scalar(out, `energy_doses[${i}].label`, d.label);
    scalar(out, `energy_doses[${i}].note`, d.note);
  });

  stringArray(out, 'high_quality_cpr', algo.high_quality_cpr);

  if (algo.reversible_causes) {
    scalar(out, 'reversible_causes.title', algo.reversible_causes.title, true);
    stringArray(out, 'reversible_causes.h', algo.reversible_causes.h);
    stringArray(out, 'reversible_causes.t', algo.reversible_causes.t);
  }

  if (algo.differentiation) {
    scalar(out, 'differentiation.title', algo.differentiation.title, true);
    for (const branch of DIFF_BRANCHES) {
      const b = algo.differentiation[branch];
      scalar(out, `differentiation.${branch}.label`, b.label, true);
      stringArray(out, `differentiation.${branch}.criteria`, b.criteria);
      scalar(out, `differentiation.${branch}.action`, b.action);
    }
  }

  scalar(out, 'refractory_note', algo.refractory_note);
  stringArray(out, 'possible_causes', algo.possible_causes);
  scalar(out, 'figure_label', algo.figure_label, true);

  return out;
}

export function palsTranslationLeaves(tr: PalsTranslation): TranslatedLeaf[] {
  const out: TranslatedLeaf[] = [];

  scalarT(out, 'title', tr.title);
  scalarT(out, 'subtitle', tr.subtitle);
  stringArrayT(out, 'steps_initial', tr.steps_initial);
  scalarT(out, 'decision_tree.question', tr.decision_tree?.question);

  for (const branch of DECISION_BRANCHES) {
    const node = tr.decision_tree?.[branch];
    if (!node) continue;
    scalarT(out, `decision_tree.${branch}.label`, node.label);
    stringArrayT(out, `decision_tree.${branch}.actions`, node.actions);
    node.branches?.forEach((b, i) => {
      scalarT(out, `decision_tree.${branch}.branches[${i}].qrs`, b.qrs);
      scalarT(out, `decision_tree.${branch}.branches[${i}].label`, b.label);
      scalarT(out, `decision_tree.${branch}.branches[${i}].action`, b.action);
    });
  }

  tr.energy_doses?.forEach((d, i) => {
    scalarT(out, `energy_doses[${i}].label`, d.label);
    scalarT(out, `energy_doses[${i}].note`, d.note);
  });

  stringArrayT(out, 'high_quality_cpr', tr.high_quality_cpr);

  if (tr.reversible_causes) {
    scalarT(out, 'reversible_causes.title', tr.reversible_causes.title);
    stringArrayT(out, 'reversible_causes.h', tr.reversible_causes.h);
    stringArrayT(out, 'reversible_causes.t', tr.reversible_causes.t);
  }

  if (tr.differentiation) {
    scalarT(out, 'differentiation.title', tr.differentiation.title);
    for (const branch of DIFF_BRANCHES) {
      const b = tr.differentiation[branch];
      if (!b) continue;
      scalarT(out, `differentiation.${branch}.label`, b.label);
      stringArrayT(out, `differentiation.${branch}.criteria`, b.criteria);
      scalarT(out, `differentiation.${branch}.action`, b.action);
    }
  }

  scalarT(out, 'refractory_note', tr.refractory_note);
  stringArrayT(out, 'possible_causes', tr.possible_causes);
  scalarT(out, 'figure_label', tr.figure_label);

  return out;
}

// ---------------------------------------------------------------------------------------------
// SE algorithm
// ---------------------------------------------------------------------------------------------

export function seLeaves(se: SeAlgorithm): Leaf[] {
  const out: Leaf[] = [];

  scalar(out, 'title', se.title, true);
  scalar(out, 'subtitle', se.subtitle, true);

  se.time_stages.forEach((s, i) => {
    scalar(out, `time_stages[${i}].minutes`, s.minutes);
    scalar(out, `time_stages[${i}].phase`, s.phase);
    scalar(out, `time_stages[${i}].level`, s.level);
    scalar(out, `time_stages[${i}].subtitle`, s.subtitle);
    stringArray(out, `time_stages[${i}].actions`, s.actions);
  });

  scalar(out, 'decision_label', se.decision_label, true);
  scalar(out, 'citation', se.citation, true);
  scalar(out, 'figure_label', se.figure_label, true);

  return out;
}

export function seTranslationLeaves(tr: SeTranslation): TranslatedLeaf[] {
  const out: TranslatedLeaf[] = [];

  scalarT(out, 'title', tr.title);
  scalarT(out, 'subtitle', tr.subtitle);

  tr.time_stages?.forEach((s, i) => {
    scalarT(out, `time_stages[${i}].minutes`, s.minutes);
    scalarT(out, `time_stages[${i}].phase`, s.phase);
    scalarT(out, `time_stages[${i}].level`, s.level);
    scalarT(out, `time_stages[${i}].subtitle`, s.subtitle);
    stringArrayT(out, `time_stages[${i}].actions`, s.actions);
  });

  scalarT(out, 'decision_label', tr.decision_label);
  scalarT(out, 'citation', tr.citation);
  scalarT(out, 'figure_label', tr.figure_label);

  return out;
}
