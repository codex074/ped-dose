# Upstream calculation engine — analysis for TypeScript port

Source: `xyzKIWI/peds-dose` @ `3939f62d84afc06b15387dae4ca384450eb42fb0` (v2.5), `index.html` (1651 lines) + `peds_drugs.json`.
The embedded `DRUG_DATA` JSON literal in `index.html` (line 721) is structurally identical to the standalone `peds_drugs.json`.

Verified by hand on 2026-09-11: weight range `(0,120]`, age range `[0,18]`, `num()` at line 760, tab list lines 696–708, `.disclaimer` CSS never used, `mgo_tab`/`lgg_pack` band gaps.

## 1. Script location & data loading

Two `<script>` blocks: main app **lines 717–1594**; unrelated feedback widget **lines 1626–1649**. **No fetch** — `DRUG_DATA` is a literal JS object on line 721 (a single 76,764-char line). Global state: `STORAGE_KEY='peds_dose_starred_v1'`, `STORAGE_LAST='peds_dose_last_v1'`, `state = {weight, age, search, view, starred:Set}`.

## 2. Patient input

- **Weight**: `<input type=number min=0 max=100 step=0.1>` (HTML max is decorative). JS handler (line 1540): `parseFloat`, valid range **`(0,120]`** — `0` itself invalid, `>120` invalid, decimals unrestricted. Invalid/blank → `state.weight=null`. Validation message `體重 0-120 kg`.
- **Age**: single field, **years as float**, range **`[0,18]`** (0 valid; line 1548). No months field; where months/weeks needed, code does `age*12` / `age*52`. Validation message `年齡 0-18 歲`.
- Blank weight/age → calc functions return `{needs_weight:true}` / `{needs_age:true}`, rendered as "輸入體重/年齡後計算" placeholders, never 0 or an error.
- Last values persisted to `localStorage` (`peds_dose_last_v1`) and restored on load (falsy values, including `0`, are treated as absent).

## 3. Calculation dispatcher — verbatim `calcDose(drug, calc, weight, age)`

12 `calc.type` branches, dispatched by `if (t === '...')` chain, fallback returns `{type:'special', text: JSON.stringify(calc)}` (never hit by real data):

```js
if (t === 'mg_per_kg_per_dose') {
  if (weight == null) return { needs_weight: true };
  let lowMg = calc.low * weight, highMg = calc.high * weight;
  if (calc.max_dose_mg) { lowMg = Math.min(lowMg, calc.max_dose_mg); highMg = Math.min(highMg, calc.max_dose_mg); }
  if (calc.min_dose_mg) { lowMg = Math.max(lowMg, calc.min_dose_mg); highMg = Math.max(highMg, calc.min_dose_mg); }
  const result = { type:'dose', mgRange:[lowMg,highMg], rule:`${calc.low}${calc.high!==calc.low?'-'+calc.high:''} mg/kg/dose` };
  if (calc.min_dose_mg) result.rule += ` (min ${calc.min_dose_mg} mg)`;
  if (calc.max_dose_mg) result.rule += ` (max ${calc.max_dose_mg} mg/dose)`;
  if (drug.concentration_mg_per_ml) result.mlRange = [lowMg/drug.concentration_mg_per_ml, highMg/drug.concentration_mg_per_ml];
  if (drug.concentration_mg_per_unit) result.unitRange = [lowMg/drug.concentration_mg_per_unit, highMg/drug.concentration_mg_per_unit];
  return result;
}
if (t === 'mg_per_kg_per_day') {
  if (weight == null) return { needs_weight: true };
  const dosesDay = calc.doses_per_day || 1;
  let lowMgDay = calc.low*weight, highMgDay = calc.high*weight;
  if (calc.max_mg_per_day) { lowMgDay = Math.min(lowMgDay, calc.max_mg_per_day); highMgDay = Math.min(highMgDay, calc.max_mg_per_day); }
  const lowMg = lowMgDay/dosesDay, highMg = highMgDay/dosesDay;
  const result = { type:'dose', mgRange:[lowMg,highMg], rule:`${calc.low}${calc.high!==calc.low?'-'+calc.high:''} mg/kg/day ÷ ${dosesDay}` };
  if (drug.concentration_mg_per_ml) result.mlRange = [lowMg/drug.concentration_mg_per_ml, highMg/drug.concentration_mg_per_ml];
  if (drug.concentration_mg_per_unit) result.unitRange = [lowMg/drug.concentration_mg_per_unit, highMg/drug.concentration_mg_per_unit];
  return result;
}
if (t === 'mcg_per_kg_per_dose') {
  if (weight == null) return { needs_weight: true };
  let lowMcg = calc.low*weight, highMcg = calc.high*weight;
  if (calc.max_dose_mcg) { lowMcg = Math.min(lowMcg, calc.max_dose_mcg); highMcg = Math.min(highMcg, calc.max_dose_mcg); }
  const result = { type:'dose', mcgRange:[lowMcg,highMcg], rule:`${calc.low}${calc.high!==calc.low?'-'+calc.high:''} mcg/kg/dose` };
  if (drug.concentration_mcg_per_ml) result.mlRange = [lowMcg/drug.concentration_mcg_per_ml, highMcg/drug.concentration_mcg_per_ml];
  else if (drug.concentration_mg_per_ml) result.mlRange = [lowMcg/(drug.concentration_mg_per_ml*1000), highMcg/(drug.concentration_mg_per_ml*1000)];
  return result;
}
if (t === 'ml_per_kg_per_dose') {
  if (weight == null) return { needs_weight: true };
  let lowMl = calc.low*weight, highMl = calc.high*weight;
  if (calc.max_ml_per_dose) { lowMl = Math.min(lowMl, calc.max_ml_per_dose); highMl = Math.min(highMl, calc.max_ml_per_dose); }
  return { type:'dose', mlRange:[lowMl,highMl], rule:`${calc.low}${calc.high!==calc.low?'-'+calc.high:''} mL/kg/dose` };
}
if (t === 'ml_per_kg_per_day') {
  if (weight == null) return { needs_weight: true };
  const dosesDay = calc.doses_per_day || 1;
  const lowMlDay = calc.low*weight, highMlDay = calc.high*weight;
  return { type:'dose', mlRange:[lowMlDay/dosesDay, highMlDay/dosesDay], rule:`${calc.low}${calc.high!==calc.low?'-'+calc.high:''} mL/kg/day ÷ ${dosesDay}` };
}
if (t === 'supp_by_weight') {
  if (weight == null) return { needs_weight: true };
  return { type:'dose', unitRange:[weight/calc.kg_per_supp_low, weight/calc.kg_per_supp_high], rule:`BW÷${calc.kg_per_supp_low} ~ BW÷${calc.kg_per_supp_high} 顆` };
}
if (t === 'pack_per_10kg_per_day') {
  if (weight == null) return { needs_weight: true };
  const dosesDay = calc.doses_per_day || 3;
  const totalPacks = (weight/10) * (calc.packs_per_10kg_per_day || 1);
  return { type:'dose', packsPerDose: totalPacks/dosesDay, rule:`${calc.packs_per_10kg_per_day} 包/10kg/day ÷ ${dosesDay}` };
}
if (t === 'pack_per_30kg_per_dose') {
  if (weight == null) return { needs_weight: true };
  return { type:'dose', packsPerDose: weight/30, rule: 'BW÷30 包/dose TID' };
}
if (t === 'weight_band') {
  if (weight == null) return { needs_weight: true };
  const band = calc.bands.find(b => weight >= b.weight_low && weight < b.weight_high);
  return { type:'band', bandText: band ? band.dose : '無相符區間', rule:'依體重分組' };
}
if (t === 'age_band') {
  if (age == null) return { needs_age: true };
  const band = calc.bands.find(b => age >= b.age_low && age < b.age_high);
  if (!band) return { type:'band', bandText:'無相符區間', rule:'依年齡分組' };
  if (band.mg_per_kg_per_dose !== undefined) {
    if (weight == null) return { needs_weight: true };
    const high = band.mg_per_kg_per_dose_high ?? band.mg_per_kg_per_dose;
    let lowMg = band.mg_per_kg_per_dose*weight, highMg = high*weight;
    if (band.max_mg_per_dose) { lowMg = Math.min(lowMg, band.max_mg_per_dose); highMg = Math.min(highMg, band.max_mg_per_dose); }
    const ruleLabel = band.label || `${band.mg_per_kg_per_dose}${high!==band.mg_per_kg_per_dose?'-'+high:''} mg/kg/dose`;
    const result = { type:'dose', mgRange:[lowMg,highMg], rule: ruleLabel };
    if (drug.concentration_mg_per_ml) result.mlRange = [lowMg/drug.concentration_mg_per_ml, highMg/drug.concentration_mg_per_ml];
    return result;
  }
  if (band.mg_per_dose !== undefined) {
    const mg = band.mg_per_dose;
    const ruleLabel = band.label || `${mg} mg/dose`;
    const result = { type:'dose', mgRange:[mg,mg], rule: ruleLabel };
    if (drug.concentration_mg_per_ml) result.mlRange = [mg/drug.concentration_mg_per_ml, mg/drug.concentration_mg_per_ml];
    return result;
  }
  return { type:'band', bandText: band.dose || '無資料', rule: band.label || '依年齡分組' };
}
if (t === 'fluid_421_rule') {
  if (weight == null) return { needs_weight: true };
  let rate = 0;
  if (weight <= 10) rate = weight*4;
  else if (weight <= 20) rate = 40 + (weight-10)*2;
  else rate = 60 + (weight-20);
  return { type:'rate', rate, rule:'4-2-1 rule', display:`${num(rate)} mL/hr` };
}
if (t === 'ml_by_weight_after_dilution') {
  if (weight == null) return { needs_weight: true };
  return { type:'special', text:`起始 ${num(weight/4)}-${num(weight/3)} mL，最多 ${num(weight)} mL（${calc.note||''}）` };
}
```

### Per-type summary

| type | doses_per_day | Cap fields (value-level, order matters) | mL conv | unit conv | count |
|---|---|---|---|---|---|
| `mg_per_kg_per_dose` | n/a | `max_dose_mg` (min) THEN `min_dose_mg` (max) — **min applied after max, can override** | `concentration_mg_per_ml` | `concentration_mg_per_unit` | 23 |
| `mg_per_kg_per_day` | default 1, divides AFTER cap | `max_mg_per_day` on daily total only | yes | yes | 11 |
| `mcg_per_kg_per_dose` | n/a | `max_dose_mcg` | `concentration_mcg_per_ml` else `mg_per_ml*1000` | none | 1 |
| `ml_per_kg_per_dose` | n/a | `max_ml_per_dose` | n/a | n/a | 3 |
| `ml_per_kg_per_day` | default 1 | **none supported** | n/a | n/a | 5 |
| `supp_by_weight` | n/a | none | n/a | direct | 1 |
| `pack_per_10kg_per_day` | default **3** | none | n/a | packs | 1 |
| `pack_per_30kg_per_dose` | n/a | none | n/a | packs | 1 |
| `weight_band` | n/a | free text | n/a | n/a | 5 |
| `age_band` | n/a | sub-branch max only | sub-branch only | **not implemented even when possible** | 6 |
| `fluid_421_rule` | n/a | inclusive `<=` at 10 and 20 | n/a | n/a | 3 |
| `ml_by_weight_after_dilution` | n/a | n/a | n/a | n/a | 1 |

**Caps mutate the value itself** (used downstream for mL/unit conversion), not just display. No "capped" flag/message exists — the only trace is `mg_per_kg_per_dose` appending `(max X mg/dose)`/`(min X mg)` text to `rule`.

**Band boundaries**: `find(b => x >= low && x < high)` — inclusive-low/exclusive-high, first match wins. **Bands are NOT gap-free**: `mgo_tab` has gaps at age [5,6) and [11,12) → `無相符區間`; `lgg_pack` starts at `age_low:3` (ages 0–3 unmatched). Free-text band values (e.g. `"BW÷20 # TID-QID"`) are displayed verbatim, **never parsed/evaluated**.

`_meta.schema_notes` documents type names `tab_per_kg_per_day`, `fixed_age_band`, `dilution` that **do not exist in the code** — stale, ignore.

6 drugs have no top-level `calc` and use `indications[].calc` instead (`prednisolone_tab`, `methylpred_inj`, `succinylcholine`, `midazolam_dormicum`, `ketamine`, `adenosine`); each indication runs through the same `calcDose`.

## 4. Rounding/formatting — `num()` (line 760), used for everything

```js
function num(x, decimals = 2) {          // decimals param is dead code
  if (x === null || x === undefined || isNaN(x)) return '—';
  if (x === 0) return '0';
  if (x >= 100) return Math.round(x).toString();
  if (x >= 10) return x.toFixed(1).replace(/\.0$/, '');
  if (x >= 1) return x.toFixed(2).replace(/\.?0+$/, '');
  return x.toFixed(2).replace(/\.?0+$/, '');
}
```

- **No tablet-specific rounding** (no snap to half/quarter) — can display `"0.73 顆"`.
- Ranges shown only if `lo !== hi` (strict, on raw floats) — post-cap collapse to a single value is common.
- The `rule` text (e.g. `"10-15 mg/kg/dose"`) interpolates **raw `calc.low`/`calc.high` via template literal, NOT through `num()`** — a separate formatting path. Port both.

## 5. Contraindications/warnings

```js
function checkContraindication(drug) {
  if (!drug.contraindications) return null;
  for (const c of drug.contraindications) {
    if (c.type === 'age_below_months' && state.age != null && state.age * 12 < c.threshold_months) return c;
    if (c.type === 'age_below_years' && state.age != null && state.age < c.threshold_years) return c;
    if (c.type === 'age_below_weeks' && state.age != null && state.age * 52 < c.threshold_weeks) return c;
    if (c.type === 'weight_above_kg' && state.weight != null && state.weight >= c.threshold_kg) return c;
    if (c.type === 'weight_below_kg' && state.weight != null && state.weight < c.threshold_kg) return c;
  }
  return null;
}
function severityClass(sev) {
  if (sev === '禁用') return 'severe';
  if (sev === '不建議') return 'moderate';
  return 'mild';   // catches 慎用, 建議改膠囊, 建議改錠劑, etc.
}
```

First match wins. Icon: `禁用`→🚫, `不建議`→⚠️, else→ℹ️. The lossy 3-bucket mapping must be replicated exactly.

## 6. Drug-specific hardcoded special cases

**None.** The only id-specific code is a display-only whitelist for the "💧水劑" tab (`ORAL_LIQUIDS_WHITELIST`, 6 ids: `antiphen_syrup`, `idefen_syrup`, `cypromin_syrup`, `cetirizine_syrup`, `zithromax_susp`, `curam_susp`).

## 7. PALS — fully data-driven

All PALS drug doses are ordinary `mg_per_kg_per_dose` entries referenced by id from `pals_algorithms[].drugs[]`, run through the same `calcDose`. Only PALS-specific arithmetic is energy dosing in `renderEnergy`: `num(e.j_per_kg * state.weight)` (and `high_j_per_kg` for ranges) — **no enforced ceiling** even though a note mentions "max 10 J/kg" (text only).

## 8. Status Epilepticus — fully data-driven

`renderSEView()` walks `se_algorithm.time_stages[]`; each stage's `drugs[]` renders through the same `calcDose`/`miniDoseLine`. Note: `renderDrugMini` shows ALL indications for multi-indication drugs (midazolam), not just the SE one. Drugs: midazolam (indications), lorazepam_inj, diazepam_iv, diazepam_pr, phenobarbital_iv, phenytoin_iv, depakine_iv, keppra_iv.

## 9. localStorage

`peds_dose_starred_v1` (starred ids array, seeded from `tags:["starred_default"]` on first load), `peds_dose_last_v1` ({weight,age}), and unrelated `pd_feedback`.

## 10. Network calls — must NOT be ported

One `fetch` in the feedback-widget script (lines 1626–1649) posting to a Google Forms endpoint (`FB_FORM`, `entry.248204705`). Never transmits weight/age/dose. Excluded from the port.

## 11. Version display

`document.getElementById('appver').textContent = 'v' + (DRUG_DATA._meta.version || '?')`.

## 12. Golden fixture strategy (decided)

Do not hand-pick fixtures. Extract `num` and `calcDose` mechanically from `index.html` by line range, purify `checkContraindication` to `(drug, weight, age)`, and run the full matrix: every drug and every indication × weight grid × age grid, plus PALS `j_per_kg * weight` and every SE stage drug. Store raw floats and `num()` strings. Representative hand-picked cases (useful as named unit tests on top of the matrix):

1. `antiphen_syrup` @10kg/2y — plain range + mL
2. `antiphen_syrup` @90kg/8y — both ends hit `max_dose_mg`
3. `acetaminophen_tab` @25kg/6y — tablet unit conversion, no snapping
4. `voren_supp` @20kg/4y — `supp_by_weight`
5. `atropine_brady` @2kg/0.5y — `min_dose_mg` overrides
6. `atropine_brady` @40kg/10y — `max_dose_mg` clamps
7. `fentanyl_inj` @15kg/3y — `mcg_per_kg_per_dose`
8. `adenosine` indications @70kg/16y — caps
9. `amoxicillin_susp` @40kg/5y — `mg_per_kg_per_day` cap collapses range
10. `cypromin_syrup` @8kg/1y — `ml_per_kg_per_day`
11. `actein_granule` @25kg/6y — `pack_per_10kg_per_day`
12. `smecta` @18kg/3y — `pack_per_30kg_per_dose`
13. `tamiflu` @15kg and @14.99kg — weight_band boundary
14. `mgo_tab` @5.5y and @11.5y — age_band gaps
15. `lgg_pack` @1y — below first band
16. `cetirizine_syrup` @2y/@4y/@10y — age_band sub-branches
17. `taita1` @10kg / @20.5kg — `fluid_421_rule` tiers
18. `citosol` @12kg — `ml_by_weight_after_dilution`
19. `idefen_syrup` @0.3y — contraindication `禁用`→severe
20. needs_weight / needs_age paths
21. `num()` at 1, 0.999999, 9.999, 10, 99.999, 100, 100.5

## 13. Extraction recipe

`num(x)` and `calcDose(drug, calc, weight, age)` are pure (no DOM/global deps). `checkContraindication`/`severityClass` read `state` — purify by passing `(drug, weight, age)`. No jsdom needed for numeric parity.
