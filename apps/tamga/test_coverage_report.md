# Tamga Test Coverage Report

**Generated:** 2026-06-16  
**Project:** Tamga — Flutter + Supabase offline-first horse management app for Mongolia  
**Total Tests:** 734 passing, 8 failing (of ~742 total)  
**Test Framework:** `flutter_test` + `mocktail`

---

## 1. Test Directory Structure

```
test/
├── core/
│   ├── error/result_test.dart
│   ├── sync/sync_queue_test.dart
│   ├── notification_preferences_test.dart
│   ├── notification_trigger_test.dart
│   └── notification_types_test.dart
├── features/
│   ├── auth/
│   │   ├── auth_state_test.dart
│   │   ├── supabase_auth_repository_test.dart
│   │   └── presentation/
│   │       ├── login_screen_test.dart
│   │       ├── register_screen_test.dart
│   │       ├── phone_login_test.dart
│   │       └── otp_verify_test.dart
│   ├── breeding/
│   │   ├── breeding_record_test.dart
│   │   └── gestation_calculator_test.dart
│   ├── certificates/
│   │   └── ownership_certificate_test.dart
│   ├── documents/
│   │   └── document_record_test.dart
│   ├── events/
│   │   └── event_repository_test.dart
│   ├── health/
│   │   └── health_repository_test.dart
│   ├── horses/
│   │   └── co_ownership_test.dart
│   ├── map/
│   │   ├── domain/map_models_test.dart
│   │   ├── data/location_service_test.dart
│   │   ├── data/geofence_service_test.dart
│   │   └── presentation/map_screen_test.dart
│   ├── market/
│   │   ├── market_listing_test.dart
│   │   ├── market_repository_test.dart
│   │   ├── domain/
│   │   │   ├── market_listing_test.dart
│   │   │   ├── market_favorites_test.dart
│   │   │   ├── market_listing_boost_test.dart
│   │   │   └── market_price_insight_test.dart
│   │   └── presentation/
│   │       ├── market_listing_screen_test.dart
│   │       └── widgets/listing_badge_test.dart
│   ├── onboarding/
│   │   ├── onboarding_data_test.dart
│   │   ├── onboarding_notifier_test.dart
│   │   ├── onboarding_repository_test.dart
│   │   └── presentation/
│   │       ├── role_selection_page_test.dart
│   │       ├── profile_setup_page_test.dart
│   │       └── onboarding_completion_checklist_test.dart
│   ├── payments/
│   │   ├── feature_gate_test.dart
│   │   ├── payment_service_test.dart
│   │   └── presentation/payment_screen_test.dart
│   ├── shared/
│   │   └── pagination_test.dart
│   └── stable/
│       ├── data/stable_repository_test.dart
│       └── domain/
│           ├── boarding_assignment_test.dart
│           ├── stable_invoice_test.dart
│           └── stable_member_test.dart
├── helpers/
│   └── test_helpers.dart
├── shared/
│   └── domain/horse_test.dart
├── local_repositories_test.dart
├── pedigree_layout_test.dart
├── phase_2_features_test.dart
├── phase_3_features_test.dart
└── widget_test.dart
```

---

## 2. Test Coverage Per Feature

### Legend
- ✅ **Unit** — Pure logic/model tests (no Flutter rendering)
- ✅ **Widget** — Flutter widget tests (requires `pumpWidget`)
- ✅ **Integration** — Full integration with Isar DB
- ❌ **Missing** — No tests exist for this area
- ⚠️ **Partial** — Some coverage but significant gaps

| Feature | Unit Tests | Widget Tests | Int. Tests | Overall | Notes |
|---|---|---|---|---|---|
| **auth** | ✅ (6 files, 30+ tests) | ✅ (4 screen tests) | ❌ | ✅ **Good** | Auth state, repository (mocked), login/register/phone/OTP screens all tested |
| **breeding** | ✅ (2 files, 40+ tests) | ❌ | ⚠️ (partial in phase_2) | ✅ **Good** | BreedingRecord model, GestationCalculator thoroughly tested; repository tested via phase_2 |
| **certificates** | ✅ (1 file, 15+ tests) | ❌ | ⚠️ (in phase_3) | ⚠️ **Partial** | OwnershipCertificate model well tested; no widget tests for certificate display |
| **documents** | ✅ (1 file, 10+ tests) | ❌ | ❌ | ⚠️ **Partial** | DocumentRecord model tested; no repository or UI tests |
| **events** | ✅ (1 file, 10+ tests) | ❌ | ✅ | ✅ **Good** | LocalEventRepository with Isar full CRUD; model equality tested |
| **health** | ✅ (1 file, 15+ tests) | ❌ | ✅ | ✅ **Good** | LocalHealthRepository with Isar; HealthLog model labels tested |
| **horses** | ⚠️ (local_repositories_test) | ❌ | ⚠️ | ⚠️ **Weak** | Basic horse save tested in local_repositories_test; no Horse model unit tests; no HorseRecord tests |
| **lineage** | ⚠️ (pedigree_layout_test) | ❌ | ❌ | ❌ **Weak** | Only Buchheim/Walker layout algorithm tested; no lineage data layer, no UI |
| **map** | ✅ (3 files, 25+ tests) | ❌ (trivial) | ❌ | ⚠️ **Partial** | Map models, LocationService, GeofenceService tested; MapScreen only referenced, not rendered |
| **market** | ✅ (6 files, 100+ tests) | ✅ (2 files, 20+ tests) | ✅ | ✅ **Excellent** | Best tested feature. Domain models, boost/VIP/badges, price insights, serialization, filtering, sorting, repository CRUD, sync queue |
| **onboarding** | ✅ (3 files, 30+ tests) | ✅ (3 files, 25+ tests) | ❌ | ✅ **Good** | Onboarding data model, repository (2 implementations), notifier logic; widget tests for role selection, profile setup, completion checklist |
| **payments** | ✅ (3 files, 40+ tests) | ❌ | ❌ | ✅ **Good** | Feature gates, payment service, payment model; tier limits, pricing, code generation |
| **stable** | ✅ (4 files, 30+ tests) | ❌ | ✅ | ✅ **Good** | StableRepository with SharedPreferences; all domain models tested |
| **shared** | ✅ (pagination_test) | ❌ | ❌ | ⚠️ **Partial** | PaginationState + PaginationNotifier well tested, but shared IsarStorage not tested |
| **profile** | ❌ | ❌ | ❌ | ❌ **None** | No tests at all |
| **search** | ❌ | ❌ | ❌ | ❌ **None** | No tests at all |
| **race_videos** | ❌ | ❌ | ❌ | ❌ **None** | No tests at all |
| **session** | ❌ | ❌ | ❌ | ❌ **None** | No tests at all |
| **shell** | ❌ | ❌ | ❌ | ❌ **None** | No tests at all |
| **lost_horse** | ❌ | ❌ | ❌ | ❌ **None** | No tests at all |
| **co-ownership** | ✅ (1 file, minimal) | ❌ | ❌ | ⚠️ **Weak** | Only CoOwnershipRecord model tested (3 basic tests) |
| **sync** | ✅ (sync_queue_test) | ❌ | ❌ | ✅ **Good** | SyncQueue and SyncEngine well tested with coalescing, retry, batch |
| **notifications** | ✅ (3 files) | ❌ | ❌ | ✅ **Good** | NotificationType, NotificationPreferences, NotificationTrigger tested |
| **core/error** | ✅ (result_test.dart) | ❌ | ❌ | ✅ **Good** | Result, AsyncResult, AppException thoroughly tested |

---

## 3. Test Quality Assessment

### Strengths
1. **Market** — Most comprehensive testing. Domain models with serialization round-trips, edge cases, boost/VIP/badge state, price insights, filtering logic, sorting, repository CRUD with sync enqueuing, and widget tests for ListingBadge
2. **Auth** — Good balance of repository unit tests (mocked Supabase) + widget tests for all 4 auth screens (login, register, phone, OTP)
3. **Breeding** — Thorough gestation calculator tests with edge cases (leap years, boundaries, overflow clamping, reminders)
4. **Payments** — Well structured with feature gate limits, tier progression, code generation uniqueness, serialization
5. **Sync** — Proper queue coalescing logic, retry/max-retries, batch processing, serialization

### Weaknesses
1. **profile** — Entirely untested (0 test files)
2. **search** — Entirely untested
3. **race_videos** — Entirely untested
4. **session** — Entirely untested
5. **shell** — Entirely untested
6. **lost_horse** — Entirely untested
7. **lineage** — Only the Buchheim/Walker layout algorithm is tested; no data layer or UI tests
8. **horses** — Very thin coverage. Horse model tested in shared/domain, but no HorseRecord tests, no horse listing/provider tests
9. **co-ownership** — Only 3 basic model tests, no repository or UI

### Flaky/Failing Tests
**8 failing tests** — all in `role_selection_page_test.dart`:
- Missing UI text "ҮРГЭЛЖЛҮҮЛЭХ" (button label mismatch or theme issue)
- Icon finders failing (`Icons.person`, `Icons.pets`, `Icons.business`)
- These are likely due to UI changes that weren't synced with tests, not fundamental logic issues

---

## 4. Test Types Breakdown

| Type | Count | Description |
|---|---|---|
| **Unit tests** (pure Dart) | ~600 | Model serialization, calculators, state machines, repository logic |
| **Widget tests** (Flutter) | ~80 | Screen rendering, form validation, user interaction flows |
| **Integration tests** (Isar) | ~50 | Local repositories with real Isar DB (Horses, Events, Health, Market, Breeding) |
| **End-to-end tests** | 0 | No integration_test/ tests with real Supabase or UI navigation |

**Note:** The `widget_test.dart` is skipped (`skip: true`) as it requires full Supabase/Isar integration setup.

---

## 5. Test Utilities, Mocks, and Fixtures

### Test Helpers
| File | Purpose |
|---|---|
| `test/helpers/test_helpers.dart` | Sets up `TestWidgetsFlutterBinding`, mocks `path_provider` channel for Isar initialization |
| `test/helpers/` | Only 1 file — minimal |

### Mocking Strategy
- **mocktail** (v1.0.4) — Used in auth, payment, onboarding repository tests
- No shared mock factories or fixture generators — mocks are defined inline per test file
- No `mockito` usage (uses `mocktail` exclusively)

### Test Infrastructure
- **Isar DB tests** — `test/helpers/test_helpers.dart` must be called before Isar.initialize()
- **SharedPreferences** — Mocked via `SharedPreferences.setMockInitialValues()` in onboarding and stable tests
- Supabase client — Mocked via `MockSupabaseClient`/`MockGoTrueClient` in auth tests
- **No test seed data** — Except for `LocalMarketRepositoryV2` which ships seed data in the constructor

---

## 6. Coverage Gaps by Concern

### Error States
- ✅ **Result/AppException** — Core Result type tested thoroughly
- ⚠️ **Repository error paths** — Tested in auth (mocked Supabase errors) and sync (network failure retries)
- ❌ **UI error states** — No widget tests showing error banners, snackbars, error dialogs
- ❌ **API timeout handling**
- ❌ **Network connectivity errors in UI**

### Loading States
- ✅ **Login/Register screens** — Loading spinner tested via Completer pattern
- ❌ **All other screens** — No loading state coverage for data fetching screens

### Empty States
- ✅ **Repository initial fetch** — Market, Events, Health, Stable repositories test empty returns
- ✅ **Pagination** — Empty initial state tested
- ❌ **UI empty states** — No widget tests verifying empty state widgets/messages

### Edge Cases
- ✅ **Boundaries** — Gestation clamping (1.5 max), tier limits, boost expiration
- ✅ **Serialization** — Legacy/missing field handling, null safety, round-trips
- ✅ **Market** — Boost/VIP expiration boundaries, sort priority calculations
- ❌ **Input validation** — Limited to auth screens; no validation tests for horse creation, event forms, etc.
- ❌ **Max items/limits** — Feature gate logic tested, but not enforced in UI

### Offline Behavior
- ❌ **Offline UI states** — No tests for connectivity state, offline banners, or queued operation indicators
- ✅ **Sync queue** — Enqueue logic tested (create/update/delete coalescing)
- ✅ **Sync engine** — Retry/max-retry/batch processing tested
- ❌ **Offline → online transition** — No tests for sync reconciliation

### Cross-feature Integration
- ❌ **Navigator/routing** — No GoRouter tests
- ❌ **Riverpod providers** — No provider test utilities; providers are tested indirectly via widget tests
- ❌ **Supabase realtime** — No tests for realtime subscription behavior

---

## 7. Suggested Approach for Production Readiness

### Phase 1: Fix Existing Failures (High Priority)
- Fix 8 failing onboarding tests (button label mismatch, icon names)
- Ensure CI green before adding new tests

### Phase 2: Untested Features (Medium Priority)
- **profile** — Add tests for ProfileScreen, profile providers, edit profile flow
- **search** — Add tests for search providers, debounce logic, filtering
- **race_videos** — Add model and repository tests
- **session** — Add session management tests
- **shell** — Add ShellScreen navigation tests
- **lost_horse** — Already has location/geofence tests; add LostHorseReport repository tests
- **lineage** — Add LocalLineageRepository + SupabaseLineageRepository tests

### Phase 3: UI Test Expansion (Medium Priority)
- Add empty state widget tests (empty horse list, no events, no listings)
- Add loading state widget tests (shimmer/progress indicator)
- Add error state widget tests (error snackbars, retry buttons)
- Add form validation tests for horse creation, event creation, document upload
- Add Riverpod provider tests (override with mock data, verify state transitions)

### Phase 4: Integration & E2E (Low Priority)
- Set up `integration_test/` with real Supabase test instance
- Add user-flow tests (onboarding → add horse → add event → view market)
- Add offline/online transition tests
- Add Isar → Supabase sync end-to-end tests

### Phase 5: Test Infrastructure Improvements
- **Fixtures** — Create shared fixture factory for Horse, MarketListing, Event, etc.
- **Mock factories** — Extract mock Supabase client, mock auth repository into reusable helpers
- **Pagination test helper** — Generic pagination mock for testing infinite scroll screens
- **Golden tests** — For critical screens (lineage tree, market listings, horse detail)
- **Coverage reporting** — Add `flutter test --coverage` and configure `lcov.info`

---

## 8. Summary

| Metric | Value |
|---|---|
| Total test files | 45 |
| Total tests | ~742 (734 pass, 8 fail) |
| Features with tests | 16 of 22 feature modules |
| Features fully untested | 6 (profile, search, race_videos, session, shell, lost_horse) |
| Unit tests | ~600 (81%) |
| Widget tests | ~80 (11%) |
| Integration tests | ~50 (7%) |
| End-to-end tests | 0 |
| Mocking library | mocktail (v1.0.4) |
| Test dependency in pubspec | ✅ mocktail, ✅ flutter_test, ✅ integration_test |
| CI integration | ❌ Not found in repo |
