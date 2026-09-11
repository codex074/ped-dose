import type { Drug } from '@/clinical/types';

type MetaSource = Pick<
  Drug,
  | 'route'
  | 'brand'
  | 'concentration_mg_per_ml'
  | 'concentration_mg_per_unit'
  | 'concentration_mcg_per_ml'
  | 'concentration_mcg_per_unit'
  | 'unit'
  | 'package'
>;

/**
 * Byte-for-byte port of upstream `buildMetaParts`: route, then a concentration string (only if
 * the brand text doesn't already spell it out), then the package (same dedupe rule against
 * brand). `drug` should be the LOCALIZED drug so `brand`/`package` dedupe against the same
 * language they're rendered in.
 */
export function buildMetaParts(drug: MetaSource): string[] {
  const parts: string[] = [];
  const brand = drug.brand ?? '';

  if (drug.route) parts.push(drug.route);

  let concStr = '';
  if (drug.concentration_mg_per_ml) concStr = `${drug.concentration_mg_per_ml} mg/mL`;
  else if (drug.concentration_mg_per_unit)
    concStr = `${drug.concentration_mg_per_unit} mg/${drug.unit || '#'}`;
  else if (drug.concentration_mcg_per_ml) concStr = `${drug.concentration_mcg_per_ml} mcg/mL`;
  else if (drug.concentration_mcg_per_unit)
    concStr = `${drug.concentration_mcg_per_unit} mcg/${drug.unit || '#'}`;
  if (
    concStr &&
    !brand.replace(/\s/g, '').toLowerCase().includes(concStr.replace(/\s/g, '').toLowerCase())
  ) {
    parts.push(concStr);
  }

  if (drug.package && !brand.includes(drug.package)) parts.push(drug.package);

  return parts;
}

/** Compact route / concentration / package line. Renders nothing when there's nothing to show. */
export function MetaRow({ drug }: { drug: MetaSource }) {
  const parts = buildMetaParts(drug);
  if (parts.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 break-words text-xs text-ink-muted">
      {parts.map((part, i) => (
        <span key={i}>{part}</span>
      ))}
    </div>
  );
}
