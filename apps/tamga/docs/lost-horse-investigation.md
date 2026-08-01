# Lost Horse Feature — Codebase Investigation Report

> Generated: 2026-06-18
> Scope: Identify existing infrastructure, reusability, gaps, and blockers for building the enhanced lost horse feature.

---

## 1. Auth System

### Files
| Path | Purpose |
|------|---------|
| `lib/src/features/auth/data/supabase_auth_repository.dart` | Supabase auth implementation |
| `lib/src/features/auth/domain/auth_state.dart` | Auth domain model |
| `lib/src/features/auth/presentation/phone_login_screen.dart` | Phone number input + OTP send |
| `lib/src/features/auth/presentation/otp_verify_screen.dart` | OTP verification |
| `lib/src/features/auth/application/auth_providers.dart` | Riverpod providers |
| `lib/src/app/supabase_bootstrap.dart` | `currentSupabaseUserId()` and `ensureSupabaseUserId()` |

### Key Findings
- **Phone auth is fully implemented** — Supabase OTP flow with `+976` prefix, 8-digit validation.
- **`currentSupabaseUserId()`** in `supabase_bootstrap.dart` returns `client.auth.currentUser?.id` (or `null` if not configured/authenticated).
- **`ensureSupabaseUserId()`** signs in anonymously if no user exists — useful for unauthenticated lost horse reports.
- **Phone stored in two places:**
  - `AuthState.phone` (from Supabase user metadata)
  - `profiles.phone` column in the `profiles` table
- **Auth metadata** stores `display_name`, `phone`, `region`, `rank` via `updateUser()`.
- **`signInAnonymously()`** is available for guest users.

### Reusable As-Is
- `currentSupabaseUserId()` for owner ID in lost horse reports.
- `ensureSupabaseUserId()` for anonymous report submission.
- Phone auth flow for lost horse finder contact.

### Needs Modification
- Lost horse reporter phone should be pulled from `AuthState.phone` or `profiles.phone`.
- An option for anonymous report submission (without full auth) may need the guest flow.

### Blockers / Gaps
- None. Auth infrastructure is solid.

---

## 2. Profile / User Model

### Files
| Path | Purpose |
|------|---------|
| `lib/src/features/profile/domain/profile_settings.dart` | Profile domain model |
| `lib/src/features/profile/data/supabase_profile_repository.dart` | Supabase profile CRUD |
| `lib/src/features/profile/data/profile_settings_repository.dart` | Abstract interface |
| `lib/src/features/profile/data/local_profile_settings_repository.dart` | Local storage |
| `lib/src/features/profile/application/profile_providers.dart` | Riverpod providers |

### Key Findings
- **`ProfileSettings`** has: `autoSyncEnabled`, `lastSyncCheckAt`, `role` (casual/breeder/stable), `rank`.
- **No phone field** in `ProfileSettings` — phone lives in `AuthState` and the `profiles` table.
- **`profiles` table** columns: `id`, `display_name`, `phone`, `region`, `avatar_url`, `subscription_tier`, `role`, `rank`, `created_at`, `updated_at`.
- **Trigger `handle_new_user()`** auto-creates a profile row on user signup.
- **`SupabaseProfileRepository`** has `get()` and `update()` with upsert pattern.

### Reusable As-Is
- Profile repository pattern for fetching contact info.
- `region` field in profiles aligns with lost horse location hierarchy.

### Needs Modification
- A phone contact field needs to be exposed on the lost horse report form — currently phone is not part of `ProfileSettings`.

### Blockers / Gaps
- `ProfileSettings` lacks `phone` — need to either add it or fetch phone from `AuthState`/profiles table directly.

---

## 3. Media Upload System

### Files
| Path | Purpose |
|------|---------|
| `lib/src/core/storage/cloud/media_storage_service.dart` | Abstract `MediaStorageService` interface |
| `lib/src/core/storage/cloud/media_storage_router.dart` | Routes to Supabase/R2 by `MediaCategory` |
| `lib/src/core/storage/cloud/supabase_media_storage.dart` | Supabase Storage for photos, docs |
| `lib/src/core/storage/cloud/r2_media_storage.dart` | Cloudflare R2 for videos |
| `lib/src/core/storage/cloud/media_upload_result.dart` | Upload result model |
| `lib/src/core/storage/cloud/media_storage_providers.dart` | Riverpod providers |
| `supabase/migrations/012_storage_buckets.sql` | Storage bucket creation |

### Key Findings
- **Three storage buckets exist:**
  - `horse-photos` (public read, 10 MB limit, JPEG/PNG/WebP/GIF)
  - `documents` (private read, 20 MB limit, PDF/JPEG/PNG)
  - `market-media` (public read, 10 MB limit, JPEG/PNG/WebP)
- **`MediaStorageRouter`** routes:
  - `MediaCategory.photo` → Supabase Storage (`horse-photos` bucket)
  - `MediaCategory.document` → Supabase Storage (`documents` bucket)
  - `MediaCategory.video` → Cloudflare R2 (via presigned URLs)
- **`SupabaseMediaStorage.upload()`** uses `uploadBinary()` with public URL return.
- **`MediaStorageRouter` has path generators:**
  - `horsePhotoPath()`, `eventPhotoPath()`, `raceVideoPath()`, `documentPath()`, `marketPhotoPath()`
- **No `lost-horse-photos` bucket** — can reuse `horse-photos` with a dedicated prefix.
- **R2 is not yet configured** — `r2StorageProvider` returns `null`, falling back to `_NoOpR2Storage`.

### Reusable As-Is
- `MediaStorageRouter` — the unified interface works for lost horse photos.
- `SupabaseMediaStorage.upload()` — direct reuse for photo uploads.
- `horse-photos` bucket can store lost horse photos with prefix like `lost-horse/{reportId}/`.

### Needs Modification
- Add a `lostHorsePhotoPath()` generator to `MediaStorageRouter`.

### Blockers / Gaps
- **Video upload requires R2 configuration.** R2 is not yet deployed. Videos will fail until R2 signing endpoint and public domain are set up.
- There is no `lost-horse-photos` storage bucket yet; reuse `horse-photos` or create a new one.
- No `lost_horse_media` table in the DB schema to track multiple photos per report.

---

## 4. Chat System

### Files
| Path | Purpose |
|------|---------|
| `lib/src/features/market/data/message_repository.dart` | Abstract `MessageRepository` interface |
| `lib/src/features/market/data/local_message_repository.dart` | Local Isar implementation |
| `lib/src/features/market/data/supabase_message_repository.dart` | Supabase + Isar implementation |
| `lib/src/features/market/domain/market_conversation.dart` | Conversation domain model |
| `lib/src/features/market/domain/market_message.dart` | Message domain model |
| `lib/src/features/market/presentation/conversation_screen.dart` | Full chat UI with bubbles, composer |
| `lib/src/features/market/application/message_providers.dart` | Riverpod providers |
| `lib/src/features/shared/data/isar_schemas/isar_market_conversation.dart` | Isar schema |
| `lib/src/features/shared/data/isar_schemas/isar_market_message.dart` | Isar schema |

### Key Findings
- **Full chat system exists**, built for marketplace conversations (buyer ↔ seller).
- **`MarketConversation`** ties a conversation to a `listingId`, with `buyerId`, `sellerId`.
- **`MarketMessage`** has `conversationId`, `senderId`, `listingId`, `text`, `timestamp`, `read`.
- **Architecture is local-first:** messages stored in Isar, synced to Supabase via `SyncQueue`.
- **`SupabaseMessageRepository`** wraps `LocalMessageRepository` and adds Supabase Realtime channels.
- **`ConversationScreen`** is a full chat UI with:
  - Message bubbles (styled differently for sender/receiver)
  - Listing card header
  - Message composer
  - Block/report dialogs
- **No Supabase tables for conversations/messages yet** — the `SupabaseMessageRepository` writes to Supabase tables `conversations` and `messages` via upsert, but no migration creates those tables. They'd be auto-created on first upsert if Supabase has `CREATE TABLE` permission, or need explicit migrations.

### Reusable As-Is
- **Entire chat UI** (`ConversationScreen`) — can be adapted for lost horse finder ↔ reporter chat.
- **`MarketConversation` model** — the `listingId` field could be repurposed as `reportId`.
- **`MarketMessage` model** — text chat works directly.
- **`LocalMessageRepository`** — offline-first messaging works for lost horse chat.
- **`messageStreamProvider`** — real-time message streaming ready.

### Needs Modification
- Chat needs to work with `lost_horse_reports` instead of `market_listings`. The conversation model should support both listing and report references.
- Need to add a new conversation type or modify `MarketConversation` to allow `reportId` alongside `listingId`.
- `ConversationScreen` currently hardcodes `_localUserId = 'local-buyer'` — needs real user ID.

### Blockers / Gaps
- **No `conversations` or `messages` tables in Supabase migrations.** These need to be created.
- Chat is designed for buyer↔seller — needs adaptation for finder↔reporter or community context.
- No media sharing in messages (only text).

---

## 5. Payment System

### Files
| Path | Purpose |
|------|---------|
| `lib/src/features/payments/domain/payment_request.dart` | Domain model: `SubscriptionTier`, `PaymentRequest`, `PaymentStatus` |
| `lib/src/features/payments/data/payment_repository.dart` | Abstract `PaymentRepository` interface |
| `lib/src/features/payments/data/supabase_payment_repository.dart` | Supabase implementation |
| `lib/src/features/payments/data/local_payment_repository.dart` | Local Isar implementation |
| `lib/src/features/payments/data/payment_service.dart` | Business logic (code generation, request creation) |
| `lib/src/features/payments/data/admin_verification.dart` | Admin verification functions |
| `lib/src/features/payments/presentation/payment_tier_card.dart` | Tier selection UI |
| `lib/src/features/payments/presentation/payment_screen.dart` | Payment screen |
| `lib/src/features/payments/presentation/payment_instructions.dart` | Payment instructions |
| `lib/src/features/payments/application/payment_providers.dart` | Riverpod providers |
| `supabase/migrations/005_payment_system.sql` | Payment tables, RPC functions |

### Key Findings
- **Manual bank transfer system** — user generates a payment code, transfers to Khan Bank, admin verifies manually.
- **`SubscriptionTier`**: `free`, `pro` (₮9,900), `breeder` (₮29,900), `stable` (₮49,900).
- **`PaymentRequest`**: linked to `userId`, has `code`, `amountMnt`, `status` (pending/verified/rejected/expired), `expiresAt`.
- **`verify_payment()` RPC** — admin function that verifies payment, updates profile tier, sets 30-day expiry.
- **`payment_requests` table** created in migration 005.
- **Local-first pattern** with Isar + `SyncQueue`.
- **System is subscription-based**, not per-listing pricing.

### Reusable As-Is
- Payment infrastructure pattern (code generation, manual verification flow).
- `PaymentRequest` model and repository pattern.
- Admin verification RPC functions.

### Needs Modification
- **No per-listing pricing model.** Current payment system is subscription tiers only. Lost horse pricing tiers (free vs. premium listing) would need either:
  - A new `listing_payments` or `report_payments` table
  - Or extending the existing `payment_requests` with `payment_type` support for lost horse reports
- `PaymentType` enum already has `listingBoost` and `sellerBadge` — could add `lostHorseListing`.

### Blockers / Gaps
- Subscription-based only. Per-report pricing would be a new concept.
- No Stripe/QPay/Qr code payment integration (manual bank transfer only).

---

## 6. Existing Location Data

### Files
| Path | Purpose |
|------|---------|
| `lib/src/features/onboarding/presentation/pages/region_selection_page.dart` | Region picker with 21 aimags + UB |
| `lib/src/features/onboarding/domain/onboarding_data.dart` | `OnboardingData` with `region` field |

### Key Findings
- **21 aimags + UB are hardcoded** in a `_regions` list in `RegionSelectionPage`.
- **No sum/bag lists exist anywhere** in the codebase.
- `region` is stored in:
  - `OnboardingData.region`
  - `profiles.region` column
  - Auth user metadata (`region` key)
- The `profiles` table comment says `-- аймаг/сум` suggesting sum was intended but never implemented.
- **No location hierarchy tables** in any Supabase migration.

### Reusable As-Is
- The aimag list can be reused for lost horse location selection.

### Needs Modification
- **Sum (сум) and Bag (баг) lists need to be created from scratch.**
- A new `locations` or `regions` table needs to be added to Supabase for the hierarchy.
- The lost horse report model needs `location_aimag`, `location_sum`, `location_bag` fields.

### Blockers / Gaps
- **No sum or bag data exists.** This is a major gap — the entire Mongolian administrative hierarchy down to sum and bag level needs to be researched, compiled, and added.
- No location hierarchy database table or migration.
- No location picker UI component beyond aimag level.

---

## 7. Database Schema (Supabase Migrations)

### Files
| File | Contents |
|------|----------|
| `001_initial_schema.sql` | Profiles, horses, pedigree, health/farrier logs, events, marketplace, co-ownership, subscriptions, RLS, storage buckets |
| `002_phase1_schema_update.sql` | Phase 1 updates |
| `003_add_user_role.sql` | `role` column on profiles |
| `004_marketplace_enhancements.sql` | Status changes, views_count, is_featured, seller_verified |
| `005_payment_system.sql` | `payment_requests` table, `verify_payment()`/`reject_payment()` RPCs |
| `006_certificates.sql` | Digital certificates |
| `007_gestation_tracking.sql` | Gestation/breeding tracking |
| `008_notifications.sql` | Notification infrastructure |
| `009_boost_system.sql` | Boost/featured listing system |
| `010_map_features.sql` | `lost_horse_reports`, `search_areas`, `horse_locations`, `geofence_alerts` tables |
| `042_payment_notifications.sql` | Payment notification triggers (renumbered from `010_payment_notifications` — the CLI keys migrations on the numeric prefix, so duplicate prefixes collide) |
| `011_horse_owner_stamp.sql` | Ownership stamp/tamga |
| `012_storage_buckets.sql` | Storage bucket policies |
| `013_rls_policies.sql` | RLS policy updates |
| `014_notification_preferences_fix.sql` | Notification preferences fix |
| `015_add_user_rank.sql` | User rank column |
| `016_race_videos.sql` | Race video storage |

### Key Tables for Lost Horse Feature

#### `lost_horse_reports` (migration 010)
```sql
CREATE TABLE lost_horse_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id        UUID NOT NULL REFERENCES horses(id),
  owner_id        UUID NOT NULL REFERENCES profiles(id),
  horse_name      TEXT NOT NULL,
  description     TEXT,
  last_seen_lat   DOUBLE PRECISION NOT NULL,
  last_seen_lng   DOUBLE PRECISION NOT NULL,
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_radius_km DOUBLE PRECISION NOT NULL DEFAULT 5.0,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'found', 'cancelled')),
  photo_url       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `profiles` table (cumulative)
```sql
CREATE TABLE profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name          TEXT NOT NULL,
  phone                 TEXT UNIQUE,
  region                TEXT,
  avatar_url            TEXT,
  subscription_tier     TEXT NOT NULL DEFAULT 'free',
  role                  TEXT DEFAULT 'casual',
  rank                  TEXT DEFAULT 'no_rank',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Missing Tables for Enhanced Lost Horse
| Table | Needed For | Status |
|-------|-----------|--------|
| `locations` or `regions` | Aimag/Sum/Bag hierarchy | **Missing** |
| `conversations` | Chat between finder and reporter | **Missing** (only in Isar) |
| `messages` | Chat messages | **Missing** (only in Isar) |
| `lost_horse_media` | Multiple photos per report | **Missing** |
| `lost_horse_payments` | Per-report pricing | **Missing** |

### Reusable As-Is
- `lost_horse_reports` table structure.
- RLS policies (owner CRUD + public read active).
- Existing indexes.

### Needs Modification
- `lost_horse_reports` needs columns for:
  - `location_aimag TEXT` (аймаг)
  - `location_sum TEXT` (сум)
  - `location_bag TEXT` (баг)
  - `animal_type TEXT` (horse/camel/cattle/sheep/goat)
  - `animal_age TEXT` or `age_group`
  - `breed TEXT` (угсаа)
  - `coat_color TEXT` (өнгө/зүс) — already on horses table
  - `contact_phone TEXT`
  - `reward_amount INTEGER` (шагнал)
  - `tamga_stamp TEXT` or `tamga_image_url TEXT`

### Blockers / Gaps
- No location hierarchy data.
- No migrations for conversations/messages tables.
- `lost_horse_reports` schema is minimal — major expansion needed.

---

## 8. Isar Schemas

### Files
| Path | Purpose |
|------|---------|
| `lib/src/features/shared/data/isar_schemas/isar_lost_horse_report.dart` | Lost horse report Isar schema |
| `lib/src/features/shared/data/isar_schemas/isar_lost_horse_report.g.dart` | Generated code |

### Key Findings
- **`IsarLostHorseReport`** mirrors the domain `LostHorseReport`:
  - `domainId`, `horseId`, `ownerId`, `horseName`, `description`, `lastSeenLat`, `lastSeenLng`, `lastSeenAt`, `searchRadiusKm`, `status`, `photoUrl`, `createdAt`, `updatedAt`
- **Single `photoUrl` (nullable)** — only one photo supported.
- **No fields for** location hierarchy, animal type, breed, contact info, pricing, tamga.
- **Indexes**: `domainId` (unique, replace), plus implicit Isar indexes.

### Reusable As-Is
- Schema pattern and `.g.dart` generation setup.

### Needs Modification
- `IsarLostHorseReport` needs field additions matching the new `lost_horse_reports` table columns.
- `photoUrl` → `List<String>` for multiple photos.
- Add fields: `locationAimag`, `locationSum`, `locationBag`, `animalType`, `animalAge`, `breed`, `coatColor`, `contactPhone`, `rewardAmount`, `tamgaStampUrl`, `videoUrls`.

### Blockers / Gaps
- Isar schema will need a migration or schema version bump.
- `build_runner` needs to run after schema changes.

---

## 9. Existing Lost Horse Screens & Flow

### Screens
| Screen | File | Description |
|--------|------|-------------|
| `LostHorseFinderScreen` | `lib/src/features/lost_horse/presentation/lost_horse_finder_screen.dart` | Tab view: list + map, FAB to report |
| `ReportLostHorseScreen` | `lib/src/features/map/presentation/report_lost_horse_screen.dart` | Form: horse selector, description, radius slider, GPS location |
| `LostHorseDetailScreen` | `lib/src/features/map/presentation/lost_horse_detail_screen.dart` | Detail view with status actions (found/cancel) |
| `ActiveReportsScreen` | `lib/src/features/map/presentation/active_reports_screen.dart` | Sorted list of active reports |
| `LostHorseCard` | `lib/src/features/map/presentation/widgets/lost_horse_card.dart` | Compact card widget |
| `HorseMarker` | `lib/src/features/map/presentation/widgets/horse_marker.dart` | Map marker widget |

### Current Report Flow
1. User opens `LostHorseFinderScreen` (list + map tabs)
2. Taps FAB → `ReportLostHorseScreen`
3. Selects a horse from their owned list
4. Writes description (min 10 chars)
5. Adjusts search radius (1-50 km slider)
6. Uses current GPS location as "last seen"
7. Submits → `SupabaseMapRepository.reportLostHorse()`
8. Report appears in active list + map

### Limitations of Current Implementation
- Only works for owned horses (must be in user's horse list).
- Single photo via `photoUrl` field.
- No animal type — only horses.
- No location hierarchy (aimag/sum/bag).
- No contact info (uses auth user).
- No pricing/reward.
- No chat/communication between finder and reporter.
- No tamga stamp verification.
- No filters for searching active reports.

---

## 10. Summary: What Can Be Reused vs. What Needs Building

### ✅ Can Reuse As-Is
| Component | For Lost Horse |
|-----------|----------------|
| `SupabaseAuthRepository` | Auth, `currentSupabaseUserId()` |
| `AuthState.phone` | Reporter contact phone |
| `SupabaseProfileRepository` | Fetch reporter info |
| `MediaStorageRouter` | Photo upload (reuse `horse-photos` bucket) |
| `SupabaseMediaStorage` | Upload photos to Supabase Storage |
| `ConversationScreen` | Chat UI (with adaptation) |
| `MarketConversation` / `MarketMessage` | Chat models (with adaptation) |
| `LocalMessageRepository` | Offline-first chat |
| `SupabaseMessageRepository` | Chat with Supabase sync |
| `PaymentService.generatePaymentCode()` | Payment code generation |
| `PaymentRequest` model | Payment tracking |
| `SubscriptionTier` | Pricing tier enum |
| `SupabasePaymentRepository` | Payment persistence |
| `lost_horse_reports` table | Report storage (needs expansion) |
| `SupabaseMapRepository` | Report CRUD + realtime streams |
| `LocalMapRepository` | Offline report storage |
| `LostHorseFinderScreen` | Entry point (needs expanded) |
| `ActiveReportsScreen` | Report list (needs filtering) |
| `LostHorseCard` | Report card (needs more fields) |

### 🔧 Needs Modification
| Component | What to Change |
|-----------|---------------|
| `LostHorseReport` model | Add location hierarchy, animal type, breed, age, coat, contact phone, reward, tamga, video URLs, multiple photos |
| `IsarLostHorseReport` | Match expanded domain model |
| `ReportLostHorseScreen` | Add all new form fields |
| `LostHorseDetailScreen` | Show all new info, add chat button |
| `lost_horse_reports` table | Add new columns |
| `MediaStorageRouter` | Add `lostHorsePhotoPath()` generator |
| `MarketConversation` | Support `reportId` alongside `listingId` |
| `ConversationScreen` | Support lost horse conversations, use real user ID |
| `RegionSelectionPage` | Add sum (сум) and bag (баг) selection |

### 🚧 Needs Building From Scratch
| Component | Priority | Notes |
|-----------|----------|-------|
| **Location hierarchy data** | High | Aimag → Sum → Bag lookup table + seed data for all of Mongolia |
| **Location picker UI** (sum/bag) | High | Cascading dropdown or step picker |
| **Animal type/breed/coat dropdowns** | High | Dog/camel/cattle/sheep/goat options, breed lists, coat color lists |
| **Multi-photo + video upload UI** | High | Gallery picker with camera option, video capture |
| **Tamga stamp capture/upload** | Medium | Photo of brand/stamp, optional |
| **Contact phone input** | High | Phone field on report form |
| **Chat between finder ↔ reporter** | High | Adapt existing chat to link to reports |
| **Pricing tier UI** (free vs premium) | Medium | Based on payment system |
| **Report filters** (by aimag, animal type, status) | High | Filter chips/search on `ActiveReportsScreen` |
| **`conversations` + `messages` Supabase tables** | High | Database migration for chat persistence |
| **`lost_horse_media` table** | Medium | Track multiple photos/videos per report |
| **`lost_horse_payments` table** | Low | Per-report payment tracking |
| **Anonymous report without login** | Medium | Guest flow using `signInAnonymously()` |

### Key Architecture Decisions Needed
1. **Location hierarchy**: Store as reference table (normalized) or embedded strings (denormalized)?
2. **Chat integration**: Reuse `MarketConversation` with a polymorphic `referenceId` or create a separate `LostHorseConversation` model?
3. **Pricing model**: Subscription-based (existing) or per-report payment (new)?
4. **Photo storage**: New `lost-horse-photos` bucket or reuse `horse-photos`?
5. **Video storage**: Requires R2 setup — block and tackle or block and defer?

---

## 11. File Manifest

### All Files Touched During Investigation

```
# Auth
lib/src/features/auth/domain/auth_state.dart
lib/src/features/auth/data/supabase_auth_repository.dart
lib/src/features/auth/presentation/phone_login_screen.dart
lib/src/app/supabase_bootstrap.dart

# Profile
lib/src/features/profile/domain/profile_settings.dart
lib/src/features/profile/data/supabase_profile_repository.dart

# Media Storage
lib/src/core/storage/cloud/media_storage_service.dart
lib/src/core/storage/cloud/media_storage_router.dart
lib/src/core/storage/cloud/supabase_media_storage.dart
lib/src/core/storage/cloud/r2_media_storage.dart
lib/src/core/storage/cloud/media_upload_result.dart
lib/src/core/storage/cloud/media_storage_providers.dart

# Chat
lib/src/features/market/domain/market_conversation.dart
lib/src/features/market/domain/market_message.dart
lib/src/features/market/data/message_repository.dart
lib/src/features/market/data/local_message_repository.dart
lib/src/features/market/data/supabase_message_repository.dart
lib/src/features/market/presentation/conversation_screen.dart
lib/src/features/market/application/message_providers.dart

# Payment
lib/src/features/payments/domain/payment_request.dart
lib/src/features/payments/data/payment_repository.dart
lib/src/features/payments/data/supabase_payment_repository.dart
lib/src/features/payments/data/local_payment_repository.dart
lib/src/features/payments/data/payment_service.dart
lib/src/features/payments/presentation/payment_tier_card.dart

# Location
lib/src/features/onboarding/presentation/pages/region_selection_page.dart
lib/src/features/onboarding/domain/onboarding_data.dart

# Map / Lost Horse
lib/src/features/map/domain/lost_horse_report.dart
lib/src/features/map/domain/map_enums.dart
lib/src/features/map/data/map_repository.dart
lib/src/features/map/data/supabase_map_repository.dart
lib/src/features/map/data/local_map_repository.dart
lib/src/features/map/application/lost_horse_providers.dart
lib/src/features/map/application/map_providers.dart
lib/src/features/map/presentation/report_lost_horse_screen.dart
lib/src/features/map/presentation/lost_horse_detail_screen.dart
lib/src/features/map/presentation/active_reports_screen.dart
lib/src/features/map/presentation/widgets/lost_horse_card.dart
lib/src/features/lost_horse/presentation/lost_horse_finder_screen.dart

# Isar Schemas
lib/src/features/shared/data/isar_schemas/isar_lost_horse_report.dart
lib/src/features/shared/data/isar_schemas/isar_market_conversation.dart
lib/src/features/shared/data/isar_schemas/isar_market_message.dart

# Database Migrations
supabase/migrations/001_initial_schema.sql
supabase/migrations/003_add_user_role.sql
supabase/migrations/004_marketplace_enhancements.sql
supabase/migrations/005_payment_system.sql
supabase/migrations/010_map_features.sql
supabase/migrations/012_storage_buckets.sql
```
