import { useCallback, useEffect, useRef, useState } from 'react';
import type { Drug } from '@/clinical/types';

export const STARRED_KEY = 'pedsdose.starred.v1';
export const LAST_KEY = 'pedsdose.last.v1';

function readStarred(): Set<string> | null {
  try {
    const raw = localStorage.getItem(STARRED_KEY);
    if (raw == null) return null;
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return null;
  }
}

function writeStarred(set: ReadonlySet<string>): void {
  try {
    localStorage.setItem(STARRED_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

/**
 * Starred-drug set, persisted to `STARRED_KEY`. Seeded once (on first run, i.e. when the key is
 * absent) from drugs tagged `starred_default` — mirrors upstream's one-time seed-then-save.
 * Seeding waits for `drugs` to actually be loaded so an empty initial array can't seed an empty set.
 */
export function useStarred(drugs: Drug[]): {
  starred: ReadonlySet<string>;
  toggle: (id: string) => void;
} {
  const [starred, setStarred] = useState<Set<string>>(() => readStarred() ?? new Set());
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current) return;
    if (drugs.length === 0) return;
    seededRef.current = true;
    if (readStarred() != null) return;
    const seeded = new Set<string>();
    for (const d of drugs) if ((d.tags ?? []).includes('starred_default')) seeded.add(d.id);
    setStarred(seeded);
    writeStarred(seeded);
  }, [drugs]);

  const toggle = useCallback((id: string) => {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeStarred(next);
      return next;
    });
  }, []);

  return { starred, toggle };
}
