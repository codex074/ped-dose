import { useLang, useT } from '@/i18n';
import { localizePals } from '@/i18n/useAlgorithmText';
import { useDataset } from '@/state/DatasetProvider';
import { AlgorithmCard } from './AlgorithmCard';

/** The 3 PALS algorithm cards, in dataset order, each localized via `localizePals`. */
export function PALSView() {
  const { lang } = useLang();
  const t = useT();
  const dataset = useDataset();

  const algorithms = dataset.status === 'ready' ? dataset.data.pals_algorithms : undefined;

  if (!algorithms || algorithms.length === 0) {
    return (
      <div
        className="rounded-2xl bg-white p-4 text-sm text-ink-muted shadow-soft"
        data-testid="pals-empty"
      >
        {t('pals.empty')}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="pals-view">
      {algorithms.map((algo) => (
        <AlgorithmCard key={algo.id} algo={localizePals(algo, lang)} />
      ))}
    </div>
  );
}
