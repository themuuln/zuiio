# Events Feature Module

Тэмцээн, уралдаан, дуудлага худалдаа, үзэсгэлэн, сургалтын арга хэмжээний нэгдсэн модуль.

## Capabilities

- **4 Event Types:** Уралдаан (race), Дуудлага худалдаа (auction), Үзэсгэлэн худалдаа (expo), Сургалт/Зөвлөгөө (training) — each with type-specific icons, colors, filter chips
- **Event CRUD:** Create, edit, delete events with title, date, type, location, notes, photos
- **Horse Registration:** Register horses to events, view registered horses, cancel registration, duplicate prevention
- **Location:** MapLibre-based location picker and map preview. "Байршилд очих" navigation
- **Reminders:** "Сануулах" schedules local notification 1 day before event
- **Contact Organizer:** "Зарлагчтай холбогдох" calls/emails organizer
- **Auto-Achievement:** Completing an event auto-updates horse's TournamentProfile
- **Featured Events:** Home page "Онцлох арга хэмжээ" horizontal scroll section
- **Partner Dashboard:** Admin panel accessible from Profile — create/edit events, toggle featured, view registration counts

## Domain Models

- `Event` (`lib/src/shared/domain/event.dart`) — Core event model with EventType enum (race, auction, expo, training). Fields: title, date, location, lat/lng, organizer info, isFeatured, registrationEnabled, result, prizeAmount, notes, photoUrls
- `EventRegistration` (`lib/src/shared/domain/event_registration.dart`) — Horse-to-event registration with RegistrationStatus enum
- `EventType` — Enum with 4 values, each with Mongolian `displayName`
- `TournamentProfile` (in `lib/src/features/events/domain/`) — Horse's aggregated competition statistics

## Architecture

Clean Architecture layers:

- **Domain:** `lib/src/shared/domain/event.dart`, `lib/src/features/events/domain/`
- **Data:** `EventRepository`, `EventRegistrationRepository` interfaces + `LocalEventRepository`, `LocalEventRegistrationRepository` (Isar + SyncQueue) + `SupabaseEventRepository`, `SupabaseEventRegistrationRepository` (Supabase)
- **Application:** Riverpod providers in `lib/src/features/events/application/` — eventsProvider, horseEventsProvider, featuredEventsProvider, paginatedEventsProvider, eventRegistrationsProvider
- **Presentation:** Screens in `lib/src/features/events/presentation/` — EventsScreen, EventDetailScreen, AddEventScreen, PartnerDashboardScreen

## Offline-First

All writes go to Isar local storage first. SyncQueue enqueues pending operations for cloud sync when connectivity is restored. This means all features work fully offline.

## Tests

Test files in `test/features/events/`:
- `event_repository_test.dart` — Repository CRUD + SyncQueue + offline persistence
- `events_screen_pagination_test.dart` — Pagination error display
- `presentation_layer_test.dart` — Widget tests for event list, form, filtering, delete
- `event_detail_screen_test.dart` — Registration UI, organizer section, reminder button
- `event_location_test.dart` — MapLibre location picker, map preview, navigation button
- `event_auto_achievement_test.dart` — TournamentProfile auto-update logic
- `featured_events_home_test.dart` — Featured events section on home page
- `partner_dashboard_test.dart` — Partner dashboard UI, featured toggle, registration counts
- `cross_area_integration_test.dart` — Cross-feature integration tests
- `../shared/domain/event_test.dart` — EventType enum unit tests
