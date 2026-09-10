/**
 * Merges a set of translation-file modules (drug id, or algorithm id, keyed) into one flat map.
 * Each entry in `modules` is one file's already-parsed JSON object — either from
 * `import.meta.glob(..., { eager: true, import: 'default' })` (Vite/Vitest) or from
 * `JSON.parse(fs.readFileSync(...))` (tsx scripts, where `import.meta.glob` is unavailable).
 * The file-level `_meta` key is stripped; a key that appears in more than one file throws.
 */
export function mergeTranslationFiles<T>(modules: Record<string, unknown>): Record<string, T> {
  const merged: Record<string, T> = {};
  const sourceFileByKey = new Map<string, string>();

  for (const [file, mod] of Object.entries(modules)) {
    const obj = mod as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      if (key === '_meta') continue;
      const existingFile = sourceFileByKey.get(key);
      if (existingFile !== undefined) {
        throw new Error(
          `Duplicate translation key '${key}' in '${file}' (already defined in '${existingFile}')`,
        );
      }
      merged[key] = value as T;
      sourceFileByKey.set(key, file);
    }
  }

  return merged;
}
