import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { DrugDataset } from '@/clinical/types';
import { loadDrugs } from '@/data/loadDrugs';
import type { ValidationError } from '@/data/schema';

export interface DatasetError {
  message: string;
  errors?: ValidationError[];
}

export type DatasetState =
  | { status: 'loading' }
  | { status: 'error'; error: DatasetError }
  | { status: 'ready'; data: DrugDataset };

const Ctx = createContext<DatasetState | null>(null);

function toDatasetError(err: unknown): DatasetError {
  const message = err instanceof Error ? err.message : String(err);
  const errors =
    err instanceof Error && Array.isArray((err as { errors?: unknown }).errors)
      ? ((err as { errors?: ValidationError[] }).errors ?? undefined)
      : undefined;
  return { message, errors };
}

/**
 * Loads the drug dataset once on mount via `loadDrugs()`, unless `initialData` is supplied (test
 * harness / storybook path), in which case it never fetches and starts (and stays) `ready`.
 * Never re-fetches when consumers re-render (e.g. on language change) — the effect runs once.
 */
export function DatasetProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData?: DrugDataset;
}) {
  const [state, setState] = useState<DatasetState>(() =>
    initialData ? { status: 'ready', data: initialData } : { status: 'loading' },
  );

  useEffect(() => {
    if (initialData) return;
    let cancelled = false;
    loadDrugs()
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data });
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ status: 'error', error: toDatasetError(err) });
      });
    return () => {
      cancelled = true;
    };
    // Intentionally empty deps: this must run exactly once on mount and never re-fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export function useDataset(): DatasetState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDataset outside DatasetProvider');
  return ctx;
}
