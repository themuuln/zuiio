# Validation Contract: DRY/CLEAN Refactoring Assertions

> Generated: 2026-06-19
> Total assertions: 13

---

## Area 1: Widget Consolidation (Milestone 3)

Prefix: `VAL-WIDGET-`

### Current State Summary

| Widget                    | Current Pattern                        | Target Pattern                  | Status               |
| ------------------------- | -------------------------------------- | ------------------------------- | -------------------- |
| `EventCard`               | Raw `Card` + `InkWell` + `Padding`     | `TamgaCard`                     | ❌ Needs refactor    |
| `LostHorseCard`           | Already uses `TamgaCard`               | `TamgaCard`                     | ✅ Already compliant |
| `HealthLogCard`           | Raw `Card` + `InkWell` + `Padding`     | `TamgaCard`                     | ❌ Needs refactor    |
| `StatCard` (analytics)    | Raw `Card` + elevation + raw `Padding` | `TamgaSummaryCard`              | ❌ Needs refactor    |
| `ListingBadge._BadgeChip` | Raw `Container` + `BoxDecoration`      | `TamgaBadge` / `TamgaColorChip` | ❌ Needs refactor    |

### Assertions

**VAL-WIDGET-001 — EventCard composes with TamgaCard**

- File: `lib/src/features/events/presentation/widgets/event_card.dart`
- The `EventCard.build` method MUST use `TamgaCard` (from `core/widgets/tamga_card.dart`) as the outermost wrapper instead of raw `Card` + `InkWell`.
- Verification: `grep` for `TamgaCard(` in the file returns a match; `grep` for `^  return Card(` in the same file returns no match.

**VAL-WIDGET-002 — HealthLogCard composes with TamgaCard**

- File: `lib/src/features/horses/presentation/widgets/health_log_card.dart`
- The `HealthLogCard.build` method MUST use `TamgaCard` instead of raw `Card` + `InkWell`.
- Verification: `grep` for `TamgaCard(` in the file returns a match; `grep` for `^  return Card(` in the same file returns no match.

**VAL-WIDGET-003 — StatCard composes with TamgaSummaryCard**

- File: `lib/src/features/analytics/presentation/widgets/stat_card.dart`
- The `StatCard.build` method MUST use `TamgaSummaryCard` (from `core/widgets/tamga_summary_card.dart`) as its wrapper instead of raw `Card` + raw `Padding`.
- The loading, error, and empty factory constructors MUST also delegate to `TamgaSummaryCard`.
- Verification: `grep` for `TamgaSummaryCard(` in the file returns at least one match; `grep` for `return Card(` in the file returns no match.

**VAL-WIDGET-004 — ListingBadge.\_BadgeChip composes with TamgaBadge or TamgaColorChip**

- File: `lib/src/features/market/presentation/widgets/listing_badge.dart`
- The private `_BadgeChip` class MUST delegate rendering to `TamgaBadge` or `TamgaColorChip` instead of raw `Container` + `BoxDecoration`.
- Verification: `grep` for `TamgaBadge(` or `TamgaColorChip(` in the file returns at least one match; the old raw `Container` with `BoxDecoration` inside `_BadgeChip.build` is removed.

**VAL-WIDGET-005 — Visual appearance preserved and all tests pass after refactoring**

- For ALL four refactored widgets, the following visual properties MUST remain identical to baseline:
  - **Padding**: Same internal padding values via `TamgaCard`/`TamgaSummaryCard` padding props.
  - **Colors**: Same surface/background color resolution.
  - **Border radius**: Same corner radius.
- The following test files MUST pass without failures:
  - `test/features/analytics/stat_card_test.dart`
  - `test/features/market/presentation/widgets/listing_badge_test.dart`
  - Any tests exercising the refactored widgets.
- Verification: `flutter test` on relevant files exits with code 0.

---

## Area 2: Isar Index & Timestamp Upgrade (Milestone 4)

Prefix: `VAL-INDEX-`

### Current State Summary

There are **41 Isar schemas** across `lib/src/features/shared/data/isar_schemas/` and `lib/src/features/races/data/isar_schemas/`.

**domainId status** (39 schemas have `domainId`, 2 exceptions):

- `IsarLineageSnapshot` uses `rootId` (analogous to domainId)
- `IsarSyncQueueItem` has no domainId (queue item, not a domain entity)

**Schemas where domainId already has `@Index(unique: true, replace: true)`** (16):
`IsarHorse`, `IsarMarketListing`, `IsarDocumentRecord`, `IsarLostHorseReport`,
`IsarLineageRoot`, `IsarLineageTreeNode`, `IsarHorseLocation`,
`IsarMarketConversation`, `IsarMarketMessage`, `IsarMarketOffer`,
`IsarTrialBooking`, `IsarTrialSlot`, `IsarSellerRating`, `IsarSavedSearch`,
`IsarGeofenceAlert`, `IsarSearchArea`

**Schemas where domainId MISSING the unique index** (23):
`IsarHealthLog`, `IsarEvent`, `IsarBreedingRecord`, `IsarCoOwnershipRecord`,
`IsarDigitalCertificate`, `IsarRace`, `IsarRaceEntry`, `IsarTrainingLog`,
`IsarProfileSettings`, `IsarPaymentRequest`, `IsarFeedLog`, `IsarFeedSchedule`,
`IsarEventRegistration`, `IsarMedicalLog`, `IsarMarketInquiry`,
`IsarSellerProfile`, `IsarSellerPhoneVerification`,
`IsarEMongoliaVerification`, `IsarListingReport`, `IsarTeam`,
`IsarTeamMember`, `IsarTeamInvitation`, `IsarPerformanceRecord`

**Schemas with horseId field** (14):
`IsarHealthLog`, `IsarEvent`, `IsarRaceEntry`, `IsarTrainingLog`,
`IsarDocumentRecord`, `IsarGeofenceAlert`, `IsarMedicalLog`,
`IsarMarketListing`, `IsarDigitalCertificate`, `IsarFeedLog`,
`IsarFeedSchedule`, `IsarEventRegistration`, `IsarPerformanceRecord`,
`IsarCoOwnershipRecord`

### Assertions

**VAL-INDEX-001 — All 39 schemas with `domainId` have `@Index(unique: true, replace: true)`**

- For every schema file that declares `late String domainId`, the field declaration MUST be annotated with `@Index(unique: true, replace: true)`.
- This applies to all 23 schemas currently missing the annotation (listed above).
- Verification: `grep` for `late String domainId` across all Isar schema files; for each result, confirm the preceding non-whitespace line contains `@Index(unique: true, replace: true)`.

**VAL-INDEX-002 — IsarLineageSnapshot.rootId has `@Index(unique: true, replace: true)`**

- File: `lib/src/features/shared/data/isar_schemas/isar_lineage_snapshot.dart`
- The `rootId` field (analogous to domainId for this schema) MUST retain `@Index(unique: true, replace: true)`.
- Verification: The annotation is already present and remains unchanged.

**VAL-INDEX-003 — All 14 schemas with `horseId` field have `@Index()`**

- For every schema that declares `late String horseId`, the field MUST be annotated with `@Index()`.
- This includes (but is not limited to): `IsarHealthLog`, `IsarEvent`, `IsarRaceEntry`, `IsarTrainingLog`, `IsarDocumentRecord`, `IsarGeofenceAlert`, `IsarMedicalLog`, `IsarMarketListing`, `IsarDigitalCertificate`, `IsarFeedLog`, `IsarFeedSchedule`, `IsarEventRegistration`, `IsarPerformanceRecord`, `IsarCoOwnershipRecord`.
- Verification: For every `late String horseId` declaration in Isar schemas, confirm the preceding line contains `@Index()`.

**VAL-INDEX-004 — Build runner succeeds and all tests pass after index changes**

- `dart run build_runner build --delete-conflicting-outputs` MUST complete without errors (exit code 0).
- `flutter test` MUST pass across the entire test suite, with attention to:
  - `test/features/lineage/lineage_isar_schemas_test.dart`
  - `test/features/map/data/local_map_repository_test.dart`
  - `test/features/market/market_repository_test.dart`
- Verification: Both commands exit with code 0.

---

## Area 3: Isar Timestamp Upgrade

Prefix: `VAL-TS-`

### Current State Summary

Schemas that already have `createdAt`/`updatedAt` timestamps:

- **Both**: `IsarMarketListing`, `IsarDocumentRecord`, `IsarLostHorseReport`, `IsarMarketInquiry`
- **createdAt only**: `IsarListingReport`, `IsarTeam`, `IsarTeamInvitation`, `IsarSearchArea`, `IsarSavedSearch`, `IsarSellerRating`
- **Nullable/conditional createdAt**: `IsarPaymentRequest`, `IsarTrialSlot`, `IsarMarketOffer`

**12 schemas targeted to GAIN `createdAt` + `updatedAt` timestamps:**

| Schema                   | Why needed                    |
| ------------------------ | ----------------------------- |
| `IsarHorse`              | Core entity, no timestamps    |
| `IsarHealthLog`          | Audit trail for health events |
| `IsarEvent`              | Event lifecycle tracking      |
| `IsarBreedingRecord`     | Breeding timeline             |
| `IsarCoOwnershipRecord`  | Ownership change audit        |
| `IsarDigitalCertificate` | Certificate lifecycle         |
| `IsarEventRegistration`  | Registration timeline         |
| `IsarMedicalLog`         | Medical audit trail           |
| `IsarTrainingLog`        | Training history              |
| `IsarFeedLog`            | Feeding schedule audit        |
| `IsarFeedSchedule`       | Schedule management           |
| `IsarPerformanceRecord`  | Performance tracking          |

### Assertions

**VAL-TS-001 — 12 targeted schemas gain non-nullable `createdAt` and `updatedAt` fields**

- The following 12 schemas MUST add `late DateTime createdAt` and `late DateTime updatedAt` fields:
  `IsarHorse`, `IsarHealthLog`, `IsarEvent`, `IsarBreedingRecord`,
  `IsarCoOwnershipRecord`, `IsarDigitalCertificate`, `IsarEventRegistration`,
  `IsarMedicalLog`, `IsarTrainingLog`, `IsarFeedLog`, `IsarFeedSchedule`,
  `IsarPerformanceRecord`
- Verification: For each of the 12 files, `grep` for `late DateTime createdAt` and `late DateTime updatedAt` both return a match and use `late` (non-nullable).

**VAL-TS-002 — Timestamp fields are populated during `fromDomain()`**

- For all 12 schemas, the `fromDomain()` factory MUST assign `createdAt` and `updatedAt` from the corresponding domain model fields (or `DateTime.now()` if the domain doesn't have them yet).
- Verification: For each schema, the `fromDomain()` method body contains two assignment lines: `..createdAt =` and `..updatedAt =`.

**VAL-TS-003 — Timestamp fields are propagated in `toDomain()`**

- For all 12 schemas, the `toDomain()` method MUST pass `createdAt` and `updatedAt` to the domain model constructor.
- Verification: For each schema, the return expression in `toDomain()` includes both `createdAt: createdAt` and `updatedAt: updatedAt`.

**VAL-TS-004 — Build runner succeeds and all tests pass after timestamp additions**

- `dart run build_runner build --delete-conflicting-outputs` MUST complete without errors (exit code 0).
- `flutter test` MUST pass across the entire test suite (exit code 0).
- Verification: Both commands exit with code 0.
