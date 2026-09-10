/** One drug's translation entry. Every field optional — translations may be partial/in-progress.
 * Arrays must align by index with the canonical drug's array of the same name; a length mismatch
 * is treated as "no translation" for that array (see `localizeDrug`). */
export interface DrugTranslationMeta {
  status: 'draft' | 'reviewed' | 'approved';
  reviewedBy: string | null;
}

export interface DrugTranslationIndication {
  label?: string;
  notes?: string;
  frequency?: string;
  onset?: string;
  duration?: string;
  route?: string;
}

export interface DrugTranslationContraindication {
  severity?: string;
  reason?: string;
}

export interface DrugTranslationBand {
  dose?: string;
  label?: string;
}

export interface DrugTranslationClinical {
  use?: string;
  contraindications?: string;
  adverseEffects?: string;
  warnings?: string;
  pregnancy?: string;
  breastfeeding?: string;
  controlledDrug?: string;
}

export interface DrugTranslation {
  _meta?: DrugTranslationMeta;
  brand?: string;
  notes?: string;
  frequency?: string;
  source?: string;
  package?: string;
  unit?: string;
  urgency_label?: string;
  concentration_note?: string;
  duration_note?: string;
  max_per_day_note?: string;
  monitoring?: string;
  warnings?: string[];
  contraindications?: DrugTranslationContraindication[];
  bands?: DrugTranslationBand[];
  indications?: DrugTranslationIndication[];
  clinical?: DrugTranslationClinical;
}

/** Shape of one `src/i18n/drugs/{th,en}/<range>.json` file: `{ _meta, <drugId>: DrugTranslation, ... }`. */
export interface DrugsFile {
  _meta?: { status: string; [key: string]: unknown };
  [drugId: string]: DrugTranslation | { status: string; [key: string]: unknown } | undefined;
}
