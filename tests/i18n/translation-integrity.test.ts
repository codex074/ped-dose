import { describe, expect, test } from 'vitest';
import { drugsEn as en, drugsTh as th } from '@/i18n/drugs';
import { palsEn, palsTh, seEn, seTh } from '@/i18n/algorithms';
import { checkNumericPreservation, checkSeverity, SEVERITY_MAP } from '@/i18n/numericPreservation';
import { mergeTranslationFiles } from '@/i18n/mergeTranslationFiles';
import { localizeDrug } from '@/i18n/useDrugText';
import { localizePalsWith, localizeSeWith } from '@/i18n/useAlgorithmText';
import { reportProblems } from '@/i18n/translationReport';
import type { Drug, DrugDataset, PalsAlgorithm, SeAlgorithm } from '@/clinical/types';
import type { DrugTranslation } from '@/i18n/drugs/types';
import dataset from '../../public/data/peds_drugs.json';

// Phase-agnostic: `reportProblems` walks the SAME leaf list the skeleton generator and CLI use
// (src/i18n/translationLeaves.ts), so this passes whether the translation range directories are
// empty (merged maps `{}`, today) or filled in with real files (Phase 6) — it never hard-codes a
// specific coverage state, and becomes the real integrity gate once translations land.
test('the app-loaded translation maps produce no report problems', () => {
  const problems = reportProblems(
    dataset as unknown as DrugDataset,
    th,
    en,
    { pals: palsTh, se: seTh },
    { pals: palsEn, se: seEn },
  );
  expect(problems).toEqual([]);
});

test('every translated drug/PALS id exists canonically', () => {
  const drugIds = new Set(dataset.drugs.map((d) => d.id));
  for (const file of [th, en]) {
    for (const id of Object.keys(file)) expect(drugIds.has(id), id).toBe(true);
  }
  const palsIds = new Set(dataset.pals_algorithms.map((a) => a.id));
  for (const file of [palsTh, palsEn]) {
    for (const id of Object.keys(file)) expect(palsIds.has(id), id).toBe(true);
  }
});

describe('mergeTranslationFiles', () => {
  test('merges multiple files into one flat map', () => {
    const merged = mergeTranslationFiles<{ v: number }>({
      'a.json': { x: { v: 1 } },
      'b.json': { y: { v: 2 } },
    });
    expect(merged).toEqual({ x: { v: 1 }, y: { v: 2 } });
  });
  test('strips file-level _meta', () => {
    const merged = mergeTranslationFiles<{ v: number }>({
      'a.json': { _meta: { status: 'draft' }, x: { v: 1 } },
    });
    expect(merged).toEqual({ x: { v: 1 } });
  });
  test('throws on a duplicate key across files', () => {
    expect(() =>
      mergeTranslationFiles({
        'a.json': { dup: { v: 1 } },
        'b.json': { dup: { v: 2 } },
      }),
    ).toThrow(/duplicate/i);
  });
});

describe('checkNumericPreservation', () => {
  test('numbers, units, operators survive translation', () => {
    expect(checkNumericPreservation('0.5 # BID PC', '0.5 เม็ด BID PC').ok).toBe(true);
    expect(checkNumericPreservation('max 10 mg', 'max 100 mg').ok).toBe(false);
  });
  test('catches a changed unit', () => {
    expect(checkNumericPreservation('5 mg', '5 mL').ok).toBe(false);
  });
  test('catches a changed operator', () => {
    expect(checkNumericPreservation('<2', '>2').ok).toBe(false);
  });
  test('accepts Thai text around preserved tokens', () => {
    const r = checkNumericPreservation('give <2 mg every Q6H', 'ให้ <2 mg ทุก Q6H');
    expect(r.ok).toBe(true);
  });
  test('unit comparison is case-insensitive', () => {
    expect(checkNumericPreservation('5 mg', '5 MG').ok).toBe(true);
  });
  test('% is preserved as a unit (no \\b required)', () => {
    expect(checkNumericPreservation('50%', '50').ok).toBe(false);
    expect(checkNumericPreservation('50%', '50 %').ok).toBe(true);
  });
});

describe('checkSeverity', () => {
  test('禁用 requires the contra.severe UI string', () => {
    expect(checkSeverity('禁用', 'ห้ามใช้', 'th')).toBe(true);
    expect(checkSeverity('禁用', 'Contraindicated', 'en')).toBe(true);
    expect(checkSeverity('禁用', 'wrong', 'th')).toBe(false);
  });
  test('不建議 requires the contra.moderate UI string', () => {
    expect(checkSeverity('不建議', 'ไม่แนะนำ', 'th')).toBe(true);
    expect(checkSeverity('不建議', 'wrong', 'en')).toBe(false);
  });
  test('other severities always pass', () => {
    expect(checkSeverity('慎用', 'anything', 'en')).toBe(true);
  });
  test('SEVERITY_MAP has the two mapped severities', () => {
    expect(SEVERITY_MAP['禁用']).toBe('severe');
    expect(SEVERITY_MAP['不建議']).toBe('moderate');
  });
});

describe('localizeDrug fallback', () => {
  const canonical = dataset.drugs.find((d) => d.id === 'antiphen_syrup')! as unknown as Drug;

  test('falls back th -> en -> canonical per field', () => {
    const thMap: Record<string, DrugTranslation> = {
      antiphen_syrup: { notes: 'บันทึกไทย' },
    };
    const enMap: Record<string, DrugTranslation> = {
      antiphen_syrup: { notes: 'EN notes', frequency: 'EN frequency' },
    };
    const th1 = localizeDrug(canonical, 'th', thMap, enMap);
    expect(th1.notes).toBe('บันทึกไทย'); // th present
    expect(th1.frequency).toBe('EN frequency'); // th missing -> en
    expect(th1.source).toBe(canonical.source); // neither -> canonical

    const en1 = localizeDrug(canonical, 'en', thMap, enMap);
    expect(en1.notes).toBe('EN notes');
    expect(en1.source).toBe(canonical.source);
  });

  test('does not mutate the canonical drug object', () => {
    const before = structuredClone(canonical);
    localizeDrug(canonical, 'th', { antiphen_syrup: { notes: 'x' } }, {});
    expect(canonical).toEqual(before);
  });

  test('array-length mismatch is ignored (falls through)', () => {
    const withWarnings: Drug = {
      ...canonical,
      warnings: ['first warning', 'second warning'],
    };
    const thMap: Record<string, DrugTranslation> = {
      [withWarnings.id]: { warnings: ['only one, wrong length'] },
    };
    const enMap: Record<string, DrugTranslation> = {
      [withWarnings.id]: { warnings: ['EN first', 'EN second'] },
    };
    const localized = localizeDrug(withWarnings, 'th', thMap, enMap);
    // th array length (1) mismatches canonical (2) -> ignored -> falls through to en
    expect(localized.warnings).toEqual(['EN first', 'EN second']);
  });

  test('builds clinical from kmuh_detail via CLINICAL_KEY_MAP', () => {
    const localized = localizeDrug(canonical, 'en', {}, {});
    for (const zhKey of Object.keys(canonical.kmuh_detail)) {
      expect(Object.values(localized.clinical)).toContain(canonical.kmuh_detail[zhKey]);
    }
  });
});

describe('localizePalsWith / localizeSeWith', () => {
  const pals = dataset.pals_algorithms[0]! as unknown as PalsAlgorithm;
  const se = dataset.se_algorithm as unknown as SeAlgorithm;

  test('leaves drugs and figure_url untouched even if a translation tries to override them', () => {
    // Deliberately mistyped fixture: `drugs`/`figure_url` aren't part of PalsTranslation at all —
    // this proves localizePalsWith ignores them even if a hand-edited translation file smuggled
    // them in.
    const th = {
      [pals.id]: {
        title: 'แปลแล้ว',
        drugs: ['should-not-appear'],
        figure_url: 'https://should-not-be-used.example',
      },
    } as unknown as Record<string, import('@/i18n/algorithms/types').PalsTranslation>;
    const localized = localizePalsWith(pals, 'th', th, {});
    expect(localized.title).toBe('แปลแล้ว');
    expect(localized.drugs).toEqual(pals.drugs);
    expect(localized.figure_url).toBe(pals.figure_url);
  });

  test('does not mutate the canonical algorithm', () => {
    const before = structuredClone(pals);
    localizePalsWith(pals, 'th', { [pals.id]: { title: 'x' } }, {});
    expect(pals).toEqual(before);
  });

  test('se localization never translates figure_url', () => {
    const fixture = {
      figure_url: 'https://nope.example',
    } as unknown as import('@/i18n/algorithms/types').SeTranslation;
    const localized = localizeSeWith(se, 'th', fixture, undefined);
    expect(localized.figure_url).toBe(se.figure_url);
  });
});
