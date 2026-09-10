# AGENTS.md — PedsDose TH/EN

> Agent implementation guide for creating a Thai/English adaptation of `xyzKIWI/peds-dose`.
>
> Working project name: **PedsDose TH/EN**
>
> Source repository: https://github.com/xyzKIWI/peds-dose
>
> Primary goal: keep the original clinical dataset and calculation behavior as the single source of truth, while providing a clean bilingual Thai/English interface.

---

## 1. Project Mission

Build a bilingual pediatric medication dose calculator based on the public open-source project `xyzKIWI/peds-dose`.

The new application must:

- support **Thai (`th`)** and **English (`en`)**;
- use **one canonical clinical dataset** for both languages;
- preserve the original calculation rules and numeric values;
- translate only human-readable content;
- keep calculation output identical regardless of selected language;
- be fast, responsive, simple to use, and suitable for desktop, tablet, and mobile;
- remain deployable as a static web application;
- preserve the original project's license and attribution;
- make it clear that the tool is clinical decision support and does not replace professional judgment.

This first version is primarily a **localization and usability adaptation**, not a redesign of the medical content.

---

## 2. Core Principle: One Clinical Source of Truth

This is the most important requirement.

**DO NOT create separate Thai and English drug databases.**

The application must have:

```text
ONE canonical clinical dataset
        |
        +---- Thai translation layer
        |
        +---- English translation layer
```

Changing the language must never change:

- drug dose;
- concentration;
- calculation type;
- low/high dose values;
- maximum dose;
- maximum daily dose;
- doses per day;
- route code;
- age threshold;
- weight threshold;
- contraindication threshold;
- clinical calculation result;
- rounding behavior;
- number of tablets;
- calculated mL;
- calculated mg.

Thai and English are presentation layers only.

### Required invariant

For identical patient input and drug selection:

```text
Result(th) === Result(en)
```

except for display text.

Example:

```text
Weight: 18 kg
Age: 5 years
Drug: X
```

If Thai mode calculates:

```text
180 mg/dose
3.6 mL/dose
```

English mode MUST calculate:

```text
180 mg/dose
3.6 mL/dose
```

The language switch must never invoke a different clinical rule.

---

## 3. Source Repository

Start from:

```text
https://github.com/xyzKIWI/peds-dose
```

Before making changes, inspect at minimum:

```text
README.md
LICENSE
index.html
peds_drugs.json
rewrite_clinical_summary.py
```

At the time this project plan was prepared, the upstream repository contains a single-page pediatric dose calculator in `index.html` and its medication data in `peds_drugs.json`.

Do not assume the upstream repository will remain unchanged forever.

Before implementation:

1. record the upstream repository URL;
2. record the upstream commit SHA used as the baseline;
3. preserve the upstream license;
4. keep a note of which files were imported or adapted.

Recommended file:

```text
UPSTREAM.md
```

Example:

```md
# Upstream

Project: xyzKIWI/peds-dose
Repository: https://github.com/xyzKIWI/peds-dose
Baseline commit: <commit SHA>
Imported date: <YYYY-MM-DD>
License: MIT
```

---

## 4. Licensing and Attribution

The upstream repository includes an MIT license.

Agents MUST:

- keep the upstream copyright/license notice;
- retain the original `LICENSE` unless there is a deliberate legal reason to change it;
- add attribution in README;
- add an "Open-source credits" section in the application About page;
- never imply that this adaptation is the official application of the original author.

Suggested wording:

```text
Based on the open-source peds-dose project by xyzKIWI.
Modified for Thai/English bilingual use.
```

### Clinical-content warning

The upstream README states that dose references include sources such as Lexicomp, Nelson, UpToDate, AHA/AAP, AES, and institutional materials.

Do not claim that the translated dataset has been independently clinically validated merely because the source code is open source.

Before real clinical deployment, translated content and dose rules must be reviewed by qualified healthcare professionals and the organization responsible for deployment.

---

## 5. Scope of Version 1

Version 1 should prioritize **functional parity + bilingual localization**.

### Include

- weight input;
- age input;
- original medication categories/scenarios;
- drug search;
- original calculation modes;
- mg calculation;
- mL calculation;
- tablet/unit calculation where supported;
- dose frequency;
- maximum dose logic already present upstream;
- warnings;
- contraindication messages;
- notes;
- clinical detail sections;
- PALS functionality present upstream;
- status epilepticus functionality present upstream;
- responsive layout;
- TH/EN language switch;
- persisted language preference;
- original data references;
- disclaimer;
- basic automated tests.

### Do not add in Version 1 unless required for parity

- patient names;
- HN;
- AN;
- personal health record storage;
- user accounts;
- Supabase;
- Firebase;
- remote database;
- analytics containing patient information;
- dose history tied to identifiable patients;
- hospital HIS integration;
- AI-generated dose recommendations;
- automatic dose modification;
- renal adjustment not already supported upstream;
- hepatic adjustment not already supported upstream;
- neonatal advanced dosing not already supported upstream.

Keep Version 1 stateless whenever possible.

---

## 6. Preferred Architecture

A static web application is preferred.

Recommended stack for a maintainable rewrite:

```text
React
TypeScript
Vite
CSS / Tailwind CSS
local JSON data
Vitest
```

However, **clinical parity is more important than framework migration**.

If converting the original single-file implementation into React introduces calculation differences, preserve the original calculation functions first and refactor incrementally.

Recommended structure:

```text
/
├── public/
│   └── data/
│       └── peds_drugs.json
│
├── src/
│   ├── components/
│   │   ├── PatientInput/
│   │   ├── DrugSearch/
│   │   ├── CategoryTabs/
│   │   ├── DrugCard/
│   │   ├── DoseResult/
│   │   ├── WarningPanel/
│   │   ├── PALS/
│   │   ├── StatusEpilepticus/
│   │   └── LanguageSwitcher/
│   │
│   ├── clinical/
│   │   ├── calculateDose.ts
│   │   ├── formatDose.ts
│   │   ├── contraindications.ts
│   │   └── types.ts
│   │
│   ├── data/
│   │   ├── loadDrugs.ts
│   │   └── schema.ts
│   │
│   ├── i18n/
│   │   ├── index.ts
│   │   ├── ui.th.json
│   │   ├── ui.en.json
│   │   ├── drugs.th.json
│   │   └── drugs.en.json
│   │
│   ├── pages/
│   ├── tests/
│   └── App.tsx
│
├── AGENTS.md
├── UPSTREAM.md
├── README.md
├── LICENSE
└── package.json
```

The exact structure may be adjusted when justified, but the separation between:

```text
clinical data
clinical calculation
translation
presentation
```

must remain clear.

---

## 7. Canonical Clinical Dataset

The upstream `peds_drugs.json` is the clinical source dataset for this adaptation.

Prefer keeping a recognizable canonical copy:

```text
public/data/peds_drugs.json
```

Do not translate the canonical file by replacing Chinese strings in-place unless absolutely necessary.

The canonical dataset may contain fields such as:

```text
id
generic
brand
concentration_mg_per_ml
concentration_mg_per_unit
unit
kmuh_code
category
form
route
calc
frequency
notes
source
warnings
tags
contraindications
group_id
kmuh_detail
```

Actual fields must be determined from the current upstream file.

### Immutable clinical fields

Treat these as clinical/invariant unless review explicitly authorizes a change:

```text
id
concentration_mg_per_ml
concentration_mg_per_unit
category
form
route
calc.type
calc.low
calc.high
calc.doses_per_day
calc.max_mg_per_dose
calc.max_mg_per_day
calc age/weight thresholds
contraindication thresholds
group_id
```

Do not alter numeric values during translation.

### Textual fields

Textual fields can be localized through translation files, for example:

```text
brand
unit display name
category display name
form display name
notes
warnings
clinical use
contraindication explanation
adverse effects
warning text
pregnancy text
breastfeeding text
controlled-drug text
age-band free-text instructions
source display label
```

Do not remove the original value from the canonical dataset.

---

## 8. Translation Architecture

Use a localization layer keyed by stable canonical identifiers.

Do not duplicate the whole drug object separately for Thai and English.

### UI translations

Example:

```json
{
  "app.title": "Pediatric Dose Calculator",
  "patient.weight": "น้ำหนัก",
  "patient.age": "อายุ",
  "search.placeholder": "ค้นหายา",
  "result.calculatedDose": "ขนาดยาที่คำนวณได้"
}
```

English:

```json
{
  "app.title": "Pediatric Dose Calculator",
  "patient.weight": "Weight",
  "patient.age": "Age",
  "search.placeholder": "Search medicines",
  "result.calculatedDose": "Calculated dose"
}
```

### Drug-text translations

Use the canonical `drug.id` as the translation key.

Example concept:

```json
{
  "acc_effervescent": {
    "brand": "...",
    "notes": "...",
    "warnings": ["..."],
    "clinical": {
      "use": "...",
      "contraindications": "...",
      "adverseEffects": "...",
      "warnings": "...",
      "pregnancy": "...",
      "breastfeeding": "...",
      "controlledDrug": "..."
    }
  }
}
```

Thai and English translation objects must have the same key structure.

### Never key translations by Chinese display text

Bad:

```text
translations["兒科藥物"]
```

Good:

```text
translations["category.pediatric"]
translations["drug.acc_effervescent.notes"]
```

Keys must remain stable even if source wording changes.

---

## 9. Translation Rules

### Thai

Use natural medical Thai suitable for healthcare professionals.

Prefer:

```text
น้ำหนัก
อายุ
ขนาดยา
ขนาดยาสูงสุด
ความถี่
วิธีบริหารยา
ข้อบ่งใช้
ข้อห้ามใช้
คำเตือน
อาการไม่พึงประสงค์
แหล่งอ้างอิง
```

Keep internationally recognized medical abbreviations when helpful:

```text
PO
IV
IM
PR
BID
TID
QID
PRN
mg
mcg
g
mL
kg
mg/kg/dose
mg/kg/day
```

Do not translate units into ambiguous wording.

### English

Use concise clinical English.

Do not rewrite the clinical meaning to sound more sophisticated.

Translation should be semantic but conservative.

### Drug names

Prefer generic drug names as the primary identifier.

Do not translate INN/generic names into invented Thai spellings when an English generic name is clearer.

Thai UI may display:

```text
Amoxicillin
อะม็อกซีซิลลิน
```

only if a reviewed Thai name is available.

Otherwise:

```text
Amoxicillin
```

is acceptable.

### Brand names

Brand names are proper names and usually should not be literally translated.

If the upstream brand is institution-specific or Taiwan-specific, retain it only as secondary information or hide it from the main result card.

Do not replace it with a Thai hospital brand without explicit project-owner approval.

---

## 10. Mixed Clinical Strings

Some upstream fields may contain numbers, dosing abbreviations, and Chinese text in the same string.

Example concept:

```text
0.5 # BID PC
```

or:

```text
not recommended under a particular age
```

These fields need special care.

### Rule

Never change the numeric component as part of translation.

Translation must preserve:

- numbers;
- dose units;
- frequency;
- route;
- comparison signs;
- age cutoffs;
- mathematical meaning.

Agents should create tests around translated free-text dose bands.

If a free-text field can safely be converted into structured data without changing meaning, document the conversion and test it against the original behavior.

Do not silently reinterpret clinical instructions.

---

## 11. Language Switching

Add a visible language switch:

```text
ไทย | EN
```

Recommended behavior:

- default language: Thai;
- save preference in `localStorage`;
- changing language must not reload clinical data from a different source;
- changing language should update text immediately;
- weight, age, search state, selected category, selected drug, and calculation result must remain unchanged after switching language.

Example:

```text
TH
น้ำหนัก: 18 kg
อายุ: 5 ปี
ขนาดยาที่คำนวณได้: 180 mg

[EN]

Weight: 18 kg
Age: 5 years
Calculated dose: 180 mg
```

---

## 12. UI Direction

The application should look clean, clinical, modern, and easy to scan.

Do not copy the upstream visual design blindly.

### Overall style

Preferred:

```text
clean
minimal
professional
mobile-first
high contrast
large numeric outputs
clear warnings
few unnecessary animations
```

The user should be able to operate the calculator quickly during clinical work.

### Suggested main screen

```text
┌──────────────────────────────────────┐
│ Pediatric Dose Calculator    ไทย | EN │
├──────────────────────────────────────┤
│ Weight                               │
│ [ 18.0 ] kg                          │
│                                      │
│ Age                                  │
│ [ 5 ] years [ 0 ] months             │
├──────────────────────────────────────┤
│ Search medicines                     │
│ [ Amoxicillin                    🔍 ] │
├──────────────────────────────────────┤
│ ⭐  URI  AGE  Antibiotic  Fever ...  │
├──────────────────────────────────────┤
│ Amoxicillin                          │
│ Oral suspension ...                  │
│                                      │
│ Dose                                 │
│ 40–50 mg/kg/day                      │
│                                      │
│ Calculated result                    │
│ XXXXX mg/dose                        │
│ XXXXX mL/dose                        │
│                                      │
│ Frequency: ...                       │
│ Maximum: ...                         │
│                                      │
│ ⚠ Warning                           │
│ ...                                  │
│                                      │
│ Reference: ...                       │
└──────────────────────────────────────┘
```

The numbers above are layout placeholders only and must not be interpreted as dosing guidance.

---

## 13. Patient Input

Preserve the upstream input behavior unless a clearly equivalent implementation is used.

At minimum support:

```text
Weight: kg
Age: years/months as required by upstream logic
```

### Validation

Do not calculate with:

- missing weight when weight is required;
- zero or negative weight;
- malformed numeric input;
- impossible negative age.

Do not auto-convert pounds unless explicitly implemented and clearly shown.

If lb support is ever added, kg must remain visible as the clinical calculation value.

---

## 14. Calculation Engine

The original calculation behavior is the baseline.

Do not "improve" a formula simply because another formula appears more familiar.

Port each calculation type intentionally.

Examples visible in the upstream dataset may include calculation modes such as:

```text
mg_per_kg_per_day
ml_per_kg_per_day
pack_per_10kg_per_day
age_band
```

The current upstream repository must be inspected for the complete set.

Create a typed calculation dispatcher:

```text
calc.type
   |
   +-- handler A
   +-- handler B
   +-- handler C
   +-- ...
```

Do not place drug-specific `if drug === ...` rules throughout UI components when the behavior can be driven from canonical data.

---

## 15. Calculation Parity Requirement

Before refactoring calculation logic:

1. run or inspect the original application;
2. capture representative original outputs;
3. create regression fixtures;
4. port the calculation;
5. compare new output with the original output.

### Test dimensions

Include representative combinations of:

- different weights;
- different ages;
- liquid drugs;
- tablets;
- fixed-unit products;
- minimum/maximum dose rules;
- age-band calculations;
- contraindication warnings;
- emergency modes;
- PALS;
- status epilepticus.

### Critical rule

Tests should confirm **parity with upstream behavior**, not invent new expected clinical values.

Any discovered upstream clinical issue must be documented separately rather than silently corrected.

---

## 16. TH/EN Parity Tests

For every calculation regression fixture, run both languages.

Pseudo-test:

```ts
const th = calculateAndRender(input, drug, 'th');
const en = calculateAndRender(input, drug, 'en');

expect(th.numericResult).toEqual(en.numericResult);
expect(th.calculationMetadata).toEqual(en.calculationMetadata);
```

Test at minimum:

```text
mg result
mL result
unit/tablet result
max-dose result
frequency code
contraindication state
warning severity
selected calculation rule
```

Only translated strings should differ.

---

## 17. Search Behavior

Search should work in both languages.

Search indexes may include:

- generic name;
- brand name;
- English translation;
- Thai translation;
- tags;
- category.

However, search results must resolve to the **same canonical drug ID**.

Example:

```text
"amoxicillin"
"อะม็อกซีซิลลิน"
```

should both resolve to:

```text
canonical id: amoxicillin_susp
```

when a reviewed Thai synonym exists.

Do not create duplicate drug records for search aliases.

---

## 18. Categories

Keep upstream categories/scenarios functionally equivalent.

Translate category display names only.

Example concept:

```text
uri
age
sedation
seizure
antibiotic
antipyretic
liquid
status_epilepticus
resuscitation
pals
```

The actual upstream category/tag values must remain canonical.

Example:

```text
canonical: antibiotic

TH: ยาปฏิชีวนะ
EN: Antibiotics
```

Do not change filtering logic based on translated category text.

---

## 19. Warnings and Contraindications

Warnings are safety-critical content.

Display them prominently.

Recommended visual hierarchy:

```text
Critical / contraindicated
High-visibility alert

Caution
Visible warning panel

Informational note
Secondary panel
```

Do not use color alone to communicate severity.

Use:

- icon;
- label;
- text;
- color as supplementary styling.

### Translation requirement

Warnings must be translated conservatively.

Never soften a warning during translation.

Never turn:

```text
contraindicated
```

into:

```text
use with caution
```

or vice versa.

---

## 20. Clinical Detail

The upstream dataset may contain institution-specific detail fields such as `kmuh_detail`.

Do not use the upstream institution's name as if it were the deploying institution.

In the UI, use a generic section title such as:

Thai:

```text
ข้อมูลทางคลินิก
```

English:

```text
Clinical information
```

Individual source/institution attribution should remain available where relevant.

Possible fields:

```text
Clinical use
Contraindications
Adverse effects
Warnings
Pregnancy
Breastfeeding
Controlled drug status
```

These are translations of upstream content, not newly authored clinical recommendations.

---

## 21. Institution-Specific Codes

Fields such as an upstream hospital medication code may remain in canonical data for provenance.

However:

- do not present a Taiwan hospital code as a Thai hospital code;
- do not rename it to a local code;
- hide institution-specific codes from the main calculator unless useful;
- if displayed, label the provenance clearly.

Future local formulary mapping must be implemented as a separate layer.

Example future model:

```text
canonical drug ID
    |
    +-- upstream code
    |
    +-- local hospital code
```

Do not overwrite provenance.

---

## 22. References

Keep original `source` metadata associated with each drug/rule.

The UI should provide a Reference/Source area in both languages.

Translate labels, not source identity.

Example:

Thai:

```text
แหล่งอ้างอิง
```

English:

```text
Reference
```

If the source name itself is in Chinese, an optional translated display label may be added, while preserving the original source string in canonical data.

---

## 23. Disclaimer

The app must include a clearly accessible disclaimer.

Suggested Thai wording:

```text
เครื่องมือนี้จัดทำเพื่อช่วยคำนวณและแสดงข้อมูลประกอบการใช้ยาในเด็กสำหรับบุคลากรทางการแพทย์
ผลลัพธ์จากโปรแกรมไม่ควรใช้แทนการประเมินทางคลินิก การตรวจสอบเอกสารอ้างอิง และดุลยพินิจของผู้ประกอบวิชาชีพ
ควรตรวจสอบชื่อยา ความแรงยา ขนาดยา ขนาดยาสูงสุด วิธีบริหารยา อายุ น้ำหนัก และข้อมูลผู้ป่วยก่อนใช้ยาทุกครั้ง
```

Suggested English wording:

```text
This tool is intended to assist healthcare professionals with pediatric medication dose calculations and reference information.
Its output does not replace clinical assessment, verification against appropriate references, or professional judgment.
Always verify the medicine, formulation, dose, maximum dose, route, patient age, weight, and relevant patient factors before administration.
```

Do not hide the disclaimer only in README.

---

## 24. No AI Dose Generation

Version 1 must not use an LLM to generate or modify pediatric dose recommendations.

An LLM may assist development and translation, but runtime calculation must be deterministic.

Never implement:

```text
patient input
   -> LLM
   -> dose
```

Clinical calculations must use:

```text
patient input
   -> deterministic calculation engine
   -> canonical structured data
   -> result
```

---

## 25. Translation Workflow for Agents

Agents may use machine translation as an initial draft.

For each source text:

```text
canonical original
       |
       +--> draft Thai translation
       |
       +--> draft English translation
       |
       +--> preserve source link/key
```

### Mandatory translation checks

Agents must automatically check:

- numbers were not changed;
- units were not changed;
- comparison operators were not changed;
- age limits were not changed;
- dose frequencies were not changed;
- route abbreviations were not changed;
- warning severity was not changed;
- arrays remain aligned;
- every translated drug entry references an existing canonical drug ID.

Create a translation coverage report.

Example:

```text
Canonical drugs: 100
Thai translated: 100
English translated: 100
Missing TH: 0
Missing EN: 0
Orphan translation keys: 0
```

Do not fabricate missing clinical content.

If a source field is unclear:

```text
mark for review
```

rather than guessing.

---

## 26. Translation Status

Translation records should optionally support review status.

Example:

```json
{
  "_meta": {
    "status": "draft",
    "reviewedBy": null
  }
}
```

Recommended statuses:

```text
draft
reviewed
approved
```

This metadata must not affect calculation.

It is for content quality management only.

---

## 27. Data Validation

Create automated schema validation for `peds_drugs.json`.

Validate where applicable:

- required IDs;
- unique IDs;
- numeric values are numbers;
- low <= high;
- concentration > 0;
- `doses_per_day` > 0;
- maximum dose values are positive;
- age bands are valid;
- route is supported;
- calculation type has a known handler.

Do not automatically "repair" suspicious clinical values.

Fail validation and report the affected drug ID.

---

## 28. Error Handling

Clinical calculations should fail safely.

Do not display a plausible-looking dose when required data is missing or unsupported.

Preferred behavior:

```text
Unable to calculate this item safely.
Please review the source data.
```

Thai:

```text
ไม่สามารถคำนวณรายการนี้ได้อย่างปลอดภัย
กรุณาตรวจสอบข้อมูลต้นทาง
```

Log technical details to development tools without exposing unnecessary internals to the user.

---

## 29. Offline and Privacy

Because Version 1 uses local static data, keep calculations client-side.

Preferred:

```text
no patient data upload
no server calculation
no remote logging of entered weight/age
```

If PWA/offline support is added:

- cache app assets;
- cache the canonical clinical JSON;
- version the cache;
- ensure updates do not result in mixed old/new application assets.

Show application/data version somewhere in About.

---

## 30. Accessibility

Minimum requirements:

- keyboard-accessible controls;
- sufficient contrast;
- visible focus state;
- labels associated with inputs;
- no warning conveyed by color alone;
- responsive font sizes;
- numeric dose results easy to read;
- Thai text must not be clipped;
- buttons should be usable on touch screens.

---

## 31. Responsive Design

Support at minimum:

```text
mobile: 360 px+
tablet
desktop
```

Mobile is important.

Avoid dense tables as the only presentation method.

Use cards or stacked information where appropriate.

---

## 32. Application State

Language switching must preserve:

- weight;
- age;
- selected category;
- search text;
- selected drug;
- expanded clinical details;
- calculation output.

Only display strings should change.

---

## 33. Recommended Components

Suggested components:

```text
AppHeader
LanguageSwitcher
PatientInput
WeightInput
AgeInput
DrugSearch
CategoryTabs
DrugList
DrugCard
DoseSummary
DoseBreakdown
FormulationResult
MaxDoseNotice
WarningAlert
ContraindicationAlert
ClinicalInfo
ReferenceInfo
PALSPanel
StatusEpilepticusPanel
Disclaimer
AboutDialog
```

Keep calculation functions outside visual components.

---

## 34. Visual Priorities

Highest visual priority:

```text
1. drug name
2. calculated dose
3. calculated volume/tablet amount
4. maximum-dose alert
5. important contraindication/warning
6. frequency and route
7. reference
8. secondary clinical information
```

Do not let decorative UI compete with the dose result.

---

## 35. Security

Even as a static application:

- do not use `eval`;
- sanitize any rendered HTML;
- avoid injecting raw source strings as HTML;
- pin dependencies appropriately;
- do not expose secrets;
- do not add API keys to client code;
- do not require a backend for Version 1.

---

## 36. Testing Strategy

Implement at least:

### Unit tests

```text
calculation functions
max-dose capping/display behavior
age-band selection
contraindication evaluation
unit conversion already present upstream
formatting
```

### Data tests

```text
schema validation
unique IDs
known calculation types
translation coverage
translation keys map to canonical IDs
```

### Localization tests

```text
TH and EN return identical clinical numeric results
no missing UI translation keys
language change preserves calculator state
```

### Regression tests

Compare against upstream representative outputs.

### UI tests

Test:

```text
weight entry
age entry
drug search
category switching
drug selection
TH/EN switch
warning display
reference display
mobile layout
```

---

## 37. Snapshot / Golden Fixtures

Create a set of upstream-parity fixtures.

Suggested structure:

```text
tests/fixtures/upstream-parity.json
```

Example schema:

```json
[
  {
    "drugId": "<canonical-id>",
    "weightKg": 10,
    "ageYears": 5,
    "expectedFromUpstream": {
      "rawCalculation": "<captured upstream output>"
    }
  }
]
```

Do not fill expected values from memory or assumptions.

Capture them from the actual upstream application/calculation logic.

---

## 38. Required Documentation

Create/update:

```text
README.md
AGENTS.md
UPSTREAM.md
LICENSE
TRANSLATION.md
CLINICAL_VALIDATION.md
CHANGELOG.md
```

### README should explain

- what the app is;
- that it is bilingual TH/EN;
- how to run locally;
- how to build;
- how to deploy;
- upstream attribution;
- disclaimer;
- data/reference provenance;
- clinical-validation status.

### TRANSLATION.md should explain

- canonical data strategy;
- translation file structure;
- how to add or edit a translation;
- how to run translation validation;
- which fields must never be changed during translation.

### CLINICAL_VALIDATION.md

Start with a clear status:

```text
Clinical validation status: NOT YET APPROVED FOR PRODUCTION USE
```

Add a checklist for professional review.

---

## 39. Clinical Validation Checklist

Before production deployment, require review of:

```text
[ ] drug list
[ ] formulations/concentrations
[ ] dose formulas
[ ] maximum doses
[ ] maximum daily doses
[ ] age limits
[ ] weight limits
[ ] contraindications
[ ] warnings
[ ] PALS content
[ ] status epilepticus content
[ ] Thai translation
[ ] English translation
[ ] references
[ ] calculation parity tests
[ ] local formulary differences
```

Do not mark these complete automatically.

---

## 40. Upstream Update Strategy

Do not lose the ability to compare with upstream.

Recommended Git strategy:

```text
origin   -> this project
upstream -> xyzKIWI/peds-dose
```

When upstream changes:

1. inspect the upstream diff;
2. identify clinical-data changes;
3. identify calculation changes;
4. update canonical data deliberately;
5. update translations;
6. rerun schema tests;
7. rerun TH/EN parity tests;
8. rerun upstream regression tests;
9. update `UPSTREAM.md`;
10. update `CHANGELOG.md`.

Do not blindly overwrite translated/localized files.

---

## 41. Do Not Do These Things

Agents MUST NOT:

- create separate clinical JSON databases for Thai and English;
- manually change a dose because it "looks wrong";
- change concentration during translation;
- change max dose during translation;
- change frequency during translation;
- change route during translation;
- invent missing references;
- invent Thai brand names;
- rename an institutional code as a local hospital code;
- use AI at runtime to calculate doses;
- store identifiable patient data in Version 1;
- remove clinical warnings to simplify the UI;
- hide the upstream attribution;
- claim production clinical validation without explicit approval;
- silently fix upstream medical content.

---

## 42. Allowed Improvements Without Clinical-Content Change

Agents may safely improve:

- layout;
- responsive behavior;
- typography;
- Thai font rendering;
- navigation;
- search UX;
- category tabs;
- accessibility;
- loading states;
- error states;
- language switch;
- code organization;
- test coverage;
- static deployment;
- PWA support;
- performance;
- maintainability.

As long as the clinical behavior remains unchanged.

---

## 43. Development Sequence

Follow this order.

### Phase 0 — Inspect

- clone/read upstream;
- record commit SHA;
- understand every calculation type;
- understand all data fields;
- run the original app.

### Phase 1 — Freeze baseline

- create upstream regression fixtures;
- preserve `peds_drugs.json`;
- document current behavior.

### Phase 2 — Application structure

- create the maintainable frontend structure;
- port calculation logic without changing outputs;
- add automated parity tests.

### Phase 3 — i18n framework

- add `th` and `en`;
- move UI text into translation files;
- implement persistent language switching.

### Phase 4 — Drug-text translation

- translate source display text into Thai;
- translate source display text into English;
- keep clinical numerics untouched;
- generate translation coverage report.

### Phase 5 — UI refinement

- improve visual design;
- optimize mobile use;
- make calculated doses visually prominent;
- improve warnings and references.

### Phase 6 — Validation

- run all tests;
- compare TH/EN;
- compare against upstream;
- create clinical review checklist.

### Phase 7 — Deployment

- build static production bundle;
- deploy to GitHub Pages or Vercel;
- include version information;
- include disclaimer and attribution.

---

## 44. Definition of Done

Version 1 is complete only when all of the following are true:

```text
[ ] Application works on mobile and desktop
[ ] Thai interface is complete
[ ] English interface is complete
[ ] One canonical drug dataset is used
[ ] No separate TH/EN dose datasets exist
[ ] Clinical numeric output is identical in TH and EN
[ ] Original calculation behavior has regression coverage
[ ] All known calculation types are supported
[ ] Translation coverage report has no unexplained gaps
[ ] Warnings and contraindications are visible
[ ] References are visible
[ ] Disclaimer is visible
[ ] Upstream attribution is present
[ ] MIT license is preserved
[ ] No patient-identifying information is stored
[ ] No runtime AI dose generation exists
[ ] Static production build succeeds
[ ] Clinical validation status is clearly documented
```

---

## 45. Acceptance Test: Language Invariance

This is a release-blocking requirement.

For a representative test suite:

```text
for every fixture:
    calculate in TH
    calculate in EN

    assert:
        selected canonical drug ID is identical
        clinical rule ID/type is identical
        mg result is identical
        mL result is identical
        unit/tablet result is identical
        max-dose handling is identical
        contraindication state is identical
        warning severity is identical
```

If this test fails, do not release.

---

## 46. Future Phase — Local Hospital Adaptation

Do NOT mix this into the first translation release.

A future version may add a separate local formulary layer:

```text
canonical drug
      |
      +---- upstream formulation
      |
      +---- local hospital formulation
      |
      +---- local drug code
```

This should be clearly separated from the upstream source dataset.

Potential future features:

- hospital-specific concentrations;
- local drug codes;
- local formulary availability;
- reviewed local references;
- pharmacist-admin panel;
- version control;
- approval workflow;
- audit log.

These require a separate design and clinical governance process.

---

# Final Instruction to All Coding Agents

Build this project as a **faithful bilingual adaptation first**.

The task is NOT to redesign pediatric pharmacotherapy.

The task is:

```text
preserve clinical source data
        +
preserve deterministic calculation behavior
        +
add Thai translation
        +
add English translation
        +
improve usability
        +
prove TH/EN clinical-result parity
```

When there is a conflict between visual convenience and clinical-data integrity:

```text
clinical-data integrity wins
```

When there is uncertainty about the meaning of a medical source string:

```text
do not guess
mark it for human review
```

When an upstream dose appears questionable:

```text
do not silently fix it
document it
request clinical review
```

The application should be easy to use, but its data provenance and calculation behavior must remain traceable.
