import { z } from 'zod';
import { CALC_TYPES, type Calc, type ContraindicationType, type Drug } from '@/clinical/types';
import type { DrugDataset } from '@/clinical/types';

const CALC_TYPE_SET: ReadonlySet<string> = new Set(CALC_TYPES);
const CONTRA_TYPES: ReadonlySet<ContraindicationType> = new Set([
  'age_below_months',
  'age_below_years',
  'age_below_weeks',
  'weight_above_kg',
  'weight_below_kg',
]);

const CONCENTRATION_FIELDS = [
  'concentration_mg_per_ml',
  'concentration_mg_per_unit',
  'concentration_mcg_per_ml',
  'concentration_mcg_per_unit',
] as const;

// --- Loose structural schemas. `.passthrough()` everywhere: we never repair/coerce, we only
// check that the fields we care about exist with the right JS type; everything else rides along.

const metaSchema = z
  .object({
    version: z.string(),
    last_updated: z.string(),
    scope: z.string(),
    primary_source: z.string(),
    disclaimer: z.string(),
  })
  .passthrough();

const categorySchema = z
  .object({
    id: z.string(),
    label: z.string(),
    order: z.number(),
  })
  .passthrough();

const calcSchema = z
  .object({
    type: z.string(),
  })
  .passthrough();

const indicationSchema = z
  .object({
    label: z.string(),
    calc: calcSchema,
  })
  .passthrough();

const contraindicationSchema = z
  .object({
    type: z.string(),
    severity: z.string(),
    reason: z.string(),
  })
  .passthrough();

const drugSchema = z
  .object({
    id: z.string(),
    generic: z.string(),
    brand: z.string(),
    kmuh_code: z.string().nullable(),
    category: z.string(),
    form: z.string(),
    route: z.string(),
    source: z.string(),
    kmuh_detail: z.record(z.string()),
    calc: calcSchema.optional(),
    indications: z.array(indicationSchema).optional(),
    contraindications: z.array(contraindicationSchema).optional(),
  })
  .passthrough();

const palsAlgorithmSchema = z
  .object({
    id: z.string(),
    title: z.string(),
  })
  .passthrough();

const seAlgorithmSchema = z
  .object({
    id: z.string(),
    title: z.string(),
  })
  .passthrough();

const datasetShapeSchema = z
  .object({
    _meta: metaSchema,
    categories: z.array(categorySchema),
    drugs: z.array(z.unknown()),
    pals_algorithms: z.array(palsAlgorithmSchema),
    se_algorithm: seAlgorithmSchema,
  })
  .passthrough();

export type ValidationError = { drugId: string | null; message: string };
export type ValidationResult =
  { ok: true; data: DrugDataset } | { ok: false; errors: ValidationError[] };

function issuesToErrors(issues: z.ZodIssue[], drugId: string | null): ValidationError[] {
  return issues.map((issue) => ({
    drugId,
    message: `${issue.path.join('.') || '(root)'}: ${issue.message}`,
  }));
}

/** Cross-field business rules that zod's structural pass can't express. Pushes into `errors`. */
function checkCalcBusinessRules(
  calc: Calc | undefined,
  where: string,
  drugId: string,
  errors: ValidationError[],
): void {
  if (!calc) return;
  const push = (message: string) => errors.push({ drugId, message: `${where}.${message}` });

  if (!CALC_TYPE_SET.has(calc.type)) push(`type: unknown calc type '${calc.type}'`);

  if (calc.low !== undefined && typeof calc.low !== 'number') push('low: not numeric');
  if (calc.high !== undefined && typeof calc.high !== 'number') push('high: not numeric');
  if (typeof calc.low === 'number' && typeof calc.high === 'number' && calc.low > calc.high) {
    push(`low (${calc.low}) > high (${calc.high})`);
  }

  if (calc.doses_per_day !== undefined) {
    if (typeof calc.doses_per_day !== 'number' || !(calc.doses_per_day > 0)) {
      push(`doses_per_day: must be > 0, got ${String(calc.doses_per_day)}`);
    }
  }

  if (calc.bands !== undefined) {
    if (calc.bands.length === 0) {
      push('bands: must be non-empty when present');
    }
    calc.bands.forEach((band, i) => {
      const b = band as unknown as Record<string, unknown>;
      const pairs: [unknown, unknown][] = [
        [b.weight_low, b.weight_high],
        [b.age_low, b.age_high],
      ];
      const hasNumericPair = pairs.some(
        ([lo, hi]) => typeof lo === 'number' && typeof hi === 'number',
      );
      if (!hasNumericPair) push(`bands[${i}]: missing numeric low/high bounds`);
    });
  }
}

function checkDrugBusinessRules(drug: Drug, errors: ValidationError[]): void {
  checkCalcBusinessRules(drug.calc, 'calc', drug.id, errors);
  (drug.indications ?? []).forEach((ind, i) =>
    checkCalcBusinessRules(ind.calc, `indications[${i}].calc`, drug.id, errors),
  );

  for (const field of CONCENTRATION_FIELDS) {
    const v = drug[field];
    if (v !== undefined && v !== null) {
      if (typeof v !== 'number' || !(v > 0)) {
        errors.push({ drugId: drug.id, message: `${field}: must be > 0, got ${String(v)}` });
      }
    }
  }

  (drug.contraindications ?? []).forEach((c, i) => {
    if (!CONTRA_TYPES.has(c.type as ContraindicationType)) {
      errors.push({
        drugId: drug.id,
        message: `contraindications[${i}].type: unknown '${c.type}'`,
      });
    }
  });
}

/** Validates the dataset without mutating or repairing it. */
export function validateDataset(json: unknown): ValidationResult {
  const shape = datasetShapeSchema.safeParse(json);
  if (!shape.success) {
    return { ok: false, errors: issuesToErrors(shape.error.issues, null) };
  }

  const rawDrugs = (json as { drugs: unknown[] }).drugs;
  const errors: ValidationError[] = [];
  const seenIds = new Set<string>();

  for (const raw of rawDrugs) {
    const parsedDrug = drugSchema.safeParse(raw);
    const rawId =
      typeof raw === 'object' && raw !== null && 'id' in raw
        ? (((raw as { id?: unknown }).id as string | undefined) ?? null)
        : null;
    if (!parsedDrug.success) {
      errors.push(...issuesToErrors(parsedDrug.error.issues, rawId));
      continue;
    }
    const drug = parsedDrug.data as unknown as Drug;
    if (seenIds.has(drug.id)) {
      errors.push({ drugId: drug.id, message: `duplicate drug id '${drug.id}'` });
    }
    seenIds.add(drug.id);
    checkDrugBusinessRules(drug, errors);
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, data: json as DrugDataset };
}
