import type { DoseRow } from '@/i18n/formatDose';

/**
 * Renders one `DoseRow` produced by `doseRows()`. Purely presentational — no hooks, no i18n
 * lookups of its own; all text arrives already translated on the row.
 */
export function DoseRowView({ row }: { row: DoseRow }) {
  if (row.value === '') {
    // needs_weight / needs_age / dilution rows carry their full sentence in `label`.
    return (
      <p className="thai-safe text-sm text-ink-muted" data-testid={`dose-row-${row.id}`}>
        {row.label}
      </p>
    );
  }

  const valueClass = row.emphasis
    ? 'font-num tabular-nums text-3xl font-bold text-ink md:text-4xl'
    : 'font-num tabular-nums text-2xl font-semibold text-ink';

  return (
    <div data-testid={`dose-row-${row.id}`}>
      <p className="thai-safe text-xs uppercase tracking-wide text-ink-muted">{row.label}</p>
      <p className={valueClass}>
        {row.value}
        {row.unit && <span className="ml-1 text-base font-normal text-ink-muted">{row.unit}</span>}
      </p>
      {row.sub && <p className="thai-safe text-xs text-ink-muted">{row.sub}</p>}
    </div>
  );
}
