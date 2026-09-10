/** Maps upstream `kmuh_detail` zh keys to stable English keys used throughout the i18n layer. */
export const CLINICAL_KEY_MAP: Record<string, string> = {
  臨床用途: 'use',
  禁忌: 'contraindications',
  副作用: 'adverseEffects',
  警語: 'warnings',
  懷孕分級: 'pregnancy',
  授乳: 'breastfeeding',
  管制性藥品: 'controlledDrug',
};

export const CLINICAL_KEY_ORDER = [
  'use',
  'contraindications',
  'adverseEffects',
  'warnings',
  'pregnancy',
  'breastfeeding',
  'controlledDrug',
] as const;

export type ClinicalKey = (typeof CLINICAL_KEY_ORDER)[number];
