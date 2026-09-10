import { mergeAlgorithmFiles } from '../mergeAlgorithmFiles';
import type { PalsTranslation, SeTranslation } from './types';

const thModules = import.meta.glob('./th/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;
const enModules = import.meta.glob('./en/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

const th = mergeAlgorithmFiles(thModules);
const en = mergeAlgorithmFiles(enModules);

/** PALS translations by algorithm id. `{}` when no files exist yet. */
export const palsTh: Record<string, PalsTranslation> = th.pals;
export const palsEn: Record<string, PalsTranslation> = en.pals;
/** The single SE algorithm's translation, if any file provides one. */
export const seTh: SeTranslation | undefined = th.se;
export const seEn: SeTranslation | undefined = en.se;
