// Reproduces upstream `rule` strings for parity testing only.
import type { RuleDescriptor } from './types';
const lh = (low: number, high: number) => `${low}${high !== low ? '-' + high : ''}`;
export function ruleToUpstreamText(r: RuleDescriptor): string {
  switch (r.kind) {
    case 'mg_per_kg_per_dose':
      return `${lh(r.low, r.high)} mg/kg/dose${r.minMg ? ` (min ${r.minMg} mg)` : ''}${r.maxMg ? ` (max ${r.maxMg} mg/dose)` : ''}`;
    case 'mg_per_kg_per_day':
      return `${lh(r.low, r.high)} mg/kg/day ÷ ${r.dosesPerDay}`;
    case 'mcg_per_kg_per_dose':
      return `${lh(r.low, r.high)} mcg/kg/dose`;
    case 'ml_per_kg_per_dose':
      return `${lh(r.low, r.high)} mL/kg/dose`;
    case 'ml_per_kg_per_day':
      return `${lh(r.low, r.high)} mL/kg/day ÷ ${r.dosesPerDay}`;
    case 'supp_by_weight':
      return `BW÷${r.divLow} ~ BW÷${r.divHigh} 顆`;
    case 'pack_per_10kg_per_day':
      return `${r.packsPer10kg} 包/10kg/day ÷ ${r.dosesPerDay}`;
    case 'pack_per_30kg_per_dose':
      return 'BW÷30 包/dose TID';
    case 'weight_band':
      return '依體重分組';
    case 'age_band':
      return '依年齡分組';
    case 'band_label':
      return r.label;
    case 'fluid_421':
      return '4-2-1 rule';
  }
}
