// Thin CLI: loads the canonical dataset + merged translation maps (via fs, not import.meta.glob
// — tsx has no Vite dev server behind it) and prints coverage + integrity checks.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Drug, DrugDataset } from '../src/clinical/types';
import { mergeAlgorithmFiles } from '../src/i18n/mergeAlgorithmFiles';
import { mergeTranslationFiles } from '../src/i18n/mergeTranslationFiles';
import type { DrugTranslation } from '../src/i18n/drugs/types';
import { checkNumericPreservation, checkSeverity } from '../src/i18n/numericPreservation';

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

let exitCode = 0;
const problems: string[] = [];

function reportDrugCoverage(label: string, translated: Record<string, DrugTranslation>): void {
  const ids = Object.keys(translated);
  const missing = canonicalIds.filter((id) => !ids.includes(id));
  const orphans = ids.filter((id) => !canonicalIdSet.has(id));
  console.log(`${label} translated: ${ids.length}/${canonicalIds.length}`);
  console.log(`Missing ${label} (${missing.length}): ${missing.join(', ') || '(none)'}`);
  console.log(`Orphan ${label} keys (${orphans.length}): ${orphans.join(', ') || '(none)'}`);
  if (orphans.length) exitCode = 1;
}

const NUMERIC_SCALAR_FIELDS = [
  'brand',
  'notes',
  'frequency',
  'source',
  'package',
  'unit',
  'urgency_label',
  'concentration_note',
  'duration_note',
  'max_per_day_note',
  'monitoring',
] as const;

function checkArrayLength(
  id: string,
  field: string,
  lang: string,
  canonicalLen: number,
  translatedLen: number,
): boolean {
  if (canonicalLen === translatedLen) return true;
  problems.push(
    `${id}.${field} (${lang}): array length mismatch — canonical ${canonicalLen}, translated ${translatedLen}`,
  );
  exitCode = 1;
  return false;
}

function checkPair(id: string, field: string, lang: string, source: string, value: string): void {
  const r = checkNumericPreservation(source, value);
  if (!r.ok) {
    for (const p of r.problems) problems.push(`${id}.${field} (${lang}): ${p}`);
    exitCode = 1;
  }
}

function checkDrugFields(
  id: string,
  lang: 'th' | 'en',
  canonical: Drug,
  translated: DrugTranslation | undefined,
): void {
  if (!translated) return;

  for (const field of NUMERIC_SCALAR_FIELDS) {
    const source = canonical[field] as string | undefined;
    const value = translated[field] as string | undefined;
    if (typeof source === 'string' && typeof value === 'string')
      checkPair(id, field, lang, source, value);
  }

  if (translated.warnings) {
    const canonicalWarnings = canonical.warnings ?? [];
    if (
      checkArrayLength(id, 'warnings', lang, canonicalWarnings.length, translated.warnings.length)
    ) {
      canonicalWarnings.forEach((w, i) =>
        checkPair(id, `warnings[${i}]`, lang, w, translated.warnings![i]!),
      );
    }
  }

  if (translated.contraindications) {
    const canonicalContra = canonical.contraindications ?? [];
    if (
      checkArrayLength(
        id,
        'contraindications',
        lang,
        canonicalContra.length,
        translated.contraindications.length,
      )
    ) {
      canonicalContra.forEach((c, i) => {
        const tc = translated.contraindications![i]!;
        if (typeof tc.reason === 'string')
          checkPair(id, `contraindications[${i}].reason`, lang, c.reason, tc.reason);
        if (typeof tc.severity === 'string' && !checkSeverity(c.severity, tc.severity, lang)) {
          problems.push(
            `${id}.contraindications[${i}].severity (${lang}): '${c.severity}' -> '${tc.severity}' does not match the required UI string`,
          );
          exitCode = 1;
        }
      });
    }
  }

  if (translated.indications) {
    const canonicalIndications = canonical.indications ?? [];
    if (
      checkArrayLength(
        id,
        'indications',
        lang,
        canonicalIndications.length,
        translated.indications.length,
      )
    ) {
      canonicalIndications.forEach((ind, i) => {
        const ti = translated.indications![i]!;
        (['label', 'notes', 'frequency', 'onset', 'duration'] as const).forEach((f) => {
          const source = ind[f];
          const value = ti[f];
          if (typeof source === 'string' && typeof value === 'string') {
            checkPair(id, `indications[${i}].${f}`, lang, source, value);
          }
        });
      });
    }
  }

  if (translated.bands && canonical.calc?.bands) {
    const canonicalBands = canonical.calc.bands;
    if (checkArrayLength(id, 'calc.bands', lang, canonicalBands.length, translated.bands.length)) {
      canonicalBands.forEach((band, i) => {
        const dose = (band as { dose?: string }).dose;
        const tb = translated.bands![i]!;
        if (typeof dose === 'string' && typeof tb.dose === 'string') {
          checkPair(id, `calc.bands[${i}].dose`, lang, dose, tb.dose);
        }
      });
    }
  }
}

console.log(`Canonical drugs: ${canonicalIds.length}`);
reportDrugCoverage('TH', drugsTh);
reportDrugCoverage('EN', drugsEn);

for (const drug of dataset.drugs) {
  checkDrugFields(drug.id, 'th', drug, drugsTh[drug.id]);
  checkDrugFields(drug.id, 'en', drug, drugsEn[drug.id]);
}

console.log(
  `\nAlgorithms — TH pals: ${Object.keys(algoTh.pals).length}/${dataset.pals_algorithms.length}, ` +
    `EN pals: ${Object.keys(algoEn.pals).length}/${dataset.pals_algorithms.length}, ` +
    `TH se: ${algoTh.se ? 'yes' : 'no'}, EN se: ${algoEn.se ? 'yes' : 'no'}`,
);

if (problems.length) {
  console.log(`\nNumeric-preservation / severity problems (${problems.length}):`);
  for (const p of problems) console.log(`  ${p}`);
} else {
  console.log('\nNo numeric-preservation or severity problems found.');
}

console.log(exitCode === 0 ? '\nOK' : '\nFAILED');
process.exit(exitCode);
