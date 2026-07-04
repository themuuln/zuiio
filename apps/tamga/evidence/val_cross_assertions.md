# Cross-Area Behavioral Assertions — DRY/CLEAN Refactoring

> These assertions validate that the refactoring _as a whole_ succeeded — no regressions,
> all new abstractions are actually adopted, and the project's quality baselines are
> preserved.

---

### VAL-CROSS-010: Test baseline preserved

**Assertion:** `flutter test` passes with exactly 2261 tests (no regressions, no new
failures, no skipped tests lost). Run `flutter test` and verify total count.

**Verification:**

```bash
flutter test 2>&1 | tail -5
# Expected: "+2261 ~1: All tests passed!"
```

**Scope:** All feature areas — horses, health, events, market, map, auth, breeding,
nutrition, training, certificates, documents, teams, races, shared, core.

---

### VAL-CROSS-011: Analysis baseline preserved

**Assertion:** `dart analyze` reports 0 errors and 0 warnings across the entire project.

**Verification:**

```bash
dart analyze 2>&1
# Expected: "No issues found!"
```

**Scope:** Whole project source tree — confirms no broken imports, no type mismatches,
no unused references were introduced during refactoring.

---

### VAL-CROSS-012: Isar code generation succeeds

**Assertion:** `dart run build_runner build --delete-conflicting-outputs` exits with
code 0. All Isar schema changes compile correctly.

**Verification:**

```bash
dart run build_runner build --delete-conflicting-outputs 2>&1
# Expected: exit code 0, no build failures.
```

**Scope:** All 15 Isar schemas across all features.

---

### VAL-CROSS-013: Supabase repository mixin adopted

**Assertion:** Every Supabase repository implementation uses the extracted
`SupabaseRepositoryMixin` (or equivalent shared base class/helper) rather than
duplicating `_wrap()` / `_noClient()` / `_userId` boilerplate inline.

**Verification:** Grep for each Supabase repository file to confirm the mixin is
imported and applied. Count files that still define `_wrap()` directly — should be 0.

```bash
# All Supabase repos should import the mixin, not define _wrap inline
rg "mixin SupabaseRepositoryMixin" lib/src/features/*/data/supabase_*_repository.dart | wc -l
# Expected: 15 (one per Supabase repo)

# No file should define _wrap inline anymore
rg "AppException _wrap" lib/src/features/*/data/supabase_*_repository.dart || echo "0 inline definitions — PASS"
```

**Target files (15 repos):**
`horses`, `health`, `events`, `nutrition`, `training`, `market`, `teams`,
`documents`, `breeding`, `certificates`, `lineage`, `payments`, `races`,
`race_videos`, `ai`.

---

### VAL-CROSS-014: Local repository base class adopted

**Assertion:** Every local Isar repository uses the `LocalRepository<T, TIsar>` base
class (or equivalent) instead of hand-rolling Isar CRUD, sync queue enqueue, and
`toDomain()` mapping in each file.

**Verification:** Grep for each local repository file to confirm it extends/uses the
shared base. Count files that directly instantiate `IsarStorage` or repeat `save()`
signatures — should be 0 for refactored repos.

```bash
# Check how many local repos extend the shared base
rg -l "extends LocalRepository" lib/src/features/*/data/local_*_repository.dart | wc -l
# Expected: all local repos (8+)

# No file should manually call syncQueue.enqueue() — handled by base class
rg "syncQueue\.enqueue" lib/src/features/*/data/local_*_repository.dart || echo "0 direct enqueue calls — PASS"
```

**Target files (8 repos):**
`health`, `events`, `horses`, `documents`, `market`, `training`, `nutrition`, `teams`.

---

### VAL-CROSS-015: Feature card widgets compose with TamgaCard

**Assertion:** All feature-level card widgets (`event_card.dart`, `lost_horse_card.dart`,
`health_log_card.dart`) use `TamgaCard` as their base container instead of building
from scratch with raw `Container` + `BoxDecoration`.

**Verification:** Grep confirms each file imports `TamgaCard` from core and wraps
its content in `<TamgaCard>`. Count files that still define standalone
`Container(boxDecoration: BoxDecoration(...))` at the widget root — should be 0.

```bash
# All three card files should import TamgaCard
rg "tamga_card" lib/src/features/events/presentation/widgets/event_card.dart
rg "tamga_card" lib/src/features/map/presentation/widgets/lost_horse_card.dart
rg "tamga_card" lib/src/features/horses/presentation/widgets/health_log_card.dart
# Each should show "import 'package:tamga/src/core/widgets/tamga_card.dart'"
```

**Target files:**

- `lib/src/features/events/presentation/widgets/event_card.dart`
- `lib/src/features/map/presentation/widgets/lost_horse_card.dart`
- `lib/src/features/horses/presentation/widgets/health_log_card.dart`

---

### VAL-CROSS-016: Duplicate enums consolidated

**Assertion:** All enum duplications identified in the duplication report are
resolved. Specifically:

- `HorseMarkerType` is defined **once** in `map_enums.dart` and imported by
  `horse_marker.dart` (not redefined).
- `MedicalLogType` is removed; all code uses `LogType` from
  `shared/domain/health_log.dart`.
- `OnboardingData.horseGender` uses `HorseGender?` from `shared/domain/horse.dart`
  instead of `String?`.

**Verification:**

```bash
# HorseMarkerType should only appear once as a definition
rg "enum HorseMarkerType" lib/ | wc -l
# Expected: 1 (in map_enums.dart)

# MedicalLogType should no longer exist
rg "enum MedicalLogType" lib/ || echo "MedicalLogType removed — PASS"

# OnboardingData should use HorseGender type, not String
rg "horseGender" lib/src/features/onboarding/domain/onboarding_data.dart
# Expected: "HorseGender? horseGender"
```

---

### VAL-CROSS-017: No new duplication introduced

**Assertion:** After refactoring, `git diff` (or the full codebase via lint) shows
no new instances of the patterns that were being eliminated — i.e., no new inline
`_wrap()` definitions, no new raw `Container`+`BoxDecoration` card roots, no new
standalone `enum` that duplicates an existing shared enum.

**Verification:** Run the same detection commands as VAL-CROSS-013 through
VAL-CROSS-016 and confirm counts are at or below the expected baselines. Also run:

```bash
# No new Supabase repo files that lack the mixin
rg -L "SupabaseRepositoryMixin" lib/src/features/*/data/supabase_*_repository.dart
# Expected: empty (all repos use the mixin)

# No new raw Container+BoxDecoration card roots in feature widgets
rg "Container\(.*\n.*BoxDecoration" lib/src/features/*/presentation/widgets/*card*.dart
# Expected: empty (all cards use TamgaCard)
```

---

## Summary Table

| ID            | Assertion                                                                   | Verification method       |
| ------------- | --------------------------------------------------------------------------- | ------------------------- |
| VAL-CROSS-010 | Test baseline preserved — 2261 tests pass                                   | `flutter test`            |
| VAL-CROSS-011 | Analysis baseline preserved — 0 errors, 0 warnings                          | `dart analyze`            |
| VAL-CROSS-012 | Isar code generation succeeds                                               | `build_runner build`      |
| VAL-CROSS-013 | Supabase repository mixin adopted across all 15 repos                       | `rg` for mixin imports    |
| VAL-CROSS-014 | Local repository base class adopted across all 8 repos                      | `rg` for base class usage |
| VAL-CROSS-015 | Feature card widgets compose with TamgaCard                                 | `rg` for imports          |
| VAL-CROSS-016 | Duplicate enums consolidated (HorseMarkerType, MedicalLogType, HorseGender) | `rg` for enum definitions |
| VAL-CROSS-017 | No new duplication introduced by refactoring                                | `rg` for baseline checks  |
