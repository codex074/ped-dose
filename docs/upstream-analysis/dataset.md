# Dataset Analysis: `peds_drugs.json` (xyzKIWI/peds-dose upstream)

File: `upstream/peds_drugs.json`, 99,934 bytes, single JSON object (UTF-8, Chinese/Traditional + English mixed).

## 1. Top-level structure

Top-level dict with 5 keys:

| Key               | Type              | Count / size                     |
| ----------------- | ----------------- | -------------------------------- |
| `_meta`           | object            | 4 fields + nested `schema_notes` |
| `categories`      | array of objects  | 17                               |
| `drugs`           | array of objects  | **67**                           |
| `pals_algorithms` | array of objects  | 3                                |
| `se_algorithm`    | object (singular) | 1                                |

`_meta`:

```json
{
  "version": "2.5",
  "last_updated": "2026-05-09",
  "scope": "Pediatric ED — common drugs for 院內",
  "primary_source": "Lexicomp / Nelson / UpToDate, cross-referenced with 高醫速算表 (初版) and 小兒常用藥丹",
  "disclaimer": "個人速算工具。僅供臨床醫師快速參考，最終劑量以主治醫師臨床判斷為準。藥碼以高醫 HIS 為準，請於開藥前再次核對。",
  "schema_notes": {
    "calc.type": "mg_per_kg_per_dose | mg_per_kg_per_day | ml_per_kg_per_dose | ml_per_kg_per_day | tab_per_kg_per_day | fixed_age_band | dilution",
    "indications": "陣列，支援同藥多適應症（如 ketamine IM induction vs IV sedation vs IV analgesia）"
  }
}
```

**Note:** `schema_notes.calc.type` is **stale/incomplete** — the enumerated types (`tab_per_kg_per_day`, `fixed_age_band`, `dilution`) do not literally match any `calc.type` actually used in the data (see §3); the real type strings are different (`age_band`, `weight_band`, `fluid_421_rule`, `supp_by_weight`, `pack_per_10kg_per_day`, `pack_per_30kg_per_dose`, `mcg_per_kg_per_dose`, `ml_by_weight_after_dilution`). Documentation drift — do not rely on `_meta` to enumerate calc types for the port.

## 2. Field inventory of a drug record (across all 67 records)

| Field                        | n (of 67)                    | Type(s)    | Example values                                                                                    |
| ---------------------------- | ---------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `id`                         | 67                           | str        | `"antiphen_syrup"`, `"amoxicillin_susp"`, `"epinephrine_arrest"`                                  |
| `generic`                    | 67                           | str        | `"Acetaminophen"`, `"Amoxicillin"`, `"Epinephrine — Cardiac Arrest"`                              |
| `brand`                      | 67                           | str        | `"Amoxicillin susp 25 mg/mL · 安默西林"`, `"Bosmin / Adrenalin（arrest 用 1:10000 = 0.1 mg/mL）"` |
| `kmuh_code`                  | 67 (64 str, 3 `null`)        | str/null   | `"1AMKIN"`, `"3BO500"`, `null`                                                                    |
| `category`                   | 67                           | str        | `"antibiotic"`, `"seizure"`, `"pals_arrest"`                                                      |
| `form`                       | 67                           | str        | `"susp"`, `"amp"`, `"tab"`                                                                        |
| `route`                      | 67                           | str        | `"PO"`, `"IV/IO"`, `"IM/IV"`                                                                      |
| `source`                     | 67                           | str        | `"高醫速算表"`, `"Lexicomp + 高醫速算表"`, `"AHA/AAP 2025 PALS"`                                  |
| `kmuh_detail`                | 67                           | dict       | see §7                                                                                            |
| `calc`                       | 61 (6 missing)               | dict       | see §3                                                                                            |
| `tags`                       | 60 (7 missing/empty-omitted) | list[str]  | `["common","uri"]`, `["emergency","pals","starred_default"]`                                      |
| `frequency`                  | 56                           | str        | `"Q12H PC"`, `"Q6H PRN"`, `"ST × 1 dose"`                                                         |
| `notes`                      | 45                           | str        | free-text Chinese/mixed clinical notes                                                            |
| `package`                    | 36                           | str        | `"60 mL/bot"`, `"原液 1 mg/mL/Amp"`                                                               |
| `concentration_mg_per_ml`    | 34 (29 int, 5 float)         | number     | `25`, `0.1`, `2.5`                                                                                |
| `group_id`                   | 33                           | str        | `"amoxicillin"`, `"levetiracetam"` (links brand-variant records)                                  |
| `unit`                       | 22                           | str        | `"粒"`, `"tab"`, `"Vial"`, `"包"`, `"blister"`, `"Amp"`                                           |
| `warnings`                   | 22                           | list[str]  | `["<1 歲禁用"]`, `["呼吸抑制","管制藥"]`                                                          |
| `concentration_mg_per_unit`  | 21 (19 int, 2 float)         | number     | `600`, `12.5`, `250`                                                                              |
| `contraindications`          | 14                           | list[dict] | see §8                                                                                            |
| `concentration_note`         | 9                            | str        | `"1500 mg / 60 mL = 25 mg/mL"`                                                                    |
| `indications`                | 6                            | list[dict] | see §3 (multi-indication drugs)                                                                   |
| `urgency`                    | 6                            | str        | `"maintenance"`, `"acute"`                                                                        |
| `urgency_label`              | 6                            | str        | `"💊 口服維持"`, `"🚨 急性 loading"`                                                              |
| `concentration_mcg_per_ml`   | 2                            | int        | (fentanyl-type)                                                                                   |
| `concentration_mcg_per_unit` | 1                            | int        |                                                                                                   |
| `duration_note`              | 1                            | str        |                                                                                                   |
| `max_per_day_note`           | 1                            | str        | `"Max 2.1 g/day"` (mgo_tab)                                                                       |
| `monitoring`                 | 1                            | str        |                                                                                                   |

No record has every field — only `id, generic, brand, kmuh_code(nullable), category, form, route, source, kmuh_detail` are effectively universal (kmuh_code has 3 nulls). `calc` is missing on 6 records (see §3/§10) because dosing lives in `indications[].calc` instead.

## 3. `calc` object — types and sub-fields

Distinct `calc.type` values (top-level, n=61 records with a top-level `calc`):

| type                          | count |
| ----------------------------- | ----- |
| `mg_per_kg_per_dose`          | 23    |
| `mg_per_kg_per_day`           | 11    |
| `age_band`                    | 6     |
| `ml_per_kg_per_day`           | 5     |
| `weight_band`                 | 5     |
| `ml_per_kg_per_dose`          | 3     |
| `fluid_421_rule`              | 3     |
| `supp_by_weight`              | 1     |
| `pack_per_10kg_per_day`       | 1     |
| `pack_per_30kg_per_dose`      | 1     |
| `mcg_per_kg_per_dose`         | 1     |
| `ml_by_weight_after_dilution` | 1     |

Additionally, 15 nested `indications[].calc` entries (across the 6 top-level-`calc`-less drugs plus a few multi-indication drugs) are **all** `mg_per_kg_per_dose`.

### 3.1 `mg_per_kg_per_dose` (n=23, + 15 nested = 38 total)

Sub-fields seen: `type, low, high, max_dose_mg, max_doses_per_day, max_mg_per_day, max_ml_per_day, doses_per_day, doses_per_day_freq, max_total_mg, min_dose_mg, note`.

Full example (`antiphen_syrup`):

```json
{
  "type": "mg_per_kg_per_dose",
  "low": 10,
  "high": 15,
  "max_dose_mg": 1000,
  "max_doses_per_day": 5,
  "max_mg_per_day": 4000
}
```

Rare-field examples:

- `idefen_syrup`: `{"max_mg_per_day": 1200, "max_ml_per_day": 60}`
- `morphine_inj`: `{"doses_per_day_freq": "Q4H"}`
- `chloral_hydrate`: `{"max_total_mg": 2000, "note": "可在 30 min 後再給 25-50 mg/kg；總量 max 100 mg/kg/procedure 或 2000 mg/procedure"}`
- `atropine_brady`: `{"min_dose_mg": 0.1}`

### 3.2 `mg_per_kg_per_day` (n=11)

Sub-fields: `type, low, high, doses_per_day, max_mg_per_day, calc_basis` (calc_basis n=2).
Example (`cypromin_tab`):

```json
{ "type": "mg_per_kg_per_day", "low": 0.24, "high": 0.24, "doses_per_day": 3, "max_mg_per_day": 16 }
```

Example (`amoxicillin_susp`, real full record):

```json
{ "type": "mg_per_kg_per_day", "low": 80, "high": 90, "doses_per_day": 2, "max_mg_per_day": 3000 }
```

### 3.3 `ml_per_kg_per_day` (n=5)

Sub-fields: `type, low, high, doses_per_day`.
Example (`peace_syrup`): `{"type": "ml_per_kg_per_day", "low": 0.6, "high": 0.6, "doses_per_day": 3}`

### 3.4 `ml_per_kg_per_dose` (n=3)

Sub-fields: `type, low, high, max_ml_per_dose (n=2), doses_per_day (n=1)`.
Example (`epinephrine_inh_croup`): `{"type": "ml_per_kg_per_dose", "low": 0.5, "high": 0.5, "max_ml_per_dose": 5}`

### 3.5 `age_band` (n=6) and `weight_band` (n=5) — band structure

Both share shape `{"type": <str>, "bands": [ {...}, ... ]}`. Band objects use `age_low`/`age_high` (years, `age_high` capped at sentinel `999` for "no upper bound") or `weight_low`/`weight_high` (kg, same `999` sentinel). Each band then EITHER:

- carries **structured numeric dosing** (`mg_per_kg_per_dose` and/or `mg_per_dose`, plus optional `max_mg_per_dose`, plus a human `label` string), e.g. `cetirizine_syrup`'s youngest band, or
- carries **only a free-text `dose` string** embedding numbers, units, comparators and Chinese dosing-frequency abbreviations (no structured numeric fields at all).

Full example, mixed style (`cetirizine_syrup`, `age_band`):

```json
{
  "type": "age_band",
  "bands": [
    {
      "age_low": 0,
      "age_high": 3,
      "mg_per_kg_per_dose": 0.25,
      "max_mg_per_dose": 5,
      "label": "<3y · 0.25 mg/kg QD-BID（依醫師指示）"
    },
    { "age_low": 3, "age_high": 6, "mg_per_dose": 5, "label": "3-6y · 5 mg QD（或 2.5 mg BID）" },
    { "age_low": 6, "age_high": 999, "mg_per_dose": 10, "label": "≥6y / 成人 · 10 mg QD" }
  ]
}
```

Full example, free-text-only style (`tamiflu`, `weight_band`):

```json
{
  "type": "weight_band",
  "bands": [
    { "weight_low": 0, "weight_high": 15, "dose": "30 mg BID × 5 days" },
    { "weight_low": 15, "weight_high": 23, "dose": "45 mg BID × 5 days" },
    { "weight_low": 23, "weight_high": 40, "dose": "60 mg BID × 5 days" },
    { "weight_low": 40, "weight_high": 999, "dose": "75 mg BID × 5 days" }
  ]
}
```

**All 11 age/weight-band drugs and every one of their bands, verbatim** (fewer than 60 distinct strings, so listing exhaustively):

- `cetirizine_syrup` (age_band): `<3y · 0.25 mg/kg QD-BID（依醫師指示）` / `3-6y · 5 mg QD（或 2.5 mg BID）` / `≥6y / 成人 · 10 mg QD` — structured, has `label` only as display text.
- `acc_effervescent` (age_band, `dose` free text): `不建議 (<6 歲改用 Actein granule)` / `0.5 # BID PC` / `1 # BID-TID PC`
- `tamiflu` (weight_band, `dose` free text): `30 mg BID × 5 days` / `45 mg BID × 5 days` / `60 mg BID × 5 days` / `75 mg BID × 5 days`
- `xofluza_tab` (weight_band, `dose` free text): `≥1 歲 + <20 kg：2 mg/kg PO single dose` / `40 mg (2 #) PO single dose` / `80 mg (4 #) PO single dose`
- `relenza_inh` (age_band, `dose` free text): `<7 歲不建議` / `10 mg (2 blisters) BID × 5 days`
- `terbutaline_neb` (weight_band, `dose` free text): `0.5 amp/dose` / `1 amp/dose`
- `ipratropium_neb` (weight_band, `dose` free text): `0.5 amp/dose` / `1 amp/dose`
- `meptin_tab` (weight_band, `dose` free text): `0.5 # BID` / `1 # BID` / `1-2 # BID`
- `kascoal_tab` (age_band, `dose` free text): `0.5 # QID` / `1 # QID` / `1-3 # QID`
- `lgg_pack` (age_band, `dose` free text): `0.3-0.5 包 TID` / `0.5-1 包 TID` / `成人劑量`
- `mgo_tab` (age_band, `dose` free text): `BW÷20 # TID-QID` / `0.5-1 # TID-QID` / `1-2 # TID-QID` / `2 # TID-QID` — **note age-band gap, see §10**

Free-text `dose`/`label` strings mix: numbers, mg/mL/kg units, `#` (= tablet/capsule count — a Taiwan clinical shorthand), Chinese dosing-frequency letters embedded in Chinese sentences (QD/BID/TID/QID, PC = after meal), comparators (`<`, `≥`, `÷`), and Chinese unit words (`包`=pack/sachet, `顆`/`粒`=piece/tablet, `歲`=years old, `月`=months). This is exactly the "0.5 # BID PC"-style free text the task asked about.

### 3.6 Other special types (each n=1, except `fluid_421_rule` n=3)

- `fluid_421_rule` (n=3, e.g. `taita1`): `{"type": "fluid_421_rule"}` or with `formula` sub-field — this is the classic Holliday-Segar 4-2-1 maintenance-fluid rule; two of the three instances carry no numeric params at all (rule is applied procedurally in app code, not data-driven) and one adds a `formula` string.
- `supp_by_weight` (`voren_supp`): `{"type": "supp_by_weight", "kg_per_supp_low": 25, "kg_per_supp_high": 12.5, "max_doses_per_day": 2}` — **field names are divisors, not weight thresholds** (see §10 for why `low > high` here is intentional, not a bug).
- `pack_per_10kg_per_day` (`actein_granule`): `{"type": "pack_per_10kg_per_day", "packs_per_10kg_per_day": 1, "doses_per_day": 3}`
- `pack_per_30kg_per_dose` (`smecta`): `{"type": "pack_per_30kg_per_dose", "doses_per_day": 3, "formula": "BW÷30 包/dose TID"}`
- `mcg_per_kg_per_dose` (`fentanyl_inj`): `{"type": "mcg_per_kg_per_dose", "low": 0.5, "high": 1, "max_dose_mcg": 50, "note": "可上至 4 mcg/kg 但需密切監測"}`
- `ml_by_weight_after_dilution` (`citosol`): `{"type": "ml_by_weight_after_dilution", "starting_ml": "BW÷4 ~ BW÷3 mL", "max_ml": "BW mL", "note": "0.5 amp 稀釋至 20 mL 後"}` — note `starting_ml`/`max_ml` are **strings containing formulas**, not numbers.

### 3.7 Drugs with NO top-level `calc` (dosing lives in `indications[]` instead)

`prednisolone_tab`, `methylpred_inj`, `succinylcholine`, `midazolam_dormicum`, `ketamine`, `adenosine` — all 6 have multi-indication dosing (see §9 `indications` schema) and every nested `calc` is `mg_per_kg_per_dose`.

## 4. Categories / tags / group_id

`categories` (17, all used by exactly the drugs' `category` field — perfect 1:1 coverage, no orphans either direction):

| id                   | label (zh)                      | order |
| -------------------- | ------------------------------- | ----- |
| antipyretic          | 退燒/止痛                       | 1     |
| rhinitis             | 流鼻水/過敏                     | 2     |
| cough_cold           | 止咳/感冒                       | 3     |
| expectorant          | 化痰                            | 4     |
| antibiotic           | 抗生素                          | 5     |
| flu                  | 流感                            | 6     |
| croup_bronchodilator | Croup / 支氣管擴張              | 7     |
| steroid              | 類固醇                          | 8     |
| antiemetic           | 止吐                            | 9     |
| gi_other             | 腸胃道（脹氣/便秘/止瀉/益生菌） | 10    |
| fluid                | 點滴/輸液                       | 11    |
| analgesic_inj        | 止痛針劑                        | 12    |
| sedation             | 鎮靜/麻醉誘導                   | 13    |
| seizure              | 抽搐/癲癇                       | 14    |
| allergy_eps          | 過敏/EPS                        | 15    |
| muscle_relaxant      | 肌肉鬆弛                        | 16    |
| pals_arrest          | PALS 心臟停止/心律不整          | 17    |

`category` usage counts: seizure 11, antibiotic 6, croup_bronchodilator 5, gi_other 5, pals_arrest 5, antipyretic 4, rhinitis 4, flu 4, antiemetic 4, sedation 4, expectorant 3, fluid 3, cough_cold 2, steroid 2, analgesic_inj 2, allergy_eps 2, muscle_relaxant 1.

`tags` (free list, distinct values and counts — **note this is a flat, ungrouped tag vocabulary, not the same set implied by the task's example list of "uri, age, sedation, seizure, antibiotic, antipyretic, liquid, status_epilepticus, pals, resuscitation"**; only some of those actually occur):

| tag                 | count |
| ------------------- | ----- |
| uri                 | 26    |
| common              | 12    |
| age                 | 11    |
| emergency           | 10    |
| starred_default     | 9     |
| pals                | 5     |
| fever               | 4     |
| flu                 | 4     |
| seizure_second_line | 2     |
| seizure             | 2     |
| se_protocol         | 2     |
| allergy             | 2     |
| seizure_first_line  | 1     |
| rsi                 | 1     |
| sedation            | 1     |

No `antibiotic`, `antipyretic`, `liquid`, `status_epilepticus`, or `resuscitation` tag literal exists — those concepts are covered instead by `category` (`antibiotic`, `antipyretic`), by `se_protocol`/`seizure_*` tags, and by the `pals_algorithms`/`se_algorithm` top-level arrays, not by a `tags` value. Tab/filter logic in a port should not assume the task's example tag list is literal.

`group_id` (33 records carry one; links brand/dosage-form variants of the same drug): `metoclopramide`(3), `taita`(3), `levetiracetam`(3), `valproate`(3), `acetaminophen`(2), `cyproheptadine`(2), `nac`(2), `azithromycin`(2), `amoxicillin`(2), `amox_clav_curam`(2), `procaterol`(2), `diazepam`(2), `diphenhydramine`(2), `cetirizine`(1), `phenobarbital`(1), `phenytoin`(1).

`urgency` / `urgency_label` (only 6 records, all inside the multi-indication drug set or steroid group): `maintenance`→`💊 口服維持` (4), `acute`→`🚨 急性 loading` (2).

## 5. Route, form, unit — all distinct values

**route** (13 distinct): PO 34, IV 12, IV/IO 5, IV/IM 4, PR 3, IH (nebulizer) 2, IH (Diskhaler) 1, IH 1, IM/IV 1, IM 1, IV/IM/SC 1, IV/IM/IN/PO 1, PO/PR 1.

**form** (18 distinct): amp 14, tab 13, syrup 12, vial 7, susp 3, inhalation_amp 3, iv_solution 3, pack 2, supp 1, granule 1, tab_eff 1, cap 1, cap/susp 1, iv_bag 1, inhaler_dpi 1, enema 1, rectal_tube 1, solution 1.

**unit** (7 distinct, only present on 22 records — mostly PO solid-dosage-form drugs where `concentration_mg_per_unit` exists): 粒 13, tab 2, Vial 2, supp 1, 包 1, blister 1, Amp 1, vial 1. Mixed Chinese (粒/包) and English (tab/Vial/blister/Amp) tokens for the same underlying concept ("count of units") — inconsistent casing too (`Vial` vs `vial`, `Amp` vs elsewhere `amp` as a `form` value).

## 6. Concentration fields

4 possible concentration fields: `concentration_mg_per_ml` (34), `concentration_mg_per_unit` (21), `concentration_mcg_per_ml` (2), `concentration_mcg_per_unit` (1).

- Records with **both** `mg_per_ml` and `mg_per_unit`: `keppra_iv`, `depakine_iv` (IV solutions available both as ready concentration and as a per-vial/amp total — need both to compute either syringe volume or total drug amount).
- Records with **neither** of any of the 4 concentration fields (11): `peace_syrup`, `secorine_syrup`, `glyo_syrup`, `tamiflu`, `lgg_pack`, `glycerin_supp`, `smecta`, `taita1`, `taita2`, `taita5`, `citosol`. These are mostly weight/age-band or free-text-dose or fluid-formula drugs where concentration isn't the limiting calc input (compound syrups, oral rehydration/electrolyte fluids, packet-based probiotics/adsorbents).
- All 58 populated concentration values are **positive numeric** (int or float) — no zero, null, or non-numeric concentration values were found in any of the 4 fields.

## 7. Textual fields needing TH/EN translation

| Field                                      | Shape                                                        | Language mix                                                                                                             |
| ------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `brand`                                    | string                                                       | mixed 43, en 23, zh 1                                                                                                    |
| `notes`                                    | string                                                       | mixed 40, zh 5                                                                                                           |
| `frequency`                                | string (dosing-frequency shorthand, e.g. Q12H, BID, PRN, ST) | en 43, mixed 13 (English/Latin abbreviations dominate; arguably coded shorthand, not translation content)                |
| `source`                                   | string (citation)                                            | mixed 27, zh 24, en 16 — citation strings, generally should NOT be translated, just displayed as-is or given an EN gloss |
| `warnings`                                 | array[string]                                                | zh 17, mixed 17, en 4                                                                                                    |
| `kmuh_detail`                              | object, 7 fixed Chinese sub-keys (see below)                 | all-Chinese string values                                                                                                |
| `contraindications[].reason`               | string inside object                                         | Chinese, numeric-embedded                                                                                                |
| `indications[].label/notes/duration/onset` | strings                                                      | mixed                                                                                                                    |

`kmuh_detail` is present on **all 67** records with exactly the same 7 Chinese-language sub-keys every time (no variation in key names, no optional keys observed):

| Sub-key (zh) | Meaning                                                                               | Type | n   | Example                                                           |
| ------------ | ------------------------------------------------------------------------------------- | ---- | --- | ----------------------------------------------------------------- |
| `臨床用途`   | clinical use / indication                                                             | str  | 67  | `"發燒、輕度疼痛"`                                                |
| `禁忌`       | contraindications (free text, distinct from the structured `contraindications` array) | str  | 67  | `"嚴重肝功能不全、過敏"`                                          |
| `副作用`     | adverse effects                                                                       | str  | 67  | `"肝毒性（過量）、罕見過敏皮疹"`                                  |
| `警語`       | warnings/black-box-style notes                                                        | str  | 67  | `"Max 75 mg/kg/day；間隔 ≥4 hr；..."`                             |
| `懷孕分級`   | pregnancy category                                                                    | str  | 67  | `"AU TGA: A"`, `"AU TGA: C（第 3 trimester D）"`, sometimes `"—"` |
| `授乳`       | breastfeeding compatibility                                                           | str  | 67  | `"相容"`, `"短期可"`, `"資料不足"`                                |
| `管制性藥品` | controlled-substance status                                                           | str  | 67  | `"—"` (almost always em-dash = N/A), occasionally `"管制藥"`      |

This is the primary "clinical detail" sub-object the task asked about — its 7 sub-key names are fixed and exhaustive: `臨床用途, 禁忌, 副作用, 警語, 懷孕分級, 授乳, 管制性藥品`. There is no English mirror of these anywhere in the file — a bilingual port needs to translate values for all 67×7 = 469 strings (many are short, some — `警語`/`副作用` — embed numbers/units, see §9).

## 8. `contraindications` field structure

Present on 14 records, always a **list of objects** (never a bare string or single object). Distinct shapes, keyed by `type`:

| `type`             | count | threshold field          | extra fields         |
| ------------------ | ----- | ------------------------ | -------------------- |
| `age_below_months` | 10    | `threshold_months` (int) | `severity`, `reason` |
| `weight_above_kg`  | 2     | `threshold_kg` (int)     | `severity`, `reason` |
| `age_below_weeks`  | 1     | `threshold_weeks` (int)  | `severity`, `reason` |
| `age_below_years`  | 1     | `threshold_years` (int)  | `severity`, `reason` |

`severity` distinct values (Chinese free text, small but not a clean enum): `不建議`(6), `禁用`(3), `慎用`(3), `建議改膠囊`(1), `建議改錠劑`(1). Note `建議改膠囊`/`建議改錠劑` are themselves recommendation text ("suggest switching to capsule/tablet"), not a graded severity like the other three — inconsistent semantics for the `severity` field.

Every entry: `{"type": ..., "threshold_<unit>": <int>, "severity": <str>, "reason": <str>}` — structurally uniform, no missing sub-fields observed. `reason` is free Chinese text, often with embedded English drug-class terms (NSAID, EPS, etc.) — see §9.

## 9. Numeric-embedded text (safety-critical for translation)

Fields where numbers/units/comparators are embedded inside Chinese (or mixed) prose — translating these naively risks corrupting dose-relevant numbers:

- `kmuh_detail.警語` (67/67 present, many contain numbers) — e.g. `"Max 75 mg/kg/day；間隔 ≥4 hr；勿與其他含 acetaminophen 製品併用"`, `"通常 ≥30 kg 才開錠劑；max 4 g/day（兒童 75 mg/kg/day）"`, `"<6 月禁用；脫水/腎前性低灌流期間慎用；max 40 mg/kg/day"`.
- `notes` (45 records) — e.g. `voren_supp`: `"速算: BW÷25 ~ BW÷12.5 顆；Max 2 顆/日；嬰幼兒退燒備用"` — contains a literal formula.
- `contraindications[].reason` — e.g. `"< 6 月禁用（複方甘草成分）"`.
- `calc.bands[].dose` / `.label` free text (age_band/weight_band, §3.5) — the dosing numbers ARE the payload here, e.g. `"BW÷20 # TID-QID"`, `"0.5-1 # TID-QID"`.
- `calc.*.note` / `.formula` string sub-fields (`chloral_hydrate.note`, `smecta.formula`, `citosol.starting_ml/max_ml/note`) — formulas embedded as text, e.g. `"BW÷4 ~ BW÷3 mL"`, `"0.5 amp 稀釋至 20 mL 後"`.
- `max_per_day_note` (mgo_tab): `"Max 2.1 g/day"`.
- `warnings[]` array entries, e.g. `"氣喘 / COPD 慎用 — 誘發支氣管痙攣風險"`.
- `pals_algorithms[].decision_tree` / `.steps_initial` / `.high_quality_cpr` / `.reversible_causes` / `se_algorithm.time_stages[].actions` — extensively embed doses, e.g. `"IM Midazolam（無 IV 時首選）：13–40 kg → 5 mg；>40 kg → 10 mg（single dose）"`.

**Recommendation for the translation layer**: any of these fields should be treated as "structured-with-embedded-numerics" — a translation pass must never regex-replace numbers/units, and ideally the port should progressively extract more of these into structured fields (as already partially done for `age_band`/`weight_band`) rather than perpetuating free-text-with-embedded-dose strings, since that free text is exactly what's hardest to safely localize.

## 10. Data-quality observations

- **No duplicate `id` values** across the 67 drugs (verified).
- **6 drugs have no top-level `calc`** (`prednisolone_tab`, `methylpred_inj`, `succinylcholine`, `midazolam_dormicum`, `ketamine`, `adenosine`) — not a bug per se, dosing is nested under `indications[].calc` for these multi-indication drugs, but any schema/validator that assumes `calc` is required will break on these 6 ids.
- **`voren_supp` `supp_by_weight`: `kg_per_supp_low` (25) > `kg_per_supp_high` (12.5).** This looks like an ordering violation but is **not a data bug** — confirmed via its own `notes` field (`"速算: BW÷25 ~ BW÷12.5 顆"`): the field names actually store **divisors** for the low/high dose bound (dose = BW ÷ divisor), so a smaller divisor yields a _larger_ dose — i.e. `low`/`high` here refer to the resulting dose ordering, not to the raw magnitude of the two numeric fields. **Flag for schema design**: this naming is confusing and should be renamed or restructured in the port (e.g. `divisor_low_dose`/`divisor_high_dose`) to avoid a future engineer "fixing" it into an actual bug.
- **`mgo_tab` `age_band` has an uncovered age gap**: bands are `[0,2)`, `[2,5)`, `[6,11)`, `[12,999)` — ages **5 to 6** (`age_high:5` then next `age_low:6`) fall into no band. This is a genuine data gap in the upstream source, id: `mgo_tab`.
- No other `low > high` violations found anywhere else (checked all top-level `calc.low/high` and all `indications[].calc.low/high` pairs — all clean).
- No unknown/unparseable `calc.type` strings — all 12 top-level types and the 1 nested type are internally consistent, but as noted in §1 they don't match the stale `_meta.schema_notes` enumeration.
- No zero/null/non-numeric concentration values in any of the 4 concentration fields (checked all 58 populated instances).
- 3 records have `kmuh_code: null`: `peace_syrup`, `soltan_syrup`, `lgg_pack` — plausibly non-formulary / not-yet-coded items; a bilingual port that surfaces "hospital order code" UI must handle the null case.
- `unit` field casing/vocabulary is inconsistent (`Vial` vs `vial`, `Amp` vs elsewhere `amp` as a `form` value, mixing Chinese 粒/包 with English tab/blister) — worth normalizing in the port's schema rather than porting the inconsistency.
- `contraindications[].severity` is not a clean small enum in the strict sense — 3 of the 5 values are severity grades (`禁用`/`不建議`/`慎用`) while 2 are actually recommendation actions (`建議改膠囊`/`建議改錠劑`) — semantically different from the other 3, worth splitting into a `severity` + `recommended_action` pair in the port schema.
- All required-ish common fields (`id, generic, brand, category, form, route, source, kmuh_detail`) are present and non-empty on all 67 records — no missing-required-field violations found for that baseline set.
- `source` string values are inconsistent in ordering/formatting for the same underlying sources — e.g. `"Lexicomp + 高醫速算表"` vs `"高醫速算表 + Lexicomp"` appear as separate distinct strings (5 vs 7 occurrences) for what is presumably the same combination of sources used at different edit times — a free-text field, not a structured multi-value list, so any "filter by source" UI would need to parse/split it.

## 11. PALS / status-epilepticus / resuscitation data — location and structure

All of this content **is present directly inside `peds_drugs.json`** as two dedicated top-level keys — it is **not** in a separate file and (based on this file alone) does not appear to be hard-coded elsewhere in app code; a port should treat this file as the single source for these algorithms too.

### `pals_algorithms` (array, 3 entries)

Each entry: `id, title, subtitle, icon, steps_initial, decision_tree, drugs, figure_url, figure_label`, plus algorithm-specific extras:

| id               | extra fields                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| `cardiac_arrest` | `energy_doses`, `high_quality_cpr`, `reversible_causes` (`{title, h:[...], t:[...]}` — 6H+5T mnemonic) |
| `tachy_pulse`    | `differentiation` (`{title, sinus_tach:{...}, svt:{...}}`), `energy_doses`, `refractory_note`          |
| `brady_pulse`    | `possible_causes` (list)                                                                               |

`decision_tree` is a recursive free-form structure — sometimes `{question, yes:{...}, no:{...}}` with each branch either `actions:[...]` or `branches:[{qrs, label, action}]` depending on the algorithm; not a single fixed schema across the 3 entries — a port's decision-tree renderer needs to handle at least these two shapes.

`drugs` in each pals_algorithm is a list of `id` strings referencing records in the `drugs` array (e.g. `cardiac_arrest.drugs = ["epinephrine_arrest","amiodarone_arrest","lidocaine_arrest"]`) — this is the cross-reference mechanism linking algorithm to dosing data; `pals_arrest` category drugs (5 total) are exactly the ones referenced.

`energy_doses[]` entries: `{label, j_per_kg, high_j_per_kg?, note?}` — J/kg defibrillation/cardioversion energies, numeric.

External reference: each algorithm carries a `figure_url` pointing to the original AHA figure image (ahajournals.org) plus a Chinese `figure_label` ("查看原始 AHA Figure N →") link caption — these will need EN/TH label translation but the URL itself is fixed.

### `se_algorithm` (single object, not an array)

Fields: `id ("convulsive_se"), title, subtitle, icon, time_stages, decision_label, citation, figure_url, figure_label`.

`time_stages` is a list of phases, each: `{minutes: "0–5", phase, level?, subtitle?, actions:[...], drugs?:[...]}`. `drugs` cross-references dosing records exactly as in `pals_algorithms` (e.g. stage `"5–20"` references `["midazolam_dormicum","lorazepam_inj","diazepam_iv","diazepam_pr","phenobarbital_iv"]`). 4 stages total (`0–5`, `5–20`, `20–40`, `40–60`), following the AES 2016 Status Epilepticus algorithm; `actions[]` strings embed weight-based dosing (see §9 for an example).

`citation`: full academic citation string (Glauser et al., Epilepsy Currents 2016) — should not be translated, only possibly given an EN/TH label wrapper.

## 12. Institution-specific fields

- `kmuh_code` (67 records, 3 null): a short alphanumeric hospital order-entry code specific to Kaohsiung Medical University Hospital (KMUH)'s HIS system, e.g. `"1AMKIN"`, `"3BO500"`, `"3VOREN"`, `"1MGO"`. Prefix digit (1/2/3/…) likely denotes a KMUH internal formulary category (oral vs injectable vs other) but this isn't documented in the file itself. The `_meta.disclaimer` explicitly says "藥碼以高醫 HIS 為準" (order codes follow KMUH's HIS system) — i.e. these codes are **only meaningful at KMUH** and are not a general drug identifier; a Thai-hospital port should treat `kmuh_code` as optional/institution-specific metadata, not something to translate or to rely on as a primary key (the file already uses a separate synthetic `id` for that).
- `kmuh_detail` (all 67 records): despite the KMUH-prefixed name, this is **not actually institution-specific data** — it's the generic 7-field clinical detail object described in §7 (use/contraindication/adverse-effect/warning/pregnancy/breastfeeding/controlled-substance-status), apparently named after where the content was originally compiled (高醫藥品庫 = KMUH drug database) rather than because its content is KMUH-specific. This is the field a bilingual port will most want to keep (renamed to something institution-neutral, e.g. `clinical_detail`) while dropping or isolating the genuinely KMUH-specific `kmuh_code`.
- No other clearly institution-specific fields were found (e.g. no ward/formulary-restriction flags, no KMUH-specific pricing/stock fields).
