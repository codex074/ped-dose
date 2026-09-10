/** Translation shape for one PALS algorithm (keyed by algorithm id) and for the single SE
 * algorithm. Every field optional; `drugs` (id array) and `figure_url` are never translated and
 * so have no place here. */
export interface DecisionBranchTranslation {
  qrs?: string;
  label?: string;
  action?: string;
}

export interface DecisionNodeTranslation {
  label?: string;
  actions?: string[];
  branches?: DecisionBranchTranslation[];
}

export interface DecisionTreeTranslation {
  question?: string;
  yes?: DecisionNodeTranslation;
  no?: DecisionNodeTranslation;
}

export interface EnergyDoseTranslation {
  label?: string;
  note?: string;
}

export interface DifferentiationBranchTranslation {
  label?: string;
  criteria?: string[];
  action?: string;
}

export interface DifferentiationTranslation {
  title?: string;
  sinus_tach?: DifferentiationBranchTranslation;
  svt?: DifferentiationBranchTranslation;
}

export interface ReversibleCausesTranslation {
  title?: string;
  h?: string[];
  t?: string[];
}

export interface PalsTranslation {
  title?: string;
  subtitle?: string;
  steps_initial?: string[];
  decision_tree?: DecisionTreeTranslation;
  energy_doses?: EnergyDoseTranslation[];
  high_quality_cpr?: string[];
  reversible_causes?: ReversibleCausesTranslation;
  differentiation?: DifferentiationTranslation;
  refractory_note?: string;
  possible_causes?: string[];
  figure_label?: string;
}

export interface SeStageTranslation {
  minutes?: string;
  phase?: string;
  level?: string;
  subtitle?: string;
  actions?: string[];
}

export interface SeTranslation {
  title?: string;
  subtitle?: string;
  time_stages?: SeStageTranslation[];
  decision_label?: string;
  citation?: string;
  figure_label?: string;
}

/** Shape of one `src/i18n/algorithms/{th,en}/*.json` file: `{ _meta, pals?: {...}, se?: {...} }`. */
export interface AlgorithmsFile {
  _meta?: { status: string; [key: string]: unknown };
  pals?: Record<string, PalsTranslation>;
  se?: SeTranslation;
}
