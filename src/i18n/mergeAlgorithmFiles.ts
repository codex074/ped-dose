import { mergeTranslationFiles } from './mergeTranslationFiles';
import type { AlgorithmsFile, PalsTranslation, SeTranslation } from './algorithms/types';

/**
 * Algorithm translation files nest two different things per file: a `pals` map (keyed by
 * algorithm id, merged the same duplicate-checked way as drug translations) and a single `se`
 * object (there is only one SE algorithm, so more than one file defining `se` is a conflict).
 */
export function mergeAlgorithmFiles(modules: Record<string, unknown>): {
  pals: Record<string, PalsTranslation>;
  se: SeTranslation | undefined;
} {
  const palsModules: Record<string, unknown> = {};
  let se: SeTranslation | undefined;
  let seFile: string | undefined;

  for (const [file, mod] of Object.entries(modules)) {
    const obj = mod as AlgorithmsFile;
    if (obj.pals) palsModules[file] = obj.pals;
    if (obj.se) {
      if (se !== undefined) {
        throw new Error(`Duplicate 'se' translation in '${file}' (already defined in '${seFile}')`);
      }
      se = obj.se;
      seFile = file;
    }
  }

  return { pals: mergeTranslationFiles<PalsTranslation>(palsModules), se };
}
