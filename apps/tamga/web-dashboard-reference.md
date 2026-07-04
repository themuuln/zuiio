# Tamga Web Dashboard — Database & API Reference

> Generated 2026-06-19 for WS-X (Web Dashboard) and WS-Y (Organizer API) planning.

---

## 1. Supabase Schema: Complete Table Reference

### 1.1 `profiles` — User profiles (extends `auth.users`)

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| `id` | UUID | — | PK → `auth.users(id)` ON DELETE CASCADE |
| `display_name` | TEXT | — | NOT NULL |
| `phone` | TEXT | — | UNIQUE |
| `region` | TEXT | — | — |
| `avatar_url` | TEXT | — | — |
| `subscription_tier` | TEXT | `'free'` | CHECK: free, pro, breeder, stable |
| `role` | TEXT | `'casual'` | CHECK: casual, breeder, stable, admin |
| `rank` | TEXT | `'no_rank'` | CHECK: no_rank, zalu_uu, sum_aldart, aimag_aldart, uls_aldart, manlai, tod_manlai, myangat |
| `subscription_expires_at` | TIMESTAMPTZ | — | — |
| `notifications_enabled` | BOOLEAN | `true` | — |
| `notify_health_reminders` | BOOLEAN | `true` | — |
| `notify_breeding_alerts` | BOOLEAN | `true` | — |
| `notify_market_updates` | BOOLEAN | `true` | — |
| `notify_subscription_expiry` | BOOLEAN | `true` | — |
| `notify_geofence_alerts` | BOOLEAN | `true` | — |
| `notify_payment_notifications` | BOOLEAN | `true` | — |
| `created_at` | TIMESTAMPTZ | `now()` | NOT NULL |
| `updated_at` | TIMESTAMPTZ | `now()` | NOT NULL, moddatetime trigger |

**Trigger**: `on_auth_user_created` — auto-creates profile row after signup via `handle_new_user()`.

---

### 1.2 `horses` — Core horse records

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| `id` | UUID | `gen_random_uuid()` | PK |
| `owner_id` | UUID | — | NOT NULL → `profiles(id)` ON DELETE CASCADE |
| `name` | TEXT | — | NOT NULL |
| `gender` | TEXT | — | CHECK: stallion, mare, gelding, foal |
| `coat` | TEXT | — | NOT NULL |
| `birth_year` | INTEGER | — | CHECK: >= 1990 AND <= current year |
| `microchip_id` | TEXT | — | — |
| `registration_no` | TEXT | — | — |
| `notes` | TEXT | `''` | — |
| `photo_urls` | TEXT[] | `'{}'` | — |
| `is_owned_by_household` | BOOLEAN | `true` | — |
| `lineage_root_id` | UUID | — | → `horses(id)` ON DELETE SET NULL |
| `relation_label` | TEXT | `''` | Added in migration 002 |
| `award_count` | INTEGER | `0` | Added in migration 002 |
| `offspring_count` | INTEGER | `0` | Added in migration 002 |
| `owner_stamp_svg` | TEXT | — | SVG of traditional Mongolian brand (тамга), migration 011 |
| `created_at` | TIMESTAMPTZ | `now()` | NOT NULL |
| `updated_at` | TIMESTAMPTZ | `now()` | NOT NULL, moddatetime trigger |

**Indexes**: owner_id, name, lineage_root_id

---

### 1.3 `pedigree_links` — Parent-child relationships

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK (gen_random_uuid) |
| `horse_id` | UUID | NOT NULL → `horses(id)` ON DELETE CASCADE |
| `parent_id` | UUID | NOT NULL → `horses(id)` ON DELETE CASCADE |
| `relation` | TEXT | CHECK: sire, dam |
| `verified` | BOOLEAN | DEFAULT false |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() |
| UNIQUE(horse_id, parent_id) | | |

**Trigger**: `check_pedigree_cycle()` — prevents cycles up to 10 generations deep.

---

### 1.4 `health_logs` — Medical & farrier records (merged from farrier_logs)

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| `id` | UUID | `gen_random_uuid()` | PK |
| `horse_id` | UUID | — | NOT NULL → `horses(id)` ON DELETE CASCADE |
| `log_type` | TEXT | — | CHECK: vaccination, deworming, treatment, vetVisit, shoeing, trimming |
| `date` | DATE | — | NOT NULL |
| `notes` | TEXT | — | — |
| `medicament` | TEXT | — | — |
| `cost` | INTEGER | — | CHECK >= 0 (төгрөг) |
| `farrier_name` | TEXT | — | — |
| `created_at` | TIMESTAMPTZ | `now()` | NOT NULL |
| `updated_at` | TIMESTAMPTZ | `now()` | NOT NULL |

**Indexes**: horse_id, date, log_type

---

### 1.5 `reminder_templates` — Recurring schedules

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `horse_id` | UUID | NOT NULL → `horses(id)` ON DELETE CASCADE |
| `owner_id` | UUID | NOT NULL → `profiles(id)` ON DELETE CASCADE |
| `reminder_type` | TEXT | CHECK: vaccination, deworming, farrier, registration |
| `interval_days` | INTEGER | CHECK > 0 |
| `last_done` | DATE | — |
| `next_due` | DATE | NOT NULL |
| `is_active` | BOOLEAN | DEFAULT true |
| `created_at` | TIMESTAMPTZ | NOT NULL |
| `updated_at` | TIMESTAMPTZ | NOT NULL |

---

### 1.6 `documents` — Document vault

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `horse_id` | UUID | → `horses(id)` ON DELETE CASCADE |
| `owner_id` | UUID | → `profiles(id)` ON DELETE CASCADE |
| `doc_type` | TEXT | CHECK: vet_cert, insurance, registration, microchip, other |
| `title` | TEXT | NOT NULL |
| `storage_path` | TEXT | NOT NULL (Supabase Storage path) |
| `file_size` | BIGINT | CHECK >= 0 |
| `mime_type` | TEXT | — |
| `created_at` / `updated_at` | TIMESTAMPTZ | — |

---

### 1.7 `events` — Event/tournament records (legacy, being replaced by `races` table)

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `horse_id` | UUID | → `horses(id)` ON DELETE CASCADE |
| `owner_id` | UUID | → `profiles(id)` ON DELETE CASCADE |
| `event_type` | TEXT | CHECK: race, competition, exhibition, training |
| `title` | TEXT | NOT NULL |
| `location` | TEXT | — |
| `date` | DATE | NOT NULL |
| `result` | TEXT | — |
| `prize_amount` | INTEGER | CHECK >= 0 |
| `notes` | TEXT | — |
| `photo_urls` | TEXT[] | — |

Plus fields from migration 002: `horse_name`, `date_label`, `place_label`, `award_label`, `is_upcoming`

---

### 1.8 `races` — Races (new system, migration 024)

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| `id` | TEXT | — | PK |
| `name` | TEXT | — | NOT NULL |
| `location` | TEXT | — | — |
| `date` | TIMESTAMPTZ | — | — |
| `type` | TEXT | `'local'` | CHECK: naadam, regional, local |
| `status` | TEXT | `'upcoming'` | CHECK: upcoming, ongoing, completed, cancelled |
| `max_entries` | INTEGER | — | — |
| `entry_fee` | INTEGER | `0` | NOT NULL (төгрөг) |
| `organizer_id` | TEXT | `''` | NOT NULL |
| `description` | TEXT | — | — |
| `prize_distribution` | TEXT | — | — |
| `created_at` | TIMESTAMPTZ | `now()` | NOT NULL |
| `updated_at` | TIMESTAMPTZ | `now()` | NOT NULL |

**Indexes**: type, status, organizer_id, date DESC
**RLS**: Anyone can read; authenticated users insert; organizer can update/delete.

---

### 1.9 `race_entries` — Race registrations (migration 025)

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| `id` | TEXT | — | PK |
| `race_id` | TEXT | — | NOT NULL → `races(id)` ON DELETE CASCADE |
| `horse_id` | TEXT | — | NOT NULL |
| `owner_id` | TEXT | `''` | — |
| `jockey_name` | TEXT | — | — |
| `status` | TEXT | `'registered'` | CHECK: registered, confirmed, competed, scratched |
| `result` | TEXT | — | — |
| `placement` | INTEGER | — | — |
| `prize` | INTEGER | — | — |
| `created_at` | TIMESTAMPTZ | `now()` | NOT NULL |
| `updated_at` | TIMESTAMPTZ | `now()` | NOT NULL |

**Unique index**: `idx_race_entries_unique_race_horse` on (race_id, horse_id) WHERE status != 'scratched'
**RLS**: Anyone can read; authenticated users insert; owners update own; organizers update entries in their races.

---

### 1.10 `race_videos` — Race video marketplace (migration 016)

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `uploader_id` | UUID | → `auth.users(id)` ON DELETE CASCADE |
| `title` | TEXT | NOT NULL |
| `video_url` | TEXT | NOT NULL |
| `race_name` | TEXT | — |
| `race_date` | TIMESTAMPTZ | — |
| `location_aimag` | TEXT | — |
| `category` | TEXT | — |
| `thumbnail_url` | TEXT | — |
| `free_preview_url` | TEXT | — |
| `price_3day` | INT | NOT NULL DEFAULT 500 |
| `price_1year` | INT | NOT NULL DEFAULT 2500 |
| `price_lifetime` | INT | NOT NULL DEFAULT 6000 |
| `view_count` | INT | DEFAULT 0 |
| `published` | BOOLEAN | DEFAULT false |
| `tagged_horse_ids` | UUID[] | — |
| `duration_seconds` | INT | — |

**RLS**: Public read published; uploader CRUD own.
**RPC**: `increment_race_video_view_count(video_id UUID)` — security definer.

Also has `video_access_passes` table (user_id, video_id, pass_type, purchased_at, expires_at).

---

### 1.11 `market_listings` — Marketplace

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| `id` | UUID | `gen_random_uuid()` | PK |
| `horse_id` | UUID | — | → `horses(id)` ON DELETE CASCADE |
| `seller_id` | UUID | — | → `profiles(id)` ON DELETE CASCADE |
| `title` | TEXT | — | NOT NULL |
| `description` | TEXT | — | — |
| `price_amount` | INTEGER | — | NOT NULL, CHECK >= 0 |
| `currency` | TEXT | `'MNT'` | CHECK: MNT, USD |
| `sale_type` | TEXT | — | CHECK: sale, lease, trade, stud |
| `status` | TEXT | `'pending_verification'` | CHECK: active, pending_verification, sold, expired, rejected |
| `location_label` | TEXT | — | — |
| `discipline_tags` | TEXT[] | `'{}'` | — |
| `document_tags` | TEXT[] | `'{}'` | — |
| `media_urls` | TEXT[] | `'{}'` | — |
| `is_seller_verified` | BOOLEAN | `false` | — |
| `views_count` | INTEGER | `0` | — |
| `is_featured` | BOOLEAN | `false` | (deprecated, use boost/vip) |
| `boost_level` | `boost_level` ENUM | `'none'` | none, standard, premium |
| `boost_expires_at` | TIMESTAMPTZ | — | — |
| `vip_level` | `vip_level` ENUM | `'none'` | none, standard, premium |
| `vip_expires_at` | TIMESTAMPTZ | — | — |
| `seller_badge` | `seller_badge_type` ENUM | `'none'` | none, shop |
| `seller_badge_expires_at` | TIMESTAMPTZ | — | — |
| `commission_rate` | DOUBLE PRECISION | — | migration 026 |
| `commission_amount` | INTEGER | — | migration 026 |

**Indexes**: (status WHERE active), seller_id, price_amount, location_label, views_count DESC, featured WHERE true, boosted WHERE non-none.

---

### 1.12 `co_ownerships` — Co-ownership records

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `horse_id` | UUID | → `horses(id)` ON DELETE CASCADE |
| `owner_id` | UUID | → (was share-based, now person-based) |
| `co_owner_name` | TEXT | NOT NULL DEFAULT '' (added migration 002) |
| `phone` | TEXT | — |
| `role` | TEXT | DEFAULT 'owner' |
| `permissions` | TEXT[] | — |
| UNIQUE(horse_id, co_owner_name) | | |

---

### 1.13 `subscriptions` — In-app purchase subscriptions

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `profile_id` | UUID | UNIQUE → `profiles(id)` ON DELETE CASCADE |
| `tier` | TEXT | CHECK: pro, breeder, stable |
| `store_platform` | TEXT | CHECK: appstore, playstore |
| `store_tx_id` | TEXT | UNIQUE, NOT NULL |
| `expires_at` | TIMESTAMPTZ | NOT NULL |
| `is_active` | BOOLEAN | DEFAULT true |

---

### 1.14 `payment_requests` — Khan Bank manual verification payments

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | → `auth.users(id)` ON DELETE CASCADE |
| `tier` | TEXT | CHECK: pro, breeder, stable |
| `code` | TEXT | UNIQUE, NOT NULL (TG-XXXX-XXXX format) |
| `amount_mnt` | INTEGER | NOT NULL |
| `status` | TEXT | CHECK: pending, verified, rejected, expired |
| `payment_type` | `payment_type` ENUM | subscription, listingBoost, sellerBadge |
| `expires_at` | TIMESTAMPTZ | NOT NULL |

**RPC**: `verify_payment()` — security definer, verifies payment, updates profile tier.
**RPC**: `reject_payment()` — security definer, marks as rejected.

---

### 1.15 `breeding_records` — Breeding & gestation tracking

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `sire_id` | UUID | → `horses(id)` ON DELETE CASCADE |
| `dam_id` | UUID | → `horses(id)` ON DELETE CASCADE |
| `sire_name` | TEXT | NOT NULL DEFAULT '' |
| `dam_name` | TEXT | NOT NULL DEFAULT '' |
| `breeding_date` | DATE | NOT NULL |
| `expected_foaling_date` | DATE | NOT NULL |
| `status` | TEXT | CHECK: active, foaled, aborted + 'Хээлтсэн' (in migration 007) |
| `herd_label` | TEXT | — |
| `notes` | TEXT | — |
| `foal_id` | UUID | → `horses(id)` ON DELETE SET NULL |
| `owner_id` | UUID | → `profiles(id)` ON DELETE CASCADE |
| `actual_foaling_date` | TIMESTAMPTZ | migration 007 |
| `foal_name` | TEXT | migration 007 |
| `foal_gender` | TEXT | CHECK: Эр, Эм |
| `foal_color` | TEXT | migration 007 |

---

### 1.16 `digital_certificates` — Ownership certificates + transfers

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `horse_id` | UUID | NOT NULL |
| `owner_id` | UUID | → `auth.users(id)` ON DELETE CASCADE |
| `owner_name` | TEXT | NOT NULL |
| `horse_name` | TEXT | — |
| `issue_date` | TIMESTAMPTZ | NOT NULL |
| `expiry_date` | TIMESTAMPTZ | — |
| `status` | TEXT | CHECK: active, transferred, revoked |
| `qr_code` | TEXT | UNIQUE, NOT NULL |
| `previous_owner_id` | UUID | — |

Has `certificate_transfers` history table with from/to tracking.
**Trigger**: `log_certificate_transfer()` — auto-logs transfer on status change.

---

### 1.17 `lost_horse_reports` — Map/lost horse finder

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `horse_id` | UUID | → `horses(id)` ON DELETE CASCADE |
| `owner_id` | UUID | → `profiles(id)` ON DELETE CASCADE |
| `horse_name` | TEXT | NOT NULL |
| `description` | TEXT | — |
| `last_seen_lat` / `last_seen_lng` | DOUBLE PRECISION | NOT NULL |
| `search_radius_km` | DOUBLE PRECISION | DEFAULT 5.0 |
| `status` | TEXT | CHECK: active, found, cancelled, expired |
| `pricing_tier` | TEXT | CHECK: free, featured, vip (migration 022) |
| `expires_at` | TIMESTAMPTZ | — (migration 022) |
| `renewal_requested` | BOOLEAN | DEFAULT false (migration 022) |
| `location_aimag` / `location_sum` / `location_bag` / `location_name` | TEXT | migration 018 |
| `animal_type` / `animal_ages` / `gender` / `breed` / `coat_color` / `lost_count` | TEXT/INT | migration 018 |

Has `lost_horse_payments` table for per-report payment.
Has `search_areas`, `horse_locations`, `geofence_alerts` tables (migration 010).
Has `mongolian_locations` reference table (aimag + sum hierarchy) (migration 017).

---

### 1.18 `teams` & `team_members` — Multi-user stables (migration 030)

**teams**: id (UUID PK), name, owner_user_id, member_count, horse_count, created_at, updated_at
**team_members**: id (UUID PK), team_id → teams, user_id → auth.users, role (owner/manager/vet/groom/viewer), permissions TEXT[], joined_at, UNIQUE(team_id, user_id)

**team_invitations** (migration 031): id, team_id → teams, team_name, invited_user_id, invited_by_user_id, role, status (pending/accepted/declined)

---

### 1.19 `training_logs` & `performance_records` (migration 027)

**training_logs**: id, owner_id, horse_id, type (gallop/sprint/endurance/rest), date, duration_minutes, distance_km, notes, handler_name, weather
**performance_records**: id, owner_id, horse_id, metric (speed/endurance/weight/condition), value (DOUBLE), unit, notes

---

### 1.20 `feed_schedules` & `feed_logs` (migration 028)

**feed_schedules**: id, owner_id, horse_id, feed_type (hay/grain/supplement), quantity_kg, frequency, start_date, end_date, notes
**feed_logs**: id, owner_id, schedule_id → feed_schedules, horse_id, date, amount_given, skipped, notes

---

### 1.21 `ai_queries` — Rate-limit tracking (migration 029)

| Column | Type |
|--------|------|
| `id` | UUID PK |
| `user_id` | UUID → `auth.users(id)` ON DELETE CASCADE |
| `function_name` | TEXT DEFAULT 'ai-breeding' |
| `model` | TEXT DEFAULT 'deepseek-v4-flash' |
| `prompt_tokens` / `completion_tokens` | INTEGER |
| `created_at` | TIMESTAMPTZ |

---

### 1.22 `user_devices` — FCM push tokens (migration 008)

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | → `auth.users(id)` ON DELETE CASCADE |
| `fcm_token` | TEXT | NOT NULL |
| `platform` | TEXT | CHECK: ios, android, web, macos |
| `created_at` | TIMESTAMPTZ | NOT NULL |
| `last_seen_at` | TIMESTAMPTZ | NOT NULL |
| UNIQUE(user_id, fcm_token) | | |

**RPC**: `register_device(p_fcm_token TEXT, p_platform TEXT)` — upserts device token.
**RPC**: `unregister_device(p_fcm_token TEXT)` — removes device token.
**RPC**: `update_notification_preferences(...)` — updates notification flag columns on profiles.

---

### 1.23 Storage Buckets

| Bucket | Public | File size limit | Allowed types |
|--------|--------|----------------|---------------|
| `horse-photos` | ✅ Public read | 10 MB | JPEG, PNG, WebP, GIF |
| `documents` | ❌ Private | 20 MB | PDF, JPEG, PNG, MS Word |
| `market-media` | ✅ Public read | 10 MB | JPEG, PNG, WebP |

(External R2 for videos, paths stored in DB.)

---

## 2. Edge Function Pattern

All 4 Edge Functions follow a consistent pattern:

### 2.1 Common Structure

```typescript
// 1. CORS headers exported at module level
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// 2. Single Deno.serve handler
Deno.serve(async (req: Request) => {
  // 3. Handle OPTIONS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 4. Validate HTTP method
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Parse request body
    const { ... } = await req.json();

    // 6. Initialize Supabase client (service role for backend operations)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ... business logic ...

    // 7. Return success
    return new Response(JSON.stringify({ ... }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    // 8. Catch-all error handler
    console.error("...:", err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

### 2.2 Auth Patterns

**Pattern A: JWT extraction from Authorization header (ai-breeding)**
```typescript
function extractUserId(req: Request): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  // Decode JWT payload (base64url) without verification
  // Edge Function runtime already verified the JWT
  const token = authHeader.substring(7);
  const parts = token.split(".");
  const payload = parts[1];
  const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  const claims = JSON.parse(decoded);
  return claims.sub ?? null;
}
```

**Pattern B: Supabase SSR cookies (web app)**
- Uses `@supabase/ssr` with `cookies()` from `next/headers`
- Server component refresh via middleware.ts

**Pattern C: No auth (public endpoints like convert-stamp)**

### 2.3 CORS Pattern
- CORS preflight: OPTIONS → 200 with headers
- All responses include `corsHeaders` merged
- `x-webhook-signature` added for webhook endpoints (payment-sms-webhook)

### 2.4 Edge Function Inventory

| Function | Purpose | Auth | API Key |
|----------|---------|------|---------|
| `ai-breeding` | AI breeding advisor (DeepSeek V4) | JWT Bearer from Authorization header | OPENCODE_API_KEY |
| `convert-stamp` | Convert stamp photo to SVG | None (public) | OPENCODE_API_KEY |
| `payment-notification` | Send FCM push after payment | Internal (service role) | None |
| `payment-sms-webhook` | Receive bank SMS, auto-verify | HMAC signature (`x-webhook-signature`) | None |

---

## 3. Flutter Domain Models

### 3.1 `Horse` (shared domain, `lib/src/shared/domain/horse.dart`)

| Field | Type | Supabase column |
|-------|------|----------------|
| `id` | `String` | `id` |
| `ownerId` | `String` | `owner_id` |
| `name` | `String` | `name` |
| `gender` | `HorseGender` enum | `gender` TEXT (stallion/mare/gelding/foal) |
| `coat` | `String` | `coat` |
| `birthYear` | `int` | `birth_year` |
| `relationLabel` | `String` | `relation_label` |
| `awardCount` | `int` | `award_count` |
| `offspringCount` | `int` | `offspring_count` |
| `isOwnedByHousehold` | `bool` | `is_owned_by_household` |
| `notes` | `String` | `notes` |
| `microchipId` | `String?` | `microchip_id` |
| `registrationNo` | `String?` | `registration_no` |
| `photoUrls` | `List<String>` | `photo_urls` |
| `lineageRootId` | `String?` | `lineage_root_id` |
| `ownerStampSvg` | `String?` | `owner_stamp_svg` |
| `registrationDate` | `DateTime?` | `registration_date` (not yet in schema) |
| `tamgaVerified` | `bool` | `tamga_verified` (not yet in schema) |
| `stateVerified` | `bool` | `state_verified` (not yet in schema) |

**HorseGender enum**: stallion, mare, gelding, foal

### 3.2 `MarketListing` (market domain)

| Field | Type | Supabase column |
|-------|------|----------------|
| `id` | `String` | `id` |
| `horseId` | `String` | `horse_id` |
| `sellerId` | `String` | `seller_id` |
| `title` | `String` | `title` |
| `description` | `String` | `description` |
| `priceAmount` | `int` | `price_amount` |
| `currency` | `String` | `currency` (MNT/USD) |
| `saleType` | `MarketSaleType` | `sale_type` |
| `status` | `MarketListingStatus` | `status` |
| `locationLabel` | `String` | `location_label` |
| `disciplineTags` | `List<String>` | `discipline_tags` |
| `documentTags` | `List<String>` | `document_tags` |
| `mediaUrls` | `List<String>` | `media_urls` |
| `isSellerVerified` | `bool` | `is_seller_verified` |
| `viewsCount` | `int` | `views_count` |
| `boostLevel` | `BoostLevel` | `boost_level` |
| `boostExpiresAt` | `DateTime?` | `boost_expires_at` |
| `vipLevel` | `VipLevel` | `vip_level` |
| `vipExpiresAt` | `DateTime?` | `vip_expires_at` |
| `sellerBadge` | `SellerBadgeType` | `seller_badge` |
| `sellerBadgeExpiresAt` | `DateTime?` | `seller_badge_expires_at` |
| `commissionRate` | `double?` | `commission_rate` |
| `commissionAmount` | `int?` | `commission_amount` |

### 3.3 `Race` (races domain)

| Field | Type | Supabase column |
|-------|------|----------------|
| `id` | `String` | `id` (TEXT PK) |
| `name` | `String` | `name` |
| `location` | `String?` | `location` |
| `date` | `DateTime?` | `date` |
| `type` | `RaceType` | `type` (naadam/regional/local) |
| `status` | `RaceStatus` | `status` (upcoming/ongoing/completed/cancelled) |
| `maxEntries` | `int?` | `max_entries` |
| `entryFee` | `int` | `entry_fee` |
| `organizerId` | `String` | `organizer_id` |
| `description` | `String?` | `description` |
| `prizeDistribution` | `String?` | `prize_distribution` |

### 3.4 `RaceEntry` (races domain)

| Field | Type | Supabase column |
|-------|------|----------------|
| `id` | `String` | `id` (TEXT PK) |
| `raceId` | `String` | `race_id` → races(id) |
| `horseId` | `String` | `horse_id` |
| `ownerId` | `String` | `owner_id` |
| `jockeyName` | `String?` | `jockey_name` |
| `status` | `RaceEntryStatus` | `status` (registered/confirmed/competed/scratched) |
| `result` | `String?` | `result` |
| `placement` | `int?` | `placement` |
| `prize` | `int?` | `prize` |

### 3.5 `Event` (shared domain)

| Field | Type |
|-------|------|
| `id` | `String` |
| `horseId` | `String` |
| `title` | `String` |
| `eventType` | `EventType` (race/auction/expo/training) |
| `ownerId` | `String` |
| `date` | `DateTime?` |
| `horseName` | `String?` |
| `location` | `String?` |
| `latitude` / `longitude` | `double?` |
| `result` | `String?` |
| `prizeAmount` | `int?` |
| `organizerName` / `organizerPhone` / `organizerEmail` | `String?` |
| `isFeatured` / `registrationEnabled` | `bool` |
| `address` / `notes` | `String?` |
| `photoUrls` | `List<String>` |

### 3.6 `EventRegistration` (shared domain)

| Field | Type |
|-------|------|
| `id` | `String` |
| `eventId` | `String` |
| `horseId` | `String` |
| `ownerId` | `String` |
| `registeredAt` | `DateTime` |
| `status` | `RegistrationStatus` (registered/confirmed/cancelled) |
| `notes` | `String?` |

### 3.7 `HealthLog` (shared domain)

| Field | Type | Supabase column |
|-------|------|----------------|
| `id` | `String` | `id` |
| `horseId` | `String` | `horse_id` |
| `logType` | `LogType` (vaccination/deworming/treatment/vetVisit/shoeing/trimming) | `log_type` |
| `date` | `DateTime?` | `date` |
| `notes` | `String` | `notes` |
| `medicament` | `String?` | `medicament` |
| `cost` | `double?` | `cost` |
| `farrierName` | `String?` | `farrier_name` |

---

## 4. Supabase SSR Pattern (Web App)

### Server Client (`apps/web/src/lib/supabase/server.ts`)

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,  // Publishable key (not anon)
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* Server Component — ignore */ }
        },
      },
    }
  );
}
```

### Browser Client (`apps/web/src/lib/supabase/client.ts`)

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
```

### Middleware (`apps/web/src/lib/supabase/middleware.ts`)

```typescript
// Refreshes session on every request
// Protects /dashboard/* routes — redirects to /auth/login if no user
export async function updateSession(request: NextRequest) {
  // Creates server client with request/response cookie handling
  // Calls supabase.auth.getUser()
  // Redirects if !user && pathname.startsWith("/dashboard")
}
```

**Key**: Uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not `ANON_KEY`). Modern publishable key format: `sb_publishable_...`.

---

## 5. Shared Enums Summary

### Location: `lib/src/shared/domain/horse.dart`
- **`HorseGender`**: stallion, mare, gelding, foal

### Location: `lib/src/shared/domain/event.dart`
- **`EventType`**: race, auction, expo, training

### Location: `lib/src/shared/domain/event_registration.dart`
- **`RegistrationStatus`**: registered, confirmed, cancelled

### Location: `lib/src/shared/domain/health_log.dart`
- **`LogType`**: vaccination, deworming, treatment, vetVisit, shoeing, trimming

### Location: `lib/src/features/races/domain/race.dart`
- **`RaceType`**: naadam, regional, local
- **`RaceStatus`**: upcoming, ongoing, completed, cancelled

### Location: `lib/src/features/races/domain/race_entry.dart`
- **`RaceEntryStatus`**: registered, confirmed, competed, scratched

### Location: `lib/src/features/market/domain/market_listing.dart`
- **`MarketSaleType`**: sale, lease, trade, stud
- **`MarketListingStatus`**: active, pendingVerification, sold, expired, rejected
- **`BoostLevel`**: none, standard, premium
- **`VipLevel`**: none, standard, premium
- **`SellerBadgeType`**: none, shop

---

## 6. Key Architectural Patterns

### RLS Strategy
- **Read**: Most tables allow owner/co-owner reads. Market listings: anyone can read active/pending. Races: anyone can read. Lost horses: public read active.
- **Write**: Owner/seller/organizer can insert/update/delete. Teams: owner/manager role-gated.
- **Service role**: Used by Edge Functions to bypass RLS for admin operations (payment verification, push notification).

### Serialization Convention
- **Dart → JSON**: camelCase (`horseId`, `createdAt`)
- **Dart → Supabase**: snake_case (`horse_id`, `created_at`)
- Every domain model has both `fromSupabaseJson()`/`toSupabaseJson()` AND `fromJson()`/`toJson()` methods.

### Subscription Tiers (value chain)
1. **free** → 1 horse, 5 AI queries/month, basic lost horse
2. **pro** → Unlimited horses, 50 AI queries/month, boosted lost horse
3. **breeder** → Unlimited AI queries, breeding tools, training/nutrition tracking
4. **stable** → Everything + teams, unlimited members

### Rate Limiting (ai-breeding)
- Free: 5/month, Pro: 50/month, Breeder+: unlimited
- Tracked in `ai_queries` table, counted per calendar month

---

*End of reference document. Total: 31 migrations as of 2026-06-19.*
