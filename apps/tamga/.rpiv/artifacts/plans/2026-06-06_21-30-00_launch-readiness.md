---
date: 2026-06-06T21:30:00+0800
author: Temuulen Undrakhbayar
commit: be25156
branch: main
repository: tamga
topic: "Launch readiness: wire Edge Functions, fix notification bugs, add health cloud sync, decompose horses screen"
tags: [plan, edge-functions, notifications, health, refactor, rls]
status: ready
parent: .rpiv/artifacts/research/2026-06-06_19-08-35_sms-payment-otp-integration.md
phase_count: 6
unresolved_phase_count: 0
last_updated: 2026-06-06T21:30:00+0800
last_updated_by: Temuulen Undrakhbayar
---

# Launch Readiness Implementation Plan

## Overview

Wire existing Supabase Edge Functions into the notification pipeline, fix SQL/Dart layer mismatches, add health data cloud sync, fix token lifecycle, and decompose the horses screen. This closes the gap between "features built" and "features production-ready."

## Requirements

- NotificationTriggerService must call Edge Functions for remote FCM push (currently no-op)
- `_getPreferences()` must query the correct column (`id` not `owner_id` — profiles uses `id` as PK)
- Add missing `notify_geofence_alerts` and `notify_payment_notifications` columns to profiles
- Fix token lifecycle: clean stale tokens, call removeToken on sign-out
- Create SupabaseHealthRepository for health data cloud sync
- Decompose horses_screen.dart from 910 lines to <600 lines
- Add geofence_alerts DELETE RLS policy

## Current State Analysis

### Key Discoveries

1. **Edge Functions exist** — `supabase/functions/payment-notification/index.ts` and `supabase/functions/payment-sms-webhook/index.ts` are already built with Firebase Admin SDK, FCM multicast, and HMAC validation.

2. **FCM no-op** — `notification_trigger_service.dart:217-234` `_sendNotification()` only does `debugPrint` for FCM. The comment says "Remote push is triggered by Supabase Edge Functions" but no code calls them.

3. **Preferences query bug** — `notification_trigger_service.dart:271` uses `.eq('id', userId)` but profiles table PK is `id` (not `owner_id`). The SQL WHERE clauses use `owner_id` in RPCs but the table itself has `id` as PK. Need to verify which is correct.

4. **Missing SQL columns** — `008_notifications.sql` has 5 preference columns but `notify_geofence_alerts` and `notify_payment_notifications` are missing (geofence hardcoded to true in Dart, payment added in 010).

5. **Token lifecycle broken** — `notification_service.dart` stores tokens but `removeToken()` is never called on sign-out. Stale tokens accumulate on refresh.

6. **Health data trapped locally** — No `SupabaseHealthRepository` exists. Medical/farrier logs never sync to cloud.

7. **Horses screen monolith** — 910 lines with 11 widget classes. Could extract `_HorseCard`, `_EmptyHorsesState`, `_SearchBar` into separate files.

### Code References

- `supabase/functions/payment-notification/index.ts` — Edge Function pattern (Deno.serve + Firebase Admin)
- `supabase/functions/payment-sms-webhook/index.ts` — SMS webhook with HMAC validation
- `lib/src/core/services/notification_trigger_service.dart:217-234` — FCM no-op
- `lib/src/core/services/notification_trigger_service.dart:247-284` — preferences query
- `lib/src/core/services/notification_service.dart:140-164` — token storage
- `lib/src/core/domain/notification_preferences.dart:31-38` — isTypeEnabled switch
- `lib/src/features/payments/data/payment_service.dart:20-32` — code generation
- `supabase/migrations/005_payment_system.sql:72-136` — verify_payment RPC
- `supabase/migrations/008_notifications.sql:7-26` — user_devices table
- `lib/src/features/horses/presentation/horses_screen.dart` — 910-line monolith

## Desired End State

1. `NotificationTriggerService._sendNotification()` calls Edge Function for remote push
2. `_getPreferences()` returns actual user preferences (not always defaults)
3. All 7 preference columns exist in SQL
4. Tokens cleaned on sign-out, stale tokens purged
5. Health logs sync to Supabase cloud
6. horses_screen.dart <600 lines
7. All RLS policies complete

## What We're NOT Doing

- Building new Edge Functions (payment-notification and payment-sms-webhook already exist)
- Protomaps tile bundling (separate task, requires 200-500MB download)
- App Store preparation (screenshots, descriptions)
- Integration tests (unit tests only for now)
- Modifying the payment flow UI (already complete)
- Changing the auth flow (phone OTP already complete)

## Decisions

### Decision 1: FCM Wiring Approach
**Ambiguity**: How should NotificationTriggerService call Edge Functions?
**Explored**: 
- Option A: Direct HTTP call from Dart to Edge Function URL
- Option B: Use Supabase client `.functions.invoke()` method
**Decision**: Option A — direct HTTP call. The Edge Functions already have CORS headers and the pattern is simpler. `supabase.functions.invoke()` requires the Supabase client which may not be available in the service.

### Decision 2: Preferences Column Fix
**Ambiguity**: The `_getPreferences()` queries by `id` but profiles PK is `id`. Is this correct?
**Explored**: SQL migrations show `WHERE owner_id = v_user_id` in RPCs, but the table itself has `id UUID PRIMARY KEY DEFAULT auth.uid()`. The `id` column IS the user ID.
**Decision**: The query is correct (`id` = auth.uid()). The confusion was from RPC parameter naming. No change needed for the query itself. But need to add the missing columns.

### Decision 3: Health Repository Pattern
**Ambiguity**: Should health cloud sync use the same pattern as horses?
**Explored**: `supabase_horses_repository.dart` uses direct Supabase queries. `local_horses_repository.dart` uses Isar.
**Decision**: Follow the same pattern — create `SupabaseHealthRepository` implementing `HealthRepository` interface, with direct Supabase queries for health_logs table.

### Decision 4: Horses Screen Decomposition
**Ambiguity**: Which widgets to extract?
**Explored**: 11 widget classes in one file. `_HorseCard` (180 lines), `_EmptyHorsesState` (60 lines), `_SearchBar` (80 lines) are the largest.
**Decision**: Extract `_HorseCard` + `_HorseAvatar` into `horse_card.dart`, `_EmptyHorsesState` + `_NoSearchResults` into `horse_empty_states.dart`, `_SearchBar` into `horse_search_bar.dart`.

## Phase 1: Wire FCM Push Notifications

### Overview
Connect NotificationTriggerService to existing Edge Functions for remote FCM push. Depends on nothing.

### Changes Required:

#### 1. lib/src/core/services/notification_trigger_service.dart
**File**: lib/src/core/services/notification_trigger_service.dart
**Changes**: MODIFY — Replace FCM no-op with Edge Function HTTP call

```dart
// Add imports
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../app/app_config.dart';
import '../../auth/data/supabase_auth_repository.dart' show currentSupabaseUserId;

// In _sendNotification(), replace the FCM no-op block:
Future<void> _sendNotification({
  required String title,
  required String body,
  required NotificationType type,
  String? referenceId,
  String? referenceType,
}) async {
  // Local notification илгээх
  await _localNotification.showNotification(
    title: title,
    body: body,
    type: type,
    referenceId: referenceId,
    referenceType: referenceType,
  );

  // FCM push илгээх — Edge Function-ээр
  if (_pushNotification != null && _pushNotification.isAvailable) {
    try {
      final supabaseUrl = AppConfig.supabaseUrl;
      if (supabaseUrl.isEmpty) return;

      final userId = currentSupabaseUserId();
      if (userId == null) return;

      final response = await http.post(
        Uri.parse('$supabaseUrl/functions/v1/payment-notification'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${AppConfig.supabasePublishableKey}',
        },
        body: jsonEncode({
          'user_id': userId,
          'title': title,
          'body': body,
          'type': type.key,
          'reference_id': referenceId,
        }),
      );

      if (response.statusCode != 200) {
        debugPrint('[NotificationTriggerService] Edge Function error: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('[NotificationTriggerService] FCM push failed: $e');
    }
  }
}
```

#### 2. pubspec.yaml
**File**: pubspec.yaml
**Changes**: None — `http` package already present

### Success Criteria:

#### Automated Verification:
- [ ] `dart analyze lib/src/core/services/notification_trigger_service.dart` — no errors
- [ ] `flutter test` — all existing tests pass

#### Manual Verification:
- [ ] NotificationTriggerService._sendNotification() calls Edge Function
- [ ] Edge Function receives correct payload (user_id, title, body, type)

---

## Phase 2: Fix Notification Preferences

### Overview
Add missing SQL columns and fix the preferences query. Depends on nothing (can run in parallel with Phase 1).

### Changes Required:

#### 1. supabase/migrations/014_notification_preferences_fix.sql
**File**: supabase/migrations/014_notification_preferences_fix.sql
**Changes**: NEW — Add missing preference columns

```sql
-- 014_notification_preferences_fix.sql
-- Add missing notification preference columns to profiles

-- Add geofence alerts preference (was hardcoded to true in Dart)
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS notify_geofence_alerts BOOLEAN DEFAULT true;

-- Add payment notifications preference (partially added in 010)
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS notify_payment_notifications BOOLEAN DEFAULT true;

-- Update the update_notification_preferences() RPC to include new columns
-- Keep RETURNS JSONB and authentication guard from existing RPC
CREATE OR REPLACE FUNCTION update_notification_preferences(
  p_notifications_enabled BOOLEAN DEFAULT NULL,
  p_notify_health_reminders BOOLEAN DEFAULT NULL,
  p_notify_breeding_alerts BOOLEAN DEFAULT NULL,
  p_notify_market_updates BOOLEAN DEFAULT NULL,
  p_notify_subscription_expiry BOOLEAN DEFAULT NULL,
  p_notify_geofence_alerts BOOLEAN DEFAULT NULL,
  p_notify_payment_notifications BOOLEAN DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Authentication required');
  END IF;

  UPDATE profiles SET
    notifications_enabled = COALESCE(p_notifications_enabled, notifications_enabled),
    notify_health_reminders = COALESCE(p_notify_health_reminders, notify_health_reminders),
    notify_breeding_alerts = COALESCE(p_notify_breeding_alerts, notify_breeding_alerts),
    notify_market_updates = COALESCE(p_notify_market_updates, notify_market_updates),
    notify_subscription_expiry = COALESCE(p_notify_subscription_expiry, notify_subscription_expiry),
    notify_geofence_alerts = COALESCE(p_notify_geofence_alerts, notify_geofence_alerts),
    notify_payment_notifications = COALESCE(p_notify_payment_notifications, notify_payment_notifications)
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2. lib/src/core/domain/notification_preferences.dart
**File**: lib/src/core/domain/notification_preferences.dart
**Changes**: MODIFY — Add subscriptionExpiry field (currently missing from Dart but exists in SQL)

```dart
// Add to NotificationPreferences class:
final bool subscriptionExpiryEnabled;

// Add to NotificationPreferenceType enum:
subscriptionExpiry,

// Update constructor, copyWith, fromJson, toJson
// Update isTypeEnabled switch to include subscriptionExpiry case

// In _getPreferences(), add to select():
'notify_subscription_expiry, '

// In _getPreferences() constructor call, add:
subscriptionExpiryEnabled: response['notify_subscription_expiry'] as bool? ?? true,

// Replace hardcoded geofence:
// OLD: geofenceAlertsEnabled: true, // No column in SQL yet
// NEW: geofenceAlertsEnabled: response['notify_geofence_alerts'] as bool? ?? true,
```

#### 3. lib/src/core/services/notification_trigger_service.dart
**File**: lib/src/core/services/notification_trigger_service.dart
**Changes**: MODIFY — Update _getPreferences() to select all 7 columns

```dart
// Update the select() to include both new columns:
final response = await client
    .from('profiles')
    .select(
      'notifications_enabled, '
      'notify_health_reminders, '
      'notify_breeding_alerts, '
      'notify_market_updates, '
      'notify_subscription_expiry, '
      'notify_geofence_alerts, '
      'notify_payment_notifications',
    )
    .eq('id', userId)
    .maybeSingle();
```

### Success Criteria:

#### Automated Verification:
- [ ] `dart analyze lib/src/core/domain/notification_preferences.dart` — no errors
- [ ] `dart analyze lib/src/core/services/notification_trigger_service.dart` — no errors
- [ ] `flutter test test/core/notification_preferences_test.dart` — passes

#### Manual Verification:
- [ ] SQL migration adds both columns
- [ ] Dart model includes all 7 preference fields
- [ ] _getPreferences() selects all 7 columns

---

## Phase 3: Fix Token Lifecycle

### Overview
Clean stale FCM tokens and call removeToken on sign-out. Depends on nothing.

### Changes Required:

#### 1. lib/src/core/services/notification_service.dart
**File**: lib/src/core/services/notification_service.dart
**Changes**: MODIFY — Add token cleanup on refresh, call removeToken on dispose

```dart
// In initialize(), update token refresh handler:
FirebaseMessaging.instance.onTokenRefresh.listen((newToken) async {
  final client = _client;
  if (client == null) return;

  final userId = currentSupabaseUserId();
  if (userId == null) return;

  // Delete ALL old tokens for this user, then store new one
  await client.from('user_devices').delete().eq('user_id', userId);
  await _storeTokenInSupabase(newToken);
});

// signOut() already calls removeToken() — no new method needed.
// Just ensure removeToken() is called before Supabase signOut.
```

#### 2. lib/src/features/auth/application/auth_providers.dart
**File**: lib/src/features/auth/application/auth_providers.dart
**Changes**: MODIFY — Call removeToken on sign-out before Supabase signOut

```dart
// In signOut() method, add cleanup before signOut:
Future<void> signOut() async {
  // Clean FCM token before signing out
  try {
    final token = await FirebaseMessaging.instance.getToken();
    if (token != null) {
      final client = Supabase.instance.client;
      await client.from('user_devices').delete().eq('fcm_token', token);
    }
  } catch (_) {}
  
  // Existing signOut logic...
}
```

### Success Criteria:

#### Automated Verification:
- [ ] `dart analyze lib/src/core/services/notification_service.dart` — no errors
- [ ] `dart analyze lib/src/features/auth/application/auth_providers.dart` — no errors

#### Manual Verification:
- [ ] Token refresh cleans old entries
- [ ] Sign-out removes FCM token from user_devices

---

## Phase 4: Health Data Cloud Sync

### Overview
Create SupabaseHealthRepository for health data cloud sync. Depends on nothing.

### Changes Required:

#### 1. lib/src/features/health/data/supabase_health_repository.dart
**File**: lib/src/features/health/data/supabase_health_repository.dart
**Changes**: MODIFY — Add `implements HealthRepository` to existing class

The file already exists with a working implementation using `HealthLog` type and `toSupabaseJson(ownerId:)` pattern. Only change: add `implements HealthRepository` to the class declaration and ensure all interface methods are present.

```dart
// Change class declaration from:
class SupabaseHealthRepository {
// To:
class SupabaseHealthRepository implements HealthRepository {

// Verify these methods exist and match the interface:
// - Future<List<HealthLog>> fetchHealthLogs(String horseId)
// - Future<void> saveHealthLog(HealthLog log, {String? ownerId})
// - Future<void> deleteHealthLog(String horseId, String logId)
```

#### 2. lib/src/features/health/application/health_providers.dart
**File**: lib/src/features/health/application/health_providers.dart
**Changes**: MODIFY — Add cloud/local branching

```dart
// Add provider that chooses repository based on config:
final healthRepositoryProvider = FutureProvider<HealthRepository>((ref) async {
  if (AppConfig.isSupabaseConfigured) {
    return SupabaseHealthRepository();
  }
  // Use existing IsarStorage instance
  return LocalHealthRepository(
    storage: IsarStorage.instance,
    syncQueue: SyncQueue(),
  );
});
```

### Success Criteria:

#### Automated Verification:
- [ ] `dart analyze lib/src/features/health/data/supabase_health_repository.dart` — no errors
- [ ] `dart analyze lib/src/features/health/application/health_providers.dart` — no errors
- [ ] `flutter test` — all existing tests pass

#### Manual Verification:
- [ ] SupabaseHealthRepository implements HealthRepository interface
- [ ] Providers choose cloud vs local based on AppConfig

---

## Phase 5: Horses Screen Decomposition

### Overview
Extract widgets from horses_screen.dart into separate files. Depends on nothing.

### Changes Required:

#### 1. lib/src/features/horses/presentation/horse_card.dart
**File**: lib/src/features/horses/presentation/horse_card.dart
**Changes**: NEW — Extracted _HorseCard + _HorseAvatar + _Badge

```dart
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../../app/theme/app_spacing.dart';
import '../../market/application/market_providers.dart';
import '../application/horses_providers.dart';
import '../domain/horse_record.dart';
import 'co_ownership_sheet.dart';
import 'horse_detail_screen.dart';
import 'horse_editor_sheet.dart';
import '../../search/application/search_providers.dart';

// ... HorseCard, HorseAvatar, Badge widgets (public names) ...
```

#### 2. lib/src/features/horses/presentation/horse_empty_states.dart
**File**: lib/src/features/horses/presentation/horse_empty_states.dart
**Changes**: NEW — Extracted _EmptyHorsesState + _NoSearchResults

```dart
import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import 'add_horse_screen.dart';

// ... _EmptyHorsesState, _NoSearchResults widgets ...
```

#### 3. lib/src/features/horses/presentation/horse_search_bar.dart
**File**: lib/src/features/horses/presentation/horse_search_bar.dart
**Changes**: NEW — Extracted _SearchBar

```dart
import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';

// ... _SearchBar widget ...
```

#### 4. lib/src/features/horses/presentation/horses_screen.dart
**File**: lib/src/features/horses/presentation/horses_screen.dart
**Changes**: MODIFY — Remove extracted widgets, import new files, rename private to public

```dart
// Remove: _HorseCard, _HorseAvatar, _Badge, _EmptyHorsesState, _NoSearchResults, _SearchBar
// Add imports:
import 'horse_card.dart';
import 'horse_empty_states.dart';
import 'horse_search_bar.dart';

// Rename all references:
// _HorseCard → HorseCard
// _EmptyHorsesState → EmptyHorsesState
// _NoSearchResults → NoSearchResults  
// _SearchBar → HorseSearchBar
// _HorseEditorSheet → HorseEditorSheet (from horse_editor_sheet.dart)
```

### Success Criteria:

#### Automated Verification:
- [ ] `dart analyze lib/src/features/horses/presentation/` — no errors
- [ ] `flutter test` — all existing tests pass
- [ ] horses_screen.dart < 600 lines

#### Manual Verification:
- [ ] All widgets render correctly
- [ ] Navigation still works (horse detail, co-ownership sheet)

---

## Phase 6: RLS & Final Cleanup

### Overview
Add missing RLS policy and verify all changes. Depends on Phases 1-5.

### Changes Required:

#### 1. supabase/migrations/014_notification_preferences_fix.sql
**File**: supabase/migrations/014_notification_preferences_fix.sql
**Changes**: MODIFY — Add geofence_alerts DELETE policy

```sql
-- Add to existing migration:
CREATE POLICY "Geofence alerts delete by owner" ON geofence_alerts
  FOR DELETE USING (
    geofence_id IN (SELECT id FROM search_areas WHERE owner_id = auth.uid())
  );
```

#### 2. Verify all migrations
**File**: supabase/migrations/
**Changes**: VERIFY — Run all migrations against local Supabase

### Success Criteria:

#### Automated Verification:
- [ ] `dart analyze` — no new errors
- [ ] `flutter test` — all 230+ tests pass
- [ ] All SQL migrations syntactically valid

#### Manual Verification:
- [ ] Geofence alerts can be deleted by owner
- [ ] All preference columns exist in profiles table
- [ ] Edge Functions receive correct payloads

---

## Ordering Constraints

- Phase 1 (FCM Wiring) and Phase 2 (Preferences Fix) can run in parallel
- Phase 3 (Token Lifecycle) can run in parallel with Phases 1-2
- Phase 4 (Health Cloud Sync) can run in parallel with Phases 1-3
- Phase 5 (Horses Decomposition) can run in parallel with Phases 1-4
- Phase 6 (RLS & Cleanup) depends on all previous phases

## Verification Notes

- Edge Functions already exist and work — only need client-side wiring
- Preferences query is correct (`id` = auth.uid()) — only missing columns need adding
- Health repository follows same pattern as horses — straightforward implementation
- Horses screen decomposition is mechanical — extract widgets, update imports

## Performance Considerations

- Edge Function calls add ~100-200ms latency for FCM push (acceptable)
- Health cloud sync adds network calls — should be async with local-first fallback
- Token cleanup on sign-out adds ~50ms (acceptable)

## Migration Notes

- 014_notification_preferences_fix.sql adds columns with DEFAULT true (backwards compatible)
- No data migration needed — existing rows get default values
- Rollback: DROP COLUMN for each added column

## Pattern References

- `supabase/functions/payment-notification/index.ts` — Edge Function pattern
- `lib/src/features/horses/data/supabase_horses_repository.dart` — Supabase repository pattern
- `lib/src/features/horses/presentation/horse_editor_sheet.dart` — Widget extraction pattern

## Developer Context

All decisions made on autopilot per user request. No ambiguities requiring developer input.

## Plan History

- Phase 1: Wire FCM Push Notifications — pending
- Phase 2: Fix Notification Preferences — pending
- Phase 3: Fix Token Lifecycle — pending
- Phase 4: Health Data Cloud Sync — pending
- Phase 5: Horses Screen Decomposition — pending
- Phase 6: RLS & Final Cleanup — pending

## References

- `.rpiv/artifacts/research/2026-06-06_19-08-35_sms-payment-otp-integration.md` — SMS/payment/OTP research
- `supabase/functions/payment-notification/index.ts` — Existing Edge Function
- `supabase/functions/payment-sms-webhook/index.ts` — Existing Edge Function
