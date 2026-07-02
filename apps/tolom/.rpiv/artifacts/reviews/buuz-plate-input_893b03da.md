---
commit: 893b03da
date: 2026-06-04
reviewer: pi-agent
status: needs_changes
verification: V9 W1 F0
scope: 893b03da
---

# Code Review: Buuz phonetic plate input with keyboard overlay hint

## Summary

Adds a `<PlateInput>` component with a Buuz phonetic keyboard overlay, replaces 5 raw `<Input>` plate fields across the codebase, updates the Latin→Cyrillic mapping from visual-lookalike to Buuz phonetic, and adds a SQL migration for DB-side transliteration.

**3 critical issues found** — the SQL migration has incorrect mappings, old data is invisible under the new mapping, and the mapping is triplicated with one copy diverging.

## 🔴 Critical

### I1 — SQL `translate_plate()` has 3 wrong mappings (P/Q swapped, E→Е not Э) [cascade: contradictory-predicate-deadlock]

The SQL target string `'АБЦДЕФГХИЖКЛМНОӨПРСТУВҮХЫЗ'` maps by position, but positions 4, 15, 16 are wrong:

| Position | Latin | SQL maps to | JS Buuz maps to |
|----------|-------|-------------|-----------------|
| 4 | E | Е | **Э** |
| 15 | P | Ө | **П** |
| 16 | П | П | **Ө** |

`supabase/migrations/20260604021129_add_translate_plate.sql:18-19` — `'АБЦДЕФГХИЖКЛМНОӨПРСТУВҮХЫЗ'` — positions 4/15/16 produce wrong Cyrillic

`src/lib/form-validation.ts:58` — `E: "Э"` — JS says E→Э

`src/lib/form-validation.ts:66-67` — `Q: "Ө", P: "П"` — JS says Q→Ө, P→П

**Impact**: Any direct SQL insert containing E, P, or Q (e.g. `INSERT INTO vehicles (plate_number) VALUES ('4444PEQ')`) produces different Cyrillic than the JS `transliterateMongolianPlate` function. The backfill migration also uses this function, so rows with remaining Latin E/P/Q will be transliterated incorrectly. This is a silent data corruption — two different plate strings for the same physical plate.

**Fix**: Correct the SQL target string to `'АБЦДЕФГХИЖКЛМНОПӨРСТУВҮХЫЗ'` (swap positions 15↔16, fix position 4 to Э).

---

### I2 — Old-mapping rows invisible to Buuz-based search [cascade: stranded-state]

The previous migration (`20260524114223`) normalized plates using a visual-lookalike mapping: `translate('ABCEHKMOPTXY', 'АВСЕНКМОРТХУ')` producing B→В, C→С, E→Е, H→Н. These rows are now fully Cyrillic and the new backfill's `WHERE plate_number ~ '[A-Z]'` skips them.

`supabase/migrations/20260524114223_normalize_plate_numbers.sql:22-24` — old mapping: `translate(plate_number, 'ABCEHKMOPTXY', 'АВСЕНКМОРТХУ')`

`supabase/migrations/20260604021129_add_translate_plate.sql:49` — `where plate_number ~ '[A-Z]'` — only catches rows still containing Latin

`src/lib/services/bay-view-actions.ts:398` — `plate_number.ilike.%${term}%` — search term is Buuz-transliterated

**Reproducer**: User typed "1234BCN" → old migration stored "1234ВСН". Now user searches "1234BCN" → JS produces "1234БЦН" → `ilike` against "1234ВСН" → no match → vehicle unfindable.

**Fix**: The backfill needs to re-normalize ALL rows (remove the `[A-Z]` filter), or add a one-time script that maps old-mapping characters back to Latin before re-running the new normalization. Example: `UPDATE vehicles SET plate_number = normalize_plate(translate(plate_number, 'АВСЕНКМОРТХУ', 'ABCEHKMOPTXY')) WHERE plate_number ~ '[А-Я]'`.

---

### I5 — Buuz mapping triplicated; SQL copy diverges; no consistency tests [cascade: contradictory-predicate-deadlock]

The Buuz phonetic mapping exists in 3 places. Two agree; the SQL copy diverges (see I1):

`src/lib/form-validation.ts:54-81` — `LATIN_TO_CYRILLIC` (source of truth, 26 entries)

`src/components/ui/plate-input.tsx:14-56` — `BUUZ_ROWS` (display mirror, agrees)

`supabase/migrations/20260604021129_add_translate_plate.sql:18-19` — SQL `translate_plate` (P/Q/E wrong)

The comment at `add_translate_plate.sql:7` claims "This mirrors the LATIN_TO_CYRILLIC map in src/lib/form-validation.ts" — this is false.

**Impact**: Any future mapping change must update all 3 locations. The SQL copy already diverged on the same day the mapping was created. Without cross-checking tests, this class of bug is invisible.

**Fix**: Correct the SQL mapping (I1). Add a test that calls both `transliterateMongolianPlate('ABCDEFGHIJKLMNOPQRSTUVWXYZ')` and `SELECT translate_plate('ABCDEFGHIJKLMNOPQRSTUVWXYZ')` and asserts identical output.

---

## 🟡 Important

### Q4 — Two consumers duplicate transliteration instead of using PlateInput

`src/components/bay-view-v2/_plate-search-input.tsx:58-61` — `formatPlateInput(transliterateMongolianPlate(e.target.value))` inline

`src/components/bay-view-v2/vehicle-registration-dialog.tsx:533-536` — same pattern inline

`src/components/ui/plate-input.tsx:106` — canonical `formatPlateInput(transliterateMongolianPlate(e.target.value))` inside the component

Both files use raw `<Input>` with the transliteration pipeline copy-pasted instead of using `<PlateInput>`. Any change to the pipeline (e.g. adding analytics, format enforcement) would not propagate to these two locations.

---

### Q6 — Tooltip in vehicle-form shows old visual mapping; PlateInput applies Buuz

`src/components/vehicles/vehicle-form.tsx:856-858` — tooltip shows `A→А B→В C→С E→Е H→Н K→К M→М N→Н O→О P→Р T→Т U→У V→В X→Х Y→Ү` (old visual mapping)

`src/components/ui/plate-input.tsx:14-56` — `BUUZ_ROWS` defines Buuz phonetic mapping (B→Б, C→Ц, E→Э, H→Х)

The user reads the tooltip, sees "B→В", types "B", and gets "Б" from PlateInput. Two hints in the same form field contradict each other.

---

### Q2 — JS validation accepts Ң; DB CHECK constraint excludes it

`src/lib/form-validation.ts:111` — `/^\d{4}[А-ЯӨҮҢ]{3}$/` — regex includes Ң (U+04A2)

`supabase/migrations/20260524114223_normalize_plate_numbers.sql:65` — CHECK constraint `[АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯӨҮ]` omits Ң

Currently unreachable through the standard Buuz pipeline (no Latin letter maps to Ң), but a latent mismatch between JS and DB validation layers.

---

## 🔵 Low

### Q5 — Backfill skips old-mapping rows [subsumed-by I2]

`supabase/migrations/20260604021129_add_translate_plate.sql:49` — `WHERE plate_number ~ '[A-Z]'` only catches rows still containing Latin; rows already transliterated by old mapping are skipped. Same root cause as I2.

---

### Q7 — No tests for PlateInput, transliterateMongolianPlate with Buuz, or SQL translate_plate

No test files exist for `transliterateMongolianPlate`, `PlateInput`, or `translate_plate`. The P/Q/E bug (I1) would have been caught by a simple cross-check test.

---

### G1 — `_plate-search-input.tsx` is dead code

`src/components/bay-view-v2/_plate-search-input.tsx:29` — `PlateSearchInput` is exported but never imported by any file in the project. Modified in this commit but unreachable at runtime.

---

## Precedents

| Hash | Subject | 30d-follow-ups | Note |
|------|---------|----------------|------|
| `943c692f` | vehicle form validation UX — plate hint | 2 | Same-day iteration: hint added → mappings fixed → visibility fixed → extracted to component |
| `2e69248c` | SmartCar dimensions migration | 1 (+13min) | Multi-layer commit (migration + form + service) introduced INNER JOIN regression in unrelated query |

**Composite lessons**: (1) Migration + UI commits that change normalization logic are silent data breaks. (2) Features iterating 3+ times in one day should be extracted to a component (done here, but mapping duplication defeats the extraction).

## Reconciliation Notes

- I3 (BuuzHint overlap) **demoted to 💭** — `PlateSearchInput` is dead code (G1), so the overlap never manifests at runtime
- Q5 **subsumed by I2** — same root cause (backfill skips old-mapping rows)
- I1, I2, I5 are **precedent-weighted** (Precedent 2: multi-layer migration commits cause regressions within 13 min)
