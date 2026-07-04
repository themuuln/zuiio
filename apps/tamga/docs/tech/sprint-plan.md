---
title: Sprint Plan — Parallel Development Roadmap
description: Sprint-based task breakdown for subagent-driven parallel development. Each sprint has independent workstreams that can run concurrently.
---

# Sprint Plan — Parallel Development

> This is the operational execution plan. Each sprint has **independent workstreams** designed for parallel subagent execution. Tasks within a workstream are sequential; workstreams within a sprint are parallel.

---

## Current State Assessment

### What Exists (Working)

- [x] **App shell** — 5-tab nav (Lineage, Horses, Events, Market, Profile) — `app_shell.dart`, `app_router.dart`
- [x] **Theme** — Full design system (colors, typography, spacing) — `app/theme/` (5 files)
- [x] **Error handling** — Result type, AppException — `core/error/` (2 files)
- [x] **Onboarding** — Flow with provider — `features/onboarding/`
- [x] **Lineage** — Tree/List/Timeline views, inbreeding calculator — `features/lineage/` (10 files)
- [x] **Horses** — CRUD, co-ownership, health records — `features/horses/` (9 files)
- [x] **Events** — CRUD, event records — `features/events/` (5 files)
- [x] **Market** — Listings, price history, marketplace revenue — `features/market/` (8 files)
- [x] **Profile** — Settings, cloud sync coordinator — `features/profile/` (5 files)
- [x] **Search** — Basic search — `features/search/` (2 files)
- [x] **Breeding** — Gestation tracker, breeding records — `features/breeding/` (4 files)
- [x] **Health** — Health & farrier logs — `features/health/` (2 files)
- [x] **Shared** — Sync preferences — `features/shared/` (3 files)
- [x] **Local storage** — Isar (15 schemas, fully integrated) — `lib/src/core/isar/`
- [x] **Sync engine** — Sync queue + cloud sync (Supabase integration, conflict resolution) — `core/sync/`
- [x] **Auth** — Phone OTP login, multi-provider auth (Google/Apple code ready), Supabase auth — `features/auth/`
- [x] **Map & lost horse finder** — Offline map tiles, lost horse geofence alerts — `features/map/`, `features/lost_horse/`
- [x] **Document vault** — Upload, view, and manage horse documents — `features/documents/`
- [x] **Digital certificates** — Ownership certificates with verification — `features/certificates/`
- [x] **Horse transfer** — Ownership transfer with verification — `features/horses/`
- [x] **Payments** — Payment infrastructure scaffolding — `features/payments/`
- [x] **Stable management** — Multi-user stable teams — `features/stable/`
- [x] **Race videos** — Upload and view race videos — `features/race_videos/`
- [x] **Public tournament profiles** — Tournament results for marketplace trust
- [x] **Push notification triggers** — Reminder scheduling infrastructure
- [x] **Pagination** — Infinite scroll on list screens
- [x] **Co-ownership** — Local-only co-ownership records (cloud sync pending)

### What's Scaffolded (Needs Work)

- [ ] **Co-ownership cloud sync** — Local-only Isar, no Supabase sync yet
- [ ] **Multi-provider auth config** — Google/Apple sign-in code ready, needs Firebase project config
- [ ] **Offline-first UX polish** — Core sync works, but offline indicators and conflict resolution need refinement

### What Doesn't Exist Yet

- [ ] QPay/SocialPay billing (Phase 2 — 🟡 High)
- [ ] Full push notification delivery (trigger infrastructure exists, FCM/APNs delivery pending)
- [ ] Uyach migration tool (Phase 2 — 🟡 High)
- [ ] AI breeding advisor (Phase 4 — 🟢 Medium)
- [ ] GPS herd tracking (Phase 4 — 🟢 Medium)
- [ ] Web dashboard (Phase 3 — 🟢 Medium)
- [ ] Comprehensive test suite (All — 🔴 Critical)

---

## Sprint Structure

```
Sprint 1 (Week 1–2)  ──── Foundation: Auth + Isar + Tests
  ├── WS-A: Auth System          (1 agent) ✅ Complete
  ├── WS-B: Isar Migration       (1 agent) ✅ Complete
  └── WS-C: Test Foundation      (1 agent)

Sprint 2 (Week 3–4)  ──── Sync + Payments + Offline
  ├── WS-D: Supabase Sync        (1 agent)
  ├── WS-E: QPay Integration     (1 agent) - Deferred, customer service manually check payments for now
  ├── WS-F: Feature Polish       (1 agent)
  └── WS-T: Offline-First UX     (1 agent)

Sprint 3 (Week 5–6)  ──── Documents + Notifications
  ├── WS-G: Document Vault       (1 agent) -- Guide / Гарын авлага with detailed picture and videos
  ├── WS-H: Push Notifications   (1 agent)
  └── WS-I: Uyach Migration      (1 agent) -- Migrate from open data from internet, we have no access to uyach

Sprint 4 (Week 7–8)  ──── Marketplace + Community + Ownership + Data
  ├── WS-J: Marketplace Real     (1 agent)
  ├── WS-K: Race Registration    (1 agent)
  ├── WS-L: Social Features      (1 agent)
  ├── WS-S: Ownership Transfer   (1 agent)
  └── WS-U: Training & Nutrition (1 agent)

Sprint 5 (Week 9–10) ──── AI + Premium + Collaboration + GPS
  ├── WS-M: AI Breeding Advisor  (1 agent) -- Gemini model for now
  ├── WS-N: Analytics Dashboard  (1 agent)
  ├── WS-O: Premium Tier Gate    (1 agent)
  ├── WS-V: Multi-User Teams     (1 agent)
  └── WS-W: GPS Herd Tracking    (1 agent) -- Deferred, will research on gps providers and other things

Sprint 6 (Week 11–12) ──── Polish + Launch + Web + API
  ├── WS-P: Performance Audit    (1 agent)
  ├── WS-Q: App Store Prep       (1 agent)
  ├── WS-R: Documentation Final  (1 agent)
  ├── WS-X: Web Dashboard        (1 agent)
  └── WS-Y: Organizer API        (1 agent)
```

---

## Sprint 1 — Foundation (Week 1–2)

> **Goal:** Auth system, local storage (Isar), test foundation. Everything else builds on this.
>
> **Parallel:** All 3 workstreams are independent. No cross-dependencies.

---

### WS-A: Auth System (✅ Complete)

> Phone OTP auth, multi-provider auth, and auth gate are all built.
> This workstream is complete.

**Files touched:** `lib/src/core/auth/`, `lib/src/app/supabase_bootstrap.dart`, `lib/src/features/auth/`, `lib/src/features/onboarding/`

- [x] **A1** — Create `AuthService` abstraction: abstract class in `core/auth/auth_service.dart` with `signInWithPhone()`, `verifyOtp()`, `signOut()`, `getCurrentUser()`, `isAuthenticated` — compiles, no Supabase dep in interface
- [x] **A2** — Create `SupabaseAuthService`: implementation using `supabase_flutter` auth — phone OTP flow works with Supabase
- [x] **A3** — Create `MockAuthService`: testing, stores user in memory — all auth-dependent providers can be tested
- [x] **A4** — Create `auth_providers.dart`: Riverpod providers `authServiceProvider`, `currentUserProvider`, `isAuthenticatedProvider` — providers inject correct impl based on env
- [x] **A5** — Update `supabase_bootstrap.dart`: Supabase auth with phone OTP — anonymous auth removed, phone OTP available
- [x] **A6** — Create phone OTP screen: `phone_input_screen.dart` + `otp_verify_screen.dart` — user enters phone → gets OTP → verified → app opens
- [x] **A7** — Create auth gate widget: `features/auth/presentation/auth_gate.dart` — checks auth state, routes to OTP or app
- [x] **A8** — Update onboarding flow: onboarding → auth gate → phone OTP — smooth handoff
- [x] **A9** — Unit tests: test `MockAuthService`, auth providers, auth gate routing — `flutter test` passes
- [x] **A10** — Update `app.dart`: auth check → main app or OTP

**Dependencies:** None
**Blocks:** WS-D (Supabase sync needs real auth)

---

### WS-B: Isar Local Storage (✅ Complete)

> Isar is fully integrated with 15 schemas. This workstream is complete.
> No further work needed on local storage infrastructure.

**Files touched:** `pubspec.yaml`, `lib/src/core/isar/`, `lib/src/features/*/data/`

- [x] **B1** — Add Isar dependencies: `isar`, `isar_flutter_libs`, `isar_generator` in pubspec — `flutter pub get` succeeds
- [x] **B2** — Create `IsarDatabase` class: `core/isar/isar_database.dart` — initializes Isar, registers all 15 schemas — app starts without errors
- [x] **B3–B8** — Create Isar schemas for all entity types: HorseRecord, HealthRecord, EventRecord, MarketListing, BreedingRecord, ProfileSettings, and 9 more — generated adapters compile
- [x] **B9–B14** — Migrate local repositories: replace SharedPreferences/JSON with Isar collection operations — CRUD works with Isar for all 7+ repository types
- [x] **B15** — Data migration utility: one-time migration from SharedPreferences JSON to Isar — existing users don't lose data
- [x] **B16** — Update `main.dart`: initialize Isar before app starts — app starts cleanly with Isar
- [x] **B17** — Repository unit tests: test each repository with Isar — `flutter test` passes
- [x] **B18** — Remove old `LocalJsonStore`: deleted after all repositories migrated — no dead code

**Dependencies:** None
**Blocks:** WS-D (sync engine reads from Isar)

---

### WS-C: Test Foundation

> **Agent type:** `workflow-worker` [EXEC]
> **Estimated effort:** 2 days
> **Files touched:** `test/`, `lib/src/shared/domain/`

- [ ] **C1** — Audit existing tests: check which tests pass, which are broken, coverage gaps — test status report
- [ ] **C2** — Create test helpers: `test/helpers/` — mock factories for HorseRecord, HealthRecord, etc. — reusable test data builders
- [ ] **C3** — Fix broken tests: update any tests broken by recent code changes — all existing tests pass
- [ ] **C4** — Add domain model unit tests: test `HorseRecord`, `HealthRecord`, `EventRecord`, `BreedingRecord`, `MarketListing` — 100% domain model coverage
- [ ] **C5** — Add `Result` type tests: test success, failure, map, flatMap operations — edge cases covered
- [ ] **C6** — Add `InbreedingCalculator` tests: test with known pedigree data, edge cases (no parents, circular) — algorithm correctness verified
- [ ] **C7** — Add `PedigreeLayout` tests: test layout computation with mock tree data — layout produces valid positions
- [ ] **C8** — Create `test/README.md`: document test structure, how to run, conventions — new contributors know how to test
- [ ] **C9** — Set up test coverage: configure `lcov` output, minimum coverage threshold — `flutter test --coverage` works

**Dependencies:** None (can run parallel with A and B)
**Blocks:** All future workstreams (tests validate everything)

---

## Sprint 2 — Sync + Payments + Offline (Week 3–4)

> **Goal:** Real Supabase sync, QPay billing, feature polish, offline-first experience. Depends on Sprint 1 (auth + Isar).
>
> **Parallel:** All 4 workstreams are independent.

---

### WS-D: Supabase Sync Engine

> **Agent type:** `workflow-worker` [EXEC]
> **Estimated effort:** 3–4 days
> **Files touched:** `lib/src/core/sync/`, `lib/src/features/*/data/`, Supabase migrations

- [ ] **D1** — Create `SupabaseRepository` base class: abstract class with `supabaseClient` injection, common CRUD helpers — compiles, injectable
- [ ] **D2** — Implement `CloudHorsesRepository`: Supabase operations insert, update, delete, list with RLS — CRUD against Supabase works
- [ ] **D3** — Implement `CloudHealthRepository`: same pattern for health logs — CRUD against Supabase works
- [ ] **D4** — Implement `CloudEventsRepository`: same pattern for events — CRUD against Supabase works
- [ ] **D5** — Implement `CloudMarketRepository`: same pattern for market listings — CRUD against Supabase works
- [ ] **D6** — Implement `CloudBreedingRepository`: same pattern for breeding records — CRUD against Supabase works
- [ ] **D7** — Implement `CloudProfileRepository`: profile upsert, subscription check — profile syncs to Supabase
- [ ] **D8** — Enhance `SyncEngine`: process sync queue iterate pending items, send to cloud, handle success/failure/retry — queue items processed in order
- [ ] **D9** — Implement conflict resolution: last-write-wins for most entities, timestamp merge for horses — conflicts resolved correctly
- [ ] **D10** — Add connectivity monitor: `ConnectivityMonitor` class checks network state, triggers sync when online — sync runs when network available
- [ ] **D11** — Create `SyncStatusProvider`: Riverpod provider exposing sync state `idle`, `syncing`, `error`, `lastSyncTime` — UI can show sync status
- [ ] **D12** — Update repositories to use sync: each local repository enqueues changes to `SyncQueue` after local write — local-first, then sync
- [ ] **D13** — Write sync integration tests: test full cycle local write → queue → sync → cloud verify — end-to-end sync works
- [ ] **D14** — Create Supabase migration for RLS: verify/update RLS policies for all tables — `supabase db push` succeeds

**Dependencies:** WS-A (auth), WS-B (Isar)
**Blocks:** WS-G (document vault needs cloud storage)

---

### WS-E: QPay/SocialPay Integration

> **Agent type:** `workflow-worker` [EXEC]
> **Estimated effort:** 2–3 days
> **Files touched:** `lib/src/core/payments/`, `lib/src/features/profile/`, pubspec.yaml

- [ ] **E1** — Research QPay API: read QPay developer docs, understand QR code generation, callback flow — API understanding documented
- [ ] **E2** — Create `PaymentService` abstraction: abstract class `createPayment()`, `checkStatus()`, `cancelPayment()` — compiles, testable
- [ ] **E3** — Implement `QPayService`: QR code generation, payment status polling/callback — payment flow works in sandbox
- [ ] **E4** — Create `SubscriptionManager`: manages tier selection, payment initiation, receipt validation — user can select tier and pay
- [ ] **E5** — Create payment UI screen: `features/billing/presentation/plan_selection_screen.dart` — tiers displayed, user can select
- [ ] **E6** — Create payment confirmation screen: QR code display, status polling, success/failure states — payment flow completes
- [ ] **E7** — Integrate with RevenueCat: handle Apple/Google in-app purchases for mobile — iOS/Android billing works
- [ ] **E8** — Create `SubscriptionGate` widget: wraps premium features, shows upgrade prompt for free users — premium features gated correctly
- [ ] **E9** — Update profile screen: show current tier, subscription status, upgrade button — user sees their plan
- [ ] **E10** — Write payment flow tests: mock payment service, test selection → payment → confirmation — payment logic verified

**Dependencies:** WS-A (auth for user identification)
**Blocks:** WS-O (premium tier gating)

---

### WS-F: Feature Polish

> **Agent type:** `workflow-worker` [EXEC]
> **Estimated effort:** 2 days
> **Files touched:** `lib/src/features/*/presentation/`

- [ ] **F1** — Audit all screens for placeholder content: find screens showing "Coming Soon" or mock data — list of screens needing work
- [ ] **F2** — Polish horse detail screen: full profile view with all fields, photo gallery, action buttons — horse detail looks complete
- [ ] **F3** — Polish health record screens: list view with filters, add/edit form, date pickers — health tracking is usable
- [ ] **F4** — Polish event screens: list view with filters, add/edit form, event type icons — event tracking is usable
- [ ] **F5** — Polish market listing screens: card grid, detail view, price display, contact seller — marketplace looks professional
- [ ] **F6** — Add empty states: meaningful empty states for each screen (not just blank) — no empty blank screens
- [ ] **F7** — Add loading states: skeleton loaders or shimmer for async data loading — no jarring loading spinners
- [ ] **F8** — Add error states: user-friendly error messages with retry buttons — errors handled gracefully
- [ ] **F9** — Verify all navigation routes: test every route in `app_router.dart` works end-to-end — no broken navigation
- [ ] **F10** — Update onboarding screens: reflect Tamga branding, modern design — onboarding feels polished

**Dependencies:** None (pure UI work)
**Blocks:** None (but improves everything)

---

### WS-T: Offline-First UX

> **Agent type:** `workflow-worker` [EXEC]
> **Estimated effort:** 3 days
> **Files touched:** `lib/src/core/offline/`, `lib/src/features/*/presentation/`, `lib/src/app/`
>
> **Context:** Offline-first is Tamga's #1 differentiator for rural Mongolia. Isar (WS-B) provides local storage, Sync Engine (WS-D) provides cloud sync. WS-T builds the *user experience* — what people see and do when there's no signal. Every screen must work offline. The user should never feel blocked by connectivity.

- [ ] **T1** — Create `ConnectivityService`: `core/offline/connectivity_service.dart` — wraps `connectivity_plus`, exposes `Stream<ConnectivityState>` (online/offline/unknown), caches last known state — works on Android + iOS
- [ ] **T2** — Create `SyncStatus` model: `core/offline/sync_status.dart` — tracks per-entity sync state: `synced`, `pending`, `conflict`, `error` with timestamps — compiles
- [ ] **T3** — Create `OfflineBanner` widget: `core/offline/presentation/offline_banner.dart` — persistent banner at top of screen when offline, shows "Оффлайн горим" with last sync time, dismissible — appears/disappears based on connectivity
- [ ] **T4** — Create `SyncIndicator` widget: `core/offline/presentation/sync_indicator.dart` — per-screen sync status dot (green=synced, yellow=pending, red=error), tap to see details — visible on every data screen
- [ ] **T5** — Create `SyncQueueScreen`: `core/offline/presentation/sync_queue_screen.dart` — list of pending changes, retry failed, clear queue, last sync time — user can see what's waiting to sync
- [ ] **T6** — Create `ConflictResolutionScreen`: `core/offline/presentation/conflict_resolution_screen.dart` — when two devices edit the same record, show both versions side by side, let user pick winner — conflicts resolved by user, not silently
- [ ] **T7** — Create `OfflineWriteQueue`: `core/offline/offline_write_queue.dart` — queue model that tracks: entity type, entity ID, action (create/update/delete), payload, timestamp, retry count — persists to Isar, survives app restart
- [ ] **T8** — Enhance `SyncEngine` with retry logic: exponential backoff (1s, 2s, 4s, 8s, max 30s), max 5 retries per item, dead-letter queue for permanently failed items — sync is resilient
- [ ] **T9** — Add sync status to all data providers: each Riverpod provider exposes `syncStatus` alongside data — UI can show per-screen sync state
- [ ] **T10** — Add "Last synced" timestamp to profile screen: show when data was last synced to cloud, manual sync button — user knows their data freshness
- [ ] **T11** — Create offline image caching: cache horse photos in `{cacheDir}/horse-photos/` with LRU eviction (500MB limit), show cached images when offline — photos work without signal
- [ ] **T12** — Create offline-aware list screens: horses, health, events, market all show local data instantly, sync indicator in corner, pull-to-refresh triggers sync — lists feel instant even offline
- [ ] **T13** — Create offline-aware forms: all create/edit forms work offline, save locally first, enqueue for sync, show "saved locally, will sync when online" confirmation — user never loses work
- [ ] **T14** -  Add graceful degradation messages: when user tries online-only action while offline (e.g., contact seller, share link), show "This feature requires internet" with retry when reconnected — no silent failures
- [ ] **T15** — Create `SyncSettings` screen: toggle auto-sync, sync on WiFi only, clear local data, force sync now — user controls sync behavior
- [ ] **T16** — Add background sync: when app comes to foreground, trigger sync automatically; when connectivity returns, process queue automatically — sync is invisible when it works
- [ ] **T17** — Write offline tests: test write queue persistence, retry logic, conflict detection, connectivity state changes — `flutter test` passes
- [ ] **T18** — Write offline integration test: simulate offline → create horse → go online → verify sync → verify cloud state — end-to-end offline flow works

**Dependencies:** WS-B (Isar for local queue), WS-D (sync engine to enhance)
**Blocks:** None (but makes every other feature work offline)

### Offline-First — User Experience Flow

```
User opens app (no signal)
  │
  ├── App loads from Isar (instant, no loading spinner)
  ├── Offline banner appears: "Оффлайн горим — Сүүлд синк хийсэн: 2 цагийн өмнө"
  ├── All screens work: browse horses, add health records, edit profiles
  ├── Save operation: "Хадгалагдлаа — Сүлжээ ормогц синк болно"
  ├── Sync indicator: yellow dots on screens with pending changes
  │
User gets signal back
  │
  ├── Banner disappears
  ├── Background sync starts automatically
  ├── Yellow dots turn green as each screen syncs
  ├── If conflict: red dot → tap to resolve → pick version
  ├── "Бүх өгөгдөл синк хийгдлээ ✓" confirmation
```

### Offline-First — Architecture Integration

```
┌─────────────────────────────────────────────────┐
│                   UI Layer                       │
│  OfflineBanner · SyncIndicator · Forms           │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────┐
│              Application Layer                   │
│  Riverpod Providers (data + syncStatus)          │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────┐
│                Data Layer                         │
│  ┌─────────────┐  ┌──────────────┐              │
│  │ Local (Isar) │  │ SyncQueue    │              │
│  │ read/write   │  │ enqueue      │              │
│  └──────┬──────┘  └──────┬───────┘              │
│         │                │                       │
│  ┌──────┴────────────────┴───────┐              │
│  │         SyncEngine            │              │
│  │  retry · backoff · conflict   │              │
│  └──────────────┬────────────────┘              │
│                 │                                │
│  ┌──────────────┴────────────────┐              │
│  │     Cloud (Supabase)          │              │
│  └───────────────────────────────┘              │
└─────────────────────────────────────────────────┘
```

---

## Sprint 3 — Documents + Notifications (Week 5–6)

> **Goal:** Document vault, push notifications, Uyach migration tool.
>
> **Parallel:** All 3 workstreams are independent.

---

### WS-G: Document Vault

> **Agent type:** `workflow-worker` [EXEC]
> **Estimated effort:** 3 days
> **Files touched:** `lib/src/features/documents/`, Supabase Storage

- [ ] **G1** — Create `Document` domain model: `domain/document.dart` with id, horseId, type (vet_cert/insurance/registration/microchip/other), title, storageUrl, fileSize — compiles
- [ ] **G2** — Create `DocumentRepository` interface: abstract `uploadDocument()`, `getDocuments()`, `deleteDocument()`, `downloadDocument()` — compiles, injectable
- [ ] **G3** — Create `LocalDocumentRepository`: Isar-based local storage for metadata + local file cache — CRUD works locally
- [ ] **G4** — Create `CloudDocumentRepository`: Supabase Storage integration upload, download, list, delete — cloud storage works
- [ ] **G5** — Create document list screen: `features/documents/presentation/document_list_screen.dart` list per horse, filter by type — documents listed correctly
- [ ] **G6** — Create upload screen: file picker (camera/gallery/files), title input, type selector — user can upload documents
- [ ] **G7** — Create document viewer: PDF viewer, image viewer, download for offline — user can view documents
- [ ] **G8** — Create document providers: Riverpod providers for document list, upload state, download state — state management works
- [ ] **G9** — Add storage limits by tier: Free 50MB, Pro 5GB, Breeder 20GB, Stable 50GB — limits enforced
- [ ] **G10** — Write document tests: upload, download, delete, storage limit checks — `flutter test` passes

**Dependencies:** WS-D (cloud storage)
**Blocks:** None

---

### WS-H: Push Notifications

> **Agent type:** `workflow-worker` [EXEC]
> **Estimated effort:** 2 days
> **Files touched:** `lib/src/core/notifications/`, pubspec.yaml

- [ ] **H1** — Add Firebase dependencies: `firebase_core`, `firebase_messaging` in pubspec — `flutter pub get` succeeds
- [ ] **H2** — Configure Firebase: `firebase_options.dart` (generated), Android `google-services.json`, iOS `GoogleService-Info.plist` — app starts with Firebase
- [ ] **H3** — Create `NotificationService`: abstract `initialize()`, `requestPermission()`, `scheduleReminder()`, `cancelReminder()` — compiles, testable
- [ ] **H4** — Implement `FCMNotificationService`: Firebase Cloud Messaging integration token registration, background handler — push tokens received
- [ ] **H5** — Create `ReminderScheduler`: schedules local notifications for vaccination, deworming, farrier, registration — reminders appear at correct times
- [ ] **H6** — Create notification permission screen: after onboarding, ask for notification permission with clear explanation — user understands why
- [ ] **H7** — Integrate with `reminder_templates`: read from Isar/Supabase reminder_templates, schedule notifications — reminders auto-schedule
- [ ] **H8** — Create notification settings screen: toggle notifications per type, view upcoming reminders — user controls notifications
- [ ] **H9** — Write notification tests: test scheduling, cancellation, permission flow — `flutter test` passes

**Dependencies:** WS-B (Isar for reminder storage)
**Blocks:** None

---

### WS-I: Uyach Migration Tool

> **Agent type:** `workflow-worker` [EXEC]
> **Estimated effort:** 2 days
> **Files touched:** `lib/src/features/migration/`

- [ ] **I1** — Create migration screen: `features/migration/presentation/migration_screen.dart` "Import from Uyach" button — screen accessible from profile/settings
- [ ] **I2** — Create CSV/Excel import: parse exported horse data (CSV format) into `HorseRecord` objects — import works with sample data
- [ ] **I3** — Create Uyach export parser: parse Uyach's data export format (research format first) — parser handles Uyach's structure
- [ ] **I4** — Create import preview screen: show parsed data before import, let user review/modify — user sees what will be imported
- [ ] **I5** — Create import execution: batch insert into Isar + enqueue for Supabase sync — data imported correctly
- [ ] **I6** — Create import results screen: show success/failure counts, any errors — user knows what happened
- [ ] **I7** — Add duplicate detection: check if horse already exists by name+birthYear+owner — no duplicate horses
- [ ] **I8** — Write migration tests: test CSV parsing, duplicate detection, batch insert — `flutter test` passes

**Dependencies:** WS-B (Isar), WS-D (sync for cloud upload)
**Blocks:** None

---

## Sprint 4 — Marketplace + Community + Ownership (Week 7–8)

> **Goal:** Real marketplace with payments, race registration, social features, ownership transfer.
>
> **Parallel:** All 4 workstreams are independent.

---

### WS-J: Marketplace Real Transactions

> **Agent type:** `workflow-worker` [EXEC]
> **Estimated effort:** 3 days
> **Files touched:** `lib/src/features/market/`

- [ ] **J1** — Create listing creation form: full form title, description, price, sale type, location, photos, discipline tags — user can create listing
- [ ] **J2** — Add photo upload to listings: multi-photo upload via Supabase Storage — photos upload and display
- [x] **J3** — Create listing moderation flow: Published → Under Review → Published (or rejected) — listings reviewed before going live. Also built admin moderation queue for reported listings (approve/reject with seller notification behind feature flag).
- [ ] **J4** — Create seller profile: view seller's other listings, reputation score, member since — buyer can evaluate seller
- [ ] **J5** — Create buyer contact flow: "Contact Seller" → phone/WhatsApp link (no in-app chat MVP) — buyer can reach seller
- [ ] **J6** — Create "My Listings" screen: seller's active, sold, withdrawn listings — seller manages listings
- [ ] **J7** — Add marketplace commission: 3–5% fee on completed sales (tracked, not collected in MVP) — commission tracked
- [ ] **J8** — Create Facebook share integration: one-tap share listing to Facebook Marketplace — social distribution
- [ ] **J9** — Write marketplace tests: listing CRUD, photo upload, moderation flow — `flutter test` passes

**Dependencies:** WS-D (cloud sync), WS-G (photo upload pattern)
**Blocks:** None

---

### WS-K: Race Registration

> **Agent type:** `workflow-worker` [EXEC]
> **Estimated effort:** 2–3 days
> **Files touched:** `lib/src/features/races/`

- [ ] **K1** — Create `Race` domain model: id, name, location, date, type (naadam/regional/local), status — compiles
- [ ] **K2** — Create `RaceEntry` domain model: raceId, horseId, jockeyName, status (registered/confirmed/competed) — compiles
- [ ] **K3** — Create race list screen: upcoming races, past results, filter by type — races displayed
- [ ] **K4** — Create race detail screen: race info, registered horses, results (if past) — race detail works
- [ ] **K5** — Create registration flow: select horse → confirm → registration complete — user can register horse
- [ ] **K6** — Create race results display: results with placement, time, prize — results viewable
- [ ] **K7** — Create race organizer tools: create race, manage entries, enter results (scaffold for Phase 5) — scaffold exists
- [ ] **K8** — Write race tests: registration flow, results display — `flutter test` passes

**Dependencies:** None (can use local data first)
**Blocks:** None

---

### WS-L: Social Features

> **Agent type:** `workflow-worker` [EXEC]
> **Estimated effort:** 2 days
> **Files touched:** `lib/src/features/social/`

- [ ] **L1** — Create horse public profile: shareable link `tamga.app/horse/{id}` shows pedigree, achievements — link works
- [ ] **L2** — Create breeder profile: view breeder's horses, achievements, reputation — profile viewable
- [ ] **L3** — Add review/rating system: rate sellers after transaction (1–5 stars + comment) — rating system works
- [ ] **L4** — Create leaderboard: top breeders by horse count, achievements, reviews — leaderboard displayed
- [ ] **L5** — Add Facebook share: share horse profile to Facebook — social sharing works
- [ ] **L6** — Write social tests: rating, leaderboard logic — `flutter test` passes

**Dependencies:** None
**Blocks:** None

---

### WS-S: Ownership Transfer

> **Agent type:** `workflow-worker` [EXEC]
> **Estimated effort:** 3 days
> **Files touched:** `lib/src/features/ownership/`, `lib/src/core/auth/`, Supabase migrations
>
> **Context:** Ownership transfer is the digital тамга — the core metaphor of the app. When a horse is sold, leased, or gifted, the ownership record transfers with it. The new owner gets the horse's full history. This is what makes Tamga a *registry*, not just a notebook.

- [ ] **S1** — Create `OwnershipTransfer` domain model: `domain/ownership_transfer.dart` with id, horseId, fromUserId, toUserId, transferType (sale/lease/gift), status (pending/accepted/completed/rejected), timestamp, notes, priceAmount (for sales) — compiles
- [ ] **S2** — Create `DigitalCertificate` domain model: `domain/digital_certificate.dart` with id, horseId, ownerUserId, issuedAt, transferHistory (list of past owners), verificationHash — compiles
- [ ] **S3** — Create `TransferRepository` interface: abstract `initiateTransfer()`, `acceptTransfer()`, `rejectTransfer()`, `getTransferHistory()`, `getCertificate()` — compiles, injectable
- [ ] **S4** — Create `LocalTransferRepository`: Isar-based local storage for transfer records and certificates — CRUD works locally
- [ ] **S5** — Create `CloudTransferRepository`: Supabase operations with RLS (sender initiates, receiver accepts, both see history) — cloud CRUD works
- [ ] **S6** — Create Supabase migration: `ownership_transfers` table + `digital_certificates` table + `ownership_history` table with RLS policies — `supabase db push` succeeds
- [ ] **S7** — Create transfer initiation screen: `features/ownership/presentation/initiate_transfer_screen.dart` — select horse, enter recipient (by phone/search), choose type (sale/lease/gift), add price for sales, add notes — user can start transfer
- [ ] **S8** — Create transfer confirmation screen: `features/ownership/presentation/transfer_confirmation_screen.dart` — show horse details, transfer terms, accept/reject buttons — recipient can review and decide
- [ ] **S9** — Create transfer history screen: `features/ownership/presentation/transfer_history_screen.dart` — timeline of all past transfers for a horse, who owned when, transfer dates — full provenance visible
- [ ] **S10** — Create digital certificate screen: `features/ownership/presentation/certificate_screen.dart` — beautiful certificate view with horse name, current owner, transfer history, verification badge — looks official
- [ ] **S11** — Create "My Transfers" screen: `features/ownership/presentation/my_transfers_screen.dart` — incoming (pending acceptance) and outgoing (sent) transfers, completed history — user manages all transfers
- [ ] **S12** — Create transfer providers: Riverpod providers for transfer state, certificate generation, transfer history — state management works
- [ ] **S13** — Integrate with push notifications: send notification to recipient when transfer initiated, to sender when accepted/rejected — both parties notified
- [ ] **S14** — Integrate with sync engine: transfers queue locally then sync to cloud, conflict resolution (last-write-wins for status changes) — works offline
- [ ] **S15** — Add ownership badge to horse profile: show current owner, ownership status, "Transfer" action button — visible on horse detail screen
- [ ] **S16** — Create shareable certificate link: `tamga.app/certificate/{id}` — public verification page showing horse ownership chain — anyone can verify
- [ ] **S17** — Add lease expiration handling: for lease transfers, auto-revert ownership after lease period ends, notify both parties — lease lifecycle works
- [ ] **S18** — Write ownership tests: initiate, accept, reject, history, certificate generation, lease expiration — `flutter test` passes

**Dependencies:** WS-D (cloud sync), WS-A (auth for user identification), WS-H (notifications)
**Blocks:** WS-J (marketplace "Buy" button triggers ownership transfer)

---

### WS-U: Training & Nutrition Tracking

> **Agent type:** `workflow-worker` [EXEC]
> **Estimated effort:** 2 days
> **Files touched:** `lib/src/features/training/`, `lib/src/features/nutrition/`
>
> **Context:** Uyach has zero training or nutrition tracking. Serious breeders and race trainers need to log workouts, feed schedules, and track performance over time. This is a major gap to exploit.

- [ ] **U1** — Create `TrainingLog` domain model: `training/domain/training_log.dart` with id, horseId, date, type (gallop/sprint/endurance/rest), duration, distance, notes, handlerName, weather — compiles
- [ ] **U2** — Create `FeedSchedule` domain model: `nutrition/domain/feed_schedule.dart` with id, horseId, feedType (hay/grain/supplement), quantityKg, frequency, startDate, endDate, notes — compiles
- [ ] **U3** — Create `FeedLog` domain model: `nutrition/domain/feed_log.dart` with id, scheduleId, horseId, date, amountGiven, skipped (bool), notes — compiles
- [ ] **U4** — Create `PerformanceRecord` domain model: `training/domain/performance_record.dart` with id, horseId, date, metric (speed/endurance/weight/condition), value, unit, notes — compiles
- [ ] **U5** — Create `TrainingRepository` interface + local + cloud implementations: CRUD for training logs, feed schedules, feed logs, performance records — works offline and online
- [ ] **U6** — Create training log screen: `training/presentation/training_screen.dart` — list of sessions per horse, add/edit form with type picker, duration/distance inputs, calendar view — trainer can log workouts
- [ ] **U7** — Create feed schedule screen: `nutrition/presentation/feed_screen.dart` — set up feed schedule per horse, daily feed log checklist (mark fed/skipped), feed inventory — nutrition tracked
- [ ] **U8** — Create performance tracker: `training/presentation/performance_screen.dart` — chart of weight/condition over time, log new measurements, trend line — progress visible
- [ ] **U9** — Create training providers: Riverpod providers for training logs, feed schedules, performance data — state management works
- [ ] **U10** — Integrate with horse detail screen: add "Training" and "Nutrition" tabs to horse profile — accessible from horse page
- [ ] **U11** — Add feed reminders: integrate with WS-H notification system, remind when feed time, track missed feeds — nutrition consistency
- [ ] **U12** — Write training/nutrition tests: CRUD operations, reminder scheduling, performance calculations — `flutter test` passes

**Dependencies:** WS-B (Isar), WS-D (sync), WS-H (notifications for feed reminders)
**Blocks:** None

### Ownership Transfer — Detailed Flow

```
Seller/Breeder                    Buyer/Receiver
     │                                │
     ├── Initiate Transfer ──────────►│  (push notification)
     │   (select horse, enter phone,  │
     │    set price, add notes)       │
     │                                │
     │                                ├── Review horse details
     │                                ├── Review transfer terms
     │                                ├── Accept / Reject
     │                                │
     │  ◄── (push notification) ──────┤
     │                                │
     ├── Horse owner_id updates ─────►│  (auto via Supabase trigger)
     ├── Certificate generated ──────►│  (new certificate for buyer)
     ├── Full history preserved ─────►│  (buyer sees all past owners)
     │                                │
     ├── TRANSFER COMPLETE            │
     │                                │
     │   (For lease: auto-revert      │
     │    after expiration date)      │
```

### Ownership Transfer — Database Schema

```sql
-- Ownership transfers
CREATE TABLE ownership_transfers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id        UUID NOT NULL REFERENCES horses(id),
  from_user_id    UUID NOT NULL REFERENCES profiles(id),
  to_user_id      UUID NOT NULL REFERENCES profiles(id),
  transfer_type   TEXT NOT NULL CHECK (transfer_type IN ('sale','lease','gift')),
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','accepted','completed','rejected')),
  price_amount    INTEGER,
  currency        TEXT DEFAULT 'MNT',
  lease_start     DATE,
  lease_end       DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

-- Digital certificates
CREATE TABLE digital_certificates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id        UUID NOT NULL REFERENCES horses(id),
  owner_user_id   UUID NOT NULL REFERENCES profiles(id),
  transfer_id     UUID REFERENCES ownership_transfers(id),
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active       BOOLEAN DEFAULT true,
  verification    TEXT NOT NULL  -- hash for public verification
);

-- Ownership history (append-only)
CREATE TABLE ownership_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id        UUID NOT NULL REFERENCES horses(id),
  from_user_id    UUID REFERENCES profiles(id),
  to_user_id      UUID NOT NULL REFERENCES profiles(id),
  transfer_type   TEXT NOT NULL,
  transferred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes           TEXT
);
``` — AI + Premium (Week 9–10)

> **Goal:** AI breeding advisor, analytics dashboard, premium tier enforcement.
>
> **Parallel:** All 3 workstreams are independent.

---

### WS-M: AI Breeding Advisor

> **Agent type:** `workflow-worker` [EXEC]
> **Estimated effort:** 3 days
> **Files touched:** `lib/src/features/ai/`, Supabase Edge Functions

- [ ] **M1** — Create `AIService` abstraction: abstract `getBreedingAdvice()`, `analyzeInbreeding()`, `predictOutcome()` — compiles, testable
- [ ] **M2** — Implement `ClaudeAIService`: Claude API integration via Supabase Edge Function — API call works
- [ ] **M3** — Create Edge Function: `supabase/functions/ai-breeding/index.ts` proxies Claude API, enforces auth — function deploys
- [ ] **M4** — Create breeding advice screen: input select 2 horses → output compatibility analysis, inbreeding risk, suggestions — UI works end-to-end
- [ ] **M5** — Create inbreeding risk visualizer: color-coded risk assessment with explanation — visual feedback
- [ ] **M6** — Create breeding history tracker: log breeding outcomes, track success rates — data accumulates
- [ ] **M7** — Add rate limiting: Free 5 AI queries/month, Pro 50, Breeder unlimited — limits enforced
- [ ] **M8** — Write AI tests: mock API responses, test parsing, rate limiting — `flutter test` passes

**Dependencies:** WS-A (auth for API calls)
**Blocks:** None

---

### WS-N: Analytics Dashboard

> **Agent type:** `workflow-worker` [EXEC]
> **Estimated effort:** 2–3 days
> **Files touched:** `lib/src/features/analytics/`

- [ ] **N1** — Create `HerdAnalytics` model: total horses, age distribution, gender split, breed breakdown — compiles
- [ ] **N2** — Create `HealthAnalytics` model: vaccination completion rate, upcoming due, health trends — compiles
- [ ] **N3** — Create `FinancialAnalytics` model: revenue per horse, expenses, ROI, cost tracking — compiles
- [ ] **N4** — Create analytics screen: dashboard with charts (age bar, gender pie, health timeline) — dashboard displays data
- [ ] **N5** — Create chart widgets: reusable bar chart, pie chart, line chart, stat card — charts render correctly
- [ ] **N6** — Add export to PDF: generate PDF report with all analytics — PDF downloads
- [ ] **N7** — Add export to CSV: export raw data as CSV — CSV downloads
- [ ] **N8** — Write analytics tests: test calculations, chart data preparation — `flutter test` passes

**Dependencies:** WS-B (Isar for local data queries)
**Blocks:** None

---

### WS-O: Premium Tier Gating

> **Agent type:** `workflow-worker` [EXEC]
> **Estimated effort:** 1–2 days
> **Files touched:** `lib/src/features/billing/`, `lib/src/features/*/presentation/`

- [ ] **O1** — Create `SubscriptionTier` enum: `free`, `basic`, `pro`, `business`, `enterprise` with feature map — compiles
- [ ] **O2** — Create `TierGate` widget: wraps any widget, shows upgrade prompt if tier insufficient — gate works on any feature
- [ ] **O3** — Gate health records (advanced): advanced analytics behind Pro — free users see upgrade prompt
- [ ] **O4** — Gate breeding tools: breeding advisor behind Breeder tier — free/basic users see prompt
- [ ] **O5** — Gate marketplace features: featured listings behind Pro — free users see prompt
- [ ] **O6** — Gate analytics (advanced): advanced charts behind Pro — free users see prompt
- [ ] **O7** — Create upgrade prompt UI: beautiful, persuasive upgrade screen (not just text) — prompt converts
- [ ] **O8** — Write gating tests: test each gate with different tiers — `flutter test` passes

**Dependencies:** WS-E (payment system)
**Blocks:** None

---

### WS-V: Multi-User Teams (Stable Manager)

> **Agent type:** `workflow-worker` [EXEC]
> **Estimated effort:** 3 days
> **Files touched:** `lib/src/features/teams/`, `lib/src/features/profile/`, Supabase migrations
>
> **Context:** Uyach has no multi-user collaboration. Stables with 10+ horses need multiple staff members managing records. This is a Business-tier feature that justifies the ₮49,900/mo price.

- [ ] **V1** — Create `TeamMember` domain model: `teams/domain/team_member.dart` with userId, stableId, role (owner/manager/vet/groom/viewer), permissions (read/write/admin), joinedAt — compiles
- [ ] **V2** — Create `Stable` domain model: `teams/domain/stable.dart` with id, name, ownerUserId, memberCount, horseCount, createdAt — compiles
- [ ] **V3** — Create `TeamRepository` interface: abstract `inviteMember()`, `removeMember()`, `updateRole()`, `getMembers()`, `getStable()` — compiles, injectable
- [ ] **V4** — Create `LocalTeamRepository` + `CloudTeamRepository`: Isar local + Supabase cloud with RLS (stable owner manages members) — works offline and online
- [ ] **V5** — Create Supabase migration: `stables` table + `team_members` table with RLS policies — `supabase db push` succeeds
- [ ] **V6** — Create team management screen: `teams/presentation/team_screen.dart` — list members, roles, invite by phone/email, remove, change role — owner manages team
- [ ] **V7** — Create invite flow: send invite via SMS/notification, accept/decline, role assignment — new member onboarding
- [ ] **V8** — Create role-based UI: each role sees different actions (groom can log health but not delete horses, viewer can only read) — permissions enforced in UI
- [ ] **V9** — Create stable profile screen: `teams/presentation/stable_profile_screen.dart` — stable name, member list, horse count, activity feed — stable overview
- [ ] **V10** — Integrate with horse list: show which team member last edited each horse, activity log — accountability
- [ ] **V11** — Gate behind Stable tier: team features only for Stable subscribers — premium upsell
- [ ] **V12** — Write team tests: invite flow, role permissions, RLS policies — `flutter test` passes

**Dependencies:** WS-A (auth), WS-B (Isar), WS-D (sync), WS-O (tier gating)
**Blocks:** None

---

### WS-W: GPS Herd Tracking

> **Agent type:** `workflow-worker` [EXEC]
> **Estimated effort:** 3 days
> **Files touched:** `lib/src/features/gps/`, `lib/src/core/gps/`, MapLibre integration
>
> **Context:** Zero competitors have GPS tracking. For herders managing 100+ horses across vast pasture, knowing where the herd is = preventing loss. This is a premium differentiator that justifies Breeder/Stable tiers.

- [ ] **W1** — Create `HerdLocation` domain model: `gps/domain/herd_location.dart` with horseId, latitude, longitude, altitude, accuracy, timestamp, batteryLevel (for collar devices) — compiles
- [ ] **W2** — Create `GpsDevice` domain model: `gps/domain/gps_device.dart` with id, horseId, deviceType (phone/collar/lora), status (active/low-battery/offline), lastSeen — compiles
- [ ] **W3** — Create `GpsRepository` interface: abstract `updateLocation()`, `getHerdLocations()`, `getHorseTrail()`, `getGeofenceStatus()` — compiles, injectable
- [ ] **W4** — Create `LocalGpsRepository` + `CloudGpsRepository`: Isar local cache + Supabase with PostGIS for spatial queries — works offline and online
- [ ] **W5** — Create Supabase migration: `herd_locations` table (with PostGIS geography column) + `gps_devices` table — `supabase db push` succeeds
- [ ] **W6** — Create map screen: `gps/presentation/map_screen.dart` — full-screen map with horse markers, cluster markers for dense herds, tap horse to see details — herd visible on map
- [ ] **W7** — Integrate MapLibre/Mapbox: tile rendering, offline map tiles for rural areas, satellite view toggle — maps work offline
- [ ] **W8** — Create horse trail view: `gps/presentation/trail_screen.dart` — show path a horse has traveled over last 24h/7d/30d — movement history visible
- [ ] **W9** — Create geofence feature: `gps/presentation/geofence_screen.dart` — draw pasture boundaries on map, alert when horse leaves area — theft/loss prevention
- [ ] **W10** — Create location sharing: share herd location with team members (temporary link) — coordination between herders
- [ ] **W11** — Add phone-based location tracking: use device GPS when no collar available, periodic location updates — works with just a phone
- [ ] **W12** — Create GPS settings: update interval (5min/15min/1hr), battery optimization, offline tile download — user controls tracking
- [ ] **W13** — Gate behind Breeder tier: GPS features for Breeder/Stable subscribers — premium differentiator
- [ ] **W14** — Write GPS tests: location updates, geofence logic, trail computation, offline tile caching — `flutter test` passes

**Dependencies:** WS-B (Isar), WS-D (sync), WS-O (tier gating)
**Blocks:** None

---

## Sprint 6 — Polish + Launch + Web + API (Week 11–12)

> **Goal:** Performance, App Store readiness, documentation, web dashboard, organizer API.
>
> **Parallel:** All 5 workstreams are independent.

---

### WS-P: Performance Audit

> **Agent type:** `workflow-worker` [EXEC]
> **Estimated effort:** 2–3 days
> **Files touched:** Throughout codebase

- [ ] **P1** — Run Flutter performance overlay: identify jank, slow builds, unnecessary rebuilds — performance report
- [ ] **P2** — Optimize widget rebuilds: add `const` constructors, `RepaintBoundary`, `shouldRebuild` — no unnecessary rebuilds
- [ ] **P3** — Profile image loading: lazy loading, caching, compression for horse photos — images load fast
- [ ] **P4** — Optimize Isar queries: add indexes, limit query results, pagination — large datasets don't lag
- [ ] **P5** — Test on low-end device: run on oldest supported device, identify bottlenecks — works on low-end Android
- [ ] **P6** — Reduce app size: tree-shake unused code, optimize assets — APK < 50MB
- [ ] **P7** — Memory leak check: run profiler, check for disposed controllers, streams — no memory leaks
- [ ] **P8** — Cold start optimization: measure and optimize app startup time — cold start < 2s

**Dependencies:** All previous sprints (need full app to profile)
**Blocks:** None

---

### WS-Q: App Store Prep

> **Agent type:** `workflow-worker` [EXEC]
> **Estimated effort:** 2 days
> **Files touched:** `ios/`, `android/`, `metadata/`

- [ ] **Q1** — Create app icons: all sizes for iOS + Android (1024×1024 source) — icons generated
- [ ] **Q2** — Create splash screens: iOS + Android splash with Tamga branding — splash looks professional
- [ ] **Q3** — Write App Store description: Mongolian + English, keywords, screenshots — description ready
- [ ] **Q4** — Write Play Store description: same — description ready
- [ ] **Q5** — Create screenshots: 5–6 screenshots per platform (key screens) — screenshots ready
- [ ] **Q6** — Configure iOS signing: Apple Developer certificates, provisioning profiles — iOS build succeeds
- [ ] **Q7** — Configure Android signing: keystore, upload certificate — Android build succeeds
- [ ] **Q8** — Set up Crashlytics: Firebase Crashlytics for crash reporting — crashes tracked
- [ ] **Q9** — Set up analytics: Firebase Analytics or similar — user events tracked
- [ ] **Q10** — Final build test: test release builds on real devices — no crashes on real devices

**Dependencies:** WS-P (performance audit)
**Blocks:** None

---

### WS-R: Documentation Final

> **Agent type:** `workflow-worker` [EXEC]
> **Estimated effort:** 1–2 days
> **Files touched:** `docs/`, `README.md`

- [ ] **R1** — Update README.md: reflect Tamga branding, setup instructions, features — README is current
- [x] **R2** — Update all docs for name change: replace remaining "Aduuchin" references with "Tamga" — done
- [ ] **R3** — Create API documentation: document Supabase Edge Functions, if any — API docs exist
- [ ] **R4** — Create deployment guide: how to build, sign, and submit to stores — guide is actionable
- [ ] **R5** — Create user guide: Mongolian-language user guide for key features — users can self-serve
- [ ] **R6** — Update architecture docs: reflect actual implemented architecture (not just planned) — docs match code
- [ ] **R7** — Create CHANGELOG.md: track all changes from initial commit — changelog exists

**Dependencies:** All previous sprints
**Blocks:** None

---

### WS-X: Web Dashboard

> **Agent type:** `workflow-worker` [EXEC]
> **Estimated effort:** 4 days
> **Files touched:** New Next.js project (`web/`), Supabase
>
> **Context:** Uyach is mobile-only. A web dashboard is a massive differentiator — breeders, stables, and race organizers need desktop access for reports, bulk operations, and management. This is the feature that makes Tamga feel like a professional platform, not just an app.

- [ ] **X1** — Scaffold Next.js project: `web/` directory, TypeScript, Tailwind CSS, Supabase client — `pnpm dev` works
- [ ] **X2** — Create auth flow: Supabase auth on web, same phone OTP as mobile, session sharing between web and mobile — user logs in once
- [ ] **X3** — Create dashboard layout: sidebar nav, header with user info, responsive design — layout works on 1280px+ screens
- [ ] **X4** — Create herd overview page: table of all horses with filters (age, gender, owner), search, sort, bulk select — desktop horse management
- [ ] **X5** — Create horse detail page: full profile view, health history timeline, pedigree tree (web-optimized), documents — all horse data on web
- [ ] **X6** — Create health records page: table view of all health logs across herd, filter by type/date/horse, bulk add — vet record management
- [ ] **X7** — Create reports page: herd statistics, health completion rates, age distribution charts, export to PDF/CSV — reporting dashboard
- [ ] **X8** — Create marketplace management: list/edit/deliste horses for sale, view inquiries, manage listings — seller dashboard
- [ ] **X9** — Create team management page: invite members, assign roles, view activity log — stable manager console
- [ ] **X10** — Create bulk operations: bulk health entry, bulk CSV import, bulk photo upload — power user tools
- [ ] **X11** — Add real-time sync: Supabase Realtime on web, changes reflect instantly across web + mobile — live data
- [ ] **X12** — Create mobile-responsive fallback: basic usable view on tablets/phones (not primary target but not broken) — responsive
- [ ] **X13** — Deploy to Vercel: `tamga.app` serves web dashboard, mobile deep links still work — web is live
- [ ] **X14** — Write web tests: Playwright E2E for critical flows (login, horse CRUD, health entry, reports) — `pnpm test` passes

**Dependencies:** WS-A (auth), WS-B (Isar/Supabase data), WS-D (sync)
**Blocks:** None

---

### WS-Y: Organizer API + Services

> **Agent type:** `workflow-worker` [EXEC]
> **Estimated effort:** 3 days
> **Files touched:** `supabase/functions/`, `lib/src/features/services/`
>
> **Context:** Race organizers need programmatic access to register horses, pull results, and manage events. On-site registration services (photographer visits) need booking infrastructure. This is the B2B layer that turns Tamga from an app into a platform.

- [ ] **Y1** — Create API documentation: OpenAPI/Swagger spec for all endpoints, authentication flow, rate limits — developers can read it
- [ ] **Y2** — Create API key management: org users generate API keys, scope permissions (read-only, read-write), revoke keys — API access controlled
- [ ] **Y3** — Create race registration API endpoint: `POST /api/races/{id}/entries` — register horse by ID, return confirmation — race orgs can programmatically register
- [ ] **Y4** — Create race results API endpoint: `POST /api/races/{id}/results` — submit placements, times, prizes — race orgs can push results
- [ ] **Y5** — Create horse lookup API endpoint: `GET /api/horses/{id}` — return public horse data (name, age, pedigree, achievements) — verified data access
- [ ] **Y6** — Create webhook system: notify external systems on events (horse registered, result posted, ownership transferred) — integrations possible
- [ ] **Y7** — Create on-site registration service booking: `features/services/presentation/booking_screen.dart` — select date, location, number of horses, photographer assigned — user books visit
- [ ] **Y8** — Create service provider dashboard: photographers see bookings, mark complete, upload photos — service fulfillment
- [ ] **Y9** — Create service pricing: per-horse fee, travel surcharge, bundled packages — monetization
- [ ] **Y10** — Create service history: past bookings, photos uploaded, invoices — service record
- [ ] **Y11** — Create vet connection feature: `features/services/presentation/vet_connect_screen.dart` — find nearby vets by aymag, view credentials, book visit — vet discovery
- [ ] **Y12** — Create vet portal: vets see patient list (horses they've treated), upcoming appointments, health history — vet access
- [ ] **Y13** — Write API tests: endpoint tests, auth tests, rate limiting, webhook delivery — `flutter test` + API tests pass
- [ ] **Y14** — Write service booking tests: booking flow, pricing calculation, provider assignment — `flutter test` passes

**Dependencies:** WS-A (auth), WS-D (sync), WS-K (race domain models)
**Blocks:** None

---

## Subagent Dispatch Rules

### How to Use This File

Each workstream (WS-X) is designed to be dispatched as a **single subagent task**. The agent receives:
1. The workstream definition
2. All tasks (X1, X2, ...)
3. File paths to touch
4. Acceptance criteria

### Dispatching Pattern

```
# Sprint 1 — WS-A (Auth) and WS-B (Isar) are complete.
# WS-C (Test Foundation) can still be dispatched if needed.
Agent(prompt="WS-C: Test Foundation. [paste WS-C tasks]", subagent_type="workflow-worker", run_in_background=true)

# Wait for WS-C to complete, then dispatch Sprint 2
# ... and so on
```

### Agent Type Selection

| Workstream Type | Agent | Why |
|---|---|---|
| Feature implementation | `workflow-worker` [EXEC] | Code writing + testing |
| Architecture decisions | `workflow-worker` [ARCH] | Design review |
| Code review | `workflow-worker` [CODE] | Quality check |
| Research/exploration | `Explore` | Find existing patterns |

### Dependency Rules

```
Sprint 1:  WS-A ─┐
           WS-B ─┼── All independent, run in parallel
           WS-C ─┘

Sprint 2:  WS-D ──depends on── WS-A + WS-B
           WS-E ──depends on── WS-A
           WS-F ──independent
           WS-T ──depends on── WS-B + WS-D

Sprint 3:  WS-G ──depends on── WS-D
           WS-H ──depends on── WS-B
           WS-I ──depends on── WS-B + WS-D

Sprint 4:  WS-J ──depends on── WS-D + WS-G
           WS-K ──independent
           WS-L ──independent
           WS-S ──depends on── WS-D + WS-A + WS-H
           WS-U ──depends on── WS-B + WS-D + WS-H

Sprint 5:  WS-M ──depends on── WS-A
           WS-N ──depends on── WS-B
           WS-O ──depends on── WS-E
           WS-V ──depends on── WS-A + WS-B + WS-D + WS-O
           WS-W ──depends on── WS-B + WS-D + WS-O

Sprint 6:  WS-P ──depends on── all previous
           WS-Q ──depends on── WS-P
           WS-R ──depends on── all previous
           WS-X ──depends on── WS-A + WS-B + WS-D
           WS-Y ──depends on── WS-A + WS-D + WS-K
```

---

## Progress Tracking

### Sprint Status

- [x] **Sprint 1** — Foundation (Auth + Isar + Tests) — Week 1–2 (Auth ✅, Isar ✅, Tests ongoing)
- [ ] **Sprint 2** — Sync + Payments + Offline — Week 3–4
- [ ] **Sprint 3** — Documents + Notifications — Week 5–6
- [ ] **Sprint 4** — Marketplace + Community + Ownership + Training — Week 7–8
- [ ] **Sprint 5** — AI + Premium + Teams + GPS — Week 9–10
- [ ] **Sprint 6** — Polish + Launch + Web + API — Week 11–12

### Workstream Status

- [x] **WS-A** (Sprint 1) — Auth System ✅
- [x] **WS-B** (Sprint 1) — Isar Migration ✅
- [ ] **WS-C** (Sprint 1) — Test Foundation
- [x] **WS-D** (Sprint 2) — Supabase Sync ✅
- [ ] **WS-E** (Sprint 2) — QPay Integration
- [ ] **WS-F** (Sprint 2) — Feature Polish
- [ ] **WS-T** (Sprint 2) — Offline-First UX
- [x] **WS-G** (Sprint 3) — Document Vault ✅
- [ ] **WS-H** (Sprint 3) — Push Notifications
- [ ] **WS-I** (Sprint 3) — Uyach Migration
- [ ] **WS-J** (Sprint 4) — Marketplace Real
- [ ] **WS-K** (Sprint 4) — Race Registration
- [ ] **WS-L** (Sprint 4) — Social Features
- [x] **WS-S** (Sprint 4) — Ownership Transfer ✅
- [ ] **WS-U** (Sprint 4) — Training & Nutrition
- [ ] **WS-M** (Sprint 5) — AI Breeding Advisor
- [ ] **WS-N** (Sprint 5) — Analytics Dashboard
- [ ] **WS-O** (Sprint 5) — Premium Tier Gate
- [ ] **WS-V** (Sprint 5) — Multi-User Teams
- [ ] **WS-W** (Sprint 5) — GPS Herd Tracking
- [ ] **WS-P** (Sprint 6) — Performance Audit
- [ ] **WS-Q** (Sprint 6) — App Store Prep
- [ ] **WS-R** (Sprint 6) — Documentation Final
- [ ] **WS-X** (Sprint 6) — Web Dashboard
- [ ] **WS-Y** (Sprint 6) — Organizer API + Services

---

## Key Files Reference

### App Core

| File | Purpose |
|---|---|
| `lib/main.dart` | App entry point |
| `lib/src/app/app.dart` | MaterialApp + auth gate |
| `lib/src/app/app_config.dart` | Environment config |
| `lib/src/app/supabase_bootstrap.dart` | Supabase init + auth helpers |
| `lib/src/app/router/app_router.dart` | GoRouter route definitions |

### Theme

| File | Purpose |
|---|---|
| `lib/src/app/theme/app_colors.dart` | Color tokens |
| `lib/src/app/theme/app_typography.dart` | Type scale |
| `lib/src/app/theme/app_spacing.dart` | Spacing system |
| `lib/src/app/theme/app_components.dart` | Component styles |
| `lib/src/app/theme/app_theme.dart` | ThemeData builder |

### Core Infrastructure

| File | Purpose |
|---|---|
| `lib/src/core/error/result.dart` | Result type (Success/Failure) |
| `lib/src/core/error/app_exception.dart` | Exception hierarchy |
| `lib/src/core/sync/sync_queue.dart` | Pending sync items |
| `lib/src/core/sync/sync_engine.dart` | Background sync processor |
| `lib/src/core/storage/isar_database.dart` | Isar database initialization (15 schemas) |
| `lib/src/core/storage/local_storage.dart` | Local persistence utilities |

### Database

| File | Purpose |
|---|---|
| `supabase/migrations/001_initial_schema.sql` | Full schema |

---

## Related

- [Product](../product/) — what we're building
- [Architecture](./architecture.md) — technical details
- [Tech Stack](./tech-stack.md) — technology choices
- [Roadmap](../product/roadmap) — high-level phases
- [Marketing](../market/) — launch timeline
