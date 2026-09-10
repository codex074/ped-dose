import type { DrugDataset } from '@/clinical/types';
import { validateDataset } from './schema';

/** Fetches and validates the canonical drug dataset. Throws on fetch failure or invalid data. */
export async function loadDrugs(): Promise<DrugDataset> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/peds_drugs.json`);
  if (!res.ok) throw new Error(`Failed to load drug dataset: HTTP ${res.status}`);
  const json = (await res.json()) as unknown;
  const result = validateDataset(json);
  if (!result.ok) {
    const ids = result.errors
      .map((e) => e.drugId)
      .filter((id): id is string => id !== null)
      .slice(0, 5);
    throw new Error(`Drug dataset failed validation. First drug ids: ${ids.join(', ')}`);
  }
  return result.data;
}
