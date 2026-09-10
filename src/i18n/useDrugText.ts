import { useCallback } from 'react';
import type { Calc, Contraindication, Drug, Indication } from '@/clinical/types';
import { CLINICAL_KEY_MAP, type ClinicalKey } from './clinicalKeys';
import { drugsEn, drugsTh } from './drugs';
import type { DrugTranslation } from './drugs/types';
import { useLang } from './index';
import { localizeStringArray, resolveScalar, validArr } from './localizeUtils';
import type { Lang } from './types';

export type { ClinicalKey };

export interface LocalizedDrug extends Drug {
  clinical: Record<ClinicalKey, string>;
}

function localizeContraindications(
  lang: Lang,
  canonical: Contraindication[] | undefined,
  th: DrugTranslation['contraindications'],
  en: DrugTranslation['contraindications'],
): Contraindication[] | undefined {
  if (!canonical) return canonical;
  const vTh = validArr(th, canonical.length);
  const vEn = validArr(en, canonical.length);
  return canonical.map((c, i) => ({
    ...c,
    severity: resolveScalar(lang, c.severity, vTh?.[i]?.severity, vEn?.[i]?.severity),
    reason: resolveScalar(lang, c.reason, vTh?.[i]?.reason, vEn?.[i]?.reason),
  }));
}

function localizeIndications(
  lang: Lang,
  canonical: Indication[] | undefined,
  th: DrugTranslation['indications'],
  en: DrugTranslation['indications'],
): Indication[] | undefined {
  if (!canonical) return canonical;
  const vTh = validArr(th, canonical.length);
  const vEn = validArr(en, canonical.length);
  return canonical.map((ind, i) => ({
    ...ind,
    label: resolveScalar(lang, ind.label, vTh?.[i]?.label, vEn?.[i]?.label),
    notes: resolveScalar(lang, ind.notes, vTh?.[i]?.notes, vEn?.[i]?.notes),
    frequency: resolveScalar(lang, ind.frequency, vTh?.[i]?.frequency, vEn?.[i]?.frequency),
    onset: resolveScalar(lang, ind.onset, vTh?.[i]?.onset, vEn?.[i]?.onset),
    duration: resolveScalar(lang, ind.duration, vTh?.[i]?.duration, vEn?.[i]?.duration),
    route: resolveScalar(lang, ind.route, vTh?.[i]?.route, vEn?.[i]?.route),
  }));
}

function localizeCalc(
  lang: Lang,
  canonical: Calc | undefined,
  th: DrugTranslation['bands'],
  en: DrugTranslation['bands'],
): Calc | undefined {
  if (!canonical) return canonical;
  if (!canonical.bands) return { ...canonical };
  const vTh = validArr(th, canonical.bands.length);
  const vEn = validArr(en, canonical.bands.length);
  const bands = canonical.bands.map((band, i) => {
    const b = band as { dose?: string; label?: string };
    const dose = resolveScalar(lang, b.dose, vTh?.[i]?.dose, vEn?.[i]?.dose);
    const label = resolveScalar(lang, b.label, vTh?.[i]?.label, vEn?.[i]?.label);
    return {
      ...band,
      ...(dose !== undefined ? { dose } : {}),
      ...(label !== undefined ? { label } : {}),
    };
  });
  return { ...canonical, bands };
}

function localizeClinical(
  lang: Lang,
  kmuhDetail: Drug['kmuh_detail'],
  th: DrugTranslation['clinical'],
  en: DrugTranslation['clinical'],
): Record<ClinicalKey, string> {
  const result = {} as Record<ClinicalKey, string>;
  for (const [zhKey, canonicalText] of Object.entries(kmuhDetail)) {
    const key = CLINICAL_KEY_MAP[zhKey] as ClinicalKey | undefined;
    if (!key) continue;
    result[key] = resolveScalar(lang, canonicalText, th?.[key], en?.[key]);
  }
  return result;
}

/** Pure localization: does not mutate `drug`; returns new nested objects/arrays throughout. */
export function localizeDrug(
  drug: Drug,
  lang: Lang,
  th: Record<string, DrugTranslation>,
  en: Record<string, DrugTranslation>,
): LocalizedDrug {
  const t = th[drug.id];
  const e = en[drug.id];

  return {
    ...drug,
    brand: resolveScalar(lang, drug.brand, t?.brand, e?.brand),
    notes: resolveScalar(lang, drug.notes, t?.notes, e?.notes),
    frequency: resolveScalar(lang, drug.frequency, t?.frequency, e?.frequency),
    source: resolveScalar(lang, drug.source, t?.source, e?.source),
    package: resolveScalar(lang, drug.package, t?.package, e?.package),
    unit: resolveScalar(lang, drug.unit, t?.unit, e?.unit),
    urgency_label: resolveScalar(lang, drug.urgency_label, t?.urgency_label, e?.urgency_label),
    concentration_note: resolveScalar(
      lang,
      drug.concentration_note,
      t?.concentration_note,
      e?.concentration_note,
    ),
    duration_note: resolveScalar(lang, drug.duration_note, t?.duration_note, e?.duration_note),
    max_per_day_note: resolveScalar(
      lang,
      drug.max_per_day_note,
      t?.max_per_day_note,
      e?.max_per_day_note,
    ),
    monitoring: resolveScalar(lang, drug.monitoring, t?.monitoring, e?.monitoring),
    warnings: localizeStringArray(lang, drug.warnings, t?.warnings, e?.warnings),
    contraindications: localizeContraindications(
      lang,
      drug.contraindications,
      t?.contraindications,
      e?.contraindications,
    ),
    indications: localizeIndications(lang, drug.indications, t?.indications, e?.indications),
    calc: localizeCalc(lang, drug.calc, t?.bands, e?.bands),
    clinical: localizeClinical(lang, drug.kmuh_detail, t?.clinical, e?.clinical),
  };
}

/** Returns a stable localizer bound to the current language. */
export function useDrugText(): (drug: Drug) => LocalizedDrug {
  const { lang } = useLang();
  return useCallback((drug: Drug) => localizeDrug(drug, lang, drugsTh, drugsEn), [lang]);
}
