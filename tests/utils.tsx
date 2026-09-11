import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import { LanguageProvider, type Lang } from '@/i18n';
import { CalculatorProvider, type CalculatorState } from '@/state/CalculatorProvider';
import { DatasetProvider } from '@/state/DatasetProvider';
import type { DrugDataset } from '@/clinical/types';
import realDatasetJson from '../public/data/peds_drugs.json';

/** The canonical dataset, for tests that want real drug data instead of a hand-rolled fixture. */
export const realDataset = realDatasetJson as unknown as DrugDataset;

/**
 * Shared test harness for every Phase 5/6 UI test. Wraps `ui` in the same provider stack `App`
 * uses (`LanguageProvider > DatasetProvider > CalculatorProvider`), defaulting to Thai and the
 * real dataset so components never need to special-case tests. Other tasks import this file and
 * must not modify it.
 */
export function renderWithProviders(
  ui: ReactElement,
  opts?: { lang?: Lang; dataset?: DrugDataset; calculator?: Partial<CalculatorState> },
): RenderResult {
  return render(
    <LanguageProvider initial={opts?.lang ?? 'th'}>
      <DatasetProvider initialData={opts?.dataset ?? realDataset}>
        <CalculatorProvider initial={opts?.calculator}>{ui}</CalculatorProvider>
      </DatasetProvider>
    </LanguageProvider>,
  );
}
