import type { RuleDescriptor } from '@/clinical/types';
import type { TFn } from './types';

/** Raw low-high join, mirroring upstream's direct interpolation of calc.low/calc.high. */
function range(low: number, high: number): string {
  return low === high ? `${low}` : `${low}-${high}`;
}

/** Renders a `RuleDescriptor` to a language-specific string with numeric-identical figures. */
export function formatRule(rule: RuleDescriptor, t: TFn): string {
  switch (rule.kind) {
    case 'mg_per_kg_per_dose': {
      let s = t('rule.mg_per_kg_per_dose', { range: range(rule.low, rule.high) });
      if (rule.minMg !== undefined) s += t('rule.min', { min: rule.minMg });
      if (rule.maxMg !== undefined) s += t('rule.max', { max: rule.maxMg });
      return s;
    }
    case 'mg_per_kg_per_day':
      return t('rule.mg_per_kg_per_day', {
        range: range(rule.low, rule.high),
        doses: rule.dosesPerDay,
      });
    case 'mcg_per_kg_per_dose':
      return t('rule.mcg_per_kg_per_dose', { range: range(rule.low, rule.high) });
    case 'ml_per_kg_per_dose':
      return t('rule.ml_per_kg_per_dose', { range: range(rule.low, rule.high) });
    case 'ml_per_kg_per_day':
      return t('rule.ml_per_kg_per_day', {
        range: range(rule.low, rule.high),
        doses: rule.dosesPerDay,
      });
    case 'supp_by_weight':
      return t('rule.supp_by_weight', { low: rule.divLow, high: rule.divHigh });
    case 'pack_per_10kg_per_day':
      return t('rule.pack_per_10kg_per_day', {
        packs: rule.packsPer10kg ?? '',
        doses: rule.dosesPerDay,
      });
    case 'pack_per_30kg_per_dose':
      return t('rule.pack_per_30kg_per_dose');
    case 'weight_band':
      return t('dose.bandByWeight');
    case 'age_band':
      return t('dose.bandByAge');
    case 'band_label':
      // Drug free text; not translated here (Phase 6 handles drug-text translation).
      return rule.label;
    case 'fluid_421':
      return t('rule.fluid_421');
  }
}
