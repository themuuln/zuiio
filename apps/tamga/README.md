# Tamga

Tamga is an offline-first horse management app for Mongolia, built with **Flutter**, **Supabase**, and **Isar** (local database). It supports horse records, lineage tracking, health logs, events/tournaments, marketplace, breeding tools, co-ownership, maps, document vault, and more — all with bilingual Mongolian / English UI.

---

## UI Polish Mission

A comprehensive three-milestone UI polish mission was completed to bring the app to a production-grade visual standard:

### Milestone 1 — Theme Foundation

- Refactored `AppComponents` into a parameterized single source of truth for light + dark mode.
- Migrated all 70+ screens from static `AppColors.*` to theme-aware `TamgaColors.of(context).*` — zero `AppColors` references remain in the presentation layer.
- Fixed dark mode rendering across all screens.

### Milestone 2 — Spacing & Layout

- Standardized spacing across marketplace (12 files), lineage/horses (16 files), and profile/events/onboarding (12 files) using `AppSpacing` tokens.
- Fixed `AppShell` layout positioning (sync bar, guest banner).

### Milestone 3 — Animations

- Added Hero shared-element transitions for marketplace and horse card photos.
- Added `HapticFeedback` on 11 key interaction points (tab switches, buttons, gestures).
- Tab content fade transitions for smooth screen changes.
- Staggered list entry animation on the lineage home screen.
- Theme-aware FAB menu.

---

## Critical Fixes

A two-feature maintenance mission completed in June 2026:

### Fix 1 — Co-ownership `owner_id` (Cloud Sync)

Fixed `SupabaseCoOwnershipRepository.saveCoOwner()` to include the authenticated user's `owner_id` in the upsert payload to Supabase's `co_ownerships` table. Previously, the missing `owner_id` caused NOT NULL constraint violations when writing co-ownership records to the cloud. Follows the same pattern used by `SupabaseHorsesRepository`.

### Fix 2 — `horses_screen.dart` Decomposition

Extracted 4 private widget classes from `horses_screen.dart` (566 lines) into separate files with public classes:

- `PaginationFooter` → `pagination_footer.dart`
- `PaginationErrorState` → `pagination_error_state.dart`
- `OfflineBanner` → `offline_banner.dart`
- `HorsesRegistryTab` → `horses_registry_tab.dart`

Zero behavioral changes. All existing tests pass.

---

## Events Feature Expansion

A comprehensive events module expansion completed in June 2026, adding 4 event types, horse registration, location mapping, reminders, auto-achievement tracking, featured events, and a partner dashboard.

### What was built

**Event Types:** 4 supported types — race (Уралдаан), auction (Дуудлага худалдаа), expo (Үзэсгэлэн худалдаа), training (Сургалт/Зөвлөгөө) — with type-specific icons, colors, and filter chips.

**Event CRUD & Registration:**

- Full event creation/edit form with title, date, type, location, notes, photos
- Horse registration to events with duplicate prevention
- Registered horses display on event detail screen
- Swipe-to-delete with confirmation dialog
- Optimistic local save with SyncQueue-backed cloud sync

**Location:** MapLibre-based location picker in event form. Event detail shows map preview with marker. "Байршилд очих" button opens external maps app.

**Reminders & Contact:** "Сануулах" button schedules local notification 1 day before event. "Зарлагчтай холбогдох" button calls/emails organizer. Organizer info section shown when available.

**Auto-Achievement:** Completing an event automatically updates the horse's TournamentProfile — win count, prize money, recent results.

**Featured Events:** Home page "Онцлох арга хэмжээ" horizontal scroll section. Section hidden when no featured events.

**Partner Dashboard:** Admin panel accessible from Profile screen. Partners create/edit events, toggle featured status, view registration counts. Cross-area integration with home page, TournamentProfile, and events list.

**Architecture:** Clean Architecture with domain/data/application/presentation layers. Offline-first with Isar local storage and SyncQueue for cloud sync. Old EventRecord model fully migrated to new Event model with EventType enum.

### Tests

- 1519 total tests passing (150+ event-specific)
- 38 validation contract assertions all passing
- Unit, widget, and integration tests covering all features

---

## Foundation Polish Mission

A hardening mission completed in June 2026 across three areas: test foundation, UI state polish, and offline-first UX completion.

### Milestone 1 — Test Foundation

- Created `test/README.md` documenting conventions, run instructions, mock guidelines, and Isar test setup
- Added Makefile coverage target (`make coverage` runs `flutter test --coverage`)
- Enhanced `test/helpers/test_helpers.dart` with mock factory functions for 6 domain models (Horse, Event, EventRegistration, MarketListing, BreedingRecord, HealthLog)
- 179 domain model unit tests across all 6 core models covering constructor, serialization, equality, computed properties, and enum behavior

### Milestone 2 — Feature Polish

- **ProfileScreen:** Migrated from `AsyncValue.valueOrNull` to proper `AsyncValue.when()` pattern — shows skeleton loaders during initial loading and inline error cards with "Дахин оролдох" retry buttons on failure
- **Events/Horses/Market screens:** Added centered `CircularProgressIndicator` during first-page pagination load (previously showed empty state or blank)
- Preserved all existing error, empty, and pagination footer states

### Milestone 3 — Offline-First UX Completion

- **ConflictResolutionScreen:** New screen showing field-level diff between local and remote versions with "Keep local" / "Keep remote" pickers
- **SyncIndicator:** Shows red dot with conflict count when conflicts exist; tapping navigates to ConflictResolutionScreen
- **AppLifecycleObserver:** Triggers background sync when app returns to foreground (no sync on pause/inactive)
- **Offline guards:** Conversation message send and listing contact-seller blocked with bilingual snackbar "Энэ үйлдэл интернэт холболт шаарддаг" when offline; messages enqueued in SyncQueue for later delivery
- **ProfileScreen sync status:** Shows SyncIndicator, last sync time ("Сүүлд синк хийсэн"), pending count, conflict count, and manual "Синк хийх" button
- Cleaned up legacy `offline_banner.dart` (superseded by shared version)

### Tests

- 1648 total tests passing (all 29 foundation polish assertions passed)
- `dart analyze` clean

---

## Sprint 4 — Race Registration, Marketplace Completion & Social Features

A Sprint 4 expansion completed in June 2026 adding Race Registration, Marketplace commission tracking + Facebook share, Breeder profiles, and Leaderboard.

### Milestone 1 — Race Registration

- **Race & RaceEntry domain models** with full Isar/Supabase data layer and SyncQueue integration (pattern follows EventRegistration)
- **Race list screen** with upcoming/past tabs and type filter chips (Бүгд/Наадам/Бүс/Орон нутгийн)
- **Race detail screen** with race info, registered horses list, and completed race results with placement/prize
- **Registration flow:** horse selection bottom sheet, jockey name input, duplicate prevention, entry limit enforcement
- **Organizer flows:** create/edit race form, results editor for completed races (result, placement, prize per entry)
- Supabase migrations `024_races.sql` and `025_race_entries.sql` with RLS policies

### Milestone 2 — Marketplace Completion

- **Commission tracking:** `MarketCommission` model with configurable rate, displayed as "Комисс: X%" on listing detail
- **Facebook share:** Listing detail and horse public profile now use `Share.share()` from `share_plus` with correct deep links

### Milestone 3 — Social Features

- **Breeder public profile:** Screen showing name, location, member since, total horses, achievements, recent listings, average rating. Accessible from seller profile
- **Leaderboard:** Ranked breeder list with key metrics (active listings, sales, rating, horse count). Filterable by region and time period (7d/30d/all)

### Tests

- 2020+ total tests passing (all assertions across all milestones passed)
- `dart analyze` clean

---

## Training & Nutrition Tracking

A comprehensive Training Log and Nutrition Tracking feature pair completed in June 2026.

### Training Log

- **TrainingLog** model with 4 types (gallop/sprint/endurance/rest), duration, distance, notes, handler, weather — Isar/Supabase/SyncQueue data layer
- **Training screen** per horse with type filter chips, weekly bar chart (CustomPaint), add/edit form
- **Performance tracking** — 4 metric types (speed/endurance/weight/condition), trend chart, measurement logging
- Both accessible as tabs on horse detail ("Дасгалжуулалт" / "Гүйцэтгэл")

### Nutrition Tracking

- **FeedSchedule** model with 3 types (hay/grain/supplement), quantity, frequency, dates — full data layer
- **FeedLog** model for daily fed/skipped tracking per schedule
- **Feed schedule screen** — per-horse setup with active/expired badges
- **Feed log screen** — daily fed/skipped toggle per active schedule
- Both accessible as tabs ("Тэжээлийн хуваарь" / "Тэжээлийн бүртгэл")

### Validation

- 16 Training & Nutrition assertions all passing

---

## Sprint 5 — AI Breeding, Analytics, Teams & Tier Gating

### AI Breeding Advisor

- **Supabase Edge Function** proxies to OpenCode Go API (DeepSeek V4 Flash) for breeding analysis
- Structured response: inbreeding risk (low/medium/high), risk score (0-100), health notes, color predictions, breed suggestions
- **Rate limiting** — free=5 queries/month, pro=50, breeder/stable=unlimited with upgrade prompt
- **Breeding advice screen** — horse pair selector (sire/dam), color-coded risk card, health notes, color prediction chips
- Supabase migration for `ai_queries` rate-limit tracking table

### Analytics Dashboard

- **Analytics domain models** — HerdAnalytics (age distribution, gender split, breed), HealthAnalytics (vaccination rate, trends), FinancialAnalytics (revenue, expenses, ROI)
- **Chart widgets** — AgeBarChart, GenderPieChart, HealthTimelineChart (fl_chart), StatCard — all with loading/error/empty states
- **Full dashboard screen** accessible from profile with time period filter (30d/90d/1y)
- **Export** to CSV and PDF via `csv` and `pdf` packages
- Navigation from profile screen settings tab ("Аналитик")

### Multi-User Teams

- **Team + TeamMember** domain models with 5 roles (owner/manager/vet/groom/viewer) and 9 permission types
- Isar + SyncQueue + Supabase data layer with RLS
- **Team management** — member list with role badges, owner invite/remove/change-role actions
- **Invite flow** — phone/email invite with role selector, pending invitations screen with accept/decline
- **Stable profile** — member/horse count stats, role-badged list, tier gated behind Stable
- Supabase migrations `030_teams.sql` and `031_team_invitations.sql`

### Premium Tier Gating

- `hasAiBreeding` gate — free=false, pro+, breeder+, stable+
- `hasAnalytics` gate — free=false, pro+, breeder+, stable+
- Comprehensive tests covering both gates across all 4 tiers

### Tests

- 2261 total tests passing (all 21 Sprint 5 assertions passed)
- `dart analyze` clean

---

## Performance Audit + Documentation

A Performance Audit and Documentation mission completed June 2026.

### Performance Audit

- **Isar query optimization**: Replaced `where().findAll()` + Dart-side filtering with indexed `.filter()` queries in 9 local repositories. True pagination via `.offset().limit()`.
- **Missing indexes added**: `@Index` annotations on 8 schema files (HealthLog, Event, BreedingRecord, TrainingLog, FeedSchedule, FeedLog, team). Regenerated `.g.dart`.
- **Image loading**: Replaced remaining 4 `Image.network()` calls with `CachedNetworkImage()` across breeder profile, conversation, race videos, welcome screens.
- **ImageCache**: `maximumSize(500)` and `maximumSizeBytes(100MB)` configured in main.dart.
- **ProGuard/R8**: Enabled `minifyEnabled` and `shrinkResources` for Android release builds.

### Documentation

- **CHANGELOG.md**: Created with Keep a Changelog format, releases 1.0.0–1.5.0.
- **Getting Started Guide**: `docs/getting-started.md` rewritten to 285-line comprehensive setup guide covering Supabase config, Isar generation, test runner, deployment.

### Validation

- 8 performance + docs assertions all passing

## Setup

### Prerequisites

- Flutter SDK ^3.10.3, Dart ^3.10.3
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local backend development)
- [Node.js](https://nodejs.org/) (for VitePress documentation server)

### Install Dependencies

```bash
flutter pub get
```

### Run the App

```bash
flutter run
```

### Run in Dark Mode

To verify dark mode theming (Milestone 1):

```bash
flutter run --dart-define=FLUTTER_APP_DARK_MODE=true
```

Or toggle the system/device theme to dark mode before launching the app.

### Run Tests

```bash
flutter test                              # All tests
flutter test test/features/horses/        # Feature-specific
dart run build_runner build --delete-conflicting-outputs  # Isar schema generation
```

### Build for Android/iOS

```bash
flutter build apk          # Android
flutter build ios          # iOS
flutter build web          # Web
```

---

## Documentation

Full product, architecture, and design documentation is available in the `docs/` directory as a VitePress site:

```bash
npm run docs:dev     # Start the docs dev server (localhost:4173)
npm run docs:build   # Build static site
```

---

## Tech Stack

| Layer            | Technology                                     |
| ---------------- | ---------------------------------------------- |
| Framework        | Flutter ^3.10.3, Dart ^3.10.3                  |
| Backend          | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| State Management | Riverpod ^2.6.1                                |
| Routing          | GoRouter ^16.0.0                               |
| Local Database   | Isar ^3.1.0+1 (15 schemas)                     |
| Documentation    | VitePress                                      |

---

## Architecture

Clean Architecture with 4 layers per feature module:

1. **Domain** — Pure Dart models (no Flutter / Supabase / Riverpod imports)
2. **Data** — Repository interfaces + local / remote implementations
3. **Application** — Riverpod providers and use-cases
4. **Presentation** — Screens, widgets

Each feature lives in `lib/src/features/{name}/` with `domain/`, `data/`, `application/`, `presentation/` subdirectories.

---

## Project Conventions

- **Files:** `snake_case.dart`
- **Classes:** `PascalCase`
- **Variables / functions:** `camelCase`
- **Constants:** `camelCase` with `k` prefix (e.g. `kMaxHorses`)
- **Providers:** `{name}Provider`
- **Bilingual UI text** — Mongolian + English throughout
- **Doc comments** (`///`) on all public classes and methods

See [CLAUDE.md](CLAUDE.md) and [AGENTS.md](AGENTS.md) for full coding guidelines.

---

## Lost Horse Enhancement

A comprehensive lost horse/livestock reporting system built in three milestones. Integrates deeply with the Mongolian administrative location hierarchy (Аймаг / Сум / Баг) and supports detailed animal classification, multi-photo uploads, tamga stamp + ear mark identification, contact phone integration, chat, and pricing tiers.

### Milestone 1 — Reporting & Classification

- **Administrative location picker** — Three-level cascade: Аймаг (province) → Сум (district) → Баг (sub-district)
- **Detailed animal classification** — Type (horse, cattle, camel, sheep, goat, yak), age in Монгол нэршил (traditional Mongolian age naming), breed, coat color (40+ options), gender, distinctive markings
- **Multi-photo upload** — Upload up to 5 photos of the lost animal
- **Tamga stamp + ear mark** — Record traditional ownership marks (тамга тэмдэг + чип / чимэг)
- **Contact phone** — Reporters provide a contact phone number for inquiries
- **Chat integration** — Built-in chat between report authors and respondents

### Milestone 2 — Pricing Tiers & Auto-Expiry

- **Free tier** — Basic listing with standard visibility
- **Featured tier** — Paid boost for higher visibility in searches and feeds
- **VIP tier** — Premium placement with extended duration
- **Pricing system** — Configurable pricing with duration-based auto-expiry for each tier
- **Auto-expiry** — Reports automatically expire after their tier's duration elapses
- **Renewal** — Expired reports can be renewed (extend duration) by the author

### Milestone 3 — Filters & Discovery

- **Filter controls** — Filter lost horse reports by Аймаг, төрөл (animal type), зүс (coat color), and статус (status)
- **Status filtering** — Active vs expired reports can be toggled
- **Phone verification gate** — Reporters must verify their phone number before publishing
- **Error handling** — Comprehensive Mongolian-language error messages throughout the flow

---

## DRY/CLEAN Codebase Refactoring

A comprehensive codebase refactoring mission completed in June 2026 to eliminate duplication and enforce consistent patterns across all layers:

- **Supabase Repository Mixin** — Extracted `SupabaseRepositoryMixin` into `lib/src/core/data/`, eliminating ~400 lines of duplicated `_wrap()`/`_noClient()`/`_userId()`/`_safe` boilerplate across 19 Supabase repositories. Standardized row mapping to domain model `fromSupabaseJson`/`toSupabaseJson`.

- **Local Repository Base Class** — Created `LocalRepository<T, TIsar>` in `lib/src/core/data/`, extracting ~500 lines of duplicated Isar CRUD + SyncQueue enqueue logic. All 8 local repositories extend it.

- **Dead Code Cleanup** — Removed legacy `MedicalLog`/`MedicalLogType` models (obsolete after `HealthLog`/`LogType` migration), deleted duplicate `HorseMarkerType` enum, centralized `kRaceCategories` constant, fixed `OnboardingData.horseGender` to use proper `HorseGender` enum.

- **Widget Consolidation** — Refactored `EventCard`, `HealthLogCard`, `StatCard`, and `ListingBadge` to compose with core `TamgaCard`/`TamgaSummaryCard`/`TamgaBadge` widgets instead of raw `Container`+`BoxDecoration` from scratch.

- **Isar Index & Timestamp Upgrades** — Added `@Index(unique: true, replace: true)` to all 36 domainId fields and `@Index()` to all 12 horseId fields across Isar schemas for query performance. Added `createdAt`/`updatedAt` timestamps to 11 schemas for offline sync ordering.

- **Provider Pattern Consolidation** — Extracted `createListProvider` helper eliminating repeated `FutureProvider<List<T>>` boilerplate across 7 feature provider files (14 call sites).

- **Verification** — All 2250 tests pass, `dart analyze` clean (0 errors), `build_runner` regenerates cleanly.

### How to Run

```bash
flutter pub get && dart run build_runner build && flutter run
```

### How to Test

```bash
flutter test
```

---

## Migration — New Packages & Modernization

The codebase was migrated to use modern Dart/Flutter packages:

- **freezed** — Domain models now use `@freezed` for immutable classes with auto-generated `copyWith`, `==`/`hashCode`, and JSON serialization. Migrated models: `Horse`, `HealthLog`, `LostHorseReport`, `MarketListing` (manual), and 5 Lineage models (`LineageRoot`, `LineageSnapshot`, `LineageTreeNode`, `LineageTreeEdge`, `LineageTimelineEntry`).
- **google_fonts** — App typography uses Inter font via Google Fonts for better cross-platform text rendering.
- **shadcn_flutter** — App wrapped with `ShadcnLayer` for access to shadcn/flutter design system components.
- **flutter_animate** — Added entrance animations to splash screen, app shell, login screen, horses screen, and market screen.
- **gap** — Available for consistent spacing (replacing `SizedBox`).
- **flutter_hooks** — Available for hook-based state management in widgets.
- **flutter_secure_storage** — Available for secure credential storage.
- **Supabase serialization** — Extracted to separate extension files (e.g. `horse_supabase.dart`) keeping domain models clean.

### Code Generation

```bash
dart run build_runner build --delete-conflicting-outputs
```

### Status

- ✅ 0 analyzer errors
- ✅ 2247/2247 tests passing (1 skipped)
- ✅ All existing features preserved
- ✅ Clean Architecture maintained
