# Lost Horse Feature — Enhancement Plan

## Context

Tamga already has a substantial lost horse feature built within `lib/src/features/map/` and `lib/src/features/lost_horse/`. The deep research (62 sources, 3 rounds) identified evidence-backed enhancements. This plan adds features the research found most impactful while preserving the existing architecture.

## What Already Exists

| Component | Status | Files |
|-----------|--------|-------|
| LostHorseReport domain model | ✅ Built | `map/domain/lost_horse_report.dart` (323 lines) |
| LostHorseStatus enum (active/found/cancelled/expired) | ✅ Built | `map/domain/map_enums.dart` |
| LostHorsePricingTier (free/featured/VIP) | ✅ Built | `map/domain/lost_horse_report.dart` |
| Report form (horse picker, GPS, photos, tamga, ear mark, pricing) | ✅ Built | `map/presentation/report_lost_horse_screen.dart` (1402 lines) |
| Active reports list with filters (aimag, animal type, coat color, status) | ✅ Built | `map/presentation/active_reports_screen.dart` |
| Report detail screen (Found/Cancel actions, renewal, chat) | ✅ Built | `map/presentation/lost_horse_detail_screen.dart` |
| Map view with lost horse markers + geofence circles | ✅ Built | `map/presentation/map_screen.dart` |
| Finder screen (List + Map tabs) | ✅ Built | `lost_horse/presentation/lost_horse_finder_screen.dart` |
| Expiry service (auto-expire, renewal notifications) | ✅ Built | `map/application/expiry_service.dart` |
| Geofence monitoring + alerts | ✅ Built | `map/application/geofence_monitor.dart`, `geofence_notification_handler.dart` |
| Isar local storage (offline) | ✅ Built | `shared/data/isar_schemas/isar_lost_horse_report.dart` |
| Supabase cloud sync | ✅ Built | `map/data/supabase_map_repository.dart` |
| Pricing + payment integration | ✅ Built | `payments/data/payment_service.dart` |

## What's Missing (Research-Backed)

Based on the synthesis, these are the highest-impact gaps:

### 1. 🔴 Telegram Alert Distribution (MVP — highest ROI)
**Evidence**: WhatsApp groups recover cattle in India (T1). Telegram is Mongolia's primary messaging app. No current lost-horse sharing mechanism exists beyond the in-app list.

**What to build**:
- Telegram bot that sends formatted alerts (photo, description, location, contact) to soum/aimag Telegram groups
- One-tap share from ReportLostHorseScreen → select target soum group → bot broadcasts
- Sighting reports via Telegram: user replies to bot message with photo → auto-linked to report

### 2. 🔴 Auto-Matching Engine (MVP — proven at scale)
**Evidence**: Pet FBI auto-match dashboard (2026). Central Animal Records (AU): reunions every 2.4 min. No matching currently exists in Tamga.

**What to build**:
- Background job that cross-references new "lost" reports against recent "sighting" reports
- Match by: location proximity (within X km), timeframe (last 7 days), animal description (type, breed, color, markings)
- Push notification to owner when a match is found: "Танай морь [ирсэн зургийн тэмдэглэл]-ий ойролцоо харагдсан"

### 3. 🟡 Sighting Reports (MVP — community depth > breadth)
**Evidence**: 10+ responses → 3.2× higher recovery (MarketIntelo). Ring: 1+ reunion/day from community sightings. Currently only the owner can report.

**What to build**:
- "I saw this horse" button on LostHorseDetailScreen and from Telegram bot
- Sighting form: photo, GPS location, timestamp, notes
- Sighting feed on LostHorseDetailScreen (chronological list of sightings with map pins)
- Sighting count badge on ActiveReportsScreen cards

### 4. 🟡 Privacy-Preserving Contact (Post-MVP — theft context)
**Evidence**: lo.st platform: first-names-only, no phone numbers shared until both confirm. Critical for Mongolia's theft context.

**What to build**:
- Replace raw `contactPhone` field with platform-mediated messaging
- Owner identity hidden until finder confirms they have the horse
- Anonymous reporting mode for finders who want to help without revealing identity

### 5. 🟡 AIRS Ear Tag Lookup (Post-MVP — long-term moat)
**Evidence**: Mongolia AIRS: 200K+ tagged animals, 12-digit codes. FAO mobile app supports QR. No competitor can replicate.

**What to build**:
- Manual code entry field in report form: type 12-digit AIRS code → lookup breed, age, vaccination status
- QR scan mode: camera scans ear tag → auto-populate animal details
- Visual badge on reports that have verified AIRS identity

### 6. 🟢 Telegram Auto-Matching Bot (Innovation)
**Evidence**: Pet FBI dashboard automates matching. Extending to Telegram reaches herders who don't open the app.

**What to build**:
- Telegram bot that proactively sends matching alerts to soum groups
- When a "found" sighting is reported, bot checks against active lost reports in the area
- Sends alert: "Хаяж морь олсон мэдээлэл: [description] — Хэрэв танай морь бол холбогдоно уу"

### 7. 🟢 SMS/USSD Fallback (Innovation — 21K herders on AIRS SMS)
**Evidence**: 21K Mongolian herders already on AIRS SMS. Kalinko Labs: USSD as fallback for basic phone users.

**What to build**:
- SMS keyword interface: "ХАЯЖ [description]" → creates lost report via SMS
- SMS sighting reports: "ОЛСОН [code] [location]" → links to existing report
- Integration with existing AIRS SMS infrastructure

## Files to Change

| File | Action | What changes |
|------|--------|-------------|
| **NEW** `lib/src/features/map/application/telegram_alert_service.dart` | Create | Telegram bot integration for sending/receiving alerts |
| **NEW** `lib/src/features/map/application/auto_match_service.dart` | Create | Background matching engine: lost reports ↔ sightings |
| **NEW** `lib/src/features/map/domain/sighting_report.dart` | Create | Domain model for community sighting reports |
| **NEW** `lib/src/features/map/data/sighting_repository.dart` | Create | Supabase + Isar CRUD for sightings |
| **NEW** `lib/src/features/map/presentation/sighting_form_screen.dart` | Create | "I saw this horse" report form |
| **NEW** `lib/src/features/map/presentation/widgets/sighting_card.dart` | Create | Sighting list item in detail screen |
| `lib/src/features/map/domain/lost_horse_report.dart` | Modify | Add `sightingCount` field, `hasAirsCode` flag |
| `lib/src/features/map/presentation/lost_horse_detail_screen.dart` | Modify | Add sighting feed, "I saw this" button, sighting count |
| `lib/src/features/map/presentation/active_reports_screen.dart` | Modify | Add sighting count badge to cards, Telegram share button |
| `lib/src/features/map/presentation/widgets/lost_horse_card.dart` | Modify | Add sighting count indicator |
| `lib/src/features/map/presentation/report_lost_horse_screen.dart` | Modify | Add Telegram group selector, AIRS code lookup field |
| `lib/src/features/map/application/lost_horse_providers.dart` | Modify | Add sighting providers, auto-match trigger |
| **NEW** `supabase/migrations/XXXX_create_sightings.sql` | Create | sightings table + RLS policies |
| **NEW** `supabase/migrations/XXXX_add_sighting_count.sql` | Create | Add sighting_count column to lost_horse_reports |

## Implementation Order

1. **Database** — Create `sightings` table + migration, add `sighting_count` to `lost_horse_reports`
2. **Domain** — `SightingReport` model, update `LostHorseReport` with new fields
3. **Data** — `SightingRepository` (Supabase + Isar)
4. **Application** — Sighting providers, auto-match service
5. **Presentation** — Sighting form, sighting card, update detail screen
6. **Telegram** — Bot service, share integration, update report form
7. **AIRS** — Code lookup field (manual entry first, QR later)

## Edge Cases

- **Offline sighting**: Queue sighting in Isar, sync when online (existing pattern)
- **Match false positive**: Show confidence score, require owner confirmation
- **Telegram group access**: Bot needs admin permission in soum groups → onboarding flow
- **AIRS code validation**: 12-digit format, checksum verification
- **Duplicate sightings**: Deduplicate by report_id + approximate location + time window
- **Privacy**: Finders can report anonymously; owner identity hidden until mutual confirmation

## Verification

1. **Type check**: `flutter analyze --fatal-infos` — zero errors
2. **Unit tests**: Add tests for auto-match algorithm, sighting deduplication
3. **Widget tests**: Sighting form, sighting card, detail screen with sightings
4. **Integration test**: End-to-end: report lost → someone sees horse → reports sighting → owner gets match notification
5. **Telegram test**: Send test alert to a Telegram group, verify formatting
6. **Manual**: Launch app → report lost horse → verify it appears in list → as another user, report sighting → verify match notification
