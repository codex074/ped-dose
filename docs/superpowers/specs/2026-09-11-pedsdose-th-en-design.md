# PedsDose TH/EN — Design Spec

Date: 2026-09-11
Status: draft, awaiting owner approval
Inputs: `AGENTS_PedsDose_TH_EN.md` (data / calc / i18n rules), `DESIGN_PedsDose_TH_EN.md` (visual direction), `docs/upstream-analysis/*.md` (verified upstream facts).

## 1. Goal

A static, bilingual (Thai default, English) pediatric dose calculator that is a faithful port of `xyzKIWI/peds-dose` v2.5 (baseline commit `3939f62d84afc06b15387dae4ca384450eb42fb0`) with:

- one canonical clinical dataset (`peds_drugs.json`, byte-identical to upstream);
- a deterministic calculation engine whose numeric output is proven identical to upstream by a mechanically captured golden matrix;
- a translation layer keyed by stable ids;
- a new "cute but professional" pediatric UI per DESIGN.md;
- no backend, no patient data, no runtime AI.

## 2. Authority and conflict resolution

- **AGENTS.md owns** data, calculation, i18n architecture, testing, documentation, and licensing rules.
- **DESIGN.md owns** visual direction (pastel palette, rounded shapes, soft motion, layouts). Where AGENTS.md §12 says "few unnecessary animations" and DESIGN.md asks for playful microinteractions, DESIGN.md wins on visuals, bounded by its own rule that clinical clarity wins and that decoration is minimal in result / warning / contraindication / reference areas.
- **Verified upstream reality overrides examples in either document.** Concretely: 12 calc types (not the 7 in `_meta.schema_notes` or the 4 in AGENTS.md §14); 13 tabs with mixed filter logic; `indications[]` (6 drugs) and `group_id` (~23 drugs) are core rendering paths; contraindication severity is a lossy 3-bucket mapping.

## 3. Stack

React 18 + TypeScript (strict) + Vite + Tailwind CSS v3 + Vitest + React Testing Library. pnpm. ESLint + Prettier. Deployable to GitHub Pages (relative base path). No i18n library; a ~60-line typed `t()` with interpolation is enough and keeps the translation layer transparent.

Fonts: `IBM Plex Sans Thai` for Thai and Latin UI text (DESIGN.md Option B), `Inter` for numerals in result cards (tabular figures). Loaded from Google Fonts with system fallbacks.

## 4. Repository layout

```
/
├── public/data/peds_drugs.json          # canonical, byte-identical to upstream
├── src/
│   ├── clinical/                        # pure, framework-free
│   │   ├── types.ts                     # Drug, Calc*, Indication, Contraindication, DoseResult
│   │   ├── calcDose.ts                  # dispatcher + 12 handlers, ported verbatim
│   │   ├── formatNumber.ts              # num() ported byte-for-byte
│   │   ├── contraindications.ts         # checkContraindication(drug, weight, age), severityBucket
│   │   ├── energy.ts                    # PALS j_per_kg * weight
│   │   └── filters.ts                   # tab filter predicates, ORAL_LIQUIDS_WHITELIST, search
│   ├── data/
│   │   ├── loadDrugs.ts                 # fetch + validate
│   │   └── schema.ts                    # zod schema (validation only; never mutates)
│   ├── i18n/
│   │   ├── index.ts                     # LanguageProvider, useT(), useLang()
│   │   ├── ui.th.json / ui.en.json      # UI strings
│   │   ├── drugs.th.json / drugs.en.json # drug text keyed by drug id
│   │   ├── algorithms.th.json / algorithms.en.json  # PALS + SE free text
│   │   └── clinicalKeys.ts              # 臨床用途 → clinical.use etc.
│   ├── components/                      # see §9
│   ├── hooks/                           # useCalculatorState, useStarred, useLocalStorage
│   ├── App.tsx, main.tsx, index.css
├── scripts/
│   ├── capture-golden.mjs               # extracts upstream JS, runs full matrix
│   ├── validate-data.ts                 # schema + invariants, fails on drug id
│   └── translation-report.ts           # coverage + numeric-preservation checks
├── tests/
│   ├── fixtures/upstream-golden.json    # generated, committed
│   ├── parity.test.ts                   # engine vs golden
│   ├── language-invariance.test.ts      # TH === EN numerics
│   └── translation.test.ts
├── docs/upstream-analysis/, docs/superpowers/specs/
├── AGENTS.md (copied from AGENTS_PedsDose_TH_EN.md), UPSTREAM.md, README.md, LICENSE (upstream MIT + adaptation notice),
│   TRANSLATION.md, CLINICAL_VALIDATION.md, CHANGELOG.md
```

## 5. Canonical data and validation

- `public/data/peds_drugs.json` is copied from upstream and never edited. A test asserts its SHA-256 matches the value recorded in `UPSTREAM.md`.
- `src/data/schema.ts` validates on load: unique ids; every `calc.type` (top-level or per indication) has a handler; numeric fields are numbers; `low <= high` where both exist; concentrations > 0; `doses_per_day > 0`; band arrays non-empty with numeric bounds; contraindication types known. Failure lists drug ids and the app shows the fail-safe message instead of doses. Nothing is auto-repaired.
- `voren_supp` fields `kg_per_supp_low/high` are dose divisors, not thresholds. This is documented in a TS comment; the JSON is not renamed.
- `kmuh_code` stays in the file for provenance but is excluded from search, cards, and detail. `kmuh_detail` is read through a stable-key map (`臨床用途` → `clinical.use`, …) and displayed under the generic heading "ข้อมูลทางคลินิก / Clinical information".
- `_meta.version` drives the version badge; `_meta.last_updated` drives "Data reviewed" in About (the upstream footer's hard-coded 2026-05-10 is not carried).

## 6. Calculation engine

Port `calcDose`, `num`, `checkContraindication`, `severityClass`, and the energy multiply from the verbatim code in `docs/upstream-analysis/calculation-engine.md`. Rules:

- Same dispatch order, same cap order (`max` then `min` in `mg_per_kg_per_dose`), same band matching (`>= low && < high`, first match), same defaults (`doses_per_day || 1`, `|| 3` for packs), same `needs_weight` / `needs_age` precedence.
- `num()` byte-for-byte; never `toLocaleString`; TH and EN produce identical numeral strings.
- The `rule` string keeps interpolating raw `calc.low`/`calc.high`. The Chinese fragments inside rule strings (`顆`, `包`, `起始…最多…`, `無相符區間`, `依體重分組`) become i18n keys, and the engine returns a structured `rule: { kind, params }` so display text is language-specific while numeric fields are not. The golden comparison covers numeric fields and the structured rule, not the Chinese display string.
- `DoseResult` (frozen before UI fan-out):
  ```ts
  type DoseResult =
    | { kind: 'needs_weight' } | { kind: 'needs_age' }
    | { kind: 'dose'; mgRange?: [number, number]; mcgRange?: [number, number]; mlRange?: [number, number];
        unitRange?: [number, number]; packsPerDose?: number; rule: RuleDescriptor }
    | { kind: 'band'; bandText: string; rule: RuleDescriptor }      // bandText is raw upstream free text → translated via drug key
    | { kind: 'rate'; rate: number; rule: RuleDescriptor }
    | { kind: 'special'; template: 'dilution'; start: [number, number]; max: number; note?: string };
  ```
- Contraindication severity: `禁用` → `severe`, `不建議` → `moderate`, else `mild`. The raw severity string is still shown (translated via drug key) so recommendation-style values like `建議改膠囊` survive.
- Age input is a single float in years, `[0, 18]`; weight `(0, 120]`. The UI offers an optional years + months helper that computes `years + months / 12` before the engine sees it; the engine never receives months.
- Do-not-fix list (documented in CLINICAL_VALIDATION.md, replicated exactly): no tablet snapping; PALS energy has no enforced 10 J/kg ceiling; `mgo_tab` gaps at ages [5,6) and [11,12) and `lgg_pack` under 3 years return "no matching band"; `min_dose_mg` applied after `max_dose_mg`; SE view shows all indications for midazolam; `age*12` and `age*52` conversions; `weight_above_kg` uses `>=`.

## 7. Golden capture and parity tests

`scripts/capture-golden.mjs`:

1. Fetches upstream `index.html` at the pinned SHA (or reads a vendored copy under `tests/upstream/`), extracts `num` and `calcDose` by locating `function num(` and `function calcDose(` and slicing to the matching closing brace, and evaluates them in a Node `vm` context. Re-implements `checkContraindication` in the script with explicit `(drug, weight, age)` but identical body.
2. Runs the full matrix: every drug (and each indication) × weights `[null, 0.5, 1, 2, 3, 5, 7.5, 9.99, 10, 10.01, 12.5, 14.99, 15, 18, 20, 20.5, 25, 30, 35, 40, 50, 60, 70, 90, 120]` × ages `[null, 0, 0.1, 0.25, 0.5, 0.99, 1, 2, 2.5, 3, 4, 5, 5.5, 6, 8, 10, 11.5, 12, 15, 18]`. Plus PALS energy for every `energy_doses` entry × weight grid, and every SE stage drug × weight grid.
3. Writes `tests/fixtures/upstream-golden.json` with raw floats, `num()` strings, the rule string, and the matched contraindication (id/type/severity bucket).

`tests/parity.test.ts` loads the fixture and asserts the TS engine matches every entry. `language-invariance.test.ts` renders a representative subset in both languages and asserts identical numeric results and metadata. These must be green before any UI work starts.

## 8. Translation architecture

- **UI strings**: `ui.th.json` / `ui.en.json`, flat dot keys, `{param}` interpolation, identical key sets (test).
- **Drug text**: `drugs.th.json` / `drugs.en.json` keyed by drug id: `brand`, `notes`, `warnings[]`, `frequency`, `source`, `package`, `indications[i].label/notes/onset`, `bands[i].dose/label`, `contraindications[i].severity/reason`, `clinical.{use,contraindications,adverseEffects,warnings,pregnancy,breastfeeding,controlledDrug}`, `urgency_label`, `unit`. Arrays keep upstream length and order (test).
- **Algorithm text**: `algorithms.th.json` / `algorithms.en.json` keyed by `pals.<algorithm_id>.<path>` and `se.stages[<index>].<path>`, mirroring the JSON shape; every free-text leaf in `pals_algorithms` / `se_algorithm` gets a key. A script generates the key skeleton from the JSON so agents cannot invent divergent schemes.
- **Fallback order**: current language → English → canonical original string. Missing keys are counted by the coverage report, never silently blank.
- **Status metadata**: each drug and algorithm entry carries `_meta: { status: 'draft' | 'reviewed' | 'approved', reviewedBy: null }`. All agent output is `draft`.
- **Numeric-preservation check** (`scripts/translation-report.ts`): for every translated string, the multiset of numbers, units (mg, mcg, g, mL, kg, J, min, hr, sec, %), comparison operators (`<`, `>`, `≤`, `≥`, `÷`), route/frequency tokens (PO, IV, IM, PR, IN, Q4H…, BID, TID, QID, PRN, STAT), and severity words must match the source. Any mismatch fails the test with drug id and field. The report prints coverage counts per AGENTS.md §25.
- Category labels, tab labels, form/route/unit display names live in `ui.*.json` under `category.*`, `tabs.*`, `form.*`, `route.*`, `unit.*`.
- Generic drug names stay in English. Thai transliterations are not invented; a `searchAliases.th.json` (reviewed list, initially small) supplies Thai synonyms that resolve to canonical ids.

## 9. UI and components

Layout per DESIGN.md §9: mobile single column; tablet 2 columns; desktop left panel (patient input, search, category chips, drug list) and right panel (selected drug result, warnings, clinical info, reference). Sticky compact header with logo, subtitle, language switch.

Components (calculation stays in `src/clinical`):

- `AppHeader`, `LanguageSwitcher` (segmented ไทย | EN), `PatientInput` (`WeightInput`, `AgeInput` with optional months helper), `PatientSummaryBanner`
- `DrugSearch` (clear button, live filtering, aliases), `CategoryChips` (13 upstream tabs in upstream order, horizontally scrollable, emoji icons from DESIGN.md §14)
- `DrugList`, `DrugCard`, `DrugGroupCard` (group_id), `IndicationBlock`, `StarButton`
- `DoseResultCard` (largest, most prominent; big numerals; range as dual-value layout), `DoseRow`, `RuleLabel`
- `ContraindicationAlert` (severe / moderate / mild with icon + label + text), `WarningPanel`, `InfoNote`
- `ClinicalInfoAccordion` (7 fields), `ReferenceInfo`
- `PALSView` (3 algorithm cards, decision tree, drug doses, energy, CPR checklist, causes), `SEView` (4-stage timeline)
- `Disclaimer` (always visible in footer, full text in About), `AboutDialog` (version, data date, upstream attribution, open-source credits, clinical validation status)
- `EmptyState`, `SkeletonCard`, `ErrorCard`

Behavior parity with upstream: starred group first and gold accent; emergency/RSI amber accent; grouped cards with urgency badges; detail accordion collapsed by default; weight/age feed cards, PALS, and SE simultaneously.

Design tokens in `tailwind.config.ts`: palette from DESIGN.md §4 (primary `#7EC8E3`, mint `#A8E6CF`, peach `#FFD3B6`, lavender `#CDB4DB`, cream `#FFFDF8`, text `#334155`; status green `#34D399`, amber `#FBBF24`, red `#F87171`, info `#60A5FA`), radius scale (lg/xl/2xl/full), soft shadows, motion durations (fast 120ms / normal 200ms / slow 320ms, ease-out). All animation uses transform/opacity and respects `prefers-reduced-motion`. Warnings never rely on color alone. Light theme only for v1; dark mode is out of scope.

## 10. State and persistence

Single `useCalculatorState` (weight, age, search, view, selectedDrugId, expanded details) in React context. Language lives in a separate provider so switching never touches calculator state (test: switch language, assert state and rendered numerics unchanged).

localStorage keys: `pedsdose.lang`, `pedsdose.starred.v1` (seeded from `starred_default` on first run), `pedsdose.last.v1` (weight/age, non-identifying, kept for parity). All reads wrapped in try/catch.

## 11. Deliberate non-parity (recorded in UPSTREAM.md)

| Item | Decision |
|---|---|
| Feedback widget + Google Forms POST | Dropped (author's personal channel, network call) |
| Disclaimer | Rendered in footer and About (upstream never rendered `_meta.disclaimer`) |
| `kmuh_code` | Kept in JSON; removed from search and display |
| Liquid tab whitelist | Kept; moved to `src/clinical/filters.ts` config |
| Hard-coded proofread date | Replaced by `_meta.last_updated` |
| Dark mode | Not in v1 (DESIGN.md forbids dark UI; upstream had OS dark mode) |
| Stray leading space in 抗生素 tab label | Not replicated |
| `monitoring` field | Displayed in clinical info if present (upstream never rendered it) |
| Accessibility | Improved (roles, aria-expanded, focus rings) |

## 12. Documentation deliverables

`README.md` (TH + EN sections: what, run, build, deploy, attribution, disclaimer, validation status), `UPSTREAM.md` (URL, SHA, date, license, imported files, non-parity table), `LICENSE` (upstream MIT notice preserved + adaptation line), `TRANSLATION.md`, `CLINICAL_VALIDATION.md` (status NOT YET APPROVED FOR PRODUCTION USE + AGENTS.md §39 checklist + do-not-fix findings), `CHANGELOG.md`, `AGENTS.md` (copy of the provided guide).

## 13. Testing summary

- Unit: each calc handler, `num()` edge values, contraindication buckets, band boundaries, energy, filters, search.
- Parity: full golden matrix.
- Data: schema, unique ids, known types, JSON SHA-256.
- Translation: identical key sets, array alignment, orphan keys, coverage, numeric preservation.
- Localization: TH === EN numerics; language switch preserves state.
- UI (RTL + jsdom): weight/age entry and validation, search, tab switching, drug select, star, detail expand, TH/EN switch, contraindication display, PALS and SE render with weight.
- Build: `pnpm build` succeeds; bundle has no `eval`, no external endpoints.

## 14. Execution plan shape (for writing-plans)

Sequential spine, then fan-out to Sonnet subagents:

1. Scaffold (Vite/React/TS/Tailwind/Vitest), copy data, docs skeleton, `UPSTREAM.md`.
2. Golden capture script + fixture committed.
3. Engine port (`types.ts`, `calcDose.ts`, `formatNumber.ts`, `contraindications.ts`, `energy.ts`) with parity tests green. Interfaces frozen here.
4. i18n framework + UI strings (TH/EN) + language switch + state provider.
5. Fan-out (parallel, each prompt names the frozen interfaces):
   - UI components per DESIGN.md (2–3 agents by area: input/search/list; result/warnings/clinical; PALS/SE/about)
   - Drug-text translation TH (drugs split into ~3 id ranges) and EN (same split), draft status, numeric-preservation test must pass
   - Algorithm text translation (PALS + SE)
   - Docs (README, TRANSLATION, CLINICAL_VALIDATION, CHANGELOG)
6. Integration, full test run, responsive check at 360/768/1024/1440, build, deploy config.
