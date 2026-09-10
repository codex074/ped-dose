import type { AgeBand, Calc, DoseResult, Drug, WeightBand } from './types';

function lowHigh(calc: Calc): [number, number] {
  return [calc.low as number, calc.high as number];
}

export function calcDose(
  drug: Drug,
  calc: Calc,
  weight: number | null,
  age: number | null,
): DoseResult {
  const t = calc.type;

  if (t === 'mg_per_kg_per_dose') {
    if (weight == null) return { kind: 'needs_weight' };
    const [low, high] = lowHigh(calc);
    let lowMg = low * weight,
      highMg = high * weight;
    if (calc.max_dose_mg) {
      lowMg = Math.min(lowMg, calc.max_dose_mg);
      highMg = Math.min(highMg, calc.max_dose_mg);
    }
    if (calc.min_dose_mg) {
      lowMg = Math.max(lowMg, calc.min_dose_mg);
      highMg = Math.max(highMg, calc.min_dose_mg);
    }
    const result: DoseResult = {
      kind: 'dose',
      mgRange: [lowMg, highMg],
      rule: {
        kind: 'mg_per_kg_per_dose',
        low,
        high,
        ...(calc.min_dose_mg ? { minMg: calc.min_dose_mg } : {}),
        ...(calc.max_dose_mg ? { maxMg: calc.max_dose_mg } : {}),
      },
    };
    if (drug.concentration_mg_per_ml)
      result.mlRange = [
        lowMg / drug.concentration_mg_per_ml,
        highMg / drug.concentration_mg_per_ml,
      ];
    if (drug.concentration_mg_per_unit)
      result.unitRange = [
        lowMg / drug.concentration_mg_per_unit,
        highMg / drug.concentration_mg_per_unit,
      ];
    return result;
  }

  if (t === 'mg_per_kg_per_day') {
    if (weight == null) return { kind: 'needs_weight' };
    const dosesDay = calc.doses_per_day || 1;
    const [low, high] = lowHigh(calc);
    let lowMgDay = low * weight,
      highMgDay = high * weight;
    if (calc.max_mg_per_day) {
      lowMgDay = Math.min(lowMgDay, calc.max_mg_per_day);
      highMgDay = Math.min(highMgDay, calc.max_mg_per_day);
    }
    const lowMg = lowMgDay / dosesDay,
      highMg = highMgDay / dosesDay;
    const result: DoseResult = {
      kind: 'dose',
      mgRange: [lowMg, highMg],
      rule: { kind: 'mg_per_kg_per_day', low, high, dosesPerDay: dosesDay },
    };
    if (drug.concentration_mg_per_ml)
      result.mlRange = [
        lowMg / drug.concentration_mg_per_ml,
        highMg / drug.concentration_mg_per_ml,
      ];
    if (drug.concentration_mg_per_unit)
      result.unitRange = [
        lowMg / drug.concentration_mg_per_unit,
        highMg / drug.concentration_mg_per_unit,
      ];
    return result;
  }

  if (t === 'mcg_per_kg_per_dose') {
    if (weight == null) return { kind: 'needs_weight' };
    const [low, high] = lowHigh(calc);
    let lowMcg = low * weight,
      highMcg = high * weight;
    if (calc.max_dose_mcg) {
      lowMcg = Math.min(lowMcg, calc.max_dose_mcg);
      highMcg = Math.min(highMcg, calc.max_dose_mcg);
    }
    const result: DoseResult = {
      kind: 'dose',
      mcgRange: [lowMcg, highMcg],
      rule: { kind: 'mcg_per_kg_per_dose', low, high },
    };
    if (drug.concentration_mcg_per_ml)
      result.mlRange = [
        lowMcg / drug.concentration_mcg_per_ml,
        highMcg / drug.concentration_mcg_per_ml,
      ];
    else if (drug.concentration_mg_per_ml)
      result.mlRange = [
        lowMcg / (drug.concentration_mg_per_ml * 1000),
        highMcg / (drug.concentration_mg_per_ml * 1000),
      ];
    return result;
  }

  if (t === 'ml_per_kg_per_dose') {
    if (weight == null) return { kind: 'needs_weight' };
    const [low, high] = lowHigh(calc);
    let lowMl = low * weight,
      highMl = high * weight;
    if (calc.max_ml_per_dose) {
      lowMl = Math.min(lowMl, calc.max_ml_per_dose);
      highMl = Math.min(highMl, calc.max_ml_per_dose);
    }
    return {
      kind: 'dose',
      mlRange: [lowMl, highMl],
      rule: { kind: 'ml_per_kg_per_dose', low, high },
    };
  }

  if (t === 'ml_per_kg_per_day') {
    if (weight == null) return { kind: 'needs_weight' };
    const dosesDay = calc.doses_per_day || 1;
    const [low, high] = lowHigh(calc);
    const lowMlDay = low * weight,
      highMlDay = high * weight;
    return {
      kind: 'dose',
      mlRange: [lowMlDay / dosesDay, highMlDay / dosesDay],
      rule: { kind: 'ml_per_kg_per_day', low, high, dosesPerDay: dosesDay },
    };
  }

  if (t === 'supp_by_weight') {
    if (weight == null) return { kind: 'needs_weight' };
    const divLow = calc.kg_per_supp_low as number,
      divHigh = calc.kg_per_supp_high as number;
    return {
      kind: 'dose',
      unitRange: [weight / divLow, weight / divHigh],
      rule: { kind: 'supp_by_weight', divLow, divHigh },
    };
  }

  if (t === 'pack_per_10kg_per_day') {
    if (weight == null) return { kind: 'needs_weight' };
    const dosesDay = calc.doses_per_day || 3;
    const totalPacks = (weight / 10) * (calc.packs_per_10kg_per_day || 1);
    return {
      kind: 'dose',
      packsPerDose: totalPacks / dosesDay,
      rule: {
        kind: 'pack_per_10kg_per_day',
        packsPer10kg: calc.packs_per_10kg_per_day,
        dosesPerDay: dosesDay,
      },
    };
  }

  if (t === 'pack_per_30kg_per_dose') {
    if (weight == null) return { kind: 'needs_weight' };
    return { kind: 'dose', packsPerDose: weight / 30, rule: { kind: 'pack_per_30kg_per_dose' } };
  }

  if (t === 'weight_band') {
    if (weight == null) return { kind: 'needs_weight' };
    const bands = (calc.bands ?? []) as WeightBand[];
    const idx = bands.findIndex((b) => weight >= b.weight_low && weight < b.weight_high);
    if (idx < 0) return { kind: 'band', matched: false, rule: { kind: 'weight_band' } };
    return {
      kind: 'band',
      matched: true,
      bandIndex: idx,
      bandText: bands[idx]!.dose,
      rule: { kind: 'weight_band' },
    };
  }

  if (t === 'age_band') {
    if (age == null) return { kind: 'needs_age' };
    const bands = (calc.bands ?? []) as AgeBand[];
    const idx = bands.findIndex((b) => age >= b.age_low && age < b.age_high);
    if (idx < 0) return { kind: 'band', matched: false, rule: { kind: 'age_band' } };
    const band = bands[idx]!;
    if (band.mg_per_kg_per_dose !== undefined) {
      if (weight == null) return { kind: 'needs_weight' };
      const high = band.mg_per_kg_per_dose_high ?? band.mg_per_kg_per_dose;
      let lowMg = band.mg_per_kg_per_dose * weight,
        highMg = high * weight;
      if (band.max_mg_per_dose) {
        lowMg = Math.min(lowMg, band.max_mg_per_dose);
        highMg = Math.min(highMg, band.max_mg_per_dose);
      }
      const rule = band.label
        ? { kind: 'band_label' as const, label: band.label }
        : { kind: 'mg_per_kg_per_dose' as const, low: band.mg_per_kg_per_dose, high };
      const result: DoseResult = { kind: 'dose', mgRange: [lowMg, highMg], rule };
      if (drug.concentration_mg_per_ml)
        result.mlRange = [
          lowMg / drug.concentration_mg_per_ml,
          highMg / drug.concentration_mg_per_ml,
        ];
      return result;
    }
    if (band.mg_per_dose !== undefined) {
      const mg = band.mg_per_dose;
      // Controller ruling: fixed-dose sub-branch without band.label uses upstream's
      // literal `${mg} mg/dose` text, NOT the mg_per_kg_per_dose shape (different unit).
      const rule = band.label
        ? { kind: 'band_label' as const, label: band.label }
        : { kind: 'band_label' as const, label: `${mg} mg/dose` };
      const result: DoseResult = { kind: 'dose', mgRange: [mg, mg], rule };
      if (drug.concentration_mg_per_ml)
        result.mlRange = [mg / drug.concentration_mg_per_ml, mg / drug.concentration_mg_per_ml];
      return result;
    }
    return {
      kind: 'band',
      matched: true,
      bandIndex: idx,
      bandText: band.dose ?? '',
      rule: band.label ? { kind: 'band_label', label: band.label } : { kind: 'age_band' },
    };
  }

  if (t === 'fluid_421_rule') {
    if (weight == null) return { kind: 'needs_weight' };
    let rate = 0;
    if (weight <= 10) rate = weight * 4;
    else if (weight <= 20) rate = 40 + (weight - 10) * 2;
    else rate = 60 + (weight - 20);
    return { kind: 'rate', rate, rule: { kind: 'fluid_421' } };
  }

  if (t === 'ml_by_weight_after_dilution') {
    if (weight == null) return { kind: 'needs_weight' };
    return {
      kind: 'dilution',
      startLow: weight / 4,
      startHigh: weight / 3,
      max: weight,
      note: calc.note ?? '',
    };
  }

  throw new Error(`Unsupported calc.type: ${String(t)}`);
}
