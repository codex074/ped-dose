export type CalcType =
  | 'mg_per_kg_per_dose'
  | 'mg_per_kg_per_day'
  | 'mcg_per_kg_per_dose'
  | 'ml_per_kg_per_dose'
  | 'ml_per_kg_per_day'
  | 'supp_by_weight'
  | 'pack_per_10kg_per_day'
  | 'pack_per_30kg_per_dose'
  | 'weight_band'
  | 'age_band'
  | 'fluid_421_rule'
  | 'ml_by_weight_after_dilution';

export const CALC_TYPES: readonly CalcType[] = [
  'mg_per_kg_per_dose',
  'mg_per_kg_per_day',
  'mcg_per_kg_per_dose',
  'ml_per_kg_per_dose',
  'ml_per_kg_per_day',
  'supp_by_weight',
  'pack_per_10kg_per_day',
  'pack_per_30kg_per_dose',
  'weight_band',
  'age_band',
  'fluid_421_rule',
  'ml_by_weight_after_dilution',
];

export interface WeightBand {
  weight_low: number;
  weight_high: number;
  dose: string;
}
export interface AgeBand {
  age_low: number;
  age_high: number;
  dose?: string;
  label?: string;
  mg_per_kg_per_dose?: number;
  mg_per_kg_per_dose_high?: number;
  max_mg_per_dose?: number;
  mg_per_dose?: number;
}

/** Loose on purpose: upstream reads fields dynamically. Extra keys (note, formula, calc_basis…) are allowed. */
export interface Calc {
  type: CalcType;
  low?: number;
  high?: number;
  doses_per_day?: number;
  max_dose_mg?: number;
  min_dose_mg?: number;
  max_mg_per_day?: number;
  max_dose_mcg?: number;
  max_ml_per_dose?: number;
  /** supp_by_weight: these are DIVISORS (dose = weight / kg_per_supp_*), not weight thresholds. Upstream naming kept. */
  kg_per_supp_low?: number;
  kg_per_supp_high?: number;
  packs_per_10kg_per_day?: number;
  bands?: (WeightBand | AgeBand)[];
  note?: string;
  [extra: string]: unknown;
}

export type ContraindicationType =
  | 'age_below_months'
  | 'age_below_years'
  | 'age_below_weeks'
  | 'weight_above_kg'
  | 'weight_below_kg';
export interface Contraindication {
  type: ContraindicationType;
  threshold_months?: number;
  threshold_years?: number;
  threshold_weeks?: number;
  threshold_kg?: number;
  severity: string; // raw upstream string, e.g. 禁用 / 不建議 / 慎用 / 建議改膠囊
  reason: string;
}

export interface Indication {
  label: string;
  calc: Calc;
  route?: string;
  frequency?: string;
  notes?: string;
  onset?: string;
  duration?: string;
}

export interface ClinicalDetail {
  [zhKey: string]: string;
} // 臨床用途, 禁忌, 副作用, 警語, 懷孕分級, 授乳, 管制性藥品

export interface Drug {
  id: string;
  generic: string;
  brand: string;
  kmuh_code: string | null;
  category: string;
  form: string;
  route: string;
  source: string;
  kmuh_detail: ClinicalDetail;
  calc?: Calc;
  indications?: Indication[];
  tags?: string[];
  frequency?: string;
  notes?: string;
  package?: string;
  unit?: string;
  concentration_mg_per_ml?: number;
  concentration_mg_per_unit?: number;
  concentration_mcg_per_ml?: number;
  concentration_mcg_per_unit?: number;
  concentration_note?: string;
  group_id?: string;
  warnings?: string[];
  contraindications?: Contraindication[];
  urgency?: string;
  urgency_label?: string;
  duration_note?: string;
  max_per_day_note?: string;
  monitoring?: string;
}

export interface Category {
  id: string;
  label: string;
  order: number;
}

export interface EnergyDose {
  label: string;
  j_per_kg: number;
  high_j_per_kg?: number;
  note?: string;
}
export interface DecisionBranchQrs {
  qrs: string;
  label: string;
  action: string;
}
export interface DecisionNode {
  label: string;
  actions?: string[];
  branches?: DecisionBranchQrs[];
}
export interface DecisionTree {
  question: string;
  yes: DecisionNode;
  no: DecisionNode;
}
export interface Differentiation {
  title: string;
  sinus_tach: { label: string; criteria: string[]; action?: string };
  svt: { label: string; criteria: string[]; action?: string };
}
export interface PalsAlgorithm {
  id: 'cardiac_arrest' | 'tachy_pulse' | 'brady_pulse';
  title: string;
  subtitle: string;
  icon: string;
  steps_initial: string[];
  decision_tree: DecisionTree;
  drugs: string[];
  energy_doses?: EnergyDose[];
  high_quality_cpr?: string[];
  reversible_causes?: { title: string; h: string[]; t: string[] };
  differentiation?: Differentiation;
  refractory_note?: string;
  possible_causes?: string[];
  figure_url: string;
  figure_label: string;
}
export interface SeStage {
  minutes: string;
  phase: string;
  level?: string;
  subtitle?: string;
  actions: string[];
  drugs?: string[];
}
export interface SeAlgorithm {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  time_stages: SeStage[];
  decision_label: string;
  citation: string;
  figure_url: string;
  figure_label: string;
}

export interface DrugDataset {
  _meta: {
    version: string;
    last_updated: string;
    scope: string;
    primary_source: string;
    disclaimer: string;
  };
  categories: Category[];
  drugs: Drug[];
  pals_algorithms: PalsAlgorithm[];
  se_algorithm: SeAlgorithm;
}

/** Structured description of the dosing rule; rendered to text by the i18n layer. */
export type RuleDescriptor =
  | { kind: 'mg_per_kg_per_dose'; low: number; high: number; minMg?: number; maxMg?: number }
  | { kind: 'mg_per_kg_per_day'; low: number; high: number; dosesPerDay: number }
  | { kind: 'mcg_per_kg_per_dose'; low: number; high: number }
  | { kind: 'ml_per_kg_per_dose'; low: number; high: number }
  | { kind: 'ml_per_kg_per_day'; low: number; high: number; dosesPerDay: number }
  | { kind: 'supp_by_weight'; divLow: number; divHigh: number }
  | { kind: 'pack_per_10kg_per_day'; packsPer10kg: number | undefined; dosesPerDay: number }
  | { kind: 'pack_per_30kg_per_dose' }
  | { kind: 'weight_band' }
  | { kind: 'age_band' }
  | { kind: 'band_label'; label: string }
  | { kind: 'fluid_421' };

export type DoseResult =
  | { kind: 'needs_weight' }
  | { kind: 'needs_age' }
  | {
      kind: 'dose';
      mgRange?: [number, number];
      mcgRange?: [number, number];
      mlRange?: [number, number];
      unitRange?: [number, number];
      packsPerDose?: number;
      rule: RuleDescriptor;
    }
  | { kind: 'band'; matched: true; bandIndex: number; bandText: string; rule: RuleDescriptor }
  | { kind: 'band'; matched: false; rule: RuleDescriptor }
  | { kind: 'rate'; rate: number; rule: RuleDescriptor }
  | { kind: 'dilution'; startLow: number; startHigh: number; max: number; note: string };

export type SeverityBucket = 'severe' | 'moderate' | 'mild';
export interface ContraindicationHit {
  index: number;
  contraindication: Contraindication;
  severity: SeverityBucket;
}
