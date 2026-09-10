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
| peds_drugs.json | public/data/peds_drugs.json | byte-identical, SHA-256 `52c9ddcc16ba189f13b3468637aa512ae1018b8c8263a9693d5ae586ea01ac33` |
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
