# Dead Code & Small Dedup — Milestone 1 Assertions

> Validation contract for DRY/CLEAN refactoring milestone. All assertions are black-box behavioral checks verifiable via `dart analyze`, `flutter test`, and `grep`.

---

## MedicalLog / MedicalLogType → HealthLog / LogType (Tasks 1–3)

### VAL-DEAD-001: MedicalLog class deleted

The `MedicalLog` class no longer exists anywhere in `lib/`.
Verification: `grep -rn 'class MedicalLog' lib/` returns zero results.

### VAL-DEAD-002: MedicalLogType enum deleted

The `MedicalLogType` enum no longer exists anywhere in `lib/`.
Verification: `grep -rn 'enum MedicalLogType' lib/` returns zero results.

### VAL-DEAD-003: IsarMedicalLog schema file deleted

The file `lib/src/features/shared/data/isar_schemas/isar_medical_log.dart` no longer exists.
Verification: `test -f lib/src/features/shared/data/isar_schemas/isar_medical_log.dart` returns non-zero exit code.

### VAL-DEAD-004: IsarMedicalLog-generated file deleted

The generated file `lib/src/features/shared/data/isar_schemas/isar_medical_log.g.dart` no longer exists.
Verification: `test -f lib/src/features/shared/data/isar_schemas/isar_medical_log.g.dart` returns non-zero exit code.

### VAL-DEAD-005: No imports of MedicalLog remain in lib/

No source file under `lib/` imports `health_record.dart` for the purpose of using `MedicalLog` or `MedicalLogType`. All former consumers now import `health_log.dart` from `shared/domain/`.
Verification: `grep -rn 'MedicalLog' lib/ --include='*.dart'` returns zero results (generated `.g.dart` files also deleted, so no false positives).

### VAL-DEAD-006: IsarMedicalLog removed from IsarDatabase

The `IsarMedicalLog` schema is no longer registered in `IsarDatabase` (`lib/src/core/storage/isar_database.dart`).
Verification: `grep -n 'isar_medical_log' lib/src/core/storage/isar_database.dart` returns zero results.

### VAL-DEAD-007: IsarMedicalLog removed from IsarStorage

The `IsarMedicalLog` collection accessor is no longer present in `lib/src/features/shared/data/isar_storage.dart`.
Verification: `grep -n 'isar_medical_log\|MedicalLog' lib/src/features/shared/data/isar_storage.dart` returns zero results.

### VAL-DEAD-008: horse_health_tab.dart migrated to LogType

The file `lib/src/features/horses/presentation/horse_health_tab.dart` no longer references `MedicalLogType`; it uses `LogType` from `shared/domain/health_log.dart`.
Verification: `grep -n 'MedicalLogType' lib/src/features/horses/presentation/horse_health_tab.dart` returns zero results, while `grep -n 'LogType|HealthLog'` shows the replacements.

### VAL-DEAD-009: health_log_card.dart migrated to LogType

The file `lib/src/features/horses/presentation/widgets/health_log_card.dart` no longer references `MedicalLogType`.
Verification: `grep -n 'MedicalLogType' lib/src/features/horses/presentation/widgets/health_log_card.dart` returns zero results.

### VAL-DEAD-010: add_health_log_screen.dart migrated to HealthLog/LogType

The file `lib/src/features/horses/presentation/add_health_log_screen.dart` uses `HealthLog` and `LogType` from `shared/domain/health_log.dart`, not `MedicalLog`/`MedicalLogType`.
Verification: `grep -n 'MedicalLog' lib/src/features/horses/presentation/add_health_log_screen.dart` returns zero results.

### VAL-DEAD-011: health_logs_screen.dart migrated to HealthLog

The file `lib/src/features/horses/presentation/health_logs_screen.dart` uses `HealthLog` from `shared/domain/health_log.dart` and no longer references `MedicalLog`.
Verification: `grep -n 'MedicalLog' lib/src/features/horses/presentation/health_logs_screen.dart` returns zero results.

### VAL-DEAD-012: local_health_repository.dart (horses/feature) migrated to HealthLog

The file `lib/src/features/horses/data/local_health_repository.dart` uses `HealthLog`/`LogType`/`IsarHealthLog` instead of `MedicalLog`/`MedicalLogType`/`IsarMedicalLog`. All method names and types are updated.
Verification: `grep -n 'MedicalLog\|IsarMedicalLog' lib/src/features/horses/data/local_health_repository.dart` returns zero results; `grep -n 'HealthLog\|IsarHealthLog'` shows active usage.

### VAL-DEAD-013: Tests migrated away from MedicalLog/MedicalLogType

Test files no longer reference `MedicalLog` or `MedicalLogType`:

- `test/shared/domain/health_log_test.dart` — medical-specific group removed
- `test/local_repositories_test.dart` — no `MedicalLog` usage
  Verification: `grep -rn 'MedicalLog\|MedicalLogType' test/` returns zero results.

---

## Duplicate HorseMarkerType (Task 4)

### VAL-DEAD-014: Duplicate HorseMarkerType removed from horse_marker.dart

The `enum HorseMarkerType` definition is removed from `lib/src/features/map/presentation/widgets/horse_marker.dart`. The file imports `HorseMarkerType` from `lib/src/features/map/domain/map_enums.dart` instead.
Verification: `grep -n 'enum HorseMarkerType' lib/src/features/map/presentation/widgets/horse_marker.dart` returns zero results; `grep -n 'import.*map_enums' lib/src/features/map/presentation/widgets/horse_marker.dart` shows the new import.

---

## kRaceCategories relocation (Task 5)

### VAL-DEAD-015: kRaceCategories moved to core/constants/race_categories.dart

The `kRaceCategories` constant is no longer defined in `lib/src/features/race_videos/domain/race_video.dart`. It lives in `lib/src/core/constants/race_categories.dart`.
Verification: `grep -n 'kRaceCategories' lib/src/features/race_videos/domain/race_video.dart` returns zero results; `grep -zn 'kRaceCategories' lib/src/core/constants/race_categories.dart` returns results.

### VAL-DEAD-016: All consumers import kRaceCategories from new location

All files that reference `kRaceCategories` import it from `lib/src/core/constants/race_categories.dart`, not from `race_video.dart`.
Verification: Run `grep -rn 'kRaceCategories' lib/` and confirm no result points to `race_video.dart` as the source.

---

## OnboardingData.horseGender type fix (Task 6)

### VAL-DEAD-017: OnboardingData.horseGender uses HorseGender enum

The `horseGender` field in `OnboardingData` (`lib/src/features/onboarding/domain/onboarding_data.dart`) has type `HorseGender?` instead of `String?`. All serialization/deserialization in `toMap()`/`fromMap()` uses `HorseGender.fromString()` and `.name`.
Verification: `grep -n 'final String? horseGender' lib/src/features/onboarding/domain/onboarding_data.dart` returns zero results; `grep -n 'final.*horseGender' lib/src/features/onboarding/domain/onboarding_data.dart` shows `HorseGender?` type.

### VAL-DEAD-018: All consumers pass HorseGender, not String

All callers of `OnboardingData` constructor, `copyWith`, or serialization methods pass `HorseGender` enum values rather than raw strings.
Verification: `dart analyze lib/` produces zero errors related to type mismatch on `horseGender`.

---

## Compilation Integrity

### VAL-DEAD-019: Project compiles after all changes

The entire project passes `dart analyze` with zero errors.
Verification: `dart analyze lib/` exits with code 0.

### VAL-DEAD-020: Tests pass after all changes

All existing tests pass with `flutter test`.
Verification: `flutter test` exits with code 0.
