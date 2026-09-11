import type { DecisionNode, DecisionTree } from '@/clinical/types';
import { useT } from '@/i18n';

function DecisionBranch({
  node,
  badge,
  badgeClass,
}: {
  node: DecisionNode;
  badge: string;
  badgeClass: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white/70 p-3">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass}`}
        >
          {badge}
        </span>
        <span className="thai-safe break-words text-sm font-semibold text-ink">{node.label}</span>
      </div>
      {node.actions && node.actions.length > 0 && (
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink">
          {node.actions.map((a, i) => (
            <li key={i} className="thai-safe break-words">
              {a}
            </li>
          ))}
        </ol>
      )}
      {node.branches && node.branches.length > 0 && (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {node.branches.map((b, i) => (
            <div key={i} className="rounded-xl bg-sky-soft/60 p-2.5">
              <span className="inline-block rounded-full bg-sky-deep px-2 py-0.5 text-[11px] font-semibold text-white">
                {b.qrs}
              </span>
              <div className="thai-safe break-words mt-1 text-sm font-semibold text-ink">
                {b.label}
              </div>
              <div className="thai-safe break-words text-sm text-ink-muted">{b.action}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Renders a `DecisionTree`: question box, then YES/NO columns (QRS cards or numbered actions). */
export function DecisionTreeView({ tree }: { tree: DecisionTree }) {
  const t = useT();
  return (
    <div className="space-y-3">
      <div className="thai-safe break-words rounded-2xl bg-lavender-soft px-3 py-2 text-sm font-semibold text-ink">
        ❓ {tree.question}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <DecisionBranch node={tree.yes} badge={t('pals.yes')} badgeClass="bg-mint text-ink" />
        <DecisionBranch node={tree.no} badge={t('pals.no')} badgeClass="bg-blush text-ink" />
      </div>
    </div>
  );
}
