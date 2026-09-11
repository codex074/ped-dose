import { MiniDoseLine } from '@/components/MiniDoseLine';
import type { RuleDescriptor } from '@/clinical/types';
import { useT } from '@/i18n';
import { formatRule } from '@/i18n/formatRule';
import { useDrugText } from '@/i18n/useDrugText';
import { useDataset } from '@/state/DatasetProvider';

/**
 * One drug's dose summary inside a PALS/SE section, mirroring upstream `renderDrugMini()`.
 * Multi-indication drugs (e.g. adenosine, midazolam) render one row per indication with the
 * translated indication label — upstream shows ALL indications, not just a route-matched one.
 * Below the row(s), when the drug's top-level `calc.max_dose_mg` exists, the upstream rule note
 * (mg/kg range, max/min suffixes, frequency) is rendered — never omitted.
 */
export function DrugMiniRow({ drugId }: { drugId: string }) {
  const dataset = useDataset();
  const localizeDrug = useDrugText();
  const t = useT();

  const canonical =
    dataset.status === 'ready' ? dataset.data.drugs.find((d) => d.id === drugId) : undefined;
  if (!canonical) return null;

  const drug = localizeDrug(canonical);
  const generic = (drug.generic.split('—')[0] ?? drug.generic).trim();

  let ruleNote: string | null = null;
  if (drug.calc?.max_dose_mg !== undefined) {
    const rule: RuleDescriptor = {
      kind: 'mg_per_kg_per_dose',
      low: drug.calc.low ?? 0,
      high: drug.calc.high ?? 0,
      ...(drug.calc.min_dose_mg !== undefined ? { minMg: drug.calc.min_dose_mg } : {}),
      maxMg: drug.calc.max_dose_mg,
    };
    ruleNote = formatRule(rule, t);
    if (drug.frequency) ruleNote += `; ${drug.frequency}`;
  }

  return (
    <div className="mb-1.5 last:mb-0" data-testid={`drug-mini-${drugId}`}>
      {drug.indications && drug.indications.length > 0 ? (
        <div className="space-y-1.5">
          {drug.indications.map((ind, i) => (
            <div key={i}>
              <div className="thai-safe break-words text-[11px] font-semibold text-sky-deep">
                {ind.label}
              </div>
              <div className="flex items-center justify-between gap-2 rounded-xl bg-sky-soft/40 px-2.5 py-1.5">
                <div className="min-w-0">
                  <div className="thai-safe break-words text-sm font-medium text-ink">
                    {generic}
                  </div>
                  <div className="text-[11px] text-ink-muted">{ind.route || drug.route}</div>
                </div>
                <MiniDoseLine drug={drug} calc={ind.calc} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        drug.calc && (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-sky-soft/40 px-2.5 py-1.5">
            <div className="min-w-0">
              <div className="thai-safe break-words text-sm font-medium text-ink">{generic}</div>
              <div className="text-[11px] text-ink-muted">{drug.route}</div>
            </div>
            <MiniDoseLine drug={drug} calc={drug.calc} />
          </div>
        )
      )}
      {ruleNote && (
        <div className="thai-safe break-words px-1 pt-0.5 text-xs text-ink-muted">{ruleNote}</div>
      )}
    </div>
  );
}
