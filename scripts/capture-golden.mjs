// Extracts num() and calcDose() verbatim from the vendored upstream index.html and runs them
// over a full matrix. Never retype the upstream functions by hand.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';

const UPSTREAM_SHA = '3939f62d84afc06b15387dae4ca384450eb42fb0';
const html = readFileSync('tests/upstream/index.html', 'utf8');
const data = JSON.parse(readFileSync('public/data/peds_drugs.json', 'utf8'));

function extractFunction(name) {
  const lines = html.split('\n');
  const start = lines.findIndex((l) => l.startsWith(`function ${name}(`));
  if (start < 0) throw new Error(`function ${name} not found`);
  let end = start;
  while (end < lines.length && lines[end] !== '}') end++;
  return lines.slice(start, end + 1).join('\n');
}

const src =
  extractFunction('num') +
  '\n' +
  extractFunction('calcDose') +
  '\n' +
  'module.exports = { num, calcDose };';
const ctx = { module: { exports: {} } };
vm.createContext(ctx);
vm.runInContext(src, ctx);
const { num, calcDose } = ctx.module.exports;

// Purified copy of upstream checkContraindication + severityClass (logic unchanged; state -> params)
function checkContraindication(drug, weight, age) {
  if (!drug.contraindications) return null;
  for (let i = 0; i < drug.contraindications.length; i++) {
    const c = drug.contraindications[i];
    if (c.type === 'age_below_months' && age != null && age * 12 < c.threshold_months)
      return { i, c };
    if (c.type === 'age_below_years' && age != null && age < c.threshold_years) return { i, c };
    if (c.type === 'age_below_weeks' && age != null && age * 52 < c.threshold_weeks)
      return { i, c };
    if (c.type === 'weight_above_kg' && weight != null && weight >= c.threshold_kg) return { i, c };
    if (c.type === 'weight_below_kg' && weight != null && weight < c.threshold_kg) return { i, c };
  }
  return null;
}
function severityClass(sev) {
  if (sev === '禁用') return 'severe';
  if (sev === '不建議') return 'moderate';
  return 'mild';
}

const weights = [null, 0.5, 2, 3, 5, 9.99, 10, 10.01, 12.5, 14.99, 15, 20, 20.5, 25, 40, 70, 120];
const ages = [null, 0, 0.1, 0.5, 1, 2.5, 5, 5.5, 6, 11.5, 12, 18];

const cases = [];
for (const drug of data.drugs) {
  const calcs = drug.indications
    ? drug.indications.map((ind, i) => ({ calc: ind.calc, indicationIndex: i }))
    : drug.calc
      ? [{ calc: drug.calc, indicationIndex: null }]
      : [];
  for (const { calc, indicationIndex } of calcs) {
    for (const weight of weights)
      for (const age of ages) {
        const raw = calcDose(drug, calc, weight, age);
        const formatted = {};
        if (raw.mgRange)
          formatted.mg =
            raw.mgRange[0] === raw.mgRange[1]
              ? num(raw.mgRange[0])
              : `${num(raw.mgRange[0])}-${num(raw.mgRange[1])}`;
        if (raw.mcgRange)
          formatted.mcg =
            raw.mcgRange[0] === raw.mcgRange[1]
              ? num(raw.mcgRange[0])
              : `${num(raw.mcgRange[0])}-${num(raw.mcgRange[1])}`;
        if (raw.mlRange)
          formatted.ml =
            raw.mlRange[0] === raw.mlRange[1]
              ? num(raw.mlRange[0])
              : `${num(raw.mlRange[0])}-${num(raw.mlRange[1])}`;
        if (raw.unitRange)
          formatted.unit =
            raw.unitRange[0] === raw.unitRange[1]
              ? num(raw.unitRange[0])
              : `${num(raw.unitRange[0])}-${num(raw.unitRange[1])}`;
        if (raw.packsPerDose !== undefined) formatted.packs = num(raw.packsPerDose);
        if (raw.rate !== undefined) formatted.rate = num(raw.rate);
        const hit = checkContraindication(drug, weight, age);
        cases.push({
          drugId: drug.id,
          indicationIndex,
          weight,
          age,
          raw,
          formatted,
          contra: hit
            ? { index: hit.i, type: hit.c.type, severityClass: severityClass(hit.c.severity) }
            : null,
        });
      }
  }
}

const energy = [];
for (const algo of data.pals_algorithms) {
  (algo.energy_doses || []).forEach((e, index) => {
    for (const weight of weights) {
      if (weight == null) continue;
      const low = e.j_per_kg * weight;
      const high = e.high_j_per_kg ? e.high_j_per_kg * weight : null;
      energy.push({
        algorithmId: algo.id,
        index,
        weight,
        low,
        high,
        formattedLow: num(low),
        formattedHigh: high == null ? null : num(high),
      });
    }
  });
}

mkdirSync('tests/fixtures', { recursive: true });
writeFileSync(
  'tests/fixtures/upstream-golden.json',
  JSON.stringify({
    meta: { upstreamSha: UPSTREAM_SHA, generatedAt: new Date().toISOString(), weights, ages },
    cases,
    energy,
  }),
);
console.log(`cases=${cases.length} energy=${energy.length}`);
