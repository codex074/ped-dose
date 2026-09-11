import { useState } from 'react';
import { LanguageProvider } from '@/i18n';
import { CalculatorProvider, useCalculator } from '@/state/CalculatorProvider';
import { DatasetProvider, useDataset } from '@/state/DatasetProvider';
import { AboutDialog } from '@/components/AboutDialog';
import { AppFooter } from '@/components/AppFooter';
import { AppHeader } from '@/components/AppHeader';
import { CategoryChips } from '@/components/CategoryChips';
import { DrugList } from '@/components/DrugList';
import { DrugSearch } from '@/components/DrugSearch';
import { ErrorCard } from '@/components/ErrorCard';
import { PatientInput } from '@/components/PatientInput';
import { PatientSummaryBanner } from '@/components/PatientSummaryBanner';
import { SelectedDrugPanel } from '@/components/SelectedDrugPanel';
import { SkeletonCard } from '@/components/SkeletonCard';
import { PALSView } from '@/components/pals/PALSView';
import { SEView } from '@/components/se/SEView';

/**
 * The app's real page structure, split out from `App` so tests can render it directly under
 * `renderWithProviders` (e.g. to force a `view`) without re-mocking `fetch`.
 */
export function Layout() {
  const dataset = useDataset();
  const { view } = useCalculator();
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-4 md:py-6">
        {dataset.status === 'loading' && (
          <div className="grid gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}
        {dataset.status === 'error' && <ErrorCard error={dataset.error} />}
        {dataset.status === 'ready' && (
          <>
            <PatientSummaryBanner />
            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <div className="flex flex-col gap-4">
                <PatientInput />
                {view !== 'pals' && view !== 'se' && <DrugSearch />}
                <CategoryChips />
                {view === 'pals' ? <PALSView /> : view === 'se' ? <SEView /> : <DrugList />}
              </div>
              <aside className="self-start lg:sticky lg:top-24">
                <SelectedDrugPanel />
              </aside>
            </div>
          </>
        )}
      </main>
      <AppFooter onOpenAbout={() => setAboutOpen(true)} />
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <DatasetProvider>
        <CalculatorProvider>
          <Layout />
        </CalculatorProvider>
      </DatasetProvider>
    </LanguageProvider>
  );
}
