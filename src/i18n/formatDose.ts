import type { Drug, DoseResult } from '@/clinical/types';
import { formatNumber, formatRange } from '@/clinical/formatNumber';
import { formatRule } from './formatRule';
import type { TFn } from './types';

export interface DoseRow {
  id:
    | 'mg'
    | 'mcg'
    | 'ml'
    | 'unit'
    | 'packs'
    | 'rate'
    | 'band'
    | 'dilution'
    | 'needsWeight'
    | 'needsAge';
  label: string;
  value: string;
  unit: string;
  emphasis: boolean;
  sub?: string;
}

/**
 * Renders a `DoseResult` to display rows. Row order/labels mirror upstream `renderDoseResult`.
 * Values use `formatRange`/`formatNumber` only, so numerics are identical across languages;
 * only `label`/`unit`/`sub` text differs by language (via `t`).
 */
export function doseRows(
  drug: Drug,
  result: DoseResult,
  t: TFn,
  opts?: { bandText?: string; dilutionNote?: string; frequency?: string },
): DoseRow[] {
  const rows: DoseRow[] = [];

  switch (result.kind) {
    case 'needs_weight':
      rows.push({
        id: 'needsWeight',
        label: t('dose.needsWeight'),
        value: '',
        unit: '',
        emphasis: false,
      });
      return rows;

    case 'needs_age':
      rows.push({
        id: 'needsAge',
        label: t('dose.needsAge'),
        value: '',
        unit: '',
        emphasis: false,
      });
      return rows;

    case 'dose': {
      const sub = formatRule(result.rule, t);
      if (result.mgRange) {
        rows.push({
          id: 'mg',
          label: t('dose.total'),
          value: formatRange(result.mgRange[0], result.mgRange[1]),
          unit: t('dose.mg'),
          emphasis: false,
          sub,
        });
      }
      if (result.mcgRange) {
        rows.push({
          id: 'mcg',
          label: t('dose.total'),
          value: formatRange(result.mcgRange[0], result.mcgRange[1]),
          unit: t('dose.mcg'),
          emphasis: false,
          sub,
        });
      }
      if (result.mlRange) {
        const isAmp = drug.form === 'amp' || drug.brand.includes('Amp');
        rows.push({
          id: 'ml',
          label: t(isAmp ? 'dose.draw' : 'dose.volume'),
          value: formatRange(result.mlRange[0], result.mlRange[1]),
          unit: t('dose.ml'),
          emphasis: true,
        });
      }
      if (result.unitRange) {
        const unit = drug.unit ?? '#';
        rows.push({
          id: 'unit',
          label: t('dose.unitCount', { unit }),
          value: formatRange(result.unitRange[0], result.unitRange[1]),
          unit,
          emphasis: true,
        });
      }
      if (result.packsPerDose !== undefined) {
        rows.push({
          id: 'packs',
          label: t('dose.packs'),
          value: formatNumber(result.packsPerDose),
          unit: t('dose.packPerDose'),
          emphasis: true,
        });
      }
      return rows;
    }

    case 'rate':
      rows.push({
        id: 'rate',
        label: t('dose.rate'),
        value: formatNumber(result.rate),
        unit: t('dose.mlPerHr'),
        emphasis: false,
      });
      return rows;

    case 'band': {
      const label = formatRule(result.rule, t);
      const value = result.matched ? (opts?.bandText ?? result.bandText) : t('dose.noMatchingBand');
      rows.push({ id: 'band', label, value, unit: '', emphasis: false });
      return rows;
    }

    case 'dilution':
      rows.push({
        id: 'dilution',
        label: t('dose.dilution', {
          start: formatRange(result.startLow, result.startHigh),
          max: formatNumber(result.max),
          note: opts?.dilutionNote ?? result.note,
        }),
        value: '',
        unit: '',
        emphasis: false,
      });
      return rows;
  }
}
