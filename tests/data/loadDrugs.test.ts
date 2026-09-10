import { afterEach, describe, expect, test, vi } from 'vitest';
import { loadDrugs } from '@/data/loadDrugs';
import dataset from '../../public/data/peds_drugs.json';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadDrugs', () => {
  test('fetches from BASE_URL + data/peds_drugs.json and validates', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => dataset,
    });
    vi.stubGlobal('fetch', fetchMock);
    const data = await loadDrugs();
    expect(fetchMock).toHaveBeenCalledWith(`${import.meta.env.BASE_URL}data/peds_drugs.json`);
    expect(data.drugs.length).toBe(dataset.drugs.length);
  });

  test('throws with first 5 drug ids on validation failure', async () => {
    const bad = structuredClone(dataset);
    (bad.drugs[0] as { calc: { type: string } }).calc.type = 'nope';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => bad,
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(loadDrugs()).rejects.toThrow(new RegExp(dataset.drugs[0]!.id));
  });
});
