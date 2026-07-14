---
date: 2026-06-06T19:08:35+0800
author: Temuulen Undrakhbayar
commit: be25156
branch: main
repository: tamga
topic: "SMS & OTP Integration — Payment Verification and Phone Authentication"
tags: [design, payments, auth, notifications, sms, otp, edge-functions]
status: ready
parent: .rpiv/artifacts/research/2026-06-06_19-08-35_sms-payment-otp-integration.md
last_updated: 2026-06-06T19:08:35+0800
last_updated_by: Temuulen Undrakhbayar
---

# Design: SMS & OTP Integration

## Summary

Build shared infrastructure for incoming message receiving (payment SMS webhook + phone OTP) and outgoing notification delivery (FCM push). Two new Supabase Edge Functions handle incoming webhooks and outgoing push. Phone OTP UI activates existing dormant data layer code. Payment SMS webhook auto-verifies payments by parsing bank notification SMS and matching TG-XXXX-XXXX codes against the `payment_requests` table.

## Requirements

- Receive Khan Bank "Тань дансанд орлого орлоо" SMS via GSM modem or Android forwarding app
- Parse payment code (TG-XXXX-XXXX) from SMS body and auto-verify matching payment requests
- Send FCM push notification to user after payment verification
- Enable phone OTP authentication (+976 Mongolian numbers) via Supabase/Twilio
- Build PhoneAuthScreen with phone input and OTP verification steps
- Fix notification preferences cross-layer mismatch (JSONB vs individual columns)
- Add payment notification type and preference

## Current State Analysis

### Key Discoveries

- `notification_types.dart:5-15` — `NotificationType` enum has 5 values, none for payment verification
- `notification_preferences.dart:88` — `NotificationPreferenceType` has 4 values (health/breeding/market/geofence), no payment
- `notification_trigger_service.dart:362` — `_getPreferences()` reads non-existent `notification_preferences` JSONB column (functional bug — always falls back to defaults)
- `supabase_auth_repository.dart:116-156` — `signInWithPhone()` + `verifyPhoneOtp()` exist but are never called from UI
- `auth_providers.dart:77-91` — `AuthStateNotifier` wires phone methods but `signInWithPhone()` is fire-and-forget
- `auth_state.dart:31-38` — `AuthState.loading()` returned by `signInWithPhone()` but unreachable through `authStateChanges` stream
- `login_screen.dart:83-145` — LoginScreen is email-only, no phone auth option
- `005_payment_system.sql:72-136` — `verify_payment()` RPC handles status transition + tier update
- `payment_service.dart:20-32` — TG-XXXX-XXXX code generation (excludes 0/O/I/1)
- `notification_service.dart:140-164` — Token storage via direct upsert (never uses `register_device()` RPC)
- `notification_service.dart:63-65` — Token refresh creates stale rows
- `notification_service.dart:192-214` — `removeToken()` exists but never called on sign-out
- `convert-stamp/index.ts` — Only Edge Function, demonstrates Deno.serve + CORS pattern
- `stamp_conversion_provider.dart:59` — Client invokes via `_supabase.functions.invoke('convert-stamp', body: ...)`
- `008_notifications.sql:72-84` — SQL has individual boolean columns, not JSONB
- `008_notifications.sql:145-196` — `update_notification_preferences()` RPC has 5 params

### Patterns to Follow

- **Edge Functions**: `convert-stamp/index.ts` — CORS headers, Deno.serve, env vars via `Deno.env.get()`, error handling with try/catch
- **Auth screens**: `login_screen.dart` — ConsumerStatefulWidget, `_isLoading`/`_errorMessage` local state, `ref.read(authStateProvider.notifier)` for auth calls, `ref.listen` for redirect
- **Phone validation**: `profile_setup_page.dart:128-137` — `TextInputType.phone`, strips spaces/hyphens, validates length
- **Two-step flows**: `onboarding_screen.dart:23-110` — PageView with NeverScrollableScrollPhysics, parent holds accumulated state
- **Riverpod providers**: `auth_providers.dart` — StreamNotifierProvider for auth state, Provider for repository selection
- **Error display**: `login_screen.dart:99-118` — Card with errorContainer/onErrorContainer colors

## Scope

### Building

1. **Notification types & preferences foundation** — `paymentVerified` type, `payment` preference, fix `_getPreferences()` bug, new migration
2. **Payment SMS webhook Edge Function** — Receives bank SMS, parses code, auto-verifies via `verify_payment()` RPC
3. **Phone OTP UI** — `PhoneAuthScreen` with PageView (phone input → OTP verify), route registration
4. **Payment notification Edge Function** — FCM push after payment verification via Firebase Admin SDK
5. **Notification token lifecycle fix** — Stale token cleanup, sign-out wiring, provider registration

### Not Building

- QPay/SocialPay integration (deferred per sprint plan)
- GSM modem hardware setup (infrastructure, not code)
- Admin verification UI changes (admin flow unchanged)
- SMS sending from app (OTP handled by Supabase/Twilio)
- Real-time payment status polling via Supabase Realtime (out of scope)

## Decisions

### Decision 1: Phone OTP Flow Architecture
**Ambiguity**: Single screen with internal state vs two separate screens with routing.
**Explored**:
- Option A: Single `PhoneAuthScreen` with PageView (2 steps) — matches `onboarding_screen.dart` pattern
- Option B: Two screens (`/auth/phone` + `/auth/otp-verify`) with GoRouter state passing — matches `app_router.dart` pattern for `/certificates/:certificateId`
**Decision**: Option A — Single screen with PageView. Reduces routing complexity, keeps phone state local, matches onboarding precedent.

### Decision 2: Payment SMS Auto-Verification
**Ambiguity**: Edge Function calls existing `verify_payment()` RPC vs implements own verification logic.
**Explored**:
- Option A: Call `verify_payment()` RPC — reuses existing logic, handles expiry/double-pay prevention
- Option B: Direct SQL updates — more control but duplicates RPC logic
**Decision**: Option A — Call `verify_payment()` RPC. The RPC already handles expiry checks, status transitions, tier updates, and double-pay prevention. No reason to duplicate.

### Decision 3: FCM Push Delivery
**Ambiguity**: Edge Function with Firebase Admin SDK vs client-side push trigger.
**Explored**:
- Option A: Edge Function queries `user_devices`, sends via Firebase Admin SDK — multi-device, server-side
- Option B: Client calls Edge Function after detecting status change — requires polling
**Decision**: Option A — Edge Function with Firebase Admin SDK. Multi-device delivery, no polling needed, follows existing comment at `notification_trigger_service.dart:343`.

### Decision 4: Notification Preferences Bug Fix
**Ambiguity**: Fix `_getPreferences()` as part of this work or defer.
**Explored**:
- Option A: Fix now — switch from JSONB read to individual column reads, add payment column
- Option B: Defer — note as known issue, payment notifications skip preference check
**Decision**: Option A — Fix now. The bug affects ALL notification gating. Fixing it ensures payment notifications respect user preferences.

### Decision 5: SMS Webhook Authentication
**Ambiguity**: HMAC signature validation vs API key vs no auth.
**Explored**:
- Option A: HMAC-SHA256 with shared secret (`SMS_WEBHOOK_SECRET`) — most secure, standard webhook pattern
- Option B: API key in header — simpler but less secure
- Option C: No auth (like convert-stamp) — insecure, not acceptable for payment verification
**Decision**: Option A — HMAC-SHA256. Payment verification is security-critical. The GSM modem/Android app signs the payload with a shared secret.

## Architecture

### `lib/src/core/services/notification_types.dart` — MODIFY

```dart
/// Мэдэгдлийн төрөл — бүх push notification-ийн ангилал.
enum NotificationType {
  healthReminder,
  breedingDue,
  marketListingUpdate,
  subscriptionExpiry,
  geofenceAlert,
  paymentVerified, // NEW
}

extension NotificationTypeX on NotificationType {
  String get key => switch (this) {
    NotificationType.healthReminder => 'health_reminder',
    NotificationType.breedingDue => 'breeding_due',
    NotificationType.marketListingUpdate => 'market_listing_update',
    NotificationType.subscriptionExpiry => 'subscription_expiry',
    NotificationType.geofenceAlert => 'geofence_alert',
    NotificationType.paymentVerified => 'payment_verified',
  };
  // ... label, labelEn, channelId, channelName, channelDescription
  // all include paymentVerified case
}
```

### `lib/src/core/domain/notification_preferences.dart` — MODIFY

```dart
class NotificationPreferences {
  const NotificationPreferences({
    this.notificationsEnabled = true,
    this.healthRemindersEnabled = true,
    this.breedingAlertsEnabled = true,
    this.marketUpdatesEnabled = true,
    this.geofenceAlertsEnabled = true,
    this.paymentNotificationsEnabled = true, // NEW
  });
  final bool paymentNotificationsEnabled; // NEW

  bool isTypeEnabled(NotificationPreferenceType type) {
    if (!notificationsEnabled) return false;
    return switch (type) {
      NotificationPreferenceType.health => healthRemindersEnabled,
      NotificationPreferenceType.breeding => breedingAlertsEnabled,
      NotificationPreferenceType.market => marketUpdatesEnabled,
      NotificationPreferenceType.geofence => geofenceAlertsEnabled,
      NotificationPreferenceType.payment => paymentNotificationsEnabled, // NEW
    };
  }
  // copyWith, fromJson, toJson all updated with paymentNotificationsEnabled
}

enum NotificationPreferenceType { health, breeding, market, geofence, payment }
```

### `lib/src/core/services/notification_trigger_service.dart` — MODIFY

```dart
// Fixed _getPreferences() to read individual columns from profiles table
Future<NotificationPreferences> _getPreferences() async {
  final response = await client
      .from('profiles')
      .select(
        'notifications_enabled, notify_health_reminders, '
        'notify_breeding_alerts, notify_market_updates, '
        'notify_subscription_expiry, notify_payment_notifications',
      )
      .eq('id', userId) // Fixed: was 'owner_id'
      .maybeSingle();
  return NotificationPreferences(
    notificationsEnabled: response['notifications_enabled'] as bool? ?? true,
    healthRemindersEnabled: response['notify_health_reminders'] as bool? ?? true,
    breedingAlertsEnabled: response['notify_breeding_alerts'] as bool? ?? true,
    marketUpdatesEnabled: response['notify_market_updates'] as bool? ?? true,
    geofenceAlertsEnabled: true, // No column yet
    paymentNotificationsEnabled: response['notify_payment_notifications'] as bool? ?? true,
  );
}
```

### `supabase/migrations/010_payment_notifications.sql` — NEW

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notify_payment_notifications BOOLEAN NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION update_notification_preferences(
  p_notifications_enabled BOOLEAN DEFAULT NULL,
  p_notify_health_reminders BOOLEAN DEFAULT NULL,
  p_notify_breeding_alerts BOOLEAN DEFAULT NULL,
  p_notify_market_updates BOOLEAN DEFAULT NULL,
  p_notify_subscription_expiry BOOLEAN DEFAULT NULL,
  p_notify_payment_notifications BOOLEAN DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  UPDATE profiles SET
    notifications_enabled = COALESCE(p_notifications_enabled, notifications_enabled),
    notify_health_reminders = COALESCE(p_notify_health_reminders, notify_health_reminders),
    notify_breeding_alerts = COALESCE(p_notify_breeding_alerts, notify_breeding_alerts),
    notify_market_updates = COALESCE(p_notify_market_updates, notify_market_updates),
    notify_subscription_expiry = COALESCE(p_notify_subscription_expiry, notify_subscription_expiry),
    notify_payment_notifications = COALESCE(p_notify_payment_notifications, notify_payment_notifications),
    updated_at = now()
  WHERE id = v_user_id;
  RETURN jsonb_build_object('success', true);
END;
$$;
```

### `supabase/functions/payment-sms-webhook/index.ts` — NEW

```typescript
// Receives bank SMS from GSM modem/Android forwarding app
// Validates HMAC-SHA256 signature via x-webhook-signature header
// Parses TG-XXXX-XXXX code via regex, extracts amount
// Matches payment_requests WHERE code=$code AND status='pending'
// Calls verify_payment() RPC with p_payment_id and admin_notes
// Triggers payment-notification Edge Function (best-effort)
// Returns { success, payment_id, code, tier, user_id } or { error }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { /* ... CORS headers ... */ };

async function verifyHmac(body, signature, secret) { /* Web Crypto HMAC-SHA256 */ }
function parseSms(body) { /* Regex: TG-[A-Z2-9]{4}-[A-Z2-9]{4} + amount */ }

Deno.serve(async (req) => {
  // OPTIONS → CORS preflight
  // POST → validate HMAC → parse SMS → match payment_requests → verify_payment RPC
  //   → trigger payment-notification → return success
});
```

### `supabase/functions/payment-notification/index.ts` — NEW

```typescript
// Sends FCM push after payment verification
// Queries user_devices for target user's FCM tokens
// Uses Firebase Admin SDK for multi-device delivery
// Returns success/error JSON
```

### `lib/src/features/auth/presentation/phone_auth_screen.dart` — NEW

```dart
// Single screen with PageView: phone input → OTP verify
// Phone input: +976 formatting, validation
// OTP verify: 6-digit input, auto-submit, resend timer
// Calls signInWithPhone() → verifyPhoneOtp()
```

### `lib/src/app/router/app_router.dart` — MODIFY

```dart
// Add /phone-auth route
```

### `lib/src/features/auth/presentation/login_screen.dart` — MODIFY

```dart
// Add "Нэвтрэх утасны дугаар" button navigating to /phone-auth
```

### `lib/src/core/services/notification_service.dart` — MODIFY

```dart
// Fix 1: Token refresh — clean old token before storing new one
_messaging.onTokenRefresh.listen((newToken) async {
  // Delete old token from user_devices
  if (_currentToken != null && _currentToken != newToken) {
    await _removeTokenFromDb(_currentToken!);
  }
  _currentToken = newToken;
  await _storeTokenInSupabase(newToken);
});

// Fix 2: Add public removeToken() for sign-out wiring
Future<Result<void>> removeToken() async { /* existing, already public */ }

// Fix 3: Extract _removeTokenFromDb() helper for reuse
Future<void> _removeTokenFromDb(String token) async {
  final userId = currentSupabaseUserId();
  if (userId == null) return;
  final client = _client;
  if (client == null) return;
  await client
      .from('user_devices')
      .delete()
      .eq('user_id', userId)
      .eq('fcm_token', token);
}
```

### `lib/src/features/auth/data/supabase_auth_repository.dart` — MODIFY

```dart
// Wire removeToken() to sign-out flow
Future<void> signOut() async {
  // Remove FCM token before signing out
  // Note: NotificationService must be accessible here
  await _auth?.signOut();
}
```

### `lib/main.dart` — MODIFY

```dart
// Register NotificationService as Riverpod Provider
// Wire to auth sign-out via a wrapper or listener
final notificationServiceProvider = Provider<NotificationService>((ref) {
  final service = NotificationService();
  ref.onDispose(() => service.dispose());
  return service;
});
```

## Slices

### Slice 1: Notification Types & Preferences Foundation

**Files**: `notification_types.dart`, `notification_preferences.dart`, `notification_trigger_service.dart`, `010_payment_notifications.sql`

Adds `paymentVerified` to `NotificationType` enum, `payment` to `NotificationPreferenceType`, `paymentNotificationsEnabled` field to `NotificationPreferences`. Fixes `_getPreferences()` to read individual boolean columns from `profiles` table (was reading non-existent JSONB from `user_profiles`). New migration adds `notify_payment_notifications` column and extends RPC.

#### Automated Verification:
- [ ] Type checking passes: `dart analyze lib/src/core/services/notification_types.dart lib/src/core/domain/notification_preferences.dart lib/src/core/services/notification_trigger_service.dart`
- [ ] No compile errors from exhaustive switch statements
- [ ] New migration applies cleanly: `supabase db push`

#### Manual Verification:
- [ ] `NotificationType.paymentVerified` appears in all switch expressions without warnings
- [ ] `NotificationPreferenceType.payment` appears in `isTypeEnabled()` switch
- [ ] `_getPreferences()` reads individual columns from `profiles` table with `.eq('id', userId)`

### Slice 2: Payment SMS Webhook Edge Function

**Files**: `supabase/functions/payment-sms-webhook/index.ts`

Edge Function receives bank SMS from GSM modem/Android forwarding app. Validates HMAC-SHA256 signature, parses TG-XXXX-XXXX code via regex, matches against `payment_requests.code`, calls `verify_payment()` RPC, triggers `payment-notification` Edge Function for FCM push.

#### Automated Verification:
- [ ] TypeScript compiles: `cd supabase/functions/payment-sms-webhook && deno check index.ts`
- [ ] HMAC validation rejects requests without valid signature
- [ ] TG-XXXX-XXXX regex correctly extracts codes from sample SMS bodies

#### Manual Verification:
- [ ] Edge Function deploys: `supabase functions deploy payment-sms-webhook`
- [ ] Function returns 400 for missing/invalid HMAC
- [ ] Function returns 200 with no-match for SMS without valid code
- [ ] Function returns 200 with verification result for valid SMS

### Slice 3: Phone OTP UI

**Files**: `phone_login_screen.dart` (PRE-EXISTING), `otp_verify_screen.dart` (PRE-EXISTING), `app_router.dart` (PRE-EXISTING), `login_screen.dart` (PRE-EXISTING)

**Pre-existing implementation discovered during generation.** The project already has:
- `PhoneLoginScreen` — phone input with +976 prefix, validation, calls `signInWithPhone()`
- `OtpVerifyScreen` — 6 individual input fields with auto-advance and auto-verify, resend timer
- Router routes: `/phone-login` → `PhoneLoginScreen`, `/phone-verify` → `OtpVerifyScreen(phone: phone)`
- Login screen: `OutlinedButton.icon` for "Утасны дугаараар нэвтрэх" navigating to `/phone-login`

Two-screen approach (not PageView) — cleaner separation, state passed via GoRouter `extra`.

#### Automated Verification:
- [ ] Type checking passes: `dart analyze lib/src/features/auth/presentation/phone_login_screen.dart lib/src/features/auth/presentation/otp_verify_screen.dart`
- [ ] Route registration compiles without errors

#### Manual Verification:
- [ ] Phone input accepts 99112233 format, normalizes to +97699112233
- [ ] OTP input shows 6-digit fields with auto-advance and auto-submit
- [ ] Login screen shows phone auth option
- [ ] Navigation flows: login → phone login → OTP verify → lineage home

### Slice 4: Payment Notification Edge Function

**Files**: `supabase/functions/payment-notification/index.ts`

Edge Function sends FCM push after payment verification. Queries `user_devices` for target user's FCM tokens, checks notification preferences, sends via Firebase Admin SDK `sendEachForMulticast()`, cleans up stale tokens on failure.

#### Automated Verification:
- [ ] TypeScript compiles: `cd supabase/functions/payment-notification && deno check index.ts`
- [ ] Firebase Admin SDK initializes with service account
- [ ] Queries user_devices correctly for target user

#### Manual Verification:
- [ ] Edge Function deploys: `supabase functions deploy payment-notification`
- [ ] Function sends FCM push to all user devices
- [ ] Notification appears on device with correct title/body

### Slice 5: Notification Token Lifecycle Fix

**Files**: `notification_service.dart`, `supabase_auth_repository.dart`, `main.dart`

Fixes three token lifecycle bugs: (1) stale tokens accumulate on refresh — old token not deleted; (2) `removeToken()` never called on sign-out; (3) `NotificationService` created as local variable in `main.dart` instead of Riverpod provider.

#### Automated Verification:
- [ ] Type checking passes: `dart analyze lib/src/core/services/notification_service.dart`
- [ ] No breaking changes to existing notification functionality

#### Manual Verification:
- [ ] Token refresh cleans old token from user_devices
- [ ] Sign-out removes current token from user_devices
- [ ] NotificationService accessible via Riverpod provider

## Desired End State

### Phone OTP Flow
```
User taps "Нэвтрэх утасны дугаар" on LoginScreen
  → PhoneAuthScreen (Step 1: phone input)
  → User enters "99112233", taps "Илгээх"
  → signInWithPhone(phone: "+97699112233") called
  → SMS sent via Supabase/Twilio
  → PageView advances to Step 2 (OTP input)
  → User enters "123456"
  → verifyPhoneOtp(phone: "+97699112233", token: "123456") called
  → AuthState.authenticated emitted via authStateChanges stream
  → ref.listen redirects to /lineage
```

### Payment SMS Auto-Verification
```
Khan Bank sends: "Тань дансанд орлого орлоо. Дүн: 9,900₮. Утга: TG-AB3F-7K2X"
  → GSM modem / Android app forwards to Edge Function webhook
  → payment-sms-webhook validates HMAC signature
  → Extracts TG-AB3F-7K2X via regex
  → Queries payment_requests WHERE code = 'TG-AB3F-7K2X' AND status = 'pending'
  → Calls verify_payment(p_payment_id)
  → RPC updates status → verified, subscription_tier → pro
  → Calls payment-notification Edge Function
  → FCM push sent to user: "Төлбөр баталгаажлаа! Захиалга идэвхжлээ."
```

## File Map

| Path | Status | Purpose |
|------|--------|---------|
| `lib/src/core/services/notification_types.dart` | MODIFY | Add paymentVerified type |
| `lib/src/core/domain/notification_preferences.dart` | MODIFY | Add payment preference, fix serialization |
| `lib/src/core/services/notification_trigger_service.dart` | MODIFY | Fix _getPreferences() to read columns |
| `supabase/migrations/010_payment_notifications.sql` | NEW | Add notify_payment_notifications column |
| `supabase/functions/payment-sms-webhook/index.ts` | NEW | Bank SMS webhook receiver |
| `supabase/functions/payment-notification/index.ts` | NEW | FCM push sender |
| `lib/src/features/auth/presentation/phone_auth_screen.dart` | NEW | Phone OTP UI |
| `lib/src/app/router/app_router.dart` | MODIFY | Add /phone-auth route |
| `lib/src/features/auth/presentation/login_screen.dart` | MODIFY | Add phone auth button |
| `lib/src/core/services/notification_service.dart` | MODIFY | Fix token lifecycle |
| `lib/main.dart` | MODIFY | Wire NotificationService provider |

## Ordering Constraints

- Slice 1 (types/preferences) must come first — all other slices depend on the new types
- Slice 2 (SMS webhook) and Slice 3 (phone OTP UI) are independent of each other — can be developed in parallel
- Slice 4 (FCM push) depends on Slice 1 (notification types) but not on Slice 2 or 3
- Slice 5 (token lifecycle) is independent of Slices 2-4 but depends on Slice 1

## Verification Notes

- `_getPreferences()` at `notification_trigger_service.dart:362` reads `notification_preferences` JSONB — this column doesn't exist in SQL migration 008. The fix reads individual boolean columns instead.
- `AuthState.loading()` at `auth_state.dart:31` is unreachable through the `authStateChanges` stream. Phone OTP screen must manage "OTP sent" state locally.
- `adminVerificationProvider` at `payment_providers.dart:28` is orphaned (no consumer). Leave as-is — admin flow unchanged.
- `register_device()` and `unregister_device()` RPCs at `008_notifications.sql:55,88` are never called from Dart. Consider wiring in Slice 5.
- The `owner_id` column referenced in `005_payment_system.sql:123` and `008_notifications.sql:180` may not exist in visible migrations. Verify before modifying profile queries.

## Performance Considerations

- FCM multi-device delivery: `payment-notification` Edge Function iterates over all `user_devices` rows for a user. With typical 1-3 devices per user, this is negligible.
- SMS parsing: Regex-based extraction is O(n) on SMS body length (~200 chars). No performance concern.
- Token cleanup: Batch-delete stale tokens on refresh to prevent table bloat.

## Migration Notes

- New column `notify_payment_notifications` added to `profiles` with `DEFAULT true` — existing users get payment notifications enabled by default
- `update_notification_preferences()` RPC extended with one new nullable parameter — backwards compatible
- No data migration needed — new column has sensible default

## Pattern References

- `supabase/functions/convert-stamp/index.ts:1-116` — Edge Function template (CORS, Deno.serve, error handling)
- `lib/src/features/auth/presentation/login_screen.dart:16-145` — Auth screen template (ConsumerStatefulWidget, state management)
- `lib/src/features/onboarding/presentation/onboarding_screen.dart:23-110` — PageView two-step flow template
- `lib/src/features/horses/application/stamp_conversion_provider.dart:33-85` — Edge Function client invocation pattern
- `lib/src/features/onboarding/presentation/pages/profile_setup_page.dart:128-137` — Phone input validation pattern

## Developer Context

**Q (SMS receiving approach): Which SMS receiving approach?**
A: Android SMS forwarding for MVP + GSM gateway for production. Flexible architecture.

**Q (OTP delivery): Phone OTP delivery provider?**
A: Supabase/Twilio — cost-efficient, already wired.

**Q (Build order): Phone OTP or shared infra first?**
A: Shared infra first, then both features on top.

**Q (Phone OTP flow): Single screen with PageView vs two separate screens?**
A: Single screen with PageView — matches onboarding precedent.

**Q (Payment auto-verify): Call existing verify_payment() RPC vs own logic?**
A: Call existing RPC — reuses expiry/double-pay logic.

**Q (FCM push): Edge Function with Firebase Admin SDK vs client-side?**
A: Edge Function — multi-device, no polling.

**Q (Preferences bug): Fix _getPreferences() now or defer?**
A: Fix now — affects all notification gating.

**Q (Webhook auth): HMAC, API key, or no auth?**
A: HMAC-SHA256 — payment is security-critical.

## Design History

- Slice 1: Notification Types & Preferences Foundation — approved as generated
- Slice 2: Payment SMS Webhook Edge Function — approved as generated
- Slice 3: Phone OTP UI — approved as pre-existing (discovered during generation)
- Slice 4: Payment Notification Edge Function — approved as generated
- Slice 5: Notification Token Lifecycle Fix — approved as generated

## References

- `.rpiv/artifacts/research/2026-06-06_19-08-35_sms-payment-otp-integration.md` — Research artifact
- `.rpiv/artifacts/discover/2026-06-06_17-39-27_launch-gap-closure.md` — Launch gap FRD
- `docs/sprint-plan.md:63` — QPay deferred
- `docs/finance.md:245` — "QPay + SocialPay for subscriptions"
