export interface GoldenFile {
  meta: {
    upstreamSha: string;
    generatedAt: string;
    weights: (number | null)[];
    ages: (number | null)[];
  };
  cases: GoldenCase[];
  energy: GoldenEnergy[];
}

export interface GoldenCase {
  drugId: string;
  indicationIndex: number | null; // null = top-level calc
  weight: number | null;
  age: number | null;
  raw: Record<string, unknown>; // exact object returned by upstream calcDose (numbers unrounded)
  formatted: {
    mg?: string;
    mcg?: string;
    ml?: string;
    unit?: string;
    packs?: string;
    rate?: string;
  };
  contra: { index: number; type: string; severityClass: 'severe' | 'moderate' | 'mild' } | null;
}

export interface GoldenEnergy {
  algorithmId: string;
  index: number;
  weight: number;
  low: number;
  high: number | null;
  formattedLow: string;
  formattedHigh: string | null;
}
