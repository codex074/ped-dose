import { expect, test } from 'vitest';
import type { Drug, DrugDataset, PalsAlgorithm } from '@/clinical/types';
import { drugLeaves } from '@/i18n/translationLeaves';
import { reportProblems } from '@/i18n/translationReport';
import dataset from '../../public/data/peds_drugs.json';
import skeleton from '../../src/i18n/drugs.skeleton.json';

const typedDataset = dataset as unknown as DrugDataset;

/** Inverse of gen-translation-skeleton.ts's `setNested`: turns a nested JSON value back into the
 * flat `key`/`key[i]`/`key[i].sub` path list that `translationLeaves.ts` produces. */
function flattenPaths(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((v, i) => flattenPaths(v, `${prefix}[${i}]`));
  }
  if (value !== null && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
      flattenPaths(v, prefix ? `${prefix}.${k}` : k),
    );
  }
  return prefix ? [prefix] : [];
}

test('skeleton output for every drug equals the set of drugLeaves paths', () => {
  const skeletonMap = skeleton as Record<string, unknown>;
  for (const drug of typedDataset.drugs) {
    const entry = skeletonMap[drug.id] as Record<string, unknown>;
    const rest = Object.fromEntries(Object.entries(entry).filter(([k]) => k !== '_meta'));
    const skeletonPaths = new Set(flattenPaths(rest));
    const leafPaths = new Set(drugLeaves(drug as unknown as Drug).map((l) => l.path));
    expect(skeletonPaths, drug.id).toEqual(leafPaths);
  }
});

test('a changed route token (PO -> IV) in indications[0].route is flagged', () => {
  const drug = {
    ...(typedDataset.drugs[0] as Drug),
    id: 'synthetic_route_drug',
    indications: [{ label: 'test indication', calc: { type: 'mg_per_kg_per_dose' }, route: 'PO' }],
  } as Drug;
  const dataset2: DrugDataset = { ...typedDataset, drugs: [drug] };

  const thMap = {
    [drug.id]: { indications: [{ route: 'IV' }] },
  };

  const problems = reportProblems(
    dataset2,
    thMap as never,
    {},
    { pals: {}, se: undefined },
    {
      pals: {},
      se: undefined,
    },
  );

  const routeProblem = problems.find((p) => p.path === 'indications[0].route');
  expect(routeProblem).toBeDefined();
  expect(routeProblem!.message).toMatch(/route\/frequency/);
});

test('a changed number in a clinical.* field (kmuh_detail 警語) is flagged', () => {
  const drug = {
    ...(typedDataset.drugs[0] as Drug),
    id: 'synthetic_clinical_drug',
    kmuh_detail: { 警語: 'Max 75 mg/kg/day' },
  } as Drug;
  const dataset2: DrugDataset = { ...typedDataset, drugs: [drug] };

  const thMap = {
    [drug.id]: { clinical: { warnings: 'Max 750 mg/kg/day' } },
  };

  const problems = reportProblems(
    dataset2,
    thMap as never,
    {},
    { pals: {}, se: undefined },
    {
      pals: {},
      se: undefined,
    },
  );

  const clinicalProblem = problems.find((p) => p.path === 'clinical.warnings');
  expect(clinicalProblem).toBeDefined();
  expect(clinicalProblem!.message).toMatch(/number/);
});

test('a changed number in a PALS energy_doses[0].label is flagged', () => {
  const pals = typedDataset.pals_algorithms[0] as PalsAlgorithm;
  const source = pals.energy_doses![0]!.label;
  const changed = /\d/.test(source)
    ? source.replace(/\d+/, (n) => String(Number(n) + 999))
    : '999 J/kg';

  const algoTh = {
    pals: { [pals.id]: { energy_doses: [{ label: changed }] } },
    se: undefined,
  };

  const problems = reportProblems(typedDataset, {}, {}, algoTh as never, {
    pals: {},
    se: undefined,
  });

  const energyProblem = problems.find(
    (p) => p.id === pals.id && p.path === 'energy_doses[0].label',
  );
  expect(energyProblem).toBeDefined();
  expect(energyProblem!.message).toMatch(/number/);
});
