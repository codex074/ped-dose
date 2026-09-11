// Thin CLI: loads the canonical dataset + merged translation maps (via fs, not import.meta.glob
// — tsx has no Vite dev server behind it), prints coverage, and delegates all integrity checking
// to the pure `reportProblems` core (src/i18n/translationReport.ts) so the CLI and the tests
// exercise identical logic.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DrugDataset } from '../src/clinical/types';
import { mergeAlgorithmFiles } from '../src/i18n/mergeAlgorithmFiles';
import { mergeTranslationFiles } from '../src/i18n/mergeTranslationFiles';
import type { DrugTranslation } from '../src/i18n/drugs/types';
import { reportProblems } from '../src/i18n/translationReport';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function readJsonDir(dir: string): Record<string, unknown> {
  if (!existsSync(dir)) return {};
  const out: Record<string, unknown> = {};
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    out[file] = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  }
  return out;
}

const dataset = JSON.parse(
  readFileSync(join(ROOT, 'public/data/peds_drugs.json'), 'utf8'),
) as DrugDataset;

const drugsTh = mergeTranslationFiles<DrugTranslation>(
  readJsonDir(join(ROOT, 'src/i18n/drugs/th')),
);
const drugsEn = mergeTranslationFiles<DrugTranslation>(
  readJsonDir(join(ROOT, 'src/i18n/drugs/en')),
);
const algoTh = mergeAlgorithmFiles(readJsonDir(join(ROOT, 'src/i18n/algorithms/th')));
const algoEn = mergeAlgorithmFiles(readJsonDir(join(ROOT, 'src/i18n/algorithms/en')));

const canonicalIds = dataset.drugs.map((d) => d.id);
const canonicalIdSet = new Set(canonicalIds);

function reportDrugCoverage(label: string, translated: Record<string, DrugTranslation>): void {
  const ids = Object.keys(translated);
  const missing = canonicalIds.filter((id) => !ids.includes(id));
  const orphans = ids.filter((id) => !canonicalIdSet.has(id));
  console.log(`${label} translated: ${ids.length}/${canonicalIds.length}`);
  console.log(`Missing ${label} (${missing.length}): ${missing.join(', ') || '(none)'}`);
  console.log(`Orphan ${label} keys (${orphans.length}): ${orphans.join(', ') || '(none)'}`);
}

console.log(`Canonical drugs: ${canonicalIds.length}`);
reportDrugCoverage('TH', drugsTh);
reportDrugCoverage('EN', drugsEn);

console.log(
  `\nAlgorithms — TH pals: ${Object.keys(algoTh.pals).length}/${dataset.pals_algorithms.length}, ` +
    `EN pals: ${Object.keys(algoEn.pals).length}/${dataset.pals_algorithms.length}, ` +
    `TH se: ${algoTh.se ? 'yes' : 'no'}, EN se: ${algoEn.se ? 'yes' : 'no'}`,
);

const problems = reportProblems(dataset, drugsTh, drugsEn, algoTh, algoEn);

if (problems.length) {
  console.log(`\nProblems found (${problems.length}):`);
  for (const p of problems) console.log(`  ${p.id}.${p.path} (${p.lang}): ${p.message}`);
} else {
  console.log('\nNo numeric-preservation, severity, array-length, or orphan-id problems found.');
}

const exitCode = problems.length ? 1 : 0;
console.log(exitCode === 0 ? '\nOK' : '\nFAILED');
process.exit(exitCode);
