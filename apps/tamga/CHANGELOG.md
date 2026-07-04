# Changelog

All notable changes to the Tamga project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Performance

- Replace `Image.network` with `CachedNetworkImage` in breeder profile, conversation,
  race videos, and welcome screens
- Configure `ImageCache.maximumSize` (500) and `maximumSizeBytes` (100 MB) in main.dart
- Enable ProGuard/R8 minification for Android release builds
- Optimize Isar queries with `@Index` annotations and `.filter()` + `.buildQuery()`
  pagination across all local repositories (horses, events, market, health, breeding,
  training, nutrition, teams, races)
- Add missing `@Index` on `IsarHealthLog.horseId+logType`, `IsarEvent.horseId+eventType+date`,
  `IsarBreedingRecord.sireId+damId+status`, `IsarTrainingLog.horseId`,
  `IsarFeedSchedule.horseId`, `IsarFeedLog.horseId+date`

---

## [1.5.0] — 2026-06-19

### Added

- AI breeding advice UI with horse pair selector, result cards, and rate limit integration
- AI breeding Edge Function with rate limiting and domain models
- Analytics dashboard screen with charts, filters, and CSV/PDF export
- Analytics domain models, chart widgets, and test suite
- Teams full feature: data layer with Team/TeamMember domain models, Isar + Supabase
  repositories, Supabase migration, UI with management screen, invite flow, stable
  profile, role-based UI, and tier gating
- Team invitation system with accept/decline flow, pending record, UI, and tests
- `hasAiBreeding` and `hasAnalytics` gates to `TierLimits` with tests
- Team invitations migration with RLS policies and indexes

### Fixed

- Apply `dart fix` — remove unused import in `training_form_screen_test` and fix
  deprecated member in `race_form_screen_test`

---

## [1.4.0] — 2026-06-18

### Added

- Nutrition feature: feed schedule setup screen and daily feed log checklist
- `FeedSchedule` and `FeedLog` domain models, data layer with Isar + SyncQueue,
  and Supabase migration
- Training log UI with list, form, weekly chart, performance trend, and horse detail tabs
- `TrainingLog` and `PerformanceRecord` domain models, data layer with Isar + SyncQueue,
  and Supabase migration
- Leaderboard screen with ranking, filters, and navigation (VAL-SOCIAL-003/004/005)
- Breeder profile screen with all 7 sections and navigation from seller profile
  (VAL-SOCIAL-001/002)
- Facebook share integration on listing detail and horse profile screens
  (VAL-MARKET-003/004/005)
- Commission tracking to marketplace (VAL-MARKET-001/002)
- Race and RaceEntry domain models, data layer, and Supabase migration
- Race list screen with upcoming/past tabs and type filtering
- Race registration flow with organizer create/edit race functionality
- Race form screen fixes — set organizerId from authStateProvider
- Sync status indicator on ProfileScreen (SyncIndicator, last-sync timestamp)
- Background sync on app foreground via AppLifecycleObserver
- Conflict resolution screen with SyncState.conflisted detection
- Centered first-page loading indicators on EventsScreen
- Skeleton loading and error states on ProfileScreen
- Partner dashboard screen with event management, issue reporting, and verification
- Organizer contact section and reminder button on EventScreen
- MapLibre location picker on AddEventScreen with map preview on EventDetailScreen
- Featured events horizontal scrollable section on EventsScreen
- Auto-achievement on event completion
- Event detail screen with horse registration, cancellation, and achievement display
- EventRegistration entity with Isar schema, repository, and Supabase sync
- Event model migration from EventRecord to Event (complete rewrite with
  isar_schemas, repositories, providers)
- Auto-expiry and renewal system for lost horse reports
- Pricing tier system for lost horse reports
- Filter controls on ActiveReportsScreen (аймаг, сум, report type)
- Phone verification gate on ReportLostHorseScreen
- Error handling utility with Mongolian error messages and user-friendly display
- Chat button (Чатлах) for non-owners on LostHorseDetailScreen
- Comprehensive domain model unit tests for 6 model types
- Test README (`test/README.md`) with full coverage documentation
- Makefile coverage target and test documentation
- 5 missing event-features tests (VAL-EVENTS-009 through VAL-EVENTS-013)
- Missing validation tests for EventType enum

### Fixed

- Invalidate `eventsProvider` and `paginatedEventsProvider` after mutation
- Resolve `unused_element_parameter` warnings in ConversationScreen

### Changed

- Update EventsScreen and EventCard to use new Event model

---

## [1.3.0] — 2026-06-18

### Added

- Lost horse report auto-expiry and renewal system
- Pricing tiers for lost horse reports
- ActiveReportsScreen filter controls (аймаг, сум, report type)
- Phone verification gate on ReportLostHorseScreen
- Chat button (Чатлах) for non-owners on LostHorseDetailScreen
- Error handling utility with Mongolian error messages

---

## [1.2.0] — 2026-06-18

### Added

- Race and RaceEntry domain models with Isar schemas and repositories
- Supabase migration for races
- Race list screen with upcoming/past tabs and type filtering
- Race registration flow with organizer create/edit screen
- Race form screen with auth state integration

---

## [1.1.0] — 2026-06-18

### Added

- Social features: breeder profile screen, leaderboard, Facebook share integration
- Commission tracking for marketplace listings
- Background sync with AppLifecycleObserver
- Conflict resolution UI for sync conflicts
- Sync status indicator on profile screen
- Skeleton loading states on profile and events screens

---

## [1.0.0] — 2026-06-18

### Added

- Initial horse management features: horse records, lineage, inbreeding calculator
- Health and farrier logging
- Event and tournament management
- Marketplace (buy/sell/lease) with boost/VIP/badges revenue system
- Local storage with Isar (15+ schemas)
- Sync queue and Supabase cloud sync
- Digital certificates for horses
- Breeding tools with gestation tracker
- Co-ownership management (local-only)
- Map and lost horse finder with MapLibre
- Document vault
- Push notification triggers (Firebase Cloud Messaging)
- Pagination with infinite scroll
- Phone auth (OTP) — backend and UI
- Multi-provider auth — Google/Apple sign-in
- Horse transfer with ownership registration
- Public tournament profiles for marketplace trust
- Web scaffold with Next.js app in `apps/web/`
- UI Polish — iOS-inspired Mongolian earth tone design system
- Protomaps offline tile support
