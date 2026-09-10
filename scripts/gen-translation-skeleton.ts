// Generates src/i18n/drugs.skeleton.json and src/i18n/algorithms.skeleton.json: every
// translatable leaf, keyed exactly like the real translation files, filled with the canonical
// (zh) source string so a translator can copy an id range out and fill in TH/EN values in place.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Drug, DrugDataset, PalsAlgorithm, SeAlgorithm } from '../src/clinical/types';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const dataset = JSON.parse(
  readFileSync(join(ROOT, 'public/data/peds_drugs.json'), 'utf8'),
) as DrugDataset;

const DRAFT_META = { status: 'draft' as const, reviewedBy: null };

function drugSkeleton(drug: Drug): Record<string, unknown> {
  const entry: Record<string, unknown> = { _meta: { ...DRAFT_META } };

  const scalarFields: (keyof Drug)[] = [
    'brand',
    'notes',
    'frequency',
    'source',
    'package',
    'unit',
    'urgency_label',
    'concentration_note',
    'duration_note',
    'max_per_day_note',
    'monitoring',
  ];
  for (const field of scalarFields) {
    const value = drug[field];
    if (typeof value === 'string' && value !== '') entry[field] = value;
  }

  if (drug.warnings?.length) entry.warnings = [...drug.warnings];

  if (drug.contraindications?.length) {
    entry.contraindications = drug.contraindications.map((c) => ({
      severity: c.severity,
      reason: c.reason,
    }));
  }

  if (drug.calc?.bands?.length) {
    entry.bands = drug.calc.bands.map((band) => {
      const b = band as { dose?: string; label?: string };
      const out: Record<string, string> = {};
      if (b.dose !== undefined) out.dose = b.dose;
      if (b.label !== undefined) out.label = b.label;
      return out;
    });
  }

  if (drug.indications?.length) {
    entry.indications = drug.indications.map((ind) => {
      const out: Record<string, string> = { label: ind.label };
      if (ind.notes !== undefined) out.notes = ind.notes;
      if (ind.frequency !== undefined) out.frequency = ind.frequency;
      if (ind.onset !== undefined) out.onset = ind.onset;
      if (ind.duration !== undefined) out.duration = ind.duration;
      if (ind.route !== undefined) out.route = ind.route;
      return out;
    });
  }

  const clinicalKeys = Object.keys(drug.kmuh_detail);
  if (clinicalKeys.length) {
    const CLINICAL_KEY_MAP: Record<string, string> = {
      臨床用途: 'use',
      禁忌: 'contraindications',
      副作用: 'adverseEffects',
      警語: 'warnings',
      懷孕分級: 'pregnancy',
      授乳: 'breastfeeding',
      管制性藥品: 'controlledDrug',
    };
    const clinical: Record<string, string> = {};
    for (const zhKey of clinicalKeys) {
      const key = CLINICAL_KEY_MAP[zhKey];
      if (key) clinical[key] = drug.kmuh_detail[zhKey]!;
    }
    if (Object.keys(clinical).length) entry.clinical = clinical;
  }

  return entry;
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
  const out: Record<string, unknown> = {
    title: algo.title,
    subtitle: algo.subtitle,
    steps_initial: [...algo.steps_initial],
  };
  out.decision_tree = {
    question: algo.decision_tree.question,
    yes: {
      label: algo.decision_tree.yes.label,
      ...(algo.decision_tree.yes.actions ? { actions: [...algo.decision_tree.yes.actions] } : {}),
      ...(algo.decision_tree.yes.branches
        ? { branches: algo.decision_tree.yes.branches.map((b) => ({ ...b })) }
        : {}),
    },
    no: {
      label: algo.decision_tree.no.label,
      ...(algo.decision_tree.no.actions ? { actions: [...algo.decision_tree.no.actions] } : {}),
      ...(algo.decision_tree.no.branches
        ? { branches: algo.decision_tree.no.branches.map((b) => ({ ...b })) }
        : {}),
    },
  };
  if (algo.energy_doses?.length) {
    out.energy_doses = algo.energy_doses.map((d) => ({
      label: d.label,
      ...(d.note !== undefined ? { note: d.note } : {}),
    }));
  }
  if (algo.high_quality_cpr?.length) out.high_quality_cpr = [...algo.high_quality_cpr];
  if (algo.reversible_causes) {
    out.reversible_causes = {
      title: algo.reversible_causes.title,
      h: [...algo.reversible_causes.h],
      t: [...algo.reversible_causes.t],
    };
  }
  if (algo.differentiation) {
    out.differentiation = {
      title: algo.differentiation.title,
      sinus_tach: { ...algo.differentiation.sinus_tach },
      svt: { ...algo.differentiation.svt },
    };
  }
  if (algo.refractory_note !== undefined) out.refractory_note = algo.refractory_note;
  if (algo.possible_causes?.length) out.possible_causes = [...algo.possible_causes];
  out.figure_label = algo.figure_label;
  return out;
}

function seSkeleton(se: SeAlgorithm): Record<string, unknown> {
  return {
    title: se.title,
    subtitle: se.subtitle,
    time_stages: se.time_stages.map((s) => ({
      minutes: s.minutes,
      phase: s.phase,
      ...(s.level !== undefined ? { level: s.level } : {}),
      ...(s.subtitle !== undefined ? { subtitle: s.subtitle } : {}),
      actions: [...s.actions],
    })),
    decision_label: se.decision_label,
    citation: se.citation,
    figure_label: se.figure_label,
  };
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
