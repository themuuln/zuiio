# Phase 3 — Connect the Marketplace: Lost/Stolen Listing Guard + Provenance

## Context

Phase 2 (recovery P0) is complete. The P0 plan reserved the marketplace seam:
`MarketListing.horseId` checked against active `lost_horse_reports.horse_id`.
Phase 3 connects it: a server-enforced guard that prevents listing a horse that
has an active public recovery report, flags listings when a report publishes for
their horse, clears the flag when the report resolves, and surfaces provenance
(tamga, registration, coat, breed lineage, region) on listing cards/detail.

Marketplace already has seller verification, contracts (bill of sale), trial
bookings, offers, moderation, and digital-certificate transfer — no new surfaces
needed for handoff. Vet-inspection booking and transport logistics stay deferred.

## Server contract (single additive migration)

`supabase/migrations/20260801090000_market_lost_report_guard.sql`:

1. `ALTER TABLE market_listings ADD COLUMN IF NOT EXISTS lost_report_conflict BOOLEAN NOT NULL DEFAULT false;`
2. `CREATE INDEX IF NOT EXISTS idx_market_listings_lost_conflict ON market_listings(horse_id) WHERE lost_report_conflict = true;`
3. SECURITY DEFINER helper `active_public_lost_report_for_horse(p_horse_id UUID)` —
   returns `lost_horse_reports.id` where `status = 'active' AND public_access_enabled = true`,
   else NULL. Fixed `search_path`, grant EXECUTE to `authenticated` + `service_role`.
4. `market_listings_lost_report_guard()` BEFORE INSERT OR UPDATE ON market_listings:
   - INSERT: if `active_public_lost_report_for_horse(NEW.horse_id)` IS NOT NULL →
     `RAISE EXCEPTION 'lost_report_active:%', NEW.horse_id` (blocks creating a new
     listing for a horse that is publicly reported lost).
   - UPDATE: if `NEW.status = 'active'` and an active public report exists for
     `NEW.horse_id` → same exception (blocks publishing a pending listing).
   - Both branches set `NEW.lost_report_conflict = (active report exists)` so
     existing rows that slip through carry the flag.
5. `flag_listings_on_lost_report_change()` AFTER INSERT OR UPDATE OF
   `status, public_access_enabled, resolution_type` ON `lost_horse_reports`:
   - report active + public → `UPDATE market_listings SET lost_report_conflict = true
     WHERE horse_id = NEW.horse_id AND status IN ('active','pending_verification')`
   - report terminal (`found|cancelled|expired`) or unpublished →
     `UPDATE market_listings SET lost_report_conflict = false WHERE horse_id = NEW.horse_id
     AND status IN ('active','pending_verification')`
6. `DROP TRIGGER IF EXISTS` before `CREATE TRIGGER` for idempotence; both functions
   use `CREATE OR REPLACE`.

Note: the trigger reads `lost_horse_reports` as table owner (bypasses RLS), and the
report flag trigger writes `market_listings` the same way — this is the intended
service-role enforcement path; client rows remain protected by existing RLS.

## Dart changes

### `lib/src/features/market/domain/market_listing.dart`
- Add `@Default(false) bool lostReportConflict` to the freezed factory.
- fromJson/toJson: `lostReportConflict`.
- fromSupabaseJson/toSupabaseJson: `lost_report_conflict`.
- Derived getter `bool get hasLostReportConflict => lostReportConflict;` (optional —
  plain field is enough; skip getter).

### `lib/src/features/market/presentation/listing_badge.dart`
- Add `LostReportConflictBadge` chip (amber/red, `Icons.warning_amber_rounded`,
  label from l10n) rendered inside `ListingBadge.build` when `listing.lostReportConflict`.

### `lib/src/features/market/presentation/market_listing_card.dart`
- Render the conflict badge (reuse `ListingBadge` — verify the card composes it;
  if the card renders `ListingBadge`, nothing extra needed beyond badge support).

### `lib/src/features/market/presentation/listing_detail_screen.dart`
- Conflict banner: when `listing.lostReportConflict` OR the horse has an active
  public report (via `activeLostHorsesProvider` lookup by `horse.id`), render a
  warning Card at the top: "Энэ моринд идэвхтэй эрэл хайгуул бүртгэлтэй" +
  "Эрэл хайгуулын зар үзэх" button that pushes `LostHorseDetailScreen(report: report)`
  (report fetched from `activeLostHorsesProvider` by id; MaterialPageRoute pattern
  from `lost_horse_card.dart`).
- Provenance rows in the horse evidence card (only non-null values):
  tamga clan (`tamgaBrandClan`), tamga generation, `registrationNo`, `microchipId`,
  `coatColor`/`breedLineage` labels, region/sum, tamga/state verified check icons.

### `lib/src/features/market/presentation/create_listing_screen.dart`
- On horse selection and before submit: if the selected horse has an active public
  report (from `activeLostHorsesProvider`), show inline warning text under the horse
  dropdown and block `_submitListing()` with a bilingual dialog:
  "Энэ морь эрэл хайгуулд бүртгэлтэй байна" / "Эрэл хайгуулын зар үзэх" (push detail).
- Watch the provider once in `build`; compute `_selectedHorseLostReport` helper.

### Localization
- Add keys to `lib/l10n/app_mn.arb` + `lib/l10n/app_en.arb`:
  - `marketLostReportConflictTitle`, `marketLostReportConflictBody`,
    `marketLostReportView`, `marketLostReportProvenanceTitle`,
    `marketTamgaClan`, `marketTamgaGeneration`, `marketRegistrationNo`,
    `marketMicrochipId`, `marketCoatColor`, `marketBreedLineage`,
    `marketRegion`, `marketSum`, `marketTamgaVerified`, `marketStateVerified`.
- Run `flutter gen-l10n` if needed (generated files exist under `lib/l10n/generated/`).

## Tests

- `test/features/market/domain/market_listing_test.dart` — extend with
  `lostReportConflict` roundtrip through all four serializers.
- NEW `test/features/market/presentation/listing_detail_lost_report_test.dart` —
  conflict banner renders when flag is set; provenance rows render when horse has
  tamga/registration data; banner absent when no conflict.
- NEW `test/features/market/presentation/create_listing_lost_report_test.dart` —
  submit is blocked when the selected horse has an active report; dialog shown.
- Migration trigger behavior (block/flag/clear) → integration test under
  `test/integration/market/lost_report_listing_guard_test.dart`, run only when
  local Supabase is available (same gating as P0 integration tests).

## Verification

1. `dart analyze --fatal-infos` — zero errors.
2. `flutter test test/features/market/domain/market_listing_test.dart
   test/features/market/presentation/listing_detail_lost_report_test.dart
   test/features/market/presentation/create_listing_lost_report_test.dart`
3. `dart format --set-exit-if-changed .` on changed files.
4. Migration: `supabase db reset`/apply locally (if running) — confirm guard
   blocks insert for a horse with active report, flags on publish, clears on resolve.

## Non-goals

- Vet inspection booking, transport logistics.
- Marketplace provenance scoring (trustScore already exists).
- Escrow/payments, dispute handling.
- Renaming `lost_horse_*` storage.
