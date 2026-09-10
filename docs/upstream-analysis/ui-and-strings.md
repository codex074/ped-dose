# Upstream UI, flows, and string inventory

Source: `xyzKIWI/peds-dose` @ `3939f62` (v2.5), `index.html` (`lang="zh-Hant"`), `README.md`, `rewrite_clinical_summary.py`.
Data: 67 drugs, 17 categories, 3 PALS algorithms, 1 SE algorithm.

## 1. Page anatomy (DOM order)

1. `<head>`: viewport meta, `<title>兒科藥物劑量速算</title>`, inline CSS (CSS vars + `prefers-color-scheme: dark` + components).
2. `<header>` (sticky): `<h1>` title + version badge `#appver` (from `_meta.version`); `.controls` 3-column grid (`90px 90px 1fr`): Weight `#weight` (number, step 0.1, placeholder "例 17.5"), Age `#age` (number, step 0.1, placeholder "例 5"), Search `#search` (placeholder "藥名 / 商品名 / 情境"); `.tabs` horizontally scrollable pill row (13 buttons).
3. `<main>`: `#weight-summary` banner ("📊 計算中：X kg · Y 歲", shown only when weight or age entered); `#drug-list` (innerHTML replaced by `render()` — grouped drug cards, or PALS view, or SE view); footer line `.footer-info`: "⭐ 點藥右上角星星可釘選 · 資料儲存於本機瀏覽器 · 資料校對：2026-05-10".
4. `<script>` #1: app logic.
5. Feedback widget (FAB + panel + `<script>` #2) — excluded from port.

There is **no modal**: drug detail is an inline expand/collapse. No separate search results screen. No routing/URL state.

## 2. Tabs (lines 696–708, verified)

| #   | Label      | `data-view`   | Filter                                                                         |
| --- | ---------- | ------------- | ------------------------------------------------------------------------------ |
| 1   | 全部       | `all`         | none (default)                                                                 |
| 2   | ⭐ 釘選    | `starred`     | `state.starred.has(d.id)`                                                      |
| 3   | 🤧 URI     | `uri`         | `tags.includes('uri')`                                                         |
| 4   | 🤢 AGE     | `age`         | `tags.includes('age')`                                                         |
| 5   | 🤒 退燒    | `antipyretic` | `category === 'antipyretic'`                                                   |
| 6   | 💧水劑     | `ml_only`     | whitelist of 6 ids                                                             |
| 7   | 🦠 抗生素  | `antibiotic`  | `category === 'antibiotic'`                                                    |
| 8   | 🤧 流感    | `flu`         | `category === 'flu' \|\| tags.includes('flu')`                                 |
| 9   | 😴 鎮靜    | `sedation`    | `category === 'sedation'`                                                      |
| 10  | 🫨 抽搐    | `seizure`     | `category === 'seizure'`                                                       |
| 11  | ⚡ SE 流程 | `se`          | dedicated `renderSEView()`                                                     |
| 12  | 🚨 急救    | `emergency`   | `tags.some(t => t==='emergency' \|\| t==='rsi' \|\| t==='seizure_first_line')` |
| 13  | 🫀 PALS    | `pals`        | dedicated `renderPALSView()`                                                   |

```js
const ORAL_LIQUIDS_WHITELIST = new Set([
  'antiphen_syrup',
  'idefen_syrup',
  'cypromin_syrup',
  'cetirizine_syrup',
  'zithromax_susp',
  'curam_susp',
]);
```

PALS and SE tabs bypass drug list and search entirely; weight/age inputs still apply.

## 3. Search

Live on every `input` event, no debounce. Case-insensitive substring over the concatenation of: `generic`, `brand`, `kmuh_code`, `id`, category label, all `tags`, all `indications[].label`. Combines with tab filter (AND). Inert on PALS/SE tabs. Empty state: `沒有找到符合條件的藥物`. No clear button.

**Note**: upstream DOES search `kmuh_code`. The port removes `kmuh_code` from search and display (see spec).

## 4. Drug card (in order)

Two shapes: single card (`drugCard()`) and grouped card (`drugGroupCard()`, shared `group_id`; ~23/67 drugs — a core path, not an edge case).

1. Generic name (bold)
2. Tag pills (急救 / RSI / 常用, conditional)
3. Brand line (conditional)
4. Star/pin button (aria-label 釘選/取消釘選 {generic}, aria-pressed)
5. Meta row: route; concentration (unless redundant with brand text); package (unless in brand text)
6. Contraindication banner (conditional on current weight/age)
7. Dose body: single dose rows, or per-indication blocks (label / dose / onset-duration / notes)
8. Notes (conditional, keyword-highlighted)
9. Warnings box (conditional, each "⚠️ ")
10. "▶ 📋 藥品完整資料" toggle + collapsed `<dl>` of `kmuh_detail`
11. Source line "📚 {source}"

Starred cards: gold left border, pulled into a "⭐ 釘選" group at the top. Emergency/RSI-tagged: amber left border. Grouped seizure drugs carry `urgency`/`urgency_label` badges ("💊 口服維持" vs "🚨 急性 loading"). `monitoring` field exists in data but is never rendered upstream.

Dose row labels: 總量 (mg/mcg total), 抽藥量 (draw volume for injectables), mL 數, `{unit} 數`, 包數 (value suffix 包/dose), 輸入體重後計算 / → kg, 輸入年齡後計算 / → yr.

## 5. Drug detail (expand/collapse, not modal)

`renderKmuhDetail(drug)`: `<dl>` from `Object.entries(drug.kmuh_detail)` in JSON order. Canonical 7 keys: 臨床用途, 禁忌, 副作用, 警語, 懷孕分級, 授乳, 管制性藥品. Missing keys omitted. Text runs through the danger/warn keyword highlighter (danger: 禁用|禁忌|contraindicated; warn: 不建議|慎用|警告).

## 6. Favorites

Key `peds_dose_starred_v1` (JSON array of ids). Seeded on first run from `tags: ["starred_default"]`. Starred group shown first; "⭐ 釘選" tab filters to starred only.

## 7. SE flow tab

Card "⚡ 兒科癲癇重積 Convulsive Status Epilepticus", subtitle "AES 2016 · Glauser et al · Epilepsy Currents 16(1):48-61". Vertical timeline of 4 stage cards (color-coded): time pill (0–5 / 5–20 / 20–40 / 40–60 min), phase name (Stabilization 穩定期 / Initial Therapy 第一線 BZD / Second Therapy 第二線 ASM / Third Therapy 難治性 SE), optional evidence chip ("Level A", "Level U（三藥等效）"), optional subtitle, numbered actions, optional drug mini-list ("劑量 (已套用 X kg)"). Between stages: "▼ Does Seizure Continue? — 若仍持續 → 進下一階段；若已停 → symptomatic care". Footer: link "AES 流程圖" (`figure_url`) + citation. Empty state "SE 流程資料尚未載入".

## 8. PALS tab

3 stacked cards: 💔 兒科心臟停止 Cardiac Arrest (Figure 2), 💓 兒科心搏過速（有脈搏） Tachyarrhythmia With Pulse (Figure 7), 🐢 兒科心搏過慢（有脈搏） Bradycardia With Pulse (Figure 6). Each conditionally: title/subtitle → 初始處置 steps → differentiation (Tachy: Sinus Tach vs SVT) → 決策流程 (Yes/No tree, "❓ {question}", QRS cards "Narrow (≤0.09 sec)"/"Wide (>0.09 sec)") → 藥物劑量 (已套用 X kg) → 電擊能量 (Arrest & Tachy) → High-Quality CPR checklist (Arrest, 8 items) → Reversible Causes — 6H + 5T (Arrest) → 可能病因 (Brady, 7 items) → refractory banner (Tachy) → AHA figure link → citation "📚 改編自 AHA/AAP 2025 PALS Guidelines (Lasa et al., Circulation 2025) 原文：DOI 10.1161/CIR.0000000000001368". Empty state "PALS 資料尚未載入".

## 9. Feedback widget — NOT ported

FAB 💬 "回饋盲點"; panel "值班盲點回饋"; saves to localStorage `pd_feedback` and POSTs to Google Forms (`FB_FORM`, `entry.248204705`). Personal side-channel of the upstream author. Excluded.

## 10. Metadata

Version badge from `_meta.version`. Footer proofread date hard-coded "資料校對：2026-05-10" (differs from `_meta.last_updated` "2026-05-09"). `_meta.disclaimer` is never rendered (dead text; `.disclaimer` CSS unused).

## 11. Responsive

Base 15px. `.controls` fixed 3-col grid at all widths. Tabs horizontally scrollable. Star button ≥44×44. `.drug-list-grid` 2-col CSS exists but is never applied (dead). OS dark mode via media query only. Sticky header.

## 12. UI string inventory (seed for i18n)

Keys are suggestions; EN/TH keep PO/IV/BID/TID/mg/mL/kg untranslated.

### Page / controls

| key                         | zh                   | EN                           | TH                              |
| --------------------------- | -------------------- | ---------------------------- | ------------------------------- |
| app.title                   | 兒科藥物劑量速算     | Pediatric Dose Calculator    | เครื่องคำนวณขนาดยาเด็ก          |
| controls.weight.label       | 體重 (kg)            | Weight (kg)                  | น้ำหนัก (kg)                    |
| controls.weight.placeholder | 例 17.5              | e.g. 17.5                    | เช่น 17.5                       |
| controls.age.label          | 年齡 (歲)            | Age (yr)                     | อายุ (ปี)                       |
| controls.age.placeholder    | 例 5                 | e.g. 5                       | เช่น 5                          |
| controls.search.placeholder | 藥名 / 商品名 / 情境 | Drug name / brand / scenario | ชื่อยา / ชื่อการค้า / อาการ     |
| validation.weight_range     | 體重 0-120 kg        | Weight must be 0–120 kg      | น้ำหนักต้องอยู่ระหว่าง 0-120 kg |
| validation.age_range        | 年齡 0-18 歲         | Age must be 0–18 yr          | อายุต้องอยู่ระหว่าง 0-18 ปี     |

### Tabs

| key              | zh         | EN          | TH            |
| ---------------- | ---------- | ----------- | ------------- |
| tabs.all         | 全部       | All         | ทั้งหมด       |
| tabs.starred     | ⭐ 釘選    | Favorites   | รายการโปรด    |
| tabs.uri         | 🤧 URI     | URI         | URI           |
| tabs.age         | 🤢 AGE     | AGE         | AGE           |
| tabs.antipyretic | 🤒 退燒    | Fever       | ลดไข้         |
| tabs.ml_only     | 💧水劑     | Liquids     | ยาน้ำ         |
| tabs.antibiotic  | 🦠 抗生素  | Antibiotics | ยาปฏิชีวนะ    |
| tabs.flu         | 🤧 流感    | Influenza   | ไข้หวัดใหญ่   |
| tabs.sedation    | 😴 鎮靜    | Sedation    | ยาระงับประสาท |
| tabs.seizure     | 🫨 抽搐    | Seizure     | ชัก           |
| tabs.se          | ⚡ SE 流程 | SE Protocol | แนวทาง SE     |
| tabs.emergency   | 🚨 急救    | Emergency   | ฉุกเฉิน       |
| tabs.pals        | 🫀 PALS    | PALS        | PALS          |

### Drug card

| key                      | zh                   | EN                        | TH                    |
| ------------------------ | -------------------- | ------------------------- | --------------------- |
| card.tag.emergency       | 急救                 | Emergency                 | ฉุกเฉิน               |
| card.tag.rsi             | RSI                  | RSI                       | RSI                   |
| card.tag.common          | 常用                 | Common                    | ใช้บ่อย               |
| card.star.pin            | 釘選                 | Pin                       | ปักหมุด               |
| card.star.unpin          | 取消釘選             | Unpin                     | ยกเลิกปักหมุด         |
| card.dose.needs_weight   | 輸入體重後計算       | Enter weight to calculate | กรอกน้ำหนักเพื่อคำนวณ |
| card.dose.needs_age      | 輸入年齡後計算       | Enter age to calculate    | กรอกอายุเพื่อคำนวณ    |
| card.dose.total          | 總量                 | Total dose                | ขนาดยารวม             |
| card.dose.draw           | 抽藥量               | Volume to draw            | ปริมาตรที่ดูด         |
| card.dose.ml             | mL 數                | Volume (mL)               | ปริมาตร (mL)          |
| card.dose.unit_count     | {unit} 數            | {unit} count              | จำนวน {unit}          |
| card.dose.pack           | 包數                 | Packets                   | จำนวนซอง              |
| card.dose.pack_unit      | 包/dose              | pack/dose                 | ซอง/dose              |
| card.dose.no_match_band  | 無相符區間           | No matching band          | ไม่มีช่วงที่ตรงกัน    |
| card.dose.band_by_weight | 依體重分組           | By weight band            | แบ่งตามน้ำหนัก        |
| card.dose.band_by_age    | 依年齡分組           | By age band               | แบ่งตามอายุ           |
| card.dose.no_data        | 無資料               | No data                   | ไม่มีข้อมูล           |
| card.detail.toggle       | 📋 藥品完整資料      | Full drug information     | ข้อมูลยาแบบละเอียด    |
| contra.severity.severe   | 禁用                 | Contraindicated           | ห้ามใช้               |
| contra.severity.moderate | 不建議               | Not recommended           | ไม่แนะนำ              |
| contra.severity.mild     | (per drug free text) | (per drug)                | (per drug)            |

### Clinical detail headings (`kmuh_detail` keys)

| stable key                 | zh         | EN                     | TH                       |
| -------------------------- | ---------- | ---------------------- | ------------------------ |
| clinical.use               | 臨床用途   | Clinical use           | ข้อบ่งใช้                |
| clinical.contraindications | 禁忌       | Contraindications      | ข้อห้ามใช้               |
| clinical.adverseEffects    | 副作用     | Adverse effects        | อาการไม่พึงประสงค์       |
| clinical.warnings          | 警語       | Warnings / precautions | คำเตือน / ข้อควรระวัง    |
| clinical.pregnancy         | 懷孕分級   | Pregnancy category     | การใช้ในหญิงตั้งครรภ์    |
| clinical.breastfeeding     | 授乳       | Breastfeeding          | การให้นมบุตร             |
| clinical.controlledDrug    | 管制性藥品 | Controlled substance   | ยาควบคุม / วัตถุออกฤทธิ์ |

### Categories (17)

| id                   | zh                              | EN                                                   | TH                                                       |
| -------------------- | ------------------------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| antipyretic          | 退燒/止痛                       | Fever / Pain                                         | ลดไข้ / บรรเทาปวด                                        |
| rhinitis             | 流鼻水/過敏                     | Rhinitis / Allergy                                   | น้ำมูก / ภูมิแพ้                                         |
| cough_cold           | 止咳/感冒                       | Cough / Cold                                         | แก้ไอ / หวัด                                             |
| expectorant          | 化痰                            | Expectorant                                          | ละลายเสมหะ                                               |
| antibiotic           | 抗生素                          | Antibiotics                                          | ยาปฏิชีวนะ                                               |
| flu                  | 流感                            | Influenza                                            | ไข้หวัดใหญ่                                              |
| croup_bronchodilator | Croup / 支氣管擴張              | Croup / Bronchodilator                               | ครูป / ยาขยายหลอดลม                                      |
| steroid              | 類固醇                          | Steroid                                              | สเตียรอยด์                                               |
| antiemetic           | 止吐                            | Antiemetic                                           | ยาแก้อาเจียน                                             |
| gi_other             | 腸胃道（脹氣/便秘/止瀉/益生菌） | GI (bloating / constipation / diarrhea / probiotics) | ทางเดินอาหาร (ท้องอืด / ท้องผูก / ท้องเสีย / โพรไบโอติก) |
| fluid                | 點滴/輸液                       | IV fluids                                            | สารน้ำ                                                   |
| analgesic_inj        | 止痛針劑                        | Injectable analgesics                                | ยาแก้ปวดชนิดฉีด                                          |
| sedation             | 鎮靜/麻醉誘導                   | Sedation / Induction                                 | ยาระงับประสาท / นำสลบ                                    |
| seizure              | 抽搐/癲癇                       | Seizure / Epilepsy                                   | ชัก / ลมชัก                                              |
| allergy_eps          | 過敏/EPS                        | Allergy / EPS                                        | ภูมิแพ้ / EPS                                            |
| muscle_relaxant      | 肌肉鬆弛                        | Muscle relaxant                                      | ยาคลายกล้ามเนื้อ                                         |
| pals_arrest          | PALS 心臟停止/心律不整          | PALS Cardiac Arrest / Arrhythmia                     | PALS หัวใจหยุดเต้น / หัวใจเต้นผิดจังหวะ                  |

### Banner / empty states / footer

| key                  | zh                                | EN                                                                 | TH                                            |
| -------------------- | --------------------------------- | ------------------------------------------------------------------ | --------------------------------------------- |
| summary.calculating  | 📊 計算中：{weight} kg · {age} 歲 | Calculating for {weight} kg · {age} yr                             | กำลังคำนวณสำหรับ {weight} kg · {age} ปี       |
| list.empty           | 沒有找到符合條件的藥物            | No matching medicine found. Try a generic name or another keyword. | ไม่พบยาที่ค้นหา ลองค้นด้วยชื่อสามัญหรือคำอื่น |
| pals.empty           | PALS 資料尚未載入                 | PALS data not loaded                                               | ยังไม่โหลดข้อมูล PALS                         |
| se.empty             | SE 流程資料尚未載入               | SE protocol data not loaded                                        | ยังไม่โหลดข้อมูลแนวทาง SE                     |
| footer.pin_hint      | 點藥右上角星星可釘選              | Tap the star to pin a medicine                                     | แตะดาวเพื่อปักหมุดยา                          |
| footer.local_storage | 資料儲存於本機瀏覽器              | Preferences stored in this browser only                            | บันทึกการตั้งค่าไว้ในเบราว์เซอร์นี้เท่านั้น   |
| footer.data_reviewed | 資料校對：{date}                  | Data reviewed: {date}                                              | ตรวจสอบข้อมูล: {date}                         |

### PALS view

| key                            | zh                                                                                                            | EN                                                                                                          | TH                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| pals.section.initial_steps     | 初始處置                                                                                                      | Initial management                                                                                          | การจัดการเบื้องต้น                                                                                       |
| pals.section.decision_tree     | 決策流程                                                                                                      | Decision pathway                                                                                            | แนวทางการตัดสินใจ                                                                                        |
| pals.section.drugs             | 藥物劑量                                                                                                      | Drug doses                                                                                                  | ขนาดยา                                                                                                   |
| pals.section.applied_weight    | (已套用 {weight} kg)                                                                                          | (using {weight} kg)                                                                                         | (ใช้น้ำหนัก {weight} kg)                                                                                 |
| pals.section.energy            | 電擊能量                                                                                                      | Shock energy                                                                                                | พลังงานช็อก                                                                                              |
| pals.section.cpr               | High-Quality CPR                                                                                              | High-Quality CPR                                                                                            | CPR คุณภาพสูง                                                                                            |
| pals.section.reversible_causes | Reversible Causes — 6H + 5T                                                                                   | Reversible Causes — 6H + 5T                                                                                 | สาเหตุที่แก้ไขได้ — 6H + 5T                                                                              |
| pals.section.possible_causes   | 可能病因                                                                                                      | Possible causes                                                                                             | สาเหตุที่เป็นไปได้                                                                                       |
| pals.section.refractory        | Refractory（依 guideline）                                                                                    | Refractory (per guideline)                                                                                  | ดื้อต่อการรักษา (ตามแนวทาง)                                                                              |
| pals.decision.yes / no         | YES / NO                                                                                                      | YES / NO                                                                                                    | ใช่ / ไม่ใช่                                                                                             |
| pals.figure_link               | 查看原始 AHA 流程圖 →                                                                                         | View original AHA figure                                                                                    | ดูแผนภาพต้นฉบับ AHA                                                                                      |
| pals.citation                  | 📚 改編自 AHA/AAP 2025 PALS Guidelines (Lasa et al., Circulation 2025) 原文：DOI 10.1161/CIR.0000000000001368 | Adapted from AHA/AAP 2025 PALS Guidelines (Lasa et al., Circulation 2025). DOI 10.1161/CIR.0000000000001368 | ดัดแปลงจาก AHA/AAP 2025 PALS Guidelines (Lasa et al., Circulation 2025) DOI 10.1161/CIR.0000000000001368 |

Algorithm titles/subtitles, stage phase names, decision-tree questions, action lists, CPR checklist items, and cause lists are free text inside `pals_algorithms` / `se_algorithm` JSON and are translated via the algorithm translation files (keyed by algorithm id / stage index / node path), not via UI keys.

### SE view

| key            | zh                                                                        | EN                                                                                     | TH                                                              |
| -------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| se.title       | ⚡ 兒科癲癇重積 Convulsive Status Epilepticus                             | Pediatric Convulsive Status Epilepticus                                                | ภาวะชักต่อเนื่องในเด็ก                                          |
| se.stage.doses | 劑量                                                                      | Doses                                                                                  | ขนาดยา                                                          |
| se.decision    | Does Seizure Continue? — 若仍持續 → 進下一階段；若已停 → symptomatic care | Does the seizure continue? If yes, proceed to next stage; if stopped, symptomatic care | ยังชักอยู่หรือไม่? ถ้าใช่ ไปขั้นถัดไป; ถ้าหยุดแล้ว ดูแลตามอาการ |
| se.figure_link | AES 流程圖                                                                | AES flowchart                                                                          | แผนภาพ AES                                                      |

## 13. README — attribution, sources, disclaimer

Sources to credit: Lexicomp + Nelson + UpToDate; AHA/AAP 2025 PALS Guidelines (DOI 10.1161/CIR.0000000000001368); AES 2016 Convulsive Status Epilepticus Guideline (Glauser et al, Epilepsy Currents 16:1); 高醫小兒藥物速算表 (初版) + 小兒常用藥丹 (KMUH internal). `kmuh_code` is KMUH's HIS drug code — meaningless outside that hospital.

Upstream disclaimer (zh): 個人臨床速算工具，僅供醫師快速參考。最終劑量以主治醫師臨床判斷為準，藥碼與濃度請於開藥前再次核對。

## 14. `rewrite_clinical_summary.py`

One-off data-maintenance script: replaces `kmuh_detail` on every drug with the author's own 7-field pocket-card summary (paraphrased, not verbatim from any reference). Not runtime code; nothing to port. Confirms the 7-field detail schema is intentional and stable.

## 15. Other parity notes

- Full drug schema: `id`, `generic`, `brand`, `concentration_mg_per_ml` / `_mg_per_unit` / `_mcg_per_ml` / `_mcg_per_unit`, `package`, `kmuh_code`, `category`, `form`, `route`, `calc` OR `indications[]`, `frequency`, `notes`, `warnings[]`, `source`, `tags[]`, `group_id`, `contraindications[]` (`age_below_months` / `age_below_years` / `age_below_weeks` / `weight_above_kg` / `weight_below_kg` + `severity` + `reason`), `kmuh_detail`, `urgency` / `urgency_label`, `unit`, `monitoring` (never rendered).
- 14 tag values: `age`, `allergy`, `common`, `emergency`, `fever`, `flu`, `pals`, `rsi`, `se_protocol`, `sedation`, `seizure`, `seizure_first_line`, `seizure_second_line`, `starred_default`, `uri`.
- Global weight/age feeds four surfaces at once: drug cards, PALS drug doses, PALS energy, SE stage doses.
- Accessibility upstream is minimal (only star buttons have aria attributes). Free to improve.
