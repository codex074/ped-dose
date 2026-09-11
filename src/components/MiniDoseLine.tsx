import { formatNumber, formatRange } from '@/clinical/formatNumber';
import type { Calc, Drug, DoseResult } from '@/clinical/types';
import { useDoseResult } from '@/hooks/useDoseResult';
import { useT, type TFn } from '@/i18n';

export interface MiniDoseLineProps {
  drug: Drug;
  calc: Calc;
  bandText?: string;
  className?: string;
}

/**
 * Pure text formatter for a `DoseResult`, mirroring upstream's `miniDoseLine()` and extending it
 * to cover every `DoseResult` kind. Exported so other tasks/tests can reuse the exact same
 * one-line summary logic without mounting `MiniDoseLine`. Values are produced only via
 * `formatNumber`/`formatRange`, so the numeric portion is identical across languages.
 */
export function miniDoseText(
  result: DoseResult,
  t: TFn,
  opts?: { bandText?: string; unit?: string },
): string {
  switch (result.kind) {
    case 'needs_weight':
      return t('dose.needsWeight');
    case 'needs_age':
      return t('dose.needsAge');
    case 'dose': {
      const mlSuffix = result.mlRange
        ? ` (${formatRange(result.mlRange[0], result.mlRange[1])} mL)`
        : '';
      if (result.mgRange) {
        return `${formatRange(result.mgRange[0], result.mgRange[1])} mg${mlSuffix}`;
      }
      if (result.mcgRange) {
        return `${formatRange(result.mcgRange[0], result.mcgRange[1])} mcg${mlSuffix}`;
      }
      if (result.mlRange) {
        return `${formatRange(result.mlRange[0], result.mlRange[1])} mL`;
      }
      if (result.unitRange) {
        return `${formatRange(result.unitRange[0], result.unitRange[1])} ${opts?.unit ?? '#'}`;
      }
      if (result.packsPerDose !== undefined) {
        return `${formatNumber(result.packsPerDose)} ${t('dose.packPerDose')}`;
      }
      return '';
    }
    case 'band':
      return result.matched ? (opts?.bandText ?? result.bandText) : t('dose.noMatchingBand');
    case 'rate':
      return `${formatNumber(result.rate)} ${t('dose.mlPerHr')}`;
    case 'dilution':
      return t('dose.dilution', {
        start: formatRange(result.startLow, result.startHigh),
        max: formatNumber(result.max),
        note: result.note,
      });
  }
}

/**
 * Shared one-line dose summary, consumed across the drug list/detail/search UIs. Frozen
 * file name/export/props: `drug` + `calc` feed `useDoseResult`, `bandText` overrides a matched
 * `band` result's own text (e.g. for a caller-selected age/weight band), `className` extends the
 * default styling.
 */
export function MiniDoseLine(props: MiniDoseLineProps): JSX.Element {
  const { drug, calc, bandText, className } = props;
  const result = useDoseResult(drug, calc);
  const t = useT();
  const text = miniDoseText(result, t, { bandText, unit: drug.unit });
  const muted = result.kind === 'needs_weight' || result.kind === 'needs_age';
  const base = muted
    ? 'font-num tabular-nums text-sm text-ink-muted font-normal'
    : 'font-num tabular-nums text-sm font-semibold text-ink';
  const cls = className ? `${base} ${className}` : base;

  return (
    <span className={cls} data-testid="mini-dose-line">
      {text}
    </span>
  );
}
