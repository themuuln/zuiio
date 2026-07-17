
## ✅ Phase 1 — COMPLETED (2026-07-16)

### What was built

**3 new domain files:**
- `horse_coat_color.dart` — 17 Mongolian coat color terms with displayName, description, fromString
- `horse_breed_lineage.dart` — 7 Mongolian horse lineages with displayName, region, description
- `horse_markings.dart` — Plain class (not freezed) with FaceMarking, LegMarking, LegPosition enums + manual JSON serialization

**12 files modified:**
| Layer | File | Change |
|-------|------|--------|
| Model | `horse.dart` | +9 fields + updated all 4 serde methods |
| Persistence | `isar_horse.dart` | +15 fields (9 new + 6 restored missing) |
| Persistence | `local_horses_repository.dart` | Seed data with breed/coat/region/parent links |
| Migration | `20250716180000_horse_profile_expansion.sql` | +12 columns + 4 indexes |
| Form | `add_horse_screen.dart` | +8 fields (breed, coat, region, sum, tamga, sire picker, dam picker) |
| Form | `horse_editor_sheet.dart` | Mirror of add form with pre-population |
| Display | `horse_info_tab.dart` | +6 detail rows for new fields |
| Display | `horse_card.dart` | Breed lineage badge |
| Lineage | `horse_detail_screen.dart` | _LineageTab shows sire/dam parent cards |
| Lineage | `inbreeding_calculator.dart` | Dynamic parent map + PCI calculation + warnings |

**3 test files created (80 new tests):**
- `test/shared/domain/horse_expansion_test.dart` — 38 tests (enums, markings, new fields, parent linkage)
- `test/features/horses/horse_profile_integration_test.dart` — 27 tests (full roundtrip, Supabase, markings, enums)
- `test/features/lineage/inbreeding_calculator_pci_test.dart` — 16 tests (PCI, calculateWithPCI, buildParentMapFromHorses)

**pubspec.yaml** relaxed Flutter constraint from exact `3.44.2` to `>=3.44.2` to allow running on installed SDK.

### Test results
- **108/108 horse-related tests passed** (28 existing + 80 new)
- **2387/2399 full suite** — 12 pre-existing failures in `breeding_advice_test.dart` (unrelated)
- **dart analyze**: 0 issues in all changed files (6 pre-existing errors in unrelated map/events features)

### Implementation gotchas discovered
- Isar does NOT support `@Default` annotation (freezed pattern, not Isar)
- Isar does NOT support `StringList` type — use `List<String>?`
- Isar does NOT support nullable enums with `@enumerated` — store as `int?` index
- Freezed `toJson` conflicts with manual `toJson` — use plain class when manual serialization needed
- HorseMarkings is a plain class (not freezed) to avoid serialization conflicts

### What's NOT done (Phase 2)
- Markings input form UI (model exists, no form to capture)
- Ownership history tracking
- Vet records (vaccination, farrier, dental schedules)
- Body condition score (Henneke 1-9)
- Naadam race record tracking
- Performance metrics (HR zones, lactate thresholds)
- DNA/genetic data fields

# Horse Profile & Lineage Expansion

## Context

Deep research identified ~25 missing fields in the Horse model and ~10 missing pedigree features compared to professional equine apps. The most critical gaps are: no sire/dam parent linkage, single free-text coat field (Mongolian has 17 structured terms), no tamga brand metadata, no breed lineage enum, no geographic origin, and the COI calculator is hardcoded seed data. This plan covers P0 + P1 fields — the minimum to make Tamga competitive with professional horse management apps and uniquely valuable for Mongolian horse culture.

## Scope

**Phase 1** (this plan): Add P0 fields to Horse model + supporting enums + Supabase migration + Isar schema + UI
**Phase 2** (future): P1 fields (ownership history, vet records, performance metrics, Naadam tracking)

## Files to Change

### Phase 1A: Enums & Domain Model (no dependencies)

| File | Action | What changes |
|------|--------|--------------|
| `lib/src/shared/domain/horse_coat_color.dart` | **Create** | `MongolianCoatColor` enum with 17 foundational terms (Saaral, Sharga, Khaliun, Ulaan, Buural, Tsoohor, Khar, Khyarman, Chabidar, Kheer, Khuren, Khuwar, Khul, Bor, Tsenker, Khaltar, Alag). Each has `displayName` (Mongolian), `groundColor` (body), `hairColor` (mane/tail), `fromString()` |
| `lib/src/shared/domain/horse_breed_lineage.dart` | **Create** | `MongolianBreedLineage` enum with 7 lineages (Mongol, Galshar, Tes, Myangad, Darkhad, Undurshil, GobiShankh). Each has `displayName`, `aimag`, `description` |
| `lib/src/shared/domain/horse_markings.dart` | **Create** | `HorseMarkings` freezed class: `faceMarking` (enum: none/star/strip/snip/blaze/bald/other), `faceMarkingDescription`, `legMarkings` (Map<String, LegMarking> keyed by leg position: leftFront/rightFront/leftHind/rightHind), `LegMarking` enum (none/stocking/sock/pastern/coronet/other), `bodyMarkings` (free text for scars, brands, etc.) |
| `lib/src/shared/domain/horse.dart` | **Modify** | Add 9 new fields to `Horse` factory: `sireId` (String?), `damId` (String?), `coatColor` (MongolianCoatColor?), `breedLineage` (MongolianBreedLineage?), `region` (String? — aimag), `sum` (String? — district), `markings` (HorseMarkings?), `tamgaBrandClan` (String?), `tamgaBrandGeneration` (int?). Update `fromJson`, `toJson`, `fromSupabaseJson`, `toSupabaseJson`. Make `name` field have `@Default('')` (already does) |

### Phase 1B: Isar Schema (depends on 1A)

| File | Action | What changes |
|------|--------|--------------|
| `lib/src/features/shared/data/isar_schemas/isar_horse.dart` | **Modify** | Add new nullable fields: `sireId`, `damId`, `coatColor` (int for enum index), `breedLineage` (int for enum index), `region`, `sum`, `markingsJson` (String? — serialized HorseMarkings), `tamgaBrandClan`, `tamgaBrandGeneration`. Update `fromDomain()` and `toDomain()`. Also add the 6 currently missing fields: `microchipId`, `registrationNo`, `photoUrls` (StringList), `registrationDate`, `tamgaVerified`, `stateVerified` |
| `lib/src/features/shared/data/isar_schemas/isar_horse.g.dart` | **Regenerate** | Run `dart run build_runner build --delete-conflicting-outputs` |

### Phase 1C: Supabase Migration (depends on 1A)

| File | Action | What changes |
|------|--------|--------------|
| `supabase/migrations/0XX_horse_profile_expansion.sql` | **Create** | `ALTER TABLE horses ADD COLUMN sire_id UUID REFERENCES horses(id);`, `ALTER TABLE horses ADD COLUMN dam_id UUID REFERENCES horses(id);`, `ALTER TABLE horses ADD COLUMN coat_color TEXT;`, `ALTER TABLE horses ADD COLUMN breed_lineage TEXT;`, `ALTER TABLE horses ADD COLUMN region TEXT;`, `ALTER TABLE horses ADD COLUMN sum TEXT;`, `ALTER TABLE horses ADD COLUMN markings JSONB;`, `ALTER TABLE horses ADD COLUMN tamga_brand_clan TEXT;`, `ALTER TABLE horses ADD COLUMN tamga_brand_generation INT;`, `ALTER TABLE horses ADD COLUMN registration_date TIMESTAMPTZ;`, `ALTER TABLE horses ADD COLUMN tamga_verified BOOLEAN DEFAULT false;`, `ALTER TABLE horses ADD COLUMN state_verified BOOLEAN DEFAULT false;`, Add indexes on `sire_id`, `dam_id` |

### Phase 1D: Repository Layer (depends on 1B, 1C)

| File | Action | What changes |
|------|--------|--------------|
| `lib/src/features/horses/data/supabase_horses_repository.dart` | **Modify** | Add new column mappings in save/fetch methods. The existing `fromSupabaseJson`/`toSupabaseJson` on Horse handles serialization — just need to ensure Supabase columns are passed through |
| `lib/src/features/horses/data/local_horses_repository.dart` | **Modify** | Update seed data with new fields (lineage breeds, regions, coat colors for existing horses). Add `sireId`/`damId` links between seed horses |

### Phase 1E: UI — Add/Edit Forms (depends on 1A)

| File | Action | What changes |
|------|--------|--------------|
| `lib/src/features/horses/presentation/add_horse_screen.dart` | **Modify** | Add form sections: (1) Breed Lineage dropdown, (2) Coat Color dropdown (MongolianCoatColor), (3) Region/Sum text fields, (4) Sire/Dam picker (search existing horses), (5) Markings form section, (6) Tamga brand fields (clan, generation). Reorder form to put critical Mongolian-specific fields first |
| `lib/src/features/horses/presentation/horse_editor_sheet.dart` | **Modify** | Mirror add_horse_screen fields in edit mode. Pre-populate from existing horse data |

### Phase 1F: UI — Display (depends on 1A)

| File | Action | What changes |
|------|--------|--------------|
| `lib/src/features/horses/presentation/horse_info_tab.dart` | **Modify** | Display new fields in the details card: Breed lineage badge, Coat color (Mongolian name), Region/Sum, Sire/Dam names (resolved from IDs), Markings summary, Tamga brand info (clan + generation) |
| `lib/src/features/horses/presentation/horse_card.dart` | **Modify** | Add breed lineage badge next to existing coat/gender chips |
| `lib/src/features/horses/presentation/horse_detail_screen.dart` | **Modify** | Update `_LineageTab` to use `sireId`/`damId` for direct parent linkage instead of only `lineageRootId` |

### Phase 1G: Lineage / Pedigree (depends on 1A)

| File | Action | What changes |
|------|--------|--------------|
| `lib/src/features/lineage/application/inbreeding_calculator.dart` | **Modify** | Replace hardcoded `parentMap` with dynamic construction from Horse records using `sireId`/`damId`. Add PCI (Pedigree Completeness Index) calculation. Add warning when PCI < 0.5 |
| `lib/src/features/lineage/application/pedigree_layout.dart` | **Modify** | Minor: ensure layout handles new field data on nodes |

### Phase 1H: Code Generation & Verification

| File | Action | What changes |
|------|--------|--------------|
| `lib/src/shared/domain/horse.freezed.dart` | **Regenerate** | `dart run build_runner build` |
| `lib/src/features/shared/data/isar_schemas/isar_horse.g.dart` | **Regenerate** | `dart run build_runner build` |

## Implementation Order

1. **Create enums** (horse_coat_color.dart, horse_breed_lineage.dart, horse_markings.dart) — zero dependencies
2. **Modify Horse model** — add 9 fields, update all 4 serde methods
3. **Regenerate freezed** — `dart run build_runner build`
4. **Modify IsarHorse schema** — add fields + the 6 currently missing ones, update fromDomain/toDomain
5. **Create Supabase migration** — ALTER TABLE for all new columns
6. **Apply migration** — via Supabase MCP
7. **Regenerate Isar** — `dart run build_runner build`
8. **Update seed data** — local_horses_repository.dart
9. **Update add_horse_screen** — add new form sections
10. **Update horse_editor_sheet** — mirror add form
11. **Update horse_info_tab** — display new fields
12. **Update horse_card** — add breed badge
13. **Fix inbreeding_calculator** — dynamic parent map + PCI
14. **Type-check** — `flutter analyze`
15. **Smoke test** — run app, verify add/edit/display

## Edge Cases

- **Backward compatibility**: All new fields are nullable with defaults. Existing serialized data (Isar + Supabase) continues to work — new fields deserialize as null/empty.
- **Sire/dam self-referencing**: Horse table FKs to itself — prevent cycles in UI picker (can't set horse as its own parent).
- **Markings serialization**: `HorseMarkings` is a complex nested object — serialize as JSON string in Isar, JSONB in Supabase.
- **Enum migration**: MongolianCoatColor and MongolianBreedLineage are stored as string values in Supabase (not int) for readability. Isar stores as enum index.
- **Existing coat field**: Keep the existing `coat` free-text field for backward compatibility. The new `coatColor` enum is supplementary — users can use either or both.

## Verification

1. `flutter analyze --fatal-infos` — zero errors
2. `flutter test` — all existing tests pass
3. Manual: Add a new horse → select breed lineage, coat color, region, sire, dam, markings → save → verify all fields persist
4. Manual: Edit horse → verify all new fields pre-populate correctly
5. Manual: View horse info tab → verify new fields display with correct Mongolian labels
6. Manual: Open lineage tree → verify sire/dam linkage works
7. Manual: Run inbreeding calculator → verify it uses dynamic parent map (not hardcoded)
