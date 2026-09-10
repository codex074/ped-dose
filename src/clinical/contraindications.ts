import type { ContraindicationHit, Drug, SeverityBucket } from './types';

export function severityBucket(sev: string): SeverityBucket {
  if (sev === '禁用') return 'severe';
  if (sev === '不建議') return 'moderate';
  return 'mild';
}

export function checkContraindication(
  drug: Drug,
  weight: number | null,
  age: number | null,
): ContraindicationHit | null {
  if (!drug.contraindications) return null;
  for (let index = 0; index < drug.contraindications.length; index++) {
    const c = drug.contraindications[index]!;
    const hit = () => ({ index, contraindication: c, severity: severityBucket(c.severity) });
    if (c.type === 'age_below_months' && age != null && age * 12 < (c.threshold_months as number))
      return hit();
    if (c.type === 'age_below_years' && age != null && age < (c.threshold_years as number))
      return hit();
    if (c.type === 'age_below_weeks' && age != null && age * 52 < (c.threshold_weeks as number))
      return hit();
    if (c.type === 'weight_above_kg' && weight != null && weight >= (c.threshold_kg as number))
      return hit();
    if (c.type === 'weight_below_kg' && weight != null && weight < (c.threshold_kg as number))
      return hit();
  }
  return null;
}
