import { DrugMiniRow } from '@/components/pals/DrugMiniRow';
import type { SeStage } from '@/clinical/types';
import { useT } from '@/i18n';
import { useCalculator } from '@/state/CalculatorProvider';

const PALETTE: readonly { bg: string; rail: string }[] = [
  { bg: 'bg-sky-soft', rail: 'bg-sky-deep' },
  { bg: 'bg-mint-soft', rail: 'bg-mint' },
  { bg: 'bg-peach-soft', rail: 'bg-peach' },
  { bg: 'bg-lavender-soft', rail: 'bg-lavender' },
];

/** One stage of the SE timeline: time pill, phase, level chip, subtitle, numbered actions,
 * and (when present) a drug-doses sub-section reusing `DrugMiniRow`. */
export function StageCard({ stage, index }: { stage: SeStage; index: number }) {
  const { weight } = useCalculator();
  const t = useT();
  const palette = PALETTE[index % PALETTE.length] ?? PALETTE[0]!;
  const appliedWeight = weight != null ? t('pals.appliedWeight', { weight }) : null;

  return (
    <div className={`relative rounded-3xl ${palette.bg} p-4 pl-6`} data-testid="se-stage">
      <span
        aria-hidden="true"
        className={`absolute bottom-3 left-2 top-3 w-1.5 rounded-full ${palette.rail}`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-num shrink-0 whitespace-nowrap rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold tabular-nums text-ink">
          {stage.minutes} {t('se.minutes')}
        </span>
        <span className="thai-safe break-words text-sm font-semibold text-ink">{stage.phase}</span>
        {stage.level && (
          <span className="thai-safe break-words rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium text-ink-muted">
            {stage.level}
          </span>
        )}
      </div>
      {stage.subtitle && (
        <p className="thai-safe mt-1 break-words text-sm text-ink-muted">{stage.subtitle}</p>
      )}
      {stage.actions.length > 0 && (
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink">
          {stage.actions.map((a, i) => (
            <li key={i} className="thai-safe break-words">
              {a}
            </li>
          ))}
        </ol>
      )}
      {stage.drugs && stage.drugs.length > 0 && (
        <div className="mt-3">
          <div className="text-sm font-semibold text-sky-deep">
            {t('se.doses')}
            {appliedWeight && (
              <span className="ml-1 font-normal text-ink-muted">{appliedWeight}</span>
            )}
          </div>
          <div className="mt-2 space-y-2">
            {stage.drugs.map((id) => (
              <DrugMiniRow key={id} drugId={id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
