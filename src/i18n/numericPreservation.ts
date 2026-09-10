import { translate } from './index';
import type { Lang } from './types';

const NUMBER_RE = /\d+(?:\.\d+)?/g;
const OPERATOR_RE = /[<>≤≥÷]/g;
// Note: `\b%\b` only matches when `%` is flanked by word characters on both sides (e.g.
// "50%off"), which real dosing text rarely does ("50%", "50 %") — a known limitation of the
// upstream-specified pattern, kept verbatim rather than "fixed".
const UNIT_RE = /\b(mg|mcg|g|mL|L|kg|J|min|hr|h|sec|%|PE)\b/gi;
// Deliberately case-sensitive: with an `i` flag, English words like "in"/"ac"/"pc"/"hs" would
// match and produce false preservation failures against Thai text that drops the abbreviation.
const ROUTE_RE = /\b(PO|IV|IO|IM|PR|IN|SC|SL|Q\d+(?:-\d+)?H|QD|BID|TID|QID|PRN|STAT|HS|AC|PC)\b/g;

function extract(re: RegExp, s: string, lower: boolean): string[] {
  const out: string[] = [];
  for (const m of s.matchAll(re)) out.push(lower ? m[0].toLowerCase() : m[0]);
  return out;
}

function toMultiset(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}

function diffMultisets(category: string, a: Map<string, number>, b: Map<string, number>): string[] {
  const problems: string[] = [];
  const keys = new Set([...a.keys(), ...b.keys()]);
  for (const k of keys) {
    const ca = a.get(k) ?? 0;
    const cb = b.get(k) ?? 0;
    if (ca !== cb) {
      problems.push(`${category} '${k}': ${ca} in source vs ${cb} in translation`);
    }
  }
  return problems;
}

/**
 * Verifies that numbers, comparison operators, units, and route/frequency abbreviations survive
 * translation unchanged (as multisets — order doesn't matter, count does). Numbers and operators
 * compare case-sensitively (they have no case); units compare case-insensitively; route/frequency
 * tokens compare case-sensitively (translators may drop them into lowercase prose without that
 * being a real change, but a real change like PO->IV must still be caught).
 */
export function checkNumericPreservation(
  source: string,
  translated: string,
): { ok: boolean; problems: string[] } {
  const problems: string[] = [
    ...diffMultisets(
      'number',
      toMultiset(extract(NUMBER_RE, source, false)),
      toMultiset(extract(NUMBER_RE, translated, false)),
    ),
    ...diffMultisets(
      'operator',
      toMultiset(extract(OPERATOR_RE, source, false)),
      toMultiset(extract(OPERATOR_RE, translated, false)),
    ),
    ...diffMultisets(
      'unit',
      toMultiset(extract(UNIT_RE, source, true)),
      toMultiset(extract(UNIT_RE, translated, true)),
    ),
    ...diffMultisets(
      'route/frequency',
      toMultiset(extract(ROUTE_RE, source, false)),
      toMultiset(extract(ROUTE_RE, translated, false)),
    ),
  ];
  return { ok: problems.length === 0, problems };
}

/** Raw upstream severity string -> severity bucket key (mirrors `severityBucket` in contraindications.ts). */
export const SEVERITY_MAP: Record<string, 'severe' | 'moderate'> = {
  禁用: 'severe',
  不建議: 'moderate',
};

/**
 * `禁用` must translate to the language's `contra.severe` UI string; `不建議` to `contra.moderate`.
 * Any other severity (慎用, 建議改膠囊, ...) is not checked here and always passes.
 */
export function checkSeverity(
  sourceSeverity: string,
  translatedSeverity: string,
  lang: Lang,
): boolean {
  const bucket = SEVERITY_MAP[sourceSeverity];
  if (!bucket) return true;
  const expectedKey = bucket === 'severe' ? 'contra.severe' : 'contra.moderate';
  return translatedSeverity === translate(lang, expectedKey);
}
