import type { Lang } from './types';

/**
 * Fallback chain shared by every localize* function: for `th`, prefer the TH translation, then
 * EN, then the canonical value; for `en`, prefer the EN translation, then canonical.
 */
export function resolveScalar<T>(
  lang: Lang,
  canonical: T,
  thVal: T | undefined,
  enVal: T | undefined,
): T {
  if (lang === 'th') {
    if (thVal !== undefined) return thVal;
    if (enVal !== undefined) return enVal;
    return canonical;
  }
  return enVal !== undefined ? enVal : canonical;
}

/** A translated array is only usable if its length matches the canonical array (safety net). */
export function validArr<T>(arr: T[] | undefined, expectedLen: number): T[] | undefined {
  return arr && arr.length === expectedLen ? arr : undefined;
}

/** Per-index scalar fallback over a canonical string array. */
export function localizeStringArray(
  lang: Lang,
  canonical: string[] | undefined,
  th: string[] | undefined,
  en: string[] | undefined,
): string[] | undefined {
  if (!canonical) return canonical;
  const vTh = validArr(th, canonical.length);
  const vEn = validArr(en, canonical.length);
  return canonical.map((c, i) => resolveScalar(lang, c, vTh?.[i], vEn?.[i]));
}
