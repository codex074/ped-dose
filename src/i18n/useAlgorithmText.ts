import type {
  DecisionNode,
  DecisionTree,
  Differentiation,
  EnergyDose,
  PalsAlgorithm,
  SeAlgorithm,
  SeStage,
} from '@/clinical/types';
import { palsEn, palsTh, seEn, seTh } from './algorithms';
import type {
  DecisionNodeTranslation,
  DecisionTreeTranslation,
  DifferentiationTranslation,
  EnergyDoseTranslation,
  PalsTranslation,
  SeTranslation,
} from './algorithms/types';
import { localizeStringArray, resolveScalar, validArr } from './localizeUtils';
import type { Lang } from './types';

function localizeDecisionNode(
  lang: Lang,
  canonical: DecisionNode,
  t: DecisionNodeTranslation | undefined,
  e: DecisionNodeTranslation | undefined,
): DecisionNode {
  const vt = validArr(t?.branches, canonical.branches?.length ?? -1);
  const ve = validArr(e?.branches, canonical.branches?.length ?? -1);
  return {
    ...canonical,
    label: resolveScalar(lang, canonical.label, t?.label, e?.label),
    actions: localizeStringArray(lang, canonical.actions, t?.actions, e?.actions),
    branches: canonical.branches?.map((b, i) => ({
      ...b,
      qrs: resolveScalar(lang, b.qrs, vt?.[i]?.qrs, ve?.[i]?.qrs),
      label: resolveScalar(lang, b.label, vt?.[i]?.label, ve?.[i]?.label),
      action: resolveScalar(lang, b.action, vt?.[i]?.action, ve?.[i]?.action),
    })),
  };
}

function localizeDecisionTree(
  lang: Lang,
  canonical: DecisionTree,
  t: DecisionTreeTranslation | undefined,
  e: DecisionTreeTranslation | undefined,
): DecisionTree {
  return {
    question: resolveScalar(lang, canonical.question, t?.question, e?.question),
    yes: localizeDecisionNode(lang, canonical.yes, t?.yes, e?.yes),
    no: localizeDecisionNode(lang, canonical.no, t?.no, e?.no),
  };
}

function localizeEnergyDoses(
  lang: Lang,
  canonical: EnergyDose[] | undefined,
  t: EnergyDoseTranslation[] | undefined,
  e: EnergyDoseTranslation[] | undefined,
): EnergyDose[] | undefined {
  if (!canonical) return canonical;
  const vt = validArr(t, canonical.length);
  const ve = validArr(e, canonical.length);
  return canonical.map((d, i) => ({
    ...d,
    label: resolveScalar(lang, d.label, vt?.[i]?.label, ve?.[i]?.label),
    note: resolveScalar(lang, d.note, vt?.[i]?.note, ve?.[i]?.note),
  }));
}

function localizeReversibleCauses(
  lang: Lang,
  canonical: PalsAlgorithm['reversible_causes'],
  t: PalsTranslation['reversible_causes'],
  e: PalsTranslation['reversible_causes'],
): PalsAlgorithm['reversible_causes'] {
  if (!canonical) return canonical;
  return {
    title: resolveScalar(lang, canonical.title, t?.title, e?.title),
    h: localizeStringArray(lang, canonical.h, t?.h, e?.h) ?? canonical.h,
    t: localizeStringArray(lang, canonical.t, t?.t, e?.t) ?? canonical.t,
  };
}

function localizeDiffBranch(
  lang: Lang,
  canonical: { label: string; criteria: string[]; action?: string },
  t: DifferentiationTranslation['sinus_tach'],
  e: DifferentiationTranslation['sinus_tach'],
) {
  return {
    ...canonical,
    label: resolveScalar(lang, canonical.label, t?.label, e?.label),
    criteria:
      localizeStringArray(lang, canonical.criteria, t?.criteria, e?.criteria) ?? canonical.criteria,
    action: resolveScalar(lang, canonical.action, t?.action, e?.action),
  };
}

function localizeDifferentiation(
  lang: Lang,
  canonical: Differentiation | undefined,
  t: DifferentiationTranslation | undefined,
  e: DifferentiationTranslation | undefined,
): Differentiation | undefined {
  if (!canonical) return canonical;
  return {
    title: resolveScalar(lang, canonical.title, t?.title, e?.title),
    sinus_tach: localizeDiffBranch(lang, canonical.sinus_tach, t?.sinus_tach, e?.sinus_tach),
    svt: localizeDiffBranch(lang, canonical.svt, t?.svt, e?.svt),
  };
}

/** `drugs` (id array) and `figure_url` are never translated. */
export function localizePalsWith(
  algo: PalsAlgorithm,
  lang: Lang,
  th: Record<string, PalsTranslation>,
  en: Record<string, PalsTranslation>,
): PalsAlgorithm {
  const t = th[algo.id];
  const e = en[algo.id];
  return {
    ...algo,
    title: resolveScalar(lang, algo.title, t?.title, e?.title),
    subtitle: resolveScalar(lang, algo.subtitle, t?.subtitle, e?.subtitle),
    steps_initial:
      localizeStringArray(lang, algo.steps_initial, t?.steps_initial, e?.steps_initial) ??
      algo.steps_initial,
    decision_tree: localizeDecisionTree(
      lang,
      algo.decision_tree,
      t?.decision_tree,
      e?.decision_tree,
    ),
    energy_doses: localizeEnergyDoses(lang, algo.energy_doses, t?.energy_doses, e?.energy_doses),
    high_quality_cpr: localizeStringArray(
      lang,
      algo.high_quality_cpr,
      t?.high_quality_cpr,
      e?.high_quality_cpr,
    ),
    reversible_causes: localizeReversibleCauses(
      lang,
      algo.reversible_causes,
      t?.reversible_causes,
      e?.reversible_causes,
    ),
    differentiation: localizeDifferentiation(
      lang,
      algo.differentiation,
      t?.differentiation,
      e?.differentiation,
    ),
    refractory_note: resolveScalar(
      lang,
      algo.refractory_note,
      t?.refractory_note,
      e?.refractory_note,
    ),
    possible_causes: localizeStringArray(
      lang,
      algo.possible_causes,
      t?.possible_causes,
      e?.possible_causes,
    ),
    figure_label: resolveScalar(lang, algo.figure_label, t?.figure_label, e?.figure_label),
    drugs: algo.drugs,
    figure_url: algo.figure_url,
  };
}

export function localizePals(algo: PalsAlgorithm, lang: Lang): PalsAlgorithm {
  return localizePalsWith(algo, lang, palsTh, palsEn);
}

function localizeTimeStages(
  lang: Lang,
  canonical: SeStage[],
  t: SeTranslation['time_stages'],
  e: SeTranslation['time_stages'],
): SeStage[] {
  const vt = validArr(t, canonical.length);
  const ve = validArr(e, canonical.length);
  return canonical.map((s, i) => ({
    ...s,
    minutes: resolveScalar(lang, s.minutes, vt?.[i]?.minutes, ve?.[i]?.minutes),
    phase: resolveScalar(lang, s.phase, vt?.[i]?.phase, ve?.[i]?.phase),
    level: resolveScalar(lang, s.level, vt?.[i]?.level, ve?.[i]?.level),
    subtitle: resolveScalar(lang, s.subtitle, vt?.[i]?.subtitle, ve?.[i]?.subtitle),
    actions: localizeStringArray(lang, s.actions, vt?.[i]?.actions, ve?.[i]?.actions) ?? s.actions,
  }));
}

/** `figure_url` is never translated. */
export function localizeSeWith(
  se: SeAlgorithm,
  lang: Lang,
  th: SeTranslation | undefined,
  en: SeTranslation | undefined,
): SeAlgorithm {
  return {
    ...se,
    title: resolveScalar(lang, se.title, th?.title, en?.title),
    subtitle: resolveScalar(lang, se.subtitle, th?.subtitle, en?.subtitle),
    time_stages: localizeTimeStages(lang, se.time_stages, th?.time_stages, en?.time_stages),
    decision_label: resolveScalar(lang, se.decision_label, th?.decision_label, en?.decision_label),
    citation: resolveScalar(lang, se.citation, th?.citation, en?.citation),
    figure_label: resolveScalar(lang, se.figure_label, th?.figure_label, en?.figure_label),
    figure_url: se.figure_url,
  };
}

export function localizeSe(se: SeAlgorithm, lang: Lang): SeAlgorithm {
  return localizeSeWith(se, lang, seTh, seEn);
}
