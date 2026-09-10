# PedsDose TH/EN Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, bilingual (Thai/English) React port of `xyzKIWI/peds-dose` v2.5 whose calculations are proven identical to upstream and whose UI follows DESIGN.md.

**Architecture:** One canonical `peds_drugs.json` (never edited) feeds a pure TypeScript calculation engine under `src/clinical/` that is verified against a mechanically captured golden matrix from the upstream JavaScript. Translation is a presentation layer keyed by stable ids (`ui.*`, `drugs.*`, `algorithms.*`). React components never calculate; they render `DoseResult` objects.

**Tech Stack:** React 18, TypeScript (strict), Vite 5, Tailwind CSS 3, Vitest + @testing-library/react + jsdom, zod, pnpm. Fonts: IBM Plex Sans Thai + Inter (Google Fonts).

**Spec:** `docs/superpowers/specs/2026-09-11-pedsdose-th-en-design.md` (read it first). Upstream facts: `docs/upstream-analysis/calculation-engine.md`, `docs/upstream-analysis/dataset.md`, `docs/upstream-analysis/ui-and-strings.md`.

## Global Constraints

- Upstream baseline: `https://github.com/xyzKIWI/peds-dose` commit `3939f62d84afc06b15387dae4ca384450eb42fb0`, MIT license, `_meta.version` "2.5".
- `public/data/peds_drugs.json` is byte-identical to upstream `peds_drugs.json`. Never edit it. Never create a second clinical dataset.
- Numeric output must equal upstream for identical input. `Result(th) === Result(en)` except display text.
- `num()` is ported byte-for-byte. Never use `toLocaleString` or `Intl.NumberFormat` for clinical numbers.
- Age is a float in years `[0, 18]`; weight is a float in kg `(0, 120]`. The engine never receives months.
- No `eval`, no network calls, no backend, no analytics, no patient identifiers, no runtime LLM.
- Default language Thai; preference stored in `localStorage` key `pedsdose.lang`.
- All translated drug/algorithm text produced by agents carries `_meta.status: "draft"`.
- Do-not-fix list (replicate exactly): no tablet snapping; PALS energy has no enforced 10 J/kg ceiling; `mgo_tab` age gaps [5,6) and [11,12) and `lgg_pack` age < 3 return "no matching band"; `min_dose_mg` applied after `max_dose_mg`; `weight_above_kg` uses `>=`; age→months is `age*12`, age→weeks is `age*52`; SE view shows all indications of `midazolam_dormicum`.
- Commit at the end of every task; push to `origin main` (`https://github.com/codex074/ped-dose.git`) at the end of every phase.
- Package manager: `pnpm`. Node 24 is installed.

---

## Phase map (push after each phase)

| Phase | Tasks | Deliverable |
|---|---|---|
| 1 Scaffold | 1–3 | Vite app builds, data copied and validated, docs skeleton |
| 2 Golden | 4 | `tests/fixtures/upstream-golden.json` committed |
| 3 Engine | 5–9 | `src/clinical/*` with parity tests green |
| 4 i18n + state | 10–13 | language provider, UI strings, calculator state, translation skeletons |
| 5 UI | 14–21 | all components, responsive, DESIGN.md styling |
| 6 Translations | 22–25 | drugs.th/en, algorithms.th/en, coverage report green |
| 7 Finish | 26–28 | docs, integration tests, build + deploy config |

Tasks 15–20 and 22–25 may run in parallel across subagents once Task 14 (Phase 5) or Phase 4 respectively is pushed. Parallel implementers work in their own git worktree/branch; the controller merges each branch into `main` and reviews the merged range. Every parallel task prompt must include the **Interfaces** block of Tasks 5, 10, 11, 12 and 14 verbatim. Parallel UI tasks use `tests/utils.tsx` (`renderWithProviders`) from Task 14 and never modify it.

---

## Phase 1 — Scaffold

### Task 1: Vite + React + TypeScript + Tailwind + Vitest scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.ts`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`, `.gitignore`, `.prettierrc`, `eslint.config.js`, `tests/setup.ts`
- Test: `tests/smoke.test.tsx`

**Interfaces:**
- Produces: `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck` scripts. Vite `base: '/ped-dose/'` for GitHub Pages.

- [ ] **Step 1: Create the project files**

`package.json`:
```json
{
  "name": "pedsdose-th-en",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -p tsconfig.json --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src tests scripts --ext .ts,.tsx",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,json}\" \"tests/**/*.ts*\" \"scripts/**/*.{ts,mjs}\"",
    "capture-golden": "node scripts/capture-golden.mjs",
    "validate-data": "tsx scripts/validate-data.ts",
    "translation-report": "tsx scripts/translation-report.ts",
    "gen-translation-skeleton": "tsx scripts/gen-translation-skeleton.ts"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^22.5.0",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@typescript-eslint/eslint-plugin": "^8.4.0",
    "@typescript-eslint/parser": "^8.4.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.10.0",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "jsdom": "^25.0.0",
    "postcss": "^8.4.45",
    "prettier": "^3.3.3",
    "tailwindcss": "^3.4.10",
    "tsx": "^4.19.0",
    "typescript": "^5.5.4",
    "vite": "^5.4.3",
    "vitest": "^2.0.5"
  }
}
```

`vite.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/ped-dose/',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
  },
});
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "types": ["vitest/globals", "@testing-library/jest-dom", "node"],
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src", "tests", "scripts"]
}
```

Add `resolve: { alias: { '@': '/src' } }` to `vite.config.ts` (inside `defineConfig`).

`tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FFFDF8',
        sky: { DEFAULT: '#7EC8E3', soft: '#E3F4FA', deep: '#3FA7CB' },
        mint: { DEFAULT: '#A8E6CF', soft: '#EAF9F2' },
        peach: { DEFAULT: '#FFD3B6', soft: '#FFF0E6' },
        butter: { DEFAULT: '#FFF3B0' },
        lavender: { DEFAULT: '#CDB4DB', soft: '#F3ECF7' },
        blush: { DEFAULT: '#FFC8DD' },
        ink: { DEFAULT: '#334155', muted: '#64748B' },
        line: '#E5E7EB',
        status: {
          safe: '#34D399', safeSoft: '#D1FAE5',
          caution: '#FBBF24', cautionSoft: '#FEF3C7', cautionText: '#92400E',
          danger: '#F87171', dangerSoft: '#FEE2E2', dangerText: '#991B1B',
          info: '#60A5FA', infoSoft: '#DBEAFE', infoText: '#1E40AF',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Thai"', 'Inter', 'system-ui', 'sans-serif'],
        num: ['Inter', '"IBM Plex Sans Thai"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl: '1rem', '2xl': '1.5rem', '3xl': '2rem' },
      boxShadow: {
        soft: '0 4px 16px rgba(51, 65, 85, 0.06)',
        lift: '0 10px 28px rgba(51, 65, 85, 0.10)',
      },
      transitionDuration: { fast: '120ms', normal: '200ms', slow: '320ms' },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'soft-pulse': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
      animation: { 'fade-up': 'fade-up 320ms ease-out both', 'soft-pulse': 'soft-pulse 1.4s ease-in-out infinite' },
    },
  },
  plugins: [],
} satisfies Config;
```

`postcss.config.js`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

`index.html`:
```html
<!doctype html>
<html lang="th">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
    <title>PedsDose</title>
  </head>
  <body class="bg-cream text-ink font-sans">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { color-scheme: light; }
html { -webkit-text-size-adjust: 100%; }
body { line-height: 1.6; }
.thai-safe { line-height: 1.75; overflow-wrap: anywhere; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

`src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

`src/App.tsx` (placeholder, replaced in Task 21):
```tsx
export default function App() {
  return <main className="p-6"><h1 className="text-2xl font-semibold">PedsDose</h1></main>;
}
```

`tests/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

`.gitignore`:
```
node_modules
dist
coverage
.DS_Store
*.log
.superpowers/
```

`.prettierrc`: `{ "singleQuote": true, "semi": true, "printWidth": 100, "trailingComma": "all" }`

`eslint.config.js`:
```js
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parser: tsParser, parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } } },
    plugins: { '@typescript-eslint': tsPlugin, 'react-hooks': reactHooks },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-eval': 'error',
    },
  },
];
```

- [ ] **Step 2: Write the smoke test**

`tests/smoke.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import App from '@/App';

test('renders the app title', () => {
  render(<App />);
  expect(screen.getByText('PedsDose')).toBeInTheDocument();
});
```

- [ ] **Step 3: Install and run**

Run: `pnpm install && pnpm test && pnpm build`
Expected: 1 test passes; `dist/` produced.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: scaffold Vite + React + TS + Tailwind + Vitest"
```

### Task 2: Canonical data, UPSTREAM.md, LICENSE, AGENTS.md

**Files:**
- Create: `public/data/peds_drugs.json` (copy), `UPSTREAM.md`, `LICENSE`, `AGENTS.md` (copy of `AGENTS_PedsDose_TH_EN.md`), `DESIGN.md` (copy of `DESIGN_PedsDose_TH_EN.md`), `tests/upstream/index.html` (vendored upstream, for golden capture)
- Test: `tests/data-integrity.test.ts`

**Interfaces:**
- Produces: `UPSTREAM_JSON_SHA256` constant recorded in `UPSTREAM.md` and `tests/data-integrity.test.ts`.

- [ ] **Step 1: Fetch upstream at the pinned SHA and copy files**

If network access is blocked, a clone of upstream at the same SHA exists at `/private/tmp/claude-501/-Users-codex074-Desktop-My-Web-App-ped-dose/8cd4feb1-d064-4775-86e3-3482fff31ecd/scratchpad/upstream/` — copy `peds_drugs.json`, `index.html`, `LICENSE` from there instead (verify `git -C <that dir> rev-parse HEAD` is `3939f62d…`).

```bash
mkdir -p public/data tests/upstream
curl -sL https://raw.githubusercontent.com/xyzKIWI/peds-dose/3939f62d84afc06b15387dae4ca384450eb42fb0/peds_drugs.json -o public/data/peds_drugs.json
curl -sL https://raw.githubusercontent.com/xyzKIWI/peds-dose/3939f62d84afc06b15387dae4ca384450eb42fb0/index.html -o tests/upstream/index.html
curl -sL https://raw.githubusercontent.com/xyzKIWI/peds-dose/3939f62d84afc06b15387dae4ca384450eb42fb0/LICENSE -o tests/upstream/LICENSE.upstream
shasum -a 256 public/data/peds_drugs.json
git mv AGENTS_PedsDose_TH_EN.md AGENTS.md && git mv DESIGN_PedsDose_TH_EN.md DESIGN.md
```
Record the printed SHA-256 as `<SHA256>` below.

- [ ] **Step 2: Write LICENSE**

```
MIT License

Copyright (c) 2026 xyzKIWI (original peds-dose project, https://github.com/xyzKIWI/peds-dose)
Copyright (c) 2026 PedsDose TH/EN contributors (Thai/English adaptation)

<full MIT text copied verbatim from tests/upstream/LICENSE.upstream>
```

- [ ] **Step 3: Write UPSTREAM.md**

```md
# Upstream

Project: xyzKIWI/peds-dose
Repository: https://github.com/xyzKIWI/peds-dose
Baseline commit: 3939f62d84afc06b15387dae4ca384450eb42fb0
Upstream version: 2.5 (`_meta.version`), data last_updated 2026-05-09
Imported date: 2026-09-11
License: MIT (preserved in ./LICENSE)

## Imported files
| Upstream | Here | Notes |
|---|---|---|
| peds_drugs.json | public/data/peds_drugs.json | byte-identical, SHA-256 `<SHA256>` |
| index.html | tests/upstream/index.html | vendored only for golden capture; not shipped |
| LICENSE | LICENSE | notice preserved, adaptation line added |

## Deliberate non-parity
| Item | Decision |
|---|---|
| Feedback widget + Google Forms POST | dropped |
| Disclaimer | rendered in footer and About (upstream never rendered `_meta.disclaimer`) |
| `kmuh_code` | kept in JSON; removed from search and display |
| Liquid tab whitelist (6 ids) | kept, in `src/clinical/filters.ts` |
| Hard-coded proofread date 2026-05-10 | replaced by `_meta.last_updated` |
| OS dark mode | not in v1 |
| Stray leading space in 抗生素 tab label | not replicated |
| `monitoring` field | displayed in clinical info if present |
| Accessibility | improved |

## Update procedure
See AGENTS.md §40.
```

- [ ] **Step 4: Write the data-integrity test**

`tests/data-integrity.test.ts`:
```ts
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const UPSTREAM_JSON_SHA256 = '<SHA256>';

test('canonical dataset is byte-identical to upstream baseline', () => {
  const buf = readFileSync('public/data/peds_drugs.json');
  expect(createHash('sha256').update(buf).digest('hex')).toBe(UPSTREAM_JSON_SHA256);
});

test('canonical dataset has expected top-level shape', () => {
  const d = JSON.parse(readFileSync('public/data/peds_drugs.json', 'utf8'));
  expect(d._meta.version).toBe('2.5');
  expect(d.drugs).toHaveLength(67);
  expect(d.categories).toHaveLength(17);
  expect(d.pals_algorithms.map((a: { id: string }) => a.id)).toEqual(['cardiac_arrest', 'tachy_pulse', 'brady_pulse']);
  expect(d.se_algorithm.id).toBe('convulsive_se');
});
```

- [ ] **Step 5: Run and commit**

Run: `pnpm test tests/data-integrity.test.ts`
Expected: PASS.
```bash
git add -A && git commit -m "data: import canonical peds_drugs.json at upstream 3939f62 with UPSTREAM.md and LICENSE"
```

### Task 3: Docs skeleton and phase push

**Files:**
- Create: `README.md`, `TRANSLATION.md`, `CLINICAL_VALIDATION.md`, `CHANGELOG.md`

- [ ] **Step 1: Write minimal docs (expanded in Task 26)**

`README.md`:
```md
# PedsDose TH/EN

Thai/English pediatric medication dose calculator, based on the open-source peds-dose project by xyzKIWI. Modified for Thai/English bilingual use. Not the official application of the original author.

Status: in development. Clinical validation status: NOT YET APPROVED FOR PRODUCTION USE (see CLINICAL_VALIDATION.md).

## Run
pnpm install
pnpm dev

## Test / build
pnpm test
pnpm build
```

`CLINICAL_VALIDATION.md`:
```md
# Clinical validation

Clinical validation status: NOT YET APPROVED FOR PRODUCTION USE

## Review checklist
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

## Upstream behaviors preserved for parity (not corrected)
- Tablet/unit counts are not rounded to half or quarter units.
- PALS defibrillation energy is not capped at 10 J/kg (note is text only).
- `mgo_tab` age bands have gaps at [5,6) and [11,12) years; `lgg_pack` has no band under 3 years. The app shows "no matching band".
- In `mg_per_kg_per_dose`, `min_dose_mg` is applied after `max_dose_mg`.
- Age is converted to months by `age*12` and to weeks by `age*52`.
- `weight_above_kg` contraindication triggers at `weight >= threshold`.
- The SE view shows every indication of midazolam, not only the SE one.
```

`TRANSLATION.md`: heading + "See Phase 4/6 tasks; expanded later." `CHANGELOG.md`: `## Unreleased` with "Initial scaffold, canonical data import".

- [ ] **Step 2: Commit and push Phase 1**

```bash
git add -A && git commit -m "docs: README, CLINICAL_VALIDATION, TRANSLATION, CHANGELOG skeletons" && git push origin main
```

---

## Phase 2 — Golden capture

### Task 4: Capture the upstream golden matrix

**Files:**
- Create: `scripts/capture-golden.mjs`, `tests/fixtures/upstream-golden.json` (generated, committed)
- Test: `tests/golden-fixture.test.ts`

**Interfaces:**
- Produces fixture shape:
```ts
interface GoldenFile {
  meta: { upstreamSha: string; generatedAt: string; weights: (number | null)[]; ages: (number | null)[] };
  cases: GoldenCase[];
  energy: GoldenEnergy[];
}
interface GoldenCase {
  drugId: string;
  indicationIndex: number | null;     // null = top-level calc
  weight: number | null;
  age: number | null;
  raw: Record<string, unknown>;       // exact object returned by upstream calcDose (numbers unrounded)
  formatted: { mg?: string; mcg?: string; ml?: string; unit?: string; packs?: string; rate?: string };
  contra: { index: number; type: string; severityClass: 'severe' | 'moderate' | 'mild' } | null;
}
interface GoldenEnergy { algorithmId: string; index: number; weight: number; low: number; high: number | null; formattedLow: string; formattedHigh: string | null }
```

- [ ] **Step 1: Write the capture script**

`scripts/capture-golden.mjs`:
```js
// Extracts num() and calcDose() verbatim from the vendored upstream index.html and runs them
// over a full matrix. Never retype the upstream functions by hand.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';

const UPSTREAM_SHA = '3939f62d84afc06b15387dae4ca384450eb42fb0';
const html = readFileSync('tests/upstream/index.html', 'utf8');
const data = JSON.parse(readFileSync('public/data/peds_drugs.json', 'utf8'));

function extractFunction(name) {
  const lines = html.split('\n');
  const start = lines.findIndex((l) => l.startsWith(`function ${name}(`));
  if (start < 0) throw new Error(`function ${name} not found`);
  let end = start;
  while (end < lines.length && lines[end] !== '}') end++;
  return lines.slice(start, end + 1).join('\n');
}

const src = extractFunction('num') + '\n' + extractFunction('calcDose') + '\n' +
  'module.exports = { num, calcDose };';
const ctx = { module: { exports: {} } };
vm.createContext(ctx);
vm.runInContext(src, ctx);
const { num, calcDose } = ctx.module.exports;

// Purified copy of upstream checkContraindication + severityClass (logic unchanged; state -> params)
function checkContraindication(drug, weight, age) {
  if (!drug.contraindications) return null;
  for (let i = 0; i < drug.contraindications.length; i++) {
    const c = drug.contraindications[i];
    if (c.type === 'age_below_months' && age != null && age * 12 < c.threshold_months) return { i, c };
    if (c.type === 'age_below_years' && age != null && age < c.threshold_years) return { i, c };
    if (c.type === 'age_below_weeks' && age != null && age * 52 < c.threshold_weeks) return { i, c };
    if (c.type === 'weight_above_kg' && weight != null && weight >= c.threshold_kg) return { i, c };
    if (c.type === 'weight_below_kg' && weight != null && weight < c.threshold_kg) return { i, c };
  }
  return null;
}
function severityClass(sev) {
  if (sev === '禁用') return 'severe';
  if (sev === '不建議') return 'moderate';
  return 'mild';
}

const weights = [null, 0.5, 2, 3, 5, 9.99, 10, 10.01, 12.5, 14.99, 15, 20, 20.5, 25, 40, 70, 120];
const ages = [null, 0, 0.1, 0.5, 1, 2.5, 5, 5.5, 6, 11.5, 12, 18];

const cases = [];
for (const drug of data.drugs) {
  const calcs = drug.indications
    ? drug.indications.map((ind, i) => ({ calc: ind.calc, indicationIndex: i }))
    : drug.calc ? [{ calc: drug.calc, indicationIndex: null }] : [];
  for (const { calc, indicationIndex } of calcs) {
    for (const weight of weights) for (const age of ages) {
      const raw = calcDose(drug, calc, weight, age);
      const formatted = {};
      if (raw.mgRange) formatted.mg = raw.mgRange[0] === raw.mgRange[1] ? num(raw.mgRange[0]) : `${num(raw.mgRange[0])}-${num(raw.mgRange[1])}`;
      if (raw.mcgRange) formatted.mcg = raw.mcgRange[0] === raw.mcgRange[1] ? num(raw.mcgRange[0]) : `${num(raw.mcgRange[0])}-${num(raw.mcgRange[1])}`;
      if (raw.mlRange) formatted.ml = raw.mlRange[0] === raw.mlRange[1] ? num(raw.mlRange[0]) : `${num(raw.mlRange[0])}-${num(raw.mlRange[1])}`;
      if (raw.unitRange) formatted.unit = raw.unitRange[0] === raw.unitRange[1] ? num(raw.unitRange[0]) : `${num(raw.unitRange[0])}-${num(raw.unitRange[1])}`;
      if (raw.packsPerDose !== undefined) formatted.packs = num(raw.packsPerDose);
      if (raw.rate !== undefined) formatted.rate = num(raw.rate);
      const hit = checkContraindication(drug, weight, age);
      cases.push({
        drugId: drug.id, indicationIndex, weight, age, raw, formatted,
        contra: hit ? { index: hit.i, type: hit.c.type, severityClass: severityClass(hit.c.severity) } : null,
      });
    }
  }
}

const energy = [];
for (const algo of data.pals_algorithms) {
  (algo.energy_doses || []).forEach((e, index) => {
    for (const weight of weights) {
      if (weight == null) continue;
      const low = e.j_per_kg * weight;
      const high = e.high_j_per_kg ? e.high_j_per_kg * weight : null;
      energy.push({ algorithmId: algo.id, index, weight, low, high, formattedLow: num(low), formattedHigh: high == null ? null : num(high) });
    }
  });
}

mkdirSync('tests/fixtures', { recursive: true });
writeFileSync('tests/fixtures/upstream-golden.json', JSON.stringify({
  meta: { upstreamSha: UPSTREAM_SHA, generatedAt: new Date().toISOString(), weights, ages }, cases, energy,
}));
console.log(`cases=${cases.length} energy=${energy.length}`);
```

- [ ] **Step 2: Run it**

Run: `pnpm capture-golden`
Expected: prints `cases=` roughly 16,000 and `energy=80`; file about 2–4 MB.

- [ ] **Step 3: Write the fixture sanity test**

`tests/golden-fixture.test.ts`:
```ts
import { readFileSync } from 'node:fs';
import type { GoldenFile } from '../scripts/golden-types';   // create scripts/golden-types.ts exporting the GoldenFile/GoldenCase/GoldenEnergy interfaces from the Interfaces block above
const golden = JSON.parse(readFileSync('tests/fixtures/upstream-golden.json', 'utf8')) as GoldenFile;

test('golden fixture covers every drug and indication', () => {
  const ids = new Set(golden.cases.map((c) => c.drugId));
  expect(ids.size).toBe(67);
  const adenosine = golden.cases.filter((c) => c.drugId === 'adenosine');
  expect(new Set(adenosine.map((c) => c.indicationIndex))).toEqual(new Set([0, 1]));
});

test('golden fixture contains known upstream behaviors', () => {
  const find = (drugId: string, weight: number | null, age: number | null) =>
    golden.cases.find((c) => c.drugId === drugId && c.indicationIndex === null && c.weight === weight && c.age === age)!;
  expect(find('antiphen_syrup', 10, 2.5).formatted.mg).toBe('100-150');
  expect(find('antiphen_syrup', 10, 2.5).formatted.ml).toBe('4.17-6.25');
  expect(find('mgo_tab', 20, 5.5).raw.bandText).toBe('無相符區間');
  expect(find('taita1', 10, 1).raw.rate).toBe(40);
  expect(find('taita1', 20.5, 1).raw.rate).toBe(60.5);
  expect(find('antiphen_syrup', null, 2.5).raw.needs_weight).toBe(true);
  expect(find('idefen_syrup', 5, 0.1).contra?.severityClass).toBe('severe');
});
```
If a value in this test differs from the fixture, the fixture is right and the test expectation is wrong. Fix the expectation, and note it in the commit message.

- [ ] **Step 4: Run, commit, push Phase 2**

Run: `pnpm test tests/golden-fixture.test.ts`
```bash
git add -A && git commit -m "test: capture upstream golden matrix from vendored index.html" && git push origin main
```

---

## Phase 3 — Calculation engine

### Task 5: Clinical types

**Files:**
- Create: `src/clinical/types.ts`
- Test: `tests/clinical/types.test.ts` (compile-only assertions)

**Interfaces:**
- Produces (frozen; every later task imports from here):

```ts
// src/clinical/types.ts
export type CalcType =
  | 'mg_per_kg_per_dose' | 'mg_per_kg_per_day' | 'mcg_per_kg_per_dose'
  | 'ml_per_kg_per_dose' | 'ml_per_kg_per_day' | 'supp_by_weight'
  | 'pack_per_10kg_per_day' | 'pack_per_30kg_per_dose' | 'weight_band'
  | 'age_band' | 'fluid_421_rule' | 'ml_by_weight_after_dilution';

export const CALC_TYPES: readonly CalcType[] = [
  'mg_per_kg_per_dose', 'mg_per_kg_per_day', 'mcg_per_kg_per_dose', 'ml_per_kg_per_dose',
  'ml_per_kg_per_day', 'supp_by_weight', 'pack_per_10kg_per_day', 'pack_per_30kg_per_dose',
  'weight_band', 'age_band', 'fluid_421_rule', 'ml_by_weight_after_dilution',
];

export interface WeightBand { weight_low: number; weight_high: number; dose: string }
export interface AgeBand {
  age_low: number; age_high: number;
  dose?: string; label?: string;
  mg_per_kg_per_dose?: number; mg_per_kg_per_dose_high?: number; max_mg_per_dose?: number;
  mg_per_dose?: number;
}

/** Loose on purpose: upstream reads fields dynamically. Extra keys (note, formula, calc_basis…) are allowed. */
export interface Calc {
  type: CalcType;
  low?: number; high?: number;
  doses_per_day?: number;
  max_dose_mg?: number; min_dose_mg?: number; max_mg_per_day?: number;
  max_dose_mcg?: number; max_ml_per_dose?: number;
  /** supp_by_weight: these are DIVISORS (dose = weight / kg_per_supp_*), not weight thresholds. Upstream naming kept. */
  kg_per_supp_low?: number; kg_per_supp_high?: number;
  packs_per_10kg_per_day?: number;
  bands?: (WeightBand | AgeBand)[];
  note?: string;
  [extra: string]: unknown;
}

export type ContraindicationType =
  | 'age_below_months' | 'age_below_years' | 'age_below_weeks' | 'weight_above_kg' | 'weight_below_kg';
export interface Contraindication {
  type: ContraindicationType;
  threshold_months?: number; threshold_years?: number; threshold_weeks?: number; threshold_kg?: number;
  severity: string;   // raw upstream string, e.g. 禁用 / 不建議 / 慎用 / 建議改膠囊
  reason: string;
}

export interface Indication {
  label: string; calc: Calc; route?: string; frequency?: string; notes?: string; onset?: string; duration?: string;
}

export interface ClinicalDetail { [zhKey: string]: string }   // 臨床用途, 禁忌, 副作用, 警語, 懷孕分級, 授乳, 管制性藥品

export interface Drug {
  id: string; generic: string; brand: string;
  kmuh_code: string | null; category: string; form: string; route: string; source: string;
  kmuh_detail: ClinicalDetail;
  calc?: Calc; indications?: Indication[];
  tags?: string[]; frequency?: string; notes?: string; package?: string; unit?: string;
  concentration_mg_per_ml?: number; concentration_mg_per_unit?: number;
  concentration_mcg_per_ml?: number; concentration_mcg_per_unit?: number;
  concentration_note?: string; group_id?: string; warnings?: string[];
  contraindications?: Contraindication[];
  urgency?: string; urgency_label?: string; duration_note?: string; max_per_day_note?: string; monitoring?: string;
}

export interface Category { id: string; label: string; order: number }

export interface EnergyDose { label: string; j_per_kg: number; high_j_per_kg?: number; note?: string }
export interface DecisionBranchQrs { qrs: string; label: string; action: string }
export interface DecisionNode { label: string; actions?: string[]; branches?: DecisionBranchQrs[] }
export interface DecisionTree { question: string; yes: DecisionNode; no: DecisionNode }
export interface Differentiation {
  title: string;
  sinus_tach: { label: string; criteria: string[]; action?: string };
  svt: { label: string; criteria: string[]; action?: string };
}
export interface PalsAlgorithm {
  id: 'cardiac_arrest' | 'tachy_pulse' | 'brady_pulse';
  title: string; subtitle: string; icon: string;
  steps_initial: string[]; decision_tree: DecisionTree; drugs: string[];
  energy_doses?: EnergyDose[]; high_quality_cpr?: string[];
  reversible_causes?: { title: string; h: string[]; t: string[] };
  differentiation?: Differentiation; refractory_note?: string; possible_causes?: string[];
  figure_url: string; figure_label: string;
}
export interface SeStage { minutes: string; phase: string; level?: string; subtitle?: string; actions: string[]; drugs?: string[] }
export interface SeAlgorithm {
  id: string; title: string; subtitle: string; icon: string; time_stages: SeStage[];
  decision_label: string; citation: string; figure_url: string; figure_label: string;
}

export interface DrugDataset {
  _meta: { version: string; last_updated: string; scope: string; primary_source: string; disclaimer: string };
  categories: Category[]; drugs: Drug[]; pals_algorithms: PalsAlgorithm[]; se_algorithm: SeAlgorithm;
}

/** Structured description of the dosing rule; rendered to text by the i18n layer. */
export type RuleDescriptor =
  | { kind: 'mg_per_kg_per_dose'; low: number; high: number; minMg?: number; maxMg?: number }
  | { kind: 'mg_per_kg_per_day'; low: number; high: number; dosesPerDay: number }
  | { kind: 'mcg_per_kg_per_dose'; low: number; high: number }
  | { kind: 'ml_per_kg_per_dose'; low: number; high: number }
  | { kind: 'ml_per_kg_per_day'; low: number; high: number; dosesPerDay: number }
  | { kind: 'supp_by_weight'; divLow: number; divHigh: number }
  | { kind: 'pack_per_10kg_per_day'; packsPer10kg: number | undefined; dosesPerDay: number }
  | { kind: 'pack_per_30kg_per_dose' }
  | { kind: 'weight_band' }
  | { kind: 'age_band' }
  | { kind: 'band_label'; label: string }
  | { kind: 'fluid_421' };

export type DoseResult =
  | { kind: 'needs_weight' }
  | { kind: 'needs_age' }
  | { kind: 'dose'; mgRange?: [number, number]; mcgRange?: [number, number]; mlRange?: [number, number];
      unitRange?: [number, number]; packsPerDose?: number; rule: RuleDescriptor }
  | { kind: 'band'; matched: true; bandIndex: number; bandText: string; rule: RuleDescriptor }
  | { kind: 'band'; matched: false; rule: RuleDescriptor }
  | { kind: 'rate'; rate: number; rule: RuleDescriptor }
  | { kind: 'dilution'; startLow: number; startHigh: number; max: number; note: string };

export type SeverityBucket = 'severe' | 'moderate' | 'mild';
export interface ContraindicationHit { index: number; contraindication: Contraindication; severity: SeverityBucket }
```

- [ ] **Step 1: Write the file exactly as above**
- [ ] **Step 2: Write a compile-time test**

`tests/clinical/types.test.ts`:
```ts
import type { DoseResult, Drug } from '@/clinical/types';
import { CALC_TYPES } from '@/clinical/types';
import dataset from '../../public/data/peds_drugs.json';

test('CALC_TYPES matches every type present in the dataset', () => {
  const found = new Set<string>();
  for (const d of dataset.drugs as Drug[]) {
    if (d.calc) found.add(d.calc.type);
    for (const i of d.indications ?? []) found.add(i.calc.type);
  }
  expect([...found].sort()).toEqual([...CALC_TYPES].sort());
});

test('DoseResult discriminant compiles', () => {
  const r: DoseResult = { kind: 'needs_weight' };
  expect(r.kind).toBe('needs_weight');
});
```

- [ ] **Step 3: Run and commit**

Run: `pnpm test tests/clinical/types.test.ts` → PASS.
```bash
git add -A && git commit -m "feat(clinical): frozen types for dataset, calc, and DoseResult"
```

### Task 6: `formatNumber` (upstream `num`)

**Files:**
- Create: `src/clinical/formatNumber.ts`
- Test: `tests/clinical/formatNumber.test.ts`

**Interfaces:**
- Produces: `formatNumber(x: number | null | undefined): string` and `formatRange(lo: number, hi: number): string` (`lo === hi ? num(lo) : `${num(lo)}-${num(hi)}``).

- [ ] **Step 1: Failing test**

```ts
import { formatNumber, formatRange } from '@/clinical/formatNumber';

test.each([
  [null, '—'], [undefined, '—'], [NaN, '—'], [0, '0'],
  [100, '100'], [100.5, '101'], [99.999, '100'], [150.4, '150'],
  [10, '10'], [12.5, '12.5'], [12.04, '12'], [12.96, '13'],
  [1, '1'], [1.5, '1.5'], [1.234, '1.23'], [4.166666, '4.17'], [9.999, '10'],
  [0.5, '0.5'], [0.73, '0.73'], [0.999999, '1'], [0.004, '0'],
])('formatNumber(%s) = %s', (input, expected) => {
  expect(formatNumber(input as number)).toBe(expected);
});

test('formatRange collapses equal ends', () => {
  expect(formatRange(150, 150)).toBe('150');
  expect(formatRange(100, 150)).toBe('100-150');
});
```

- [ ] **Step 2: Run → FAIL (module not found)**
- [ ] **Step 3: Implement**

```ts
/** Byte-for-byte port of upstream num(). Do not "improve". */
export function formatNumber(x: number | null | undefined): string {
  if (x === null || x === undefined || isNaN(x)) return '—';
  if (x === 0) return '0';
  if (x >= 100) return Math.round(x).toString();
  if (x >= 10) return x.toFixed(1).replace(/\.0$/, '');
  if (x >= 1) return x.toFixed(2).replace(/\.?0+$/, '');
  return x.toFixed(2).replace(/\.?0+$/, '');
}

export function formatRange(lo: number, hi: number): string {
  return lo === hi ? formatNumber(lo) : `${formatNumber(lo)}-${formatNumber(hi)}`;
}
```

- [ ] **Step 4: Run → PASS. Commit** `feat(clinical): port upstream num() as formatNumber`

### Task 7: `calcDose` dispatcher and 12 handlers

**Files:**
- Create: `src/clinical/calcDose.ts`
- Test: `tests/clinical/calcDose.test.ts`

**Interfaces:**
- Consumes: `Drug`, `Calc`, `DoseResult`, `RuleDescriptor`, `AgeBand`, `WeightBand` from Task 5.
- Produces: `calcDose(drug: Drug, calc: Calc, weight: number | null, age: number | null): DoseResult`.

- [ ] **Step 1: Failing tests (named cases from the analysis)**

```ts
import { calcDose } from '@/clinical/calcDose';
import type { Drug } from '@/clinical/types';
import dataset from '../../public/data/peds_drugs.json';

const drugs = dataset.drugs as Drug[];
const byId = (id: string) => drugs.find((d) => d.id === id)!;

test('mg_per_kg_per_dose with mL conversion', () => {
  const d = byId('antiphen_syrup');
  const r = calcDose(d, d.calc!, 10, 2);
  expect(r).toMatchObject({ kind: 'dose', mgRange: [100, 150] });
  if (r.kind === 'dose') expect(r.mlRange![0]).toBeCloseTo(4.1667, 4);
});

test('max_dose_mg collapses the range', () => {
  const d = byId('antiphen_syrup');
  const r = calcDose(d, d.calc!, 90, 8);
  expect(r).toMatchObject({ kind: 'dose', mgRange: [900, 1000] });
});

test('needs_weight when weight is null', () => {
  const d = byId('antiphen_syrup');
  expect(calcDose(d, d.calc!, null, 2)).toEqual({ kind: 'needs_weight' });
});

test('age_band gap returns unmatched band', () => {
  const d = byId('mgo_tab');
  expect(calcDose(d, d.calc!, 20, 5.5)).toEqual({ kind: 'band', matched: false, rule: { kind: 'age_band' } });
});

test('age_band matched free text', () => {
  const d = byId('mgo_tab');
  const r = calcDose(d, d.calc!, 20, 3);
  expect(r).toMatchObject({ kind: 'band', matched: true, bandIndex: 1, bandText: '0.5-1 # TID-QID' });
});

test('age_band checks age before weight', () => {
  const d = byId('cetirizine_syrup');
  expect(calcDose(d, d.calc!, 15, null)).toEqual({ kind: 'needs_age' });
});

test('fluid_421_rule tiers', () => {
  const d = byId('taita1');
  expect(calcDose(d, d.calc!, 10, 1)).toMatchObject({ kind: 'rate', rate: 40 });
  expect(calcDose(d, d.calc!, 20.5, 1)).toMatchObject({ kind: 'rate', rate: 60.5 });
});

test('dilution special', () => {
  const d = byId('citosol');
  const r = calcDose(d, d.calc!, 12, 5);
  expect(r).toMatchObject({ kind: 'dilution', startLow: 3, startHigh: 4, max: 12 });
});

test('indication calc (adenosine 2nd dose cap)', () => {
  const d = byId('adenosine');
  const r = calcDose(d, d.indications![1]!.calc, 70, 16);
  expect(r).toMatchObject({ kind: 'dose', mgRange: [12, 12] });
});
```

- [ ] **Step 2: Run → FAIL**
- [ ] **Step 3: Implement — a direct transliteration of the upstream code (see `docs/upstream-analysis/calculation-engine.md` §3)**

```ts
import type { AgeBand, Calc, DoseResult, Drug, WeightBand } from './types';

function lowHigh(calc: Calc): [number, number] {
  return [calc.low as number, calc.high as number];
}

export function calcDose(drug: Drug, calc: Calc, weight: number | null, age: number | null): DoseResult {
  const t = calc.type;

  if (t === 'mg_per_kg_per_dose') {
    if (weight == null) return { kind: 'needs_weight' };
    const [low, high] = lowHigh(calc);
    let lowMg = low * weight, highMg = high * weight;
    if (calc.max_dose_mg) { lowMg = Math.min(lowMg, calc.max_dose_mg); highMg = Math.min(highMg, calc.max_dose_mg); }
    if (calc.min_dose_mg) { lowMg = Math.max(lowMg, calc.min_dose_mg); highMg = Math.max(highMg, calc.min_dose_mg); }
    const result: DoseResult = {
      kind: 'dose', mgRange: [lowMg, highMg],
      rule: { kind: 'mg_per_kg_per_dose', low, high,
        ...(calc.min_dose_mg ? { minMg: calc.min_dose_mg } : {}),
        ...(calc.max_dose_mg ? { maxMg: calc.max_dose_mg } : {}) },
    };
    if (drug.concentration_mg_per_ml) result.mlRange = [lowMg / drug.concentration_mg_per_ml, highMg / drug.concentration_mg_per_ml];
    if (drug.concentration_mg_per_unit) result.unitRange = [lowMg / drug.concentration_mg_per_unit, highMg / drug.concentration_mg_per_unit];
    return result;
  }

  if (t === 'mg_per_kg_per_day') {
    if (weight == null) return { kind: 'needs_weight' };
    const dosesDay = calc.doses_per_day || 1;
    const [low, high] = lowHigh(calc);
    let lowMgDay = low * weight, highMgDay = high * weight;
    if (calc.max_mg_per_day) { lowMgDay = Math.min(lowMgDay, calc.max_mg_per_day); highMgDay = Math.min(highMgDay, calc.max_mg_per_day); }
    const lowMg = lowMgDay / dosesDay, highMg = highMgDay / dosesDay;
    const result: DoseResult = { kind: 'dose', mgRange: [lowMg, highMg], rule: { kind: 'mg_per_kg_per_day', low, high, dosesPerDay: dosesDay } };
    if (drug.concentration_mg_per_ml) result.mlRange = [lowMg / drug.concentration_mg_per_ml, highMg / drug.concentration_mg_per_ml];
    if (drug.concentration_mg_per_unit) result.unitRange = [lowMg / drug.concentration_mg_per_unit, highMg / drug.concentration_mg_per_unit];
    return result;
  }

  if (t === 'mcg_per_kg_per_dose') {
    if (weight == null) return { kind: 'needs_weight' };
    const [low, high] = lowHigh(calc);
    let lowMcg = low * weight, highMcg = high * weight;
    if (calc.max_dose_mcg) { lowMcg = Math.min(lowMcg, calc.max_dose_mcg); highMcg = Math.min(highMcg, calc.max_dose_mcg); }
    const result: DoseResult = { kind: 'dose', mcgRange: [lowMcg, highMcg], rule: { kind: 'mcg_per_kg_per_dose', low, high } };
    if (drug.concentration_mcg_per_ml) result.mlRange = [lowMcg / drug.concentration_mcg_per_ml, highMcg / drug.concentration_mcg_per_ml];
    else if (drug.concentration_mg_per_ml) result.mlRange = [lowMcg / (drug.concentration_mg_per_ml * 1000), highMcg / (drug.concentration_mg_per_ml * 1000)];
    return result;
  }

  if (t === 'ml_per_kg_per_dose') {
    if (weight == null) return { kind: 'needs_weight' };
    const [low, high] = lowHigh(calc);
    let lowMl = low * weight, highMl = high * weight;
    if (calc.max_ml_per_dose) { lowMl = Math.min(lowMl, calc.max_ml_per_dose); highMl = Math.min(highMl, calc.max_ml_per_dose); }
    return { kind: 'dose', mlRange: [lowMl, highMl], rule: { kind: 'ml_per_kg_per_dose', low, high } };
  }

  if (t === 'ml_per_kg_per_day') {
    if (weight == null) return { kind: 'needs_weight' };
    const dosesDay = calc.doses_per_day || 1;
    const [low, high] = lowHigh(calc);
    const lowMlDay = low * weight, highMlDay = high * weight;
    return { kind: 'dose', mlRange: [lowMlDay / dosesDay, highMlDay / dosesDay], rule: { kind: 'ml_per_kg_per_day', low, high, dosesPerDay: dosesDay } };
  }

  if (t === 'supp_by_weight') {
    if (weight == null) return { kind: 'needs_weight' };
    const divLow = calc.kg_per_supp_low as number, divHigh = calc.kg_per_supp_high as number;
    return { kind: 'dose', unitRange: [weight / divLow, weight / divHigh], rule: { kind: 'supp_by_weight', divLow, divHigh } };
  }

  if (t === 'pack_per_10kg_per_day') {
    if (weight == null) return { kind: 'needs_weight' };
    const dosesDay = calc.doses_per_day || 3;
    const totalPacks = (weight / 10) * (calc.packs_per_10kg_per_day || 1);
    return { kind: 'dose', packsPerDose: totalPacks / dosesDay, rule: { kind: 'pack_per_10kg_per_day', packsPer10kg: calc.packs_per_10kg_per_day, dosesPerDay: dosesDay } };
  }

  if (t === 'pack_per_30kg_per_dose') {
    if (weight == null) return { kind: 'needs_weight' };
    return { kind: 'dose', packsPerDose: weight / 30, rule: { kind: 'pack_per_30kg_per_dose' } };
  }

  if (t === 'weight_band') {
    if (weight == null) return { kind: 'needs_weight' };
    const bands = (calc.bands ?? []) as WeightBand[];
    const idx = bands.findIndex((b) => weight >= b.weight_low && weight < b.weight_high);
    if (idx < 0) return { kind: 'band', matched: false, rule: { kind: 'weight_band' } };
    return { kind: 'band', matched: true, bandIndex: idx, bandText: bands[idx]!.dose, rule: { kind: 'weight_band' } };
  }

  if (t === 'age_band') {
    if (age == null) return { kind: 'needs_age' };
    const bands = (calc.bands ?? []) as AgeBand[];
    const idx = bands.findIndex((b) => age >= b.age_low && age < b.age_high);
    if (idx < 0) return { kind: 'band', matched: false, rule: { kind: 'age_band' } };
    const band = bands[idx]!;
    if (band.mg_per_kg_per_dose !== undefined) {
      if (weight == null) return { kind: 'needs_weight' };
      const high = band.mg_per_kg_per_dose_high ?? band.mg_per_kg_per_dose;
      let lowMg = band.mg_per_kg_per_dose * weight, highMg = high * weight;
      if (band.max_mg_per_dose) { lowMg = Math.min(lowMg, band.max_mg_per_dose); highMg = Math.min(highMg, band.max_mg_per_dose); }
      const rule = band.label ? { kind: 'band_label' as const, label: band.label } : { kind: 'mg_per_kg_per_dose' as const, low: band.mg_per_kg_per_dose, high };
      const result: DoseResult = { kind: 'dose', mgRange: [lowMg, highMg], rule };
      if (drug.concentration_mg_per_ml) result.mlRange = [lowMg / drug.concentration_mg_per_ml, highMg / drug.concentration_mg_per_ml];
      return result;
    }
    if (band.mg_per_dose !== undefined) {
      const mg = band.mg_per_dose;
      const rule = band.label ? { kind: 'band_label' as const, label: band.label } : { kind: 'mg_per_kg_per_dose' as const, low: mg, high: mg };
      const result: DoseResult = { kind: 'dose', mgRange: [mg, mg], rule };
      if (drug.concentration_mg_per_ml) result.mlRange = [mg / drug.concentration_mg_per_ml, mg / drug.concentration_mg_per_ml];
      return result;
    }
    return { kind: 'band', matched: true, bandIndex: idx, bandText: band.dose ?? '', rule: band.label ? { kind: 'band_label', label: band.label } : { kind: 'age_band' } };
  }

  if (t === 'fluid_421_rule') {
    if (weight == null) return { kind: 'needs_weight' };
    let rate = 0;
    if (weight <= 10) rate = weight * 4;
    else if (weight <= 20) rate = 40 + (weight - 10) * 2;
    else rate = 60 + (weight - 20);
    return { kind: 'rate', rate, rule: { kind: 'fluid_421' } };
  }

  if (t === 'ml_by_weight_after_dilution') {
    if (weight == null) return { kind: 'needs_weight' };
    return { kind: 'dilution', startLow: weight / 4, startHigh: weight / 3, max: weight, note: calc.note ?? '' };
  }

  throw new Error(`Unsupported calc.type: ${String(t)}`);
}
```

Note on the `age_band` fixed-dose sub-branch: upstream builds the rule label `${mg} mg/dose`, which is a different unit from `mg/kg/dose`. Represent it as `{ kind: 'band_label', label: \`${mg} mg/dose\` }` when `band.label` is absent (replace the `mg_per_kg_per_dose` fallback in that branch with this). Add a test: `cetirizine_syrup` at age 4 → `rule.kind === 'band_label'` and mgRange `[5, 5]` (check the actual band values in the JSON before asserting).

- [ ] **Step 4: Run → PASS. Commit** `feat(clinical): port calcDose with 12 handlers`

### Task 8: Contraindications, energy, rule text parity

**Files:**
- Create: `src/clinical/contraindications.ts`, `src/clinical/energy.ts`, `src/clinical/ruleText.ts`
- Test: `tests/clinical/contraindications.test.ts`, `tests/clinical/energy.test.ts`

**Interfaces:**
- Produces:
  - `checkContraindication(drug: Drug, weight: number | null, age: number | null): ContraindicationHit | null`
  - `severityBucket(severity: string): SeverityBucket`
  - `energyJoules(e: EnergyDose, weight: number): { low: number; high: number | null }`
  - `ruleToUpstreamText(rule: RuleDescriptor): string` (test helper exported for parity; reproduces the upstream Chinese `rule` string exactly)

- [ ] **Step 1: Failing tests**

```ts
// contraindications.test.ts
import { checkContraindication, severityBucket } from '@/clinical/contraindications';
import type { Drug } from '@/clinical/types';
import dataset from '../../public/data/peds_drugs.json';
const byId = (id: string) => (dataset.drugs as Drug[]).find((d) => d.id === id)!;

test('severity buckets are lossy exactly like upstream', () => {
  expect(severityBucket('禁用')).toBe('severe');
  expect(severityBucket('不建議')).toBe('moderate');
  expect(severityBucket('慎用')).toBe('mild');
  expect(severityBucket('建議改膠囊')).toBe('mild');
});

test('idefen_syrup is contraindicated under 6 months', () => {
  const hit = checkContraindication(byId('idefen_syrup'), 5, 0.1);
  expect(hit?.severity).toBe('severe');
  expect(checkContraindication(byId('idefen_syrup'), 5, 1)).toBeNull();
});

test('no age → no age-based hit', () => {
  expect(checkContraindication(byId('idefen_syrup'), 5, null)).toBeNull();
});
```
```ts
// energy.test.ts
import { energyJoules } from '@/clinical/energy';
test('energy multiplies without ceiling', () => {
  expect(energyJoules({ label: 'x', j_per_kg: 4 }, 40)).toEqual({ low: 160, high: null });
  expect(energyJoules({ label: 'x', j_per_kg: 0.5, high_j_per_kg: 1 }, 12)).toEqual({ low: 6, high: 12 });
});
```

- [ ] **Step 2: Run → FAIL**
- [ ] **Step 3: Implement**

```ts
// src/clinical/contraindications.ts
import type { ContraindicationHit, Drug, SeverityBucket } from './types';

export function severityBucket(sev: string): SeverityBucket {
  if (sev === '禁用') return 'severe';
  if (sev === '不建議') return 'moderate';
  return 'mild';
}

export function checkContraindication(drug: Drug, weight: number | null, age: number | null): ContraindicationHit | null {
  if (!drug.contraindications) return null;
  for (let index = 0; index < drug.contraindications.length; index++) {
    const c = drug.contraindications[index]!;
    const hit = () => ({ index, contraindication: c, severity: severityBucket(c.severity) });
    if (c.type === 'age_below_months' && age != null && age * 12 < (c.threshold_months as number)) return hit();
    if (c.type === 'age_below_years' && age != null && age < (c.threshold_years as number)) return hit();
    if (c.type === 'age_below_weeks' && age != null && age * 52 < (c.threshold_weeks as number)) return hit();
    if (c.type === 'weight_above_kg' && weight != null && weight >= (c.threshold_kg as number)) return hit();
    if (c.type === 'weight_below_kg' && weight != null && weight < (c.threshold_kg as number)) return hit();
  }
  return null;
}
```
```ts
// src/clinical/energy.ts
import type { EnergyDose } from './types';
export function energyJoules(e: EnergyDose, weight: number): { low: number; high: number | null } {
  return { low: e.j_per_kg * weight, high: e.high_j_per_kg ? e.high_j_per_kg * weight : null };
}
```
```ts
// src/clinical/ruleText.ts — reproduces upstream `rule` strings for parity testing only
import type { RuleDescriptor } from './types';
const lh = (low: number, high: number) => `${low}${high !== low ? '-' + high : ''}`;
export function ruleToUpstreamText(r: RuleDescriptor): string {
  switch (r.kind) {
    case 'mg_per_kg_per_dose': return `${lh(r.low, r.high)} mg/kg/dose${r.minMg ? ` (min ${r.minMg} mg)` : ''}${r.maxMg ? ` (max ${r.maxMg} mg/dose)` : ''}`;
    case 'mg_per_kg_per_day': return `${lh(r.low, r.high)} mg/kg/day ÷ ${r.dosesPerDay}`;
    case 'mcg_per_kg_per_dose': return `${lh(r.low, r.high)} mcg/kg/dose`;
    case 'ml_per_kg_per_dose': return `${lh(r.low, r.high)} mL/kg/dose`;
    case 'ml_per_kg_per_day': return `${lh(r.low, r.high)} mL/kg/day ÷ ${r.dosesPerDay}`;
    case 'supp_by_weight': return `BW÷${r.divLow} ~ BW÷${r.divHigh} 顆`;
    case 'pack_per_10kg_per_day': return `${r.packsPer10kg} 包/10kg/day ÷ ${r.dosesPerDay}`;
    case 'pack_per_30kg_per_dose': return 'BW÷30 包/dose TID';
    case 'weight_band': return '依體重分組';
    case 'age_band': return '依年齡分組';
    case 'band_label': return r.label;
    case 'fluid_421': return '4-2-1 rule';
  }
}
```

- [ ] **Step 4: Run → PASS. Commit** `feat(clinical): contraindications, energy, rule text helper`

### Task 9: Full parity test against the golden matrix

**Files:**
- Create: `tests/parity.test.ts`, `src/clinical/index.ts` (barrel)

- [ ] **Step 1: Write the parity test**

```ts
import { readFileSync } from 'node:fs';
import type { GoldenFile } from '../scripts/golden-types';
import dataset from '../public/data/peds_drugs.json';
import { calcDose } from '@/clinical/calcDose';
const golden = JSON.parse(readFileSync('tests/fixtures/upstream-golden.json', 'utf8')) as GoldenFile;
import { formatRange, formatNumber } from '@/clinical/formatNumber';
import { checkContraindication } from '@/clinical/contraindications';
import { energyJoules } from '@/clinical/energy';
import { ruleToUpstreamText } from '@/clinical/ruleText';
import type { Drug, PalsAlgorithm } from '@/clinical/types';

const drugs = new Map((dataset.drugs as Drug[]).map((d) => [d.id, d]));

function toUpstreamShape(r: ReturnType<typeof calcDose>, weight: number | null, age: number | null): Record<string, unknown> {
  switch (r.kind) {
    case 'needs_weight': return { needs_weight: true };
    case 'needs_age': return { needs_age: true };
    case 'dose': {
      const o: Record<string, unknown> = { type: 'dose', rule: ruleToUpstreamText(r.rule) };
      if (r.mgRange) o.mgRange = r.mgRange; if (r.mcgRange) o.mcgRange = r.mcgRange;
      if (r.mlRange) o.mlRange = r.mlRange; if (r.unitRange) o.unitRange = r.unitRange;
      if (r.packsPerDose !== undefined) o.packsPerDose = r.packsPerDose;
      return o;
    }
    case 'band': return { type: 'band', bandText: r.matched ? (r.bandText || '無資料') : '無相符區間', rule: ruleToUpstreamText(r.rule) };
    case 'rate': return { type: 'rate', rate: r.rate, rule: '4-2-1 rule', display: `${formatNumber(r.rate)} mL/hr` };
    case 'dilution': return { type: 'special', text: `起始 ${formatNumber(r.startLow)}-${formatNumber(r.startHigh)} mL，最多 ${formatNumber(r.max)} mL（${r.note}）` };
  }
}

test('every golden case matches the TypeScript engine', () => {
  const failures: string[] = [];
  for (const c of golden.cases) {
    const drug = drugs.get(c.drugId)!;
    const calc = c.indicationIndex === null ? drug.calc! : drug.indications![c.indicationIndex]!.calc;
    const r = calcDose(drug, calc, c.weight, c.age);
    const mine = toUpstreamShape(r, c.weight, c.age);
    const theirs = c.raw;
    if (!deepEqual(mine, theirs)) failures.push(`${c.drugId}[${c.indicationIndex}] w=${c.weight} a=${c.age}\n  mine=${JSON.stringify(mine)}\n  gold=${JSON.stringify(theirs)}`);
    const hit = checkContraindication(drug, c.weight, c.age);
    const mineC = hit ? { index: hit.index, type: hit.contraindication.type, severityClass: hit.severity } : null;
    if (!deepEqual(mineC, c.contra)) failures.push(`contra ${c.drugId} w=${c.weight} a=${c.age}: ${JSON.stringify(mineC)} vs ${JSON.stringify(c.contra)}`);
    if (r.kind === 'dose') {
      if (r.mgRange && formatRange(...r.mgRange) !== c.formatted.mg) failures.push(`fmt mg ${c.drugId} w=${c.weight}`);
      if (r.mlRange && formatRange(...r.mlRange) !== c.formatted.ml) failures.push(`fmt ml ${c.drugId} w=${c.weight}`);
      if (r.unitRange && formatRange(...r.unitRange) !== c.formatted.unit) failures.push(`fmt unit ${c.drugId} w=${c.weight}`);
    }
  }
  expect(failures.slice(0, 20)).toEqual([]);
  expect(failures.length).toBe(0);
});

test('PALS energy matches golden', () => {
  const algos = dataset.pals_algorithms as PalsAlgorithm[];
  for (const g of golden.energy) {
    const e = algos.find((a) => a.id === g.algorithmId)!.energy_doses![g.index]!;
    expect(energyJoules(e, g.weight)).toEqual({ low: g.low, high: g.high });
  }
});
```

`deepEqual` is a key-order-independent structural comparison (write a small recursive helper in the test file or use `node:util`'s `isDeepStrictEqual`). Never compare via `JSON.stringify` — key order differs between upstream and the port. For the contraindication comparison use `isDeepStrictEqual` as well.

- [ ] **Step 2: Run → fix engine until PASS.** Any mismatch is an engine bug, never a fixture edit.
- [ ] **Step 3: Barrel + commit + push Phase 3**

`src/clinical/index.ts` re-exports `calcDose`, `formatNumber`, `formatRange`, `checkContraindication`, `severityBucket`, `energyJoules`, and all types.
```bash
git add -A && git commit -m "test: full upstream parity matrix passes" && git push origin main
```

---

## Phase 4 — i18n framework, filters, state, translation skeletons

### Task 10: Language provider and `t()`

**Files:**
- Create: `src/i18n/index.tsx`, `src/i18n/types.ts`, `src/i18n/ui.th.json`, `src/i18n/ui.en.json`
- Test: `tests/i18n/t.test.tsx`, `tests/i18n/ui-keys.test.ts`

**Interfaces:**
- Produces:
```ts
export type Lang = 'th' | 'en';
export const LANG_STORAGE_KEY = 'pedsdose.lang';
export function LanguageProvider(props: { children: React.ReactNode; initial?: Lang }): JSX.Element;
export function useLang(): { lang: Lang; setLang: (l: Lang) => void };
export function useT(): (key: string, params?: Record<string, string | number>) => string;
export function translate(lang: Lang, key: string, params?: Record<string, string | number>): string; // pure, for tests/scripts
```
- `ui.th.json` and `ui.en.json` are flat `{ "dot.key": "text" }`. `{name}` placeholders. Missing key → returns the key itself and `console.warn` once in dev.

- [ ] **Step 1: Failing tests**

```tsx
// t.test.tsx
import { render, screen, act } from '@testing-library/react';
import { LanguageProvider, useLang, useT } from '@/i18n';

function Probe() { const t = useT(); const { lang, setLang } = useLang();
  return <><span data-testid="lang">{lang}</span><span data-testid="txt">{t('patient.weight')}</span><button onClick={() => setLang('en')}>en</button></>; }

test('defaults to Thai and switches to English, persisting the choice', () => {
  localStorage.clear();
  render(<LanguageProvider><Probe /></LanguageProvider>);
  expect(screen.getByTestId('lang')).toHaveTextContent('th');
  expect(screen.getByTestId('txt')).toHaveTextContent('น้ำหนัก');
  act(() => screen.getByText('en').click());
  expect(screen.getByTestId('txt')).toHaveTextContent('Weight');
  expect(localStorage.getItem('pedsdose.lang')).toBe('en');
  expect(document.documentElement.lang).toBe('en');
});
```
```ts
// ui-keys.test.ts
import th from '@/i18n/ui.th.json'; import en from '@/i18n/ui.en.json';
test('TH and EN UI files have identical key sets', () => {
  expect(Object.keys(th).sort()).toEqual(Object.keys(en).sort());
});
test('no empty UI strings', () => {
  for (const [k, v] of Object.entries({ ...th, ...en })) expect(v, k).not.toBe('');
});
```

- [ ] **Step 2: Implement provider**

```tsx
// src/i18n/index.tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import th from './ui.th.json'; import en from './ui.en.json';
export type Lang = 'th' | 'en';
export const LANG_STORAGE_KEY = 'pedsdose.lang';
const tables: Record<Lang, Record<string, string>> = { th, en };
const warned = new Set<string>();

export function translate(lang: Lang, key: string, params?: Record<string, string | number>): string {
  let s = tables[lang][key] ?? tables.en[key];
  if (s === undefined) { if (import.meta.env.DEV && !warned.has(key)) { warned.add(key); console.warn(`[i18n] missing key: ${key}`); } return key; }
  if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
function readStored(): Lang | null { try { const v = localStorage.getItem(LANG_STORAGE_KEY); return v === 'th' || v === 'en' ? v : null; } catch { return null; } }

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void } | null>(null);
export function LanguageProvider({ children, initial }: { children: React.ReactNode; initial?: Lang }) {
  const [lang, setLangState] = useState<Lang>(() => initial ?? readStored() ?? 'th');
  const setLang = useCallback((l: Lang) => { setLangState(l); try { localStorage.setItem(LANG_STORAGE_KEY, l); } catch { /* ignore */ } }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useLang() { const v = useContext(Ctx); if (!v) throw new Error('useLang outside LanguageProvider'); return v; }
export function useT() { const { lang } = useLang(); return useCallback((key: string, params?: Record<string, string | number>) => translate(lang, key, params), [lang]); }
```

- [ ] **Step 3: Write `ui.th.json` and `ui.en.json`**

Seed from `docs/upstream-analysis/ui-and-strings.md` §12 plus these required keys (identical key set in both files):

```
app.name, app.subtitle, app.version, app.dataReviewed
lang.th, lang.en, lang.switchLabel
patient.title, patient.weight, patient.weightPlaceholder, patient.weightUnit, patient.age, patient.agePlaceholder, patient.ageYears, patient.ageMonths, patient.ageHelper, patient.weightError, patient.ageError, patient.summary
search.placeholder, search.clear, search.empty
tabs.all, tabs.starred, tabs.uri, tabs.age, tabs.antipyretic, tabs.ml_only, tabs.antibiotic, tabs.flu, tabs.sedation, tabs.seizure, tabs.se, tabs.emergency, tabs.pals
category.antipyretic … category.pals_arrest (17)
card.tag.emergency, card.tag.rsi, card.tag.common, card.pin, card.unpin, card.select, card.selected, card.starredGroup
dose.needsWeight, dose.needsAge, dose.total, dose.draw, dose.volume, dose.unitCount, dose.packs, dose.packPerDose, dose.perDose, dose.rate, dose.noMatchingBand, dose.noData, dose.bandByWeight, dose.bandByAge, dose.dilution, dose.mg, dose.mcg, dose.ml, dose.mlPerHr
rule.mg_per_kg_per_dose, rule.mg_per_kg_per_day, rule.mcg_per_kg_per_dose, rule.ml_per_kg_per_dose, rule.ml_per_kg_per_day, rule.supp_by_weight, rule.pack_per_10kg_per_day, rule.pack_per_30kg_per_dose, rule.fluid_421, rule.min, rule.max
contra.title, contra.severe, contra.moderate, contra.mild
warnings.title, notes.title
clinical.title, clinical.use, clinical.contraindications, clinical.adverseEffects, clinical.warnings, clinical.pregnancy, clinical.breastfeeding, clinical.controlledDrug, clinical.monitoring, clinical.expand, clinical.collapse
reference.title, reference.upstreamNote
pals.title, pals.initialSteps, pals.decision, pals.yes, pals.no, pals.drugs, pals.appliedWeight, pals.energy, pals.cpr, pals.reversibleCauses, pals.possibleCauses, pals.refractory, pals.viewFigure, pals.citation, pals.empty
se.title, se.doses, se.decision, se.viewFigure, se.empty, se.stage, se.minutes
disclaimer.short, disclaimer.full, about.title, about.version, about.dataVersion, about.credits, about.creditsText, about.validationStatus, about.validationText, about.close
footer.localOnly, footer.pinHint
error.unableToCalculate, error.reviewSource, error.dataLoad
```

Thai and English values must follow AGENTS.md §9 (medical Thai; abbreviations untranslated). Rule strings use placeholders, e.g. `rule.mg_per_kg_per_day`: TH `{range} mg/kg/day ÷ {doses}`, EN `{range} mg/kg/day ÷ {doses}`; `rule.supp_by_weight`: EN `BW÷{low} to BW÷{high} suppositories`, TH `น้ำหนัก÷{low} ถึง น้ำหนัก÷{high} เม็ดเหน็บ`. `disclaimer.full` uses the exact wording in AGENTS.md §23.

- [ ] **Step 4: Run → PASS. Commit** `feat(i18n): language provider, t(), TH/EN UI strings`

### Task 11: Rule and result formatting for display

**Files:**
- Create: `src/i18n/formatRule.ts`, `src/i18n/formatDose.ts`
- Test: `tests/i18n/formatRule.test.ts`

**Interfaces:**
- Produces:
  - `formatRule(rule: RuleDescriptor, t: TFn): string`
  - `doseRows(drug: Drug, result: DoseResult, t: TFn): DoseRow[]` where
    ```ts
    export type TFn = (key: string, params?: Record<string, string | number>) => string;
    export interface DoseRow { id: 'mg' | 'mcg' | 'ml' | 'unit' | 'packs' | 'rate' | 'band' | 'dilution' | 'needsWeight' | 'needsAge';
      label: string; value: string; unit: string; emphasis: boolean; sub?: string }
    ```
  - Row order and emphasis mirror upstream `renderDoseResult`: mg/mcg row (label `dose.total` + rule sub-text), mL row (label `dose.draw` when `drug.form === 'amp'` or brand includes `Amp`, else `dose.volume`; emphasis), unit row (`dose.unitCount` with `{unit}` = `drug.unit ?? '#'`; emphasis), packs row, rate row, band row (value = translated band text or `dose.noMatchingBand`), dilution row.
  - Values use `formatRange` / `formatNumber` only.

- [ ] **Step 1: Failing test**

```ts
import { formatRule } from '@/i18n/formatRule';
import { doseRows } from '@/i18n/formatDose';
import { translate } from '@/i18n';
const tEn = (k: string, p?: Record<string, string | number>) => translate('en', k, p);
const tTh = (k: string, p?: Record<string, string | number>) => translate('th', k, p);

test('rule text is language specific but numeric-identical', () => {
  const r = { kind: 'mg_per_kg_per_dose', low: 10, high: 15, maxMg: 1000 } as const;
  expect(formatRule(r, tEn)).toBe('10-15 mg/kg/dose (max 1000 mg/dose)');
  expect(formatRule(r, tTh)).toContain('10-15 mg/kg/dose');
});

test('doseRows numeric values are identical across languages', () => {
  const drug = { id: 'x', generic: 'X', brand: 'X syrup', concentration_mg_per_ml: 24, form: 'syrup' } as never;
  const result = { kind: 'dose', mgRange: [100, 150], mlRange: [4.1666, 6.25], rule: { kind: 'mg_per_kg_per_dose', low: 10, high: 15 } } as const;
  const en = doseRows(drug, result, tEn); const th = doseRows(drug, result, tTh);
  expect(en.map((r) => r.value)).toEqual(th.map((r) => r.value));
  expect(en[0]!.value).toBe('100-150'); expect(en[1]!.value).toBe('4.17-6.25'); expect(en[1]!.emphasis).toBe(true);
});
```

- [ ] **Step 2: Implement** (straightforward switch over `rule.kind` using `t('rule.*', {...})`; `doseRows` mirrors upstream `renderDoseResult` order). Band text translation is done by the caller passing an optional `bandTextOverride` — add parameter `opts?: { bandText?: string; dilutionNote?: string }` to `doseRows`.
- [ ] **Step 3: Run → PASS. Commit** `feat(i18n): formatRule and doseRows`

### Task 12: Filters, search, calculator state, starred

**Files:**
- Create: `src/clinical/filters.ts`, `src/hooks/useLocalStorage.ts`, `src/hooks/useStarred.ts`, `src/state/CalculatorProvider.tsx`, `src/data/loadDrugs.ts`, `src/data/schema.ts`
- Test: `tests/clinical/filters.test.ts`, `tests/state/calculator.test.tsx`, `tests/data/schema.test.ts`

**Interfaces:**
- Produces:
```ts
// filters.ts
export type ViewId = 'all' | 'starred' | 'uri' | 'age' | 'antipyretic' | 'ml_only' | 'antibiotic' | 'flu' | 'sedation' | 'seizure' | 'se' | 'emergency' | 'pals';
export const VIEW_ORDER: readonly ViewId[] = ['all','starred','uri','age','antipyretic','ml_only','antibiotic','flu','sedation','seizure','se','emergency','pals'];
export const VIEW_EMOJI: Record<ViewId, string>; // all '🗂️', starred '⭐', uri '🤧', age '🤢', antipyretic '🤒', ml_only '💧', antibiotic '🦠', flu '🤧', sedation '😴', seizure '🫨', se '⚡', emergency '🚨', pals '🫀'
export const ORAL_LIQUIDS_WHITELIST: ReadonlySet<string>; // 6 ids
export function filterByView(drugs: Drug[], view: ViewId, starred: ReadonlySet<string>): Drug[];   // upstream getFiltered view part; 'se'/'pals' return []
export interface SearchIndexEntry { id: string; haystack: string }
export function buildSearchIndex(drugs: Drug[], lang: Lang, categoryLabel: (id: string) => string, drugText: (id: string) => { brand?: string; indicationLabels?: string[] } , aliases: Record<string, string[]>): SearchIndexEntry[];
export function searchDrugs(drugs: Drug[], query: string, index: SearchIndexEntry[]): Drug[];   // case-insensitive substring; excludes kmuh_code
export function groupForDisplay(drugs: Drug[], categories: Category[], starred: ReadonlySet<string>): { starred: Drug[][]; byCategory: { categoryId: string; groups: Drug[][] }[] };  // groups = consecutive group_id merge like upstream renderDrugList; categories sorted by order
// CalculatorProvider.tsx
export interface CalculatorState { weight: number | null; age: number | null; weightInput: string; ageInput: string; search: string; view: ViewId; selectedDrugId: string | null; expandedDetails: ReadonlySet<string> }
export function CalculatorProvider(props: { children: React.ReactNode }): JSX.Element;
export function useCalculator(): CalculatorState & { setWeightInput(s: string): void; setAgeInput(s: string): void; setAgeFromYearsMonths(y: number, m: number): void; setSearch(s: string): void; setView(v: ViewId): void; selectDrug(id: string | null): void; toggleDetail(id: string): void; weightError: boolean; ageError: boolean };
export function parseWeight(s: string): { value: number | null; error: boolean }; // '' → {null,false}; NaN/<=0/>120 → {null,true}
export function parseAge(s: string): { value: number | null; error: boolean };    // '' → {null,false}; NaN/<0/>18 → {null,true}
// useStarred.ts
export const STARRED_KEY = 'pedsdose.starred.v1'; export const LAST_KEY = 'pedsdose.last.v1';
export function useStarred(drugs: Drug[]): { starred: ReadonlySet<string>; toggle(id: string): void };  // seeds from tags starred_default on first run
// loadDrugs.ts
export function loadDrugs(): Promise<DrugDataset>;   // fetch(`${import.meta.env.BASE_URL}data/peds_drugs.json`) then validateDataset
// schema.ts
export function validateDataset(json: unknown): { ok: true; data: DrugDataset } | { ok: false; errors: { drugId: string | null; message: string }[] };
```

- [ ] **Step 1: Failing tests (subset shown; write all)**

```ts
// filters.test.ts
import { filterByView, ORAL_LIQUIDS_WHITELIST, groupForDisplay, searchDrugs, buildSearchIndex } from '@/clinical/filters';
import dataset from '../../public/data/peds_drugs.json';
const drugs = dataset.drugs as never[];
test('ml_only whitelist has 6 ids', () => expect(filterByView(drugs, 'ml_only', new Set()).map((d: { id: string }) => d.id).sort()).toEqual([...ORAL_LIQUIDS_WHITELIST].sort()));
test('emergency view includes rsi and seizure_first_line tags', () => {
  const ids = filterByView(drugs, 'emergency', new Set()).map((d: { tags?: string[] }) => d.tags!);
  expect(ids.every((t) => t.some((x) => ['emergency', 'rsi', 'seizure_first_line'].includes(x)))).toBe(true);
});
test('search ignores kmuh_code', () => {
  const idx = buildSearchIndex(drugs, 'en', () => '', () => ({}), {});
  expect(searchDrugs(drugs, '1ANT60', idx)).toHaveLength(0);
  expect(searchDrugs(drugs, 'acetaminophen', idx).length).toBeGreaterThan(0);
});
test('groupForDisplay merges consecutive group_id and keeps category order', () => {
  const g = groupForDisplay(drugs, dataset.categories as never[], new Set());
  expect(g.byCategory[0]!.categoryId).toBe('antipyretic');
  expect(g.byCategory.flatMap((c) => c.groups).some((grp) => grp.length > 1)).toBe(true);
});
```
```tsx
// calculator.test.tsx
import { renderHook, act } from '@testing-library/react';
import { CalculatorProvider, useCalculator, parseWeight, parseAge } from '@/state/CalculatorProvider';
test.each([['', null, false], ['0', null, true], ['120', 120, false], ['120.1', null, true], ['17.5', 17.5, false], ['abc', null, true]])('parseWeight(%s)', (s, v, e) => expect(parseWeight(s)).toEqual({ value: v, error: e }));
test.each([['', null, false], ['0', 0, false], ['18', 18, false], ['18.5', null, true], ['-1', null, true]])('parseAge(%s)', (s, v, e) => expect(parseAge(s)).toEqual({ value: v, error: e }));
test('years+months helper produces float years', () => {
  const { result } = renderHook(() => useCalculator(), { wrapper: CalculatorProvider });
  act(() => result.current.setAgeFromYearsMonths(2, 6));
  expect(result.current.age).toBe(2.5);
});
```
```ts
// schema.test.ts
import { validateDataset } from '@/data/schema';
import dataset from '../../public/data/peds_drugs.json';
test('canonical dataset validates', () => expect(validateDataset(dataset).ok).toBe(true));
test('unknown calc type fails with drug id', () => {
  const bad = structuredClone(dataset); (bad.drugs[0] as { calc: { type: string } }).calc.type = 'nope';
  const r = validateDataset(bad); expect(r.ok).toBe(false); if (!r.ok) expect(r.errors[0]!.drugId).toBe(dataset.drugs[0]!.id);
});
```

- [ ] **Step 2: Implement.** `schema.ts` uses zod with `.passthrough()` on drug objects; checks: unique ids, `calc.type ∈ CALC_TYPES` (top-level and indications), numeric fields numeric, `low <= high` when both present, concentrations > 0 when present, `doses_per_day > 0`, bands non-empty with numeric bounds, contraindication `type` known. Never mutate. `CalculatorProvider` persists `{weight, age}` to `LAST_KEY` (restore on mount, treat 0 as absent like upstream).
- [ ] **Step 3: Run → PASS. Commit** `feat: filters, search index, calculator state, starred, dataset validation`

### Task 13: Translation skeletons and translation report script

**Files:**
- Create: `scripts/gen-translation-skeleton.ts`, `scripts/translation-report.ts` (thin CLI only), `src/i18n/numericPreservation.ts` (the checker; imported by tests and the CLI), `src/i18n/clinicalKeys.ts`, `src/i18n/drugs/index.ts` (merges every `src/i18n/drugs/th/*.json` into one TH map and every `src/i18n/drugs/en/*.json` into one EN map via `import.meta.glob('./th/*.json', { eager: true })`), `src/i18n/drugs/th/.gitkeep`, `src/i18n/drugs/en/.gitkeep`, `src/i18n/algorithms/index.ts` (same merge for `src/i18n/algorithms/{th,en}/*.json`), `src/i18n/searchAliases.th.json`, `src/i18n/useDrugText.ts`, `src/i18n/useAlgorithmText.ts`
- Test: `tests/i18n/translation-integrity.test.ts`

**Interfaces:**
- Produces:
```ts
// clinicalKeys.ts
export const CLINICAL_KEY_MAP: Record<string, string> = { '臨床用途': 'use', '禁忌': 'contraindications', '副作用': 'adverseEffects', '警語': 'warnings', '懷孕分級': 'pregnancy', '授乳': 'breastfeeding', '管制性藥品': 'controlledDrug' };
export const CLINICAL_KEY_ORDER = ['use','contraindications','adverseEffects','warnings','pregnancy','breastfeeding','controlledDrug'] as const;
// drugs.{th,en}.json shape (one entry per drug id; every field optional; arrays must match source length)
interface DrugTranslation { _meta: { status: 'draft'|'reviewed'|'approved'; reviewedBy: string | null };
  brand?: string; notes?: string; frequency?: string; source?: string; package?: string; unit?: string; urgency_label?: string;
  concentration_note?: string; duration_note?: string; max_per_day_note?: string; monitoring?: string;
  warnings?: string[]; contraindications?: { severity: string; reason: string }[];
  bands?: { dose?: string; label?: string }[];
  indications?: { label?: string; notes?: string; frequency?: string; onset?: string; duration?: string; route?: string }[];
  clinical?: { use?: string; contraindications?: string; adverseEffects?: string; warnings?: string; pregnancy?: string; breastfeeding?: string; controlledDrug?: string };
}
// algorithms.{th,en}.json shape: { _meta, pals: { [algorithmId]: { title, subtitle, steps_initial[], decision_tree: { question, yes: { label, actions?[], branches?: {qrs,label,action}[] }, no: {...} }, energy_doses: { label, note? }[], high_quality_cpr?[], reversible_causes?: { title, h[], t[] }, differentiation?: {...}, refractory_note?, possible_causes?[], figure_label } },
//   se: { title, subtitle, time_stages: { minutes, phase, level?, subtitle?, actions[] }[], decision_label, citation, figure_label } }
// useDrugText.ts
export function useDrugText(): (drug: Drug) => LocalizedDrug;   // LocalizedDrug has the same fields as Drug plus clinical: Record<ClinicalKey,string>, with translated values falling back th→en→canonical
export function localizeDrug(drug: Drug, lang: Lang, th: DrugsFile, en: DrugsFile): LocalizedDrug;  // pure
// useAlgorithmText.ts
export function localizePals(algo: PalsAlgorithm, lang: Lang): PalsAlgorithm; export function localizeSe(se: SeAlgorithm, lang: Lang): SeAlgorithm;
```
- Translation files: `src/i18n/drugs/th/<range>.json` and `src/i18n/drugs/en/<range>.json` (e.g. `01-23.json`, `24-45.json`, `46-67.json`), each `{ "_meta": {...}, "<drugId>": DrugTranslation, ... }`; `src/i18n/algorithms/th/pals.json`, `.../se.json` and the EN equivalents. `src/i18n/drugs/index.ts` exports `drugsTh: Record<string, DrugTranslation>` and `drugsEn` (merged; duplicate ids across files are a test failure). Vitest and Vite both support `import.meta.glob` with `eager: true`.
- `scripts/gen-translation-skeleton.ts` writes `src/i18n/drugs.skeleton.json` and `src/i18n/algorithms.skeleton.json` containing every translatable leaf with its canonical source string. Translation agents copy their id range from the skeleton into their own range file and replace values.
- `src/i18n/numericPreservation.ts` exports `checkNumericPreservation(source: string, translated: string): { ok: boolean; problems: string[] }`. `scripts/translation-report.ts` imports it and prints coverage (drugs total / translated th / en / missing / orphan keys) and runs the numeric-preservation check; exits 1 on any violation. Checker: extract from source and translation the multiset of tokens matching `/\d+(?:\.\d+)?/g`, unit tokens `/\b(mg|mcg|g|mL|L|kg|J|min|hr|h|sec|%|PE)\b/g`, operators `[<>≤≥÷]`, route/frequency tokens `/\b(PO|IV|IO|IM|PR|IN|SC|SL|Q\d+(?:-\d+)?H|QD|BID|TID|QID|PRN|STAT|HS|AC|PC)\b/g`; numbers and operators must match exactly; units and route tokens must match as multisets (case-insensitive for units). Severity: if source severity is `禁用`, translated severity must equal `ui.contra.severe` text of that language; `不建議` → `contra.moderate`.

- [ ] **Step 1: Failing test**

```ts
// translation-integrity.test.ts
import { drugsTh as th, drugsEn as en } from '@/i18n/drugs';
import dataset from '../../public/data/peds_drugs.json';
import { checkNumericPreservation } from '@/i18n/numericPreservation';
test('every translated drug id exists canonically and arrays align', () => {
  const ids = new Set(dataset.drugs.map((d) => d.id));
  for (const file of [th, en]) for (const [id, tr] of Object.entries(file)) {
    if (id === '_meta') continue; expect(ids.has(id), id).toBe(true);
    const d = dataset.drugs.find((x) => x.id === id)!;
    if (tr.warnings) expect(tr.warnings.length).toBe(d.warnings?.length ?? 0);
  }
});
test('numbers, units, operators survive translation', () => {
  expect(checkNumericPreservation('0.5 # BID PC', '0.5 เม็ด BID PC').ok).toBe(true);
  expect(checkNumericPreservation('max 10 mg', 'max 100 mg').ok).toBe(false);
});
```

- [ ] **Step 2: Implement scripts, hooks, and the merge indexes; run `pnpm gen-translation-skeleton`; leave the range directories empty except `.gitkeep` (filled in Phase 6). With no files present the merged maps are `{}` and every field falls back to the canonical string.**
- [ ] **Step 3: Run → PASS. Commit and push Phase 4**

```bash
git add -A && git commit -m "feat(i18n): drug/algorithm translation layer, skeleton generator, coverage report" && git push origin main
```

---

## Phase 5 — UI (parallelizable after Phase 4)

All UI tasks: use `superpowers:frontend-design` guidance and DESIGN.md. Every component receives already-localized text; no component imports `calcDose` except `DrugCard`/`DoseResultCard`/`PALSView`/`SEView` which call it through `useDoseResult(drug, calc)` (Task 14). Touch targets ≥ 44px. Focus rings visible (`focus-visible:ring-2 ring-sky-deep`). All motion via transform/opacity, ≤ 320ms, respects reduced motion. Never convey severity by color alone.

### Task 14: App shell, data loading, header, language switcher

**Files:**
- Create: `src/App.tsx` (replace), `src/components/AppHeader.tsx`, `src/components/LanguageSwitcher.tsx`, `src/components/ErrorCard.tsx`, `src/components/SkeletonCard.tsx`, `src/hooks/useDoseResult.ts`, `src/state/DatasetProvider.tsx`, `tests/utils.tsx`
- Modify: `vite.config.ts` (add `define: { 'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version) }` reading `package.json`)
- Test: `tests/components/AppHeader.test.tsx`, `tests/components/LanguageSwitcher.test.tsx`

**Interfaces:**
- Produces: `DatasetProvider(props: { children; initialData?: DrugDataset })` (when `initialData` is given it skips fetch and is immediately `ready`; otherwise loads via `loadDrugs`), `useDataset(): { status: 'loading' } | { status: 'error'; errors } | { status: 'ready'; data: DrugDataset }`, `useDoseResult(drug: Drug, calc: Calc): DoseResult` (reads weight/age from `useCalculator`), `tests/utils.tsx` exporting `renderWithProviders(ui: ReactElement, opts?: { lang?: Lang; dataset?: DrugDataset; calculator?: Partial<CalculatorState> }): RenderResult` which wraps in `LanguageProvider initial={lang ?? 'th'}` > `DatasetProvider initialData={dataset ?? realDataset}` > `CalculatorProvider initial={calculator}` (add an optional `initial` prop to `CalculatorProvider` if Task 12 did not; `realDataset` is `public/data/peds_drugs.json` imported statically in the test util), `AppHeader` (logo mark 💊 in a soft-sky rounded tile, `app.name`, `app.subtitle`, version badge from `_meta.version`, `LanguageSwitcher`), `LanguageSwitcher` (segmented control `ไทย | EN`, `role="radiogroup"`, `aria-label` = `lang.switchLabel`).
- `App` layout: `LanguageProvider > DatasetProvider > CalculatorProvider > Layout`. Layout: header sticky; `<main>` with `max-w-6xl mx-auto px-4`; grid `lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]` with left column (PatientInput, DrugSearch, CategoryChips, list/PALS/SE) and right column (`SelectedDrugPanel`, sticky on lg). On mobile the right column renders below the list. Footer with `Disclaimer` short text + About button.

- [ ] **Step 1: Tests**: header renders name/subtitle/version; switcher toggles `document.documentElement.lang`; loading shows 3 `SkeletonCard`s; validation error shows `ErrorCard` with `error.dataLoad`.
- [ ] **Step 2: Implement.** Header: `bg-gradient-to-r from-sky-soft via-cream to-lavender-soft`, two decorative blurred blobs (`aria-hidden`, `pointer-events-none`), compact on mobile (≤ 72px tall).
- [ ] **Step 3: Run → PASS. Commit** `feat(ui): app shell, header, language switcher, data loading`

### Task 15: Patient input and summary banner

**Files:**
- Create: `src/components/PatientInput.tsx`, `src/components/WeightInput.tsx`, `src/components/AgeInput.tsx`, `src/components/PatientSummaryBanner.tsx`
- Test: `tests/components/PatientInput.test.tsx`

**Interfaces:**
- Consumes `useCalculator()`.
- `WeightInput`: `<input type="number" inputMode="decimal" step="0.1" min="0" max="120">`, label `patient.weight`, suffix `kg`, `aria-invalid` + error text `patient.weightError` when `weightError`.
- `AgeInput`: primary field years (float, `step="0.1"`, `min=0 max=18`), plus a collapsible helper "ปี + เดือน / years + months" (two integer inputs) that calls `setAgeFromYearsMonths`; the years field always shows the float the engine uses. Error text `patient.ageError`.
- `PatientSummaryBanner`: shows `patient.summary` with `{weight}` and `{age}` only when either is set (mirrors upstream `#weight-summary`), pill style `bg-mint-soft`.

- [ ] **Step 1: Tests**: typing `17.5` sets weight; typing `130` shows error and weight null; typing years 2 months 6 in helper yields age 2.5 and years field shows `2.5`; banner hidden when both empty.
- [ ] **Step 2: Implement** in a white rounded-2xl card with soft shadow, scale icon ⚖️ and baby icon 👶 as small decorative glyphs.
- [ ] **Step 3: Run → PASS. Commit** `feat(ui): patient input with years+months helper`

### Task 16: Search and category chips

**Files:**
- Create: `src/components/DrugSearch.tsx`, `src/components/CategoryChips.tsx`
- Test: `tests/components/DrugSearch.test.tsx`, `tests/components/CategoryChips.test.tsx`

**Interfaces:**
- `DrugSearch`: `<input type="search">` pill, 🔍 icon, clear button (`search.clear`, visible when non-empty), value bound to `useCalculator().search`.
- `CategoryChips`: renders `VIEW_ORDER` as `role="tablist"` of `role="tab"` buttons with `VIEW_EMOJI[view]` + `t('tabs.'+view)`; `aria-selected`; horizontally scrollable with hidden scrollbar on mobile; active chip `bg-sky text-white shadow-soft scale-[1.03]`, inactive `bg-white border border-line`; keyboard ←/→ moves selection.

- [ ] **Step 1: Tests**: 13 tabs in order; clicking `tabs.pals` sets view `pals`; clear button empties search.
- [ ] **Step 2: Implement.** **Step 3: Commit** `feat(ui): search bar and category chips`

### Task 17: Drug list, drug cards, grouped cards, star button

**Files:**
- Create: `src/components/DrugList.tsx`, `src/components/DrugCard.tsx`, `src/components/DrugGroupCard.tsx`, `src/components/DrugFormSection.tsx`, `src/components/StarButton.tsx`, `src/components/TagPills.tsx`, `src/components/MetaRow.tsx`, `src/components/EmptyState.tsx`
- Test: `tests/components/DrugList.test.tsx`

**Interfaces:**
- `DrugList`: uses `filterByView` → `searchDrugs` → `groupForDisplay`; renders starred section header (`card.starredGroup`) then category sections with count `(n)`; empty → `EmptyState` (`search.empty`, small smiling illustration via inline SVG cloud + sparkle). Returns nothing for views `se`/`pals` (those render `SEView`/`PALSView` instead, handled by `App`).
- `DrugCard` (single) and `DrugGroupCard` (members share `group_id`) are **compact** per DESIGN.md §15.2: header = generic name (canonical, never translated), `TagPills` (emergency/rsi/common), `StarButton` per member; per form = `DrugFormSection` containing translated brand, urgency badge, `MetaRow` (route, concentration string, package — dedupe against brand exactly like upstream `buildMetaParts`), a compact contraindication marker (icon + severity label only, when hit), and ONE mini dose line per calc/indication (upstream `miniDoseLine`: `mg (mL)` via `formatRange`; `needs_weight` → `dose.needsWeight`; `needs_age` → `dose.needsAge`; band → band text; rate → `x mL/hr`). Full dose rows, notes, warnings, clinical info and reference are NOT rendered in list cards; they live in `SelectedDrugPanel` (Task 18). Export `MiniDoseLine({ drug, calc })` from `src/components/MiniDoseLine.tsx` for reuse by PALS/SE.
- Clicking a card sets `selectDrug(id)` (whole card is a `button`-like `div role="button" tabIndex=0` with Enter/Space handling; star buttons stop propagation). Selected card gets `ring-2 ring-sky border-sky bg-sky-soft/40` and a small ✓ badge (`card.selected`). Starred → `border-l-4 border-l-butter`; emergency/RSI → `border-l-4 border-l-peach`.
- Cards animate in with `animate-fade-up`.

- [ ] **Step 1: Tests** (use `renderWithProviders` from `tests/utils.tsx`): antipyretic view shows Acetaminophen group card with 2 star buttons; with weight 10 the mini dose line shows `100-150 mg (4.17-6.25 mL)`; selecting a card marks it `aria-pressed`/selected; empty search shows `EmptyState`; list cards do not render the warnings panel or clinical accordion.
- [ ] **Step 2: Implement. Step 3: Commit** `feat(ui): drug list and cards with grouped forms`

### Task 18: Dose result card, alerts, clinical info, reference

**Files:**
- Create: `src/components/SelectedDrugPanel.tsx`, `src/components/DoseResultCard.tsx`, `src/components/DoseRowView.tsx`, `src/components/ContraindicationAlert.tsx`, `src/components/WarningPanel.tsx`, `src/components/ClinicalInfoAccordion.tsx`, `src/components/ReferenceInfo.tsx`
- Test: `tests/components/DoseResultCard.test.tsx`, `tests/components/ContraindicationAlert.test.tsx`

**Interfaces:**
- `SelectedDrugPanel`: reads `selectedDrugId`; if none → friendly empty card (`panel.empty`: "เลือกยาจากรายการ / Pick a medicine from the list" — add this key to both UI files); else renders, for the selected drug and every other member of its `group_id`: `DoseResultCard` (full dose rows via `doseRows`, per-indication blocks with translated label/route/frequency/onset/duration/notes), `ContraindicationAlert` when hit, translated notes, `WarningPanel`, `ClinicalInfoAccordion`, `ReferenceInfo`. This panel is the only place full clinical content renders. Sticky top on `lg`. On mobile, selecting a drug smooth-scrolls to this panel (`scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })`).
- `DoseResultCard`: hierarchy per DESIGN.md §16: drug generic name → brand → each `DoseRowView` (value in `font-num text-3xl md:text-4xl font-bold` for emphasized rows, `text-2xl` otherwise; unit in `text-base text-ink-muted`) → frequency/route chips → rule sub-text → max/min notice (from rule.maxMg/minMg via `rule.max`/`rule.min`). Decoration minimal (no blobs inside).
- `ContraindicationAlert`: props `{ hit: ContraindicationHit; severityLabel: string; reason: string }`; severe = `bg-status-dangerSoft border-status-danger text-status-dangerText` + 🚫 + `contra.severe`; moderate = caution colors + ⚠️ + `contra.moderate`; mild = info colors + ℹ️ + translated raw severity. `role="alert"` for severe.
- `WarningPanel`: list of translated warnings, caution styling, ⚠️ icon, `warnings.title`.
- `ClinicalInfoAccordion`: `<details>`-like button with `aria-expanded`, collapsed by default, 7 fields in `CLINICAL_KEY_ORDER` (+ `monitoring` if present), labels from `clinical.*`, lavender-soft background, expand/collapse with height transition on `max-height`.
- `ReferenceInfo`: `reference.title` + translated `source` + `reference.upstreamNote` (provenance sentence).

- [ ] **Step 1: Tests**: DoseResultCard shows `100-150` and `4.17-6.25` for antiphen_syrup at 10 kg in both languages (assert equal values); severe alert has `role="alert"` and text `contra.severe`; accordion toggles `aria-expanded`.
- [ ] **Step 2: Implement. Step 3: Commit** `feat(ui): dose result card, alerts, clinical info accordion`

### Task 19: PALS view

**Files:**
- Create: `src/components/pals/PALSView.tsx`, `src/components/pals/AlgorithmCard.tsx`, `src/components/pals/DecisionTreeView.tsx`, `src/components/pals/DrugMiniRow.tsx`, `src/components/pals/EnergyRow.tsx`
- Test: `tests/components/PALSView.test.tsx`

**Interfaces:**
- `PALSView`: 3 `AlgorithmCard`s in dataset order using `localizePals`. Sections and order exactly as `docs/upstream-analysis/ui-and-strings.md` §8. `DrugMiniRow(drugId)`: generic (split on `—`, first part), route, and `MiniDoseLine` from Task 17 (upstream `miniDoseLine`; `needs_weight` → `dose.needsWeight`, `needs_age` → empty); for multi-indication drugs one row per indication with the translated indication label (upstream shows ALL indications). Below the rows, when the drug's top-level `calc.max_dose_mg` exists, render the upstream rule note: `{low}-{high} mg/kg, max {max} mg` + (`; min {min} mg` if present) + (`; {frequency}` translated if present) — build it from `RuleDescriptor` fields via `formatRule` plus `rule.max`/`rule.min` strings; never omit it. `EnergyRow`: no weight → `{j}-{high} J/kg`; with weight → `{low}-{high} J` from `energyJoules` + `formatNumber`, note below.
- Decision tree: question box `❓`, YES/NO columns; nodes with `branches` render QRS cards; nodes with `actions` render lists.

- [ ] **Step 1: Tests**: with weight 20, cardiac arrest card shows epinephrine row containing `0.2` mg and energy row `40 J` for 2 J/kg; without weight shows `2 J/kg`.
- [ ] **Step 2: Implement. Step 3: Commit** `feat(ui): PALS algorithms view`

### Task 20: Status epilepticus view

**Files:**
- Create: `src/components/se/SEView.tsx`, `src/components/se/StageCard.tsx`
- Test: `tests/components/SEView.test.tsx`

**Interfaces:**
- `SEView`: title/subtitle from `localizeSe`; vertical timeline of 4 `StageCard`s (colors: sky, mint, peach, lavender soft backgrounds; time pill; phase; level chip; subtitle; numbered actions; drug mini rows reusing `DrugMiniRow`); `se.decision` divider between stages; figure link (external, `rel="noopener noreferrer"`) + citation.

- [ ] **Step 1: Tests**: 4 stages rendered; with weight 20, stage 2 shows lorazepam `2 mg` and `0.5 mL`-ish line (compute from JSON concentration; assert the `formatRange` value).
- [ ] **Step 2: Implement. Step 3: Commit** `feat(ui): status epilepticus timeline view`

### Task 21: Disclaimer, About dialog, footer, responsive pass

**Files:**
- Create: `src/components/Disclaimer.tsx`, `src/components/AboutDialog.tsx`, `src/components/AppFooter.tsx`
- Modify: `src/App.tsx`
- Test: `tests/components/AboutDialog.test.tsx`, `tests/app.test.tsx`

**Interfaces:**
- `AboutDialog`: native `<dialog>` with `aria-labelledby`; sections: app version (package.json version via `import.meta.env.VITE_APP_VERSION` set in vite config from package.json), data version (`_meta.version`, `_meta.last_updated`), `about.creditsText` ("Based on the open-source peds-dose project by xyzKIWI. Modified for Thai/English bilingual use." + MIT + reference sources list from README §13), `about.validationText` ("NOT YET APPROVED FOR PRODUCTION USE"), full disclaimer, close button.
- `AppFooter`: `disclaimer.short`, `footer.localOnly`, About button, upstream link.
- `tests/app.test.tsx` full-flow: load dataset (mock fetch with the real file), type weight 18 and age 5, search "amox", select the card, assert result numbers, switch to EN, assert same numbers and that weight/age/search/selection persist.

- [ ] **Step 1: Tests. Step 2: Implement. Step 3: Responsive check**: run `pnpm dev`, open in the Browser pane at 360, 768, 1024, 1440 widths, confirm no horizontal scroll, chips scroll, result panel prominent; fix issues.
- [ ] **Step 4: Commit and push Phase 5** `feat(ui): about, disclaimer, footer; responsive pass` + `git push origin main`

---

## Phase 6 — Translations (parallelizable: 4 agents)

Each translation task: copy entries from `src/i18n/drugs.skeleton.json` for the assigned ids into its own range files `src/i18n/drugs/th/<range>.json` and `src/i18n/drugs/en/<range>.json` (never touch another range's file), translate per AGENTS.md §9–10 and §19 (never soften/strengthen severity; numbers/units/operators untouched; keep PO/IV/BID etc.; brand names not translated, institution-specific Chinese brand suffixes may be dropped from `brand` only if the Latin brand + strength remain), set `_meta.status: "draft"`, then run `pnpm translation-report` and `pnpm test tests/i18n` until green. Unclear source strings: keep the canonical string and add `"_review": "reason"` next to the field instead of guessing.

### Task 22: Drug text TH+EN — drugs 1–23 (dataset order) → `src/i18n/drugs/{th,en}/01-23.json`
### Task 23: Drug text TH+EN — drugs 24–45 → `src/i18n/drugs/{th,en}/24-45.json`
### Task 24: Drug text TH+EN — drugs 46–67 → `src/i18n/drugs/{th,en}/46-67.json`
### Task 25: PALS + SE algorithm text TH+EN (`src/i18n/algorithms/{th,en}/pals.json`, `.../se.json`) and `searchAliases.th.json` (Thai synonyms for common generics only where a standard Thai spelling is well established, e.g. พาราเซตามอล → acetaminophen ids, อะม็อกซีซิลลิน → amoxicillin ids; keep the list short and mark `_meta.status: draft`)

- [ ] For each: fill translations → `pnpm translation-report` → `pnpm test` → commit `i18n: translate drugs N–M (draft)`; after all four merge: `git push origin main`.

---

## Phase 7 — Docs, integration, deploy

### Task 26: Documentation

**Files:** Modify `README.md`, `TRANSLATION.md`, `CLINICAL_VALIDATION.md`, `CHANGELOG.md`

- README: TH + EN sections covering what/bilingual/run/build/deploy/attribution/disclaimer/provenance/validation status (AGENTS.md §38). TRANSLATION.md: canonical strategy, file structure, how to add/edit, how to run `translation-report`, immutable fields list. CLINICAL_VALIDATION.md: add the translation coverage numbers from the report output. CHANGELOG: `0.1.0` entry.
- [ ] Commit `docs: README, TRANSLATION, CLINICAL_VALIDATION, CHANGELOG`

### Task 27: Language-invariance and state-preservation acceptance tests

**Files:** `tests/language-invariance.test.ts`, `tests/state-preservation.test.tsx`

- `language-invariance.test.ts`: for every drug/indication and a weight/age sample (`[5, 12.5, 25, 70] × [0.5, 3, 10]`), build `doseRows` in TH and EN and assert `value`, `unit`-independent numerics and `id` sequences identical; assert `checkContraindication` hits identical (they don't depend on language, but the test documents the invariant).
- `state-preservation.test.tsx`: full app; set weight/age/search/view/selection/expanded details; switch language; assert all unchanged.
- [ ] Commit `test: language invariance and state preservation acceptance tests`

### Task 28: Build, GitHub Pages deploy workflow, final push

**Files:** `.github/workflows/deploy.yml`, `vite.config.ts` (define `VITE_APP_VERSION`), `public/404.html` (copy of index for SPA fallback not needed; no routing — skip), `CHANGELOG.md`

- Workflow: on push to `main`: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test`, `pnpm build`, upload `dist` with `actions/upload-pages-artifact@v3`, deploy with `actions/deploy-pages@v4`. Note for the owner: GitHub Pages must be set to "Source: GitHub Actions" in the repository settings; only the owner can do that.
- Grep `dist/` for `eval(`, `docs.google.com`, `fetch(` targets other than `data/peds_drugs.json`: must be none.
- [ ] Run full suite: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Commit `ci: GitHub Pages deploy workflow` and `git push origin main`.
- [ ] Verify the Definition of Done checklist in AGENTS.md §44 line by line and record it in `CHANGELOG.md`.

---

## Self-review notes

- Spec §5 validation → Task 12; §6 engine → Tasks 5–8; §7 golden → Tasks 4, 9; §8 translation architecture → Tasks 10, 11, 13, 22–25; §9 UI → Tasks 14–21; §10 state → Task 12; §11 non-parity → Task 2 (UPSTREAM.md) and Task 12 (search excludes kmuh_code); §12 docs → Tasks 3, 26; §13 tests → spread; §14 plan shape → phase map.
- Type names used consistently: `DoseResult`, `RuleDescriptor`, `ContraindicationHit`, `SeverityBucket`, `ViewId`, `TFn`, `DoseRow`, `Lang`.
- Known open point for the engine implementer: the `age_band` fixed-dose sub-branch rule label (`${mg} mg/dose`) is modelled as `band_label`; confirm with the golden `rule` strings in Task 9.
