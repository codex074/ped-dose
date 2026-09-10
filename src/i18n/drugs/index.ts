import { mergeTranslationFiles } from '../mergeTranslationFiles';
import type { DrugTranslation } from './types';

// Vite/Vitest resolve import.meta.glob at build/transform time; each file's JSON default export
// is the already-parsed `{ _meta, <drugId>: DrugTranslation, ... }` object.
const thModules = import.meta.glob('./th/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;
const enModules = import.meta.glob('./en/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

/** Every TH drug translation, merged across `th/*.json`. `{}` when no files exist yet. */
export const drugsTh: Record<string, DrugTranslation> = mergeTranslationFiles(thModules);
/** Every EN drug translation, merged across `en/*.json`. `{}` when no files exist yet. */
export const drugsEn: Record<string, DrugTranslation> = mergeTranslationFiles(enModules);
