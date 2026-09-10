import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import type { GoldenFile } from '../scripts/golden-types';
import dataset from '../public/data/peds_drugs.json';
import { calcDose } from '@/clinical/calcDose';
const golden = JSON.parse(
  readFileSync('tests/fixtures/upstream-golden.json', 'utf8'),
) as GoldenFile;
import { formatRange, formatNumber } from '@/clinical/formatNumber';
import { checkContraindication } from '@/clinical/contraindications';
import { energyJoules } from '@/clinical/energy';
import { ruleToUpstreamText } from '@/clinical/ruleText';
import type { Drug, PalsAlgorithm } from '@/clinical/types';

const drugs = new Map((dataset.drugs as Drug[]).map((d) => [d.id, d]));

function toUpstreamShape(r: ReturnType<typeof calcDose>): Record<string, unknown> {
  switch (r.kind) {
    case 'needs_weight':
      return { needs_weight: true };
    case 'needs_age':
      return { needs_age: true };
    case 'dose': {
      const o: Record<string, unknown> = { type: 'dose', rule: ruleToUpstreamText(r.rule) };
      if (r.mgRange) o.mgRange = r.mgRange;
      if (r.mcgRange) o.mcgRange = r.mcgRange;
      if (r.mlRange) o.mlRange = r.mlRange;
      if (r.unitRange) o.unitRange = r.unitRange;
      if (r.packsPerDose !== undefined) o.packsPerDose = r.packsPerDose;
      return o;
    }
    case 'band':
      return {
        type: 'band',
        bandText: r.matched
          ? r.rule.kind === 'weight_band'
            ? r.bandText
            : r.bandText || '無資料'
          : '無相符區間',
        rule: ruleToUpstreamText(r.rule),
      };
    case 'rate':
      return {
        type: 'rate',
        rate: r.rate,
        rule: '4-2-1 rule',
        display: `${formatNumber(r.rate)} mL/hr`,
      };
    case 'dilution':
      return {
        type: 'special',
        text: `起始 ${formatNumber(r.startLow)}-${formatNumber(r.startHigh)} mL，最多 ${formatNumber(r.max)} mL（${r.note}）`,
      };
  }
}

test('every golden case matches the TypeScript engine', () => {
  const failures: string[] = [];
  for (const c of golden.cases) {
    const drug = drugs.get(c.drugId)!;
    const calc =
      c.indicationIndex === null ? drug.calc! : drug.indications![c.indicationIndex]!.calc;
    const r = calcDose(drug, calc, c.weight, c.age);
    const mine = toUpstreamShape(r);
    const theirs: Record<string, unknown> = { ...c.raw };
    if (Array.isArray(theirs.display) && theirs.display.length === 0) delete theirs.display;
    if (!isDeepStrictEqual(mine, theirs))
      failures.push(
        `${c.drugId}[${c.indicationIndex}] w=${c.weight} a=${c.age}\n  mine=${JSON.stringify(mine)}\n  gold=${JSON.stringify(theirs)}`,
      );
    const hit = checkContraindication(drug, c.weight, c.age);
    const mineC = hit
      ? { index: hit.index, type: hit.contraindication.type, severityClass: hit.severity }
      : null;
    if (!isDeepStrictEqual(mineC, c.contra))
      failures.push(
        `contra ${c.drugId} w=${c.weight} a=${c.age}: ${JSON.stringify(mineC)} vs ${JSON.stringify(c.contra)}`,
      );
    if (r.kind === 'dose') {
      if (r.mgRange && formatRange(...r.mgRange) !== c.formatted.mg)
        failures.push(`fmt mg ${c.drugId} w=${c.weight}`);
      if (r.mcgRange && formatRange(...r.mcgRange) !== c.formatted.mcg)
        failures.push(`fmt mcg ${c.drugId} w=${c.weight}`);
      if (r.mlRange && formatRange(...r.mlRange) !== c.formatted.ml)
        failures.push(`fmt ml ${c.drugId} w=${c.weight}`);
      if (r.unitRange && formatRange(...r.unitRange) !== c.formatted.unit)
        failures.push(`fmt unit ${c.drugId} w=${c.weight}`);
      if (r.packsPerDose !== undefined && formatNumber(r.packsPerDose) !== c.formatted.packs)
        failures.push(`fmt packs ${c.drugId} w=${c.weight}`);
    }
    if (r.kind === 'rate' && formatNumber(r.rate) !== c.formatted.rate)
      failures.push(`fmt rate ${c.drugId} w=${c.weight}`);
  }
  expect(failures.slice(0, 20)).toEqual([]);
  expect(failures.length).toBe(0);
});

test('PALS energy matches golden', () => {
  const algos = dataset.pals_algorithms as PalsAlgorithm[];
  for (const g of golden.energy) {
    const e = algos.find((a) => a.id === g.algorithmId)!.energy_doses![g.index]!;
    expect(energyJoules(e, g.weight)).toEqual({ low: g.low, high: g.high });
  }
});
