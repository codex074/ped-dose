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
