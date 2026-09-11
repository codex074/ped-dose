import { useT } from '@/i18n';

/**
 * Caution-styled list of translated drug warnings. Never rendered for an empty list — callers
 * should only mount this when `warnings.length > 0`, but it also guards defensively.
 */
export function WarningPanel({ warnings }: { warnings: string[] }) {
  const t = useT();
  if (warnings.length === 0) return null;

  return (
    <div
      className="rounded-2xl border border-status-caution bg-status-cautionSoft p-3"
      data-testid="warning-panel"
    >
      <p className="text-sm font-semibold text-status-cautionText">{t('warnings.title')}</p>
      <ul className="mt-1 space-y-1 text-sm text-status-cautionText">
        {warnings.map((warning, i) => (
          <li key={i} className="thai-safe flex items-start gap-2">
            <span aria-hidden="true">⚠️</span>
            <span>{warning}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
