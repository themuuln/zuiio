---
date: 2026-06-06T19:08:35+0800
author: Temuulen Undrakhbayar
commit: be25156
branch: main
repository: tamga
topic: "SMS receiving for payment verification and OTP delivery — Mongolian banking integration"
tags: [research, payments, auth, notifications, sms, khanbank, otp, edge-functions]
status: complete
last_updated: 2026-06-06T19:08:35+0800
last_updated_by: Temuulen Undrakhbayar
---

# Research: SMS Receiving for Payment Verification & OTP Delivery

## Research Question

In payment and OTP, we want to receive messages from the client. Mongolian "ДАН" (dans/account) approach uses that — Khanbank sends "Тань дансанд орлого орлоо" (income deposited to your account) SMS to users' phone numbers. What do we need to set this up? How does the OTP delivery work with Supabase? What infrastructure is missing?

## Summary

The Tamga project has **zero messaging infrastructure** for receiving incoming SMS. Payment verification is fully manual (admin checks Khan Bank history, calls `verify_payment()` RPC). Phone OTP code paths exist in the data layer (`signInWithPhone()`, `verifyPhoneOtp()`) but have no UI. The notification pipeline is outgoing-only with FCM push as a no-op. To implement both features, we need: (1) a shared Supabase Edge Function for receiving incoming SMS webhooks, (2) phone OTP UI screens, (3) Firebase Admin SDK server-side push, and (4) an SMS receiving hardware/service (Android SMS forwarding app for MVP, GSM gateway for production).

## Detailed Findings

### Payment Verification — Current Flow

- `payment_service.dart:20-32` generates `TG-XXXX-XXXX` codes (excludes 0/O/I/1 for clarity, ~1.1T combinations)
- `payment_service.dart:43-66` creates PaymentRequest with 72-hour expiry
- `payment_screen.dart:277-330` displays Khan Bank details (account `MN110005005431666225`, recipient "Temuulen Undrakhbayar")
- User manually transfers money with code in bank remarks
- `admin_verification.dart:47-70` calls `verify_payment()` RPC after manual bank check
- `005_payment_system.sql:72-136` RPC updates `payment_requests.status` to 'verified', sets `profiles.subscription_tier`, expires other pending requests
- **No notification sent at any point** after verification — user must manually poll `getPaymentStatus()` at `payment_screen.dart:199`

### Payment Verification — Notification Gaps

Six specific gaps identified:

| Gap | Location | What's Missing |
|-----|----------|----------------|
| After tier upgrade | `005_payment_system.sql:123` | No push notification that subscription is active |
| After status → verified | `005_payment_system.sql:115` | No event emission, no Realtime subscription |
| After status → rejected | `reject_payment` RPC | No push notification of rejection |
| After status → expired | `005_payment_system.sql:99,128` | No expiry notification |
| subscriptionExpiry type | `notification_types.dart:13` | Defined but never triggered |
| No Realtime on payment_requests | — | App relies on manual polling |

### Phone OTP — Data Layer (Code-Complete, UI-Missing)

- `supabase_auth_repository.dart:116-129` — `signInWithPhone()` calls `auth.signInWithOtp(phone:)`, returns `AuthState.loading()`
- `supabase_auth_repository.dart:133-156` — `verifyPhoneOtp()` calls `auth.verifyOTP(type: OtpType.sms)`, returns `AuthState.authenticated()`
- `auth_providers.dart:77-91` — `AuthStateNotifier` wires both methods but is `Future<void>` (swallows Result)
- `auth_repository.dart:22-29` — Interface defines both methods
- **Neither method is called from any presentation layer** — LoginScreen and RegisterScreen are email-only
- Supabase GoTrue uses Twilio for SMS delivery — configured in Supabase dashboard (Authentication → Providers → Phone)
- Mongolian +976 numbers: Twilio supports them, but Supabase project must have Twilio configured with sufficient credits

### Phone OTP — Architectural Gap

`AuthState.loading()` at `auth_state.dart:31-38` is returned by `signInWithPhone()` but **never reaches the UI through the stream**. The `authStateChanges` stream at `supabase_auth_repository.dart:199-216` only emits `authenticated` or `unvalidated` — it never emits `loading`. The `AuthStateNotifier.signInWithPhone()` at `auth_providers.dart:77` is fire-and-forget (`Future<void>`). A new screen must manage the "OTP sent" state locally with its own state variable.

### Phone OTP — UI Requirements

- Phone number input with Mongolian +976 formatting/validation (E.164 format required by GoTrue)
- Existing phone validation at `profile_setup_page.dart:169-183` — hint `'99112233'`, validates length ≥ 8
- Need normalization: accept `99112233` or `+97699112233`, always send `+976XXXXXXXX`
- LoginScreen at `login_screen.dart:83-145` needs phone auth option (alongside email)
- RegisterScreen at `register_screen.dart:118-172` needs phone-first registration option
- New routes needed: `/login/phone` or `/phone-auth`
- Post-auth redirect already handled by `ref.listen` at `login_screen.dart:87-92`

### Mongolian Banking SMS Ecosystem

**Khan Bank SMS notifications**: Banks send "Тань дансанд орлого орлоо. Дүн: X,XXX₮" to account holders. This SMS goes to the phone number registered on the bank account — **not to a webhook endpoint**. There is no Khan Bank merchant API for incoming transfer webhooks.

**Feasible approaches for receiving bank SMS**:

| Approach | Reliability | Cost | Complexity |
|----------|-------------|------|------------|
| SIM-based GSM modem | High | $50-100 hardware + SIM | Medium |
| Android SMS forwarding app | Medium | $0 (use old phone) | Low |
| Operator API agreement | High | Enterprise pricing | High |
| QPay/SocialPay webhooks | High | Merchant fees | Medium (requires behavior change) |

**QPay/SocialPay** (`docs/finance.md:245`): Referenced as payment processing method but **zero code exists**. Sprint plan at `docs/sprint-plan.md:63` shows QPay integration was deferred ("customer service manually check payments for now"). These platforms offer QR-based payments with callback webhooks — but require users to pay via their app, not direct bank transfer.

### Notification Pipeline — Outgoing Only

- `notification_trigger_service.dart:331-351` — `_sendNotification()` only does local notifications; FCM push is a no-op (line 343 comment: "FCM push нь server-side-оос илгээгддэг")
- `notification_trigger_service.dart:403-409` — Provider never passes `pushNotification` parameter
- `notification_service.dart:10-72` — Manages FCM tokens, permission, foreground messages — **no outbound send capability**
- `notification_service.dart:140-164` — `_storeTokenInSupabase()` does direct upsert (never uses `register_device()` RPC)
- `notification_service.dart:192-214` — `removeToken()` exists but is **never called** during sign-out
- `notification_service.dart:63-65` — Token refresh creates stale rows (old token not cleaned)

### Notification Preferences — Cross-Layer Mismatch

- `notification_trigger_service.dart:362` reads `notification_preferences` JSONB column — **this column doesn't exist** in the SQL migration (which uses individual boolean columns). Preferences always fall back to defaults.
- SQL has `notify_subscription_expiry` column but Dart `NotificationPreferenceType` enum lacks `subscription`
- Dart has `geofence` in enum but SQL has no `notify_geofence_alerts` column
- `notification_types.dart:13` — `subscriptionExpiry` defined but no trigger method exists
- No `paymentVerified` or `paymentConfirmed` notification type

### Edge Functions Architecture

- Only one Edge Function exists: `supabase/functions/convert-stamp/index.ts` (image→SVG)
- Pattern: `Deno.serve()` + CORS headers + direct HTTP calls (no Supabase client)
- New functions needed:
  - `payment-sms-webhook` — receives bank SMS from forwarding service, parses code, auto-verifies
  - `payment-notification` — sends FCM push after verification (internal trigger)
  - Both need Supabase client with `SUPABASE_SERVICE_ROLE_KEY` for RLS bypass on `user_devices`

### Environment Variables — Current vs Needed

**Current** (`.env.production`): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`

**Needed for server-side push**:
- `FIREBASE_PROJECT_ID` — Firebase project identifier
- `FIREBASE_CLIENT_EMAIL` — Service account email
- `FIREBASE_PRIVATE_KEY` — Service account key

**Needed for SMS gateway**:
- `SMS_WEBHOOK_SECRET` — HMAC secret for validating incoming webhooks
- `SMS_FORWARDER_API_KEY` — API key for the forwarding service

## Code References

- `lib/src/features/payments/data/payment_service.dart:20-32` — TG-XXXX-XXXX code generation
- `lib/src/features/payments/data/payment_service.dart:43-66` — createPaymentRequest()
- `lib/src/features/payments/data/admin_verification.dart:47-70` — verifyPayment() admin call
- `supabase/migrations/005_payment_system.sql:72-136` — verify_payment() RPC
- `supabase/migrations/005_payment_system.sql:24` — code UNIQUE constraint
- `supabase/migrations/005_payment_system.sql:39-40` — idx_payment_requests_code index
- `lib/src/features/auth/data/supabase_auth_repository.dart:116-129` — signInWithPhone()
- `lib/src/features/auth/data/supabase_auth_repository.dart:133-156` — verifyPhoneOtp()
- `lib/src/features/auth/application/auth_providers.dart:77-91` — AuthStateNotifier phone methods
- `lib/src/features/auth/domain/auth_state.dart:31-38` — AuthState.loading()
- `lib/src/features/auth/presentation/login_screen.dart:83-145` — LoginScreen (email-only)
- `lib/src/core/services/notification_trigger_service.dart:331-351` — _sendNotification() (no-op FCM)
- `lib/src/core/services/notification_trigger_service.dart:403-409` — Provider wiring gap
- `lib/src/core/services/notification_service.dart:10-72` — NotificationService (token mgmt only)
- `lib/src/core/services/notification_service.dart:140-164` — Token storage (direct upsert)
- `lib/src/core/services/notification_service.dart:192-214` — removeToken() (never called)
- `lib/src/core/services/notification_types.dart:5-15` — NotificationType enum
- `lib/src/core/domain/notification_preferences.dart:31-38` — isTypeEnabled() exhaustive switch
- `supabase/migrations/008_notifications.sql:7-26` — user_devices table
- `supabase/migrations/008_notifications.sql:72-84` — preference columns
- `supabase/migrations/008_notifications.sql:145-196` — update_notification_preferences() RPC
- `supabase/functions/convert-stamp/index.ts` — Only Edge Function (template)
- `lib/src/app/app_config.dart:2-9` — AppConfig (3 env vars)
- `docs/finance.md:245` — "QPay + SocialPay for subscriptions" (docs only, no code)
- `docs/sprint-plan.md:63` — QPay deferred, manual check

## Integration Points

### Inbound References
- `payment_screen.dart:135` — User initiates payment request creation
- `admin_verification.dart:47` — Admin triggers manual verification
- `login_screen.dart:83` — User authenticates (email-only, no phone)
- `notification_trigger_service.dart:49-304` — Trigger checks for health/breeding/market/geofence

### Outbound Dependencies
- `payment_service.dart:43` → `payment_repository.dart` (interface) → `supabase_payment_repository.dart` (Supabase impl)
- `supabase_auth_repository.dart:123` → Supabase GoTrue → Twilio (SMS delivery)
- `notification_trigger_service.dart:334` → `LocalNotificationService.showNotification()`
- `notification_trigger_service.dart:339-351` → `NotificationService` (no-op for push)
- `notification_service.dart:156` → `user_devices` table (token storage)

### Infrastructure Wiring
- `005_payment_system.sql:72` — verify_payment() RPC (PostgreSQL function)
- `008_notifications.sql:55` — register_device() RPC (never called from Dart)
- `008_notifications.sql:88` — unregister_device() RPC (never called from Dart)
- `supabase/functions/convert-stamp/index.ts` — Only Edge Function

## Architecture Insights

1. **The TG-XXXX-XXXX code pattern is the linchpin** — it connects payment creation, user-facing display, bank transfer remarks, and incoming SMS parsing. Any SMS matching must extract this exact pattern.

2. **The verify_payment() RPC serves dual roles** — admin manual verification AND future auto-verification. Any notification gap fix must happen either inside the RPC (via pg_notify) or outside it (via Edge Function).

3. **The notification pipeline is a one-way street** — it only sends outgoing notifications. Incoming message ingestion (bank SMS, OTP) requires a fundamentally new architectural component: a webhook-receiving Edge Function.

4. **AuthState.loading() is unreachable** — The stream-based auth architecture never emits loading state. Phone OTP UI must manage this state locally, not through the existing AuthStateNotifier stream.

5. **Token lifecycle is broken** — Stale tokens accumulate (refresh doesn't clean old), removeToken() is never called on sign-out, and RPCs for device registration are never used from Dart.

6. **SQL/Dart layer mismatch on preferences** — The `_getPreferences()` method reads a non-existent JSONB column, causing all preference checks to fall back to defaults. This is a functional bug that affects all notification gating.

## Precedents & Lessons

4 similar past changes analyzed.

### Precedent: Payment System Foundation
**Commit(s)**: `42436c0` — "backup" (2026-06-05)
**Blast radius**: 10 files across 4 layers
  - payments/data/ — payment_service.dart, admin_verification.dart, payment_repository.dart, supabase_payment_repository.dart
  - payments/domain/ — payment_request.dart (SubscriptionTier, PaymentStatus, PaymentRequest)
  - payments/application/ — payment_providers.dart
  - payments/presentation/ — payment_screen.dart, payment_status.dart
  - migrations/ — 005_payment_system.sql

**Follow-up fixes**: None in git history.

**Lessons from docs**:
- .rpiv/artifacts/research/2026-06-05_20-43-26_marketplace-revenue.md — `isFeatured` was a dead feature added in migration but never wired. Avoid half-implementing features.

**Takeaway**: The payment system was built entirely around manual admin verification — SMS parsing would be greenfield.

### Precedent: Auth System (Email-Only)
**Commit(s)**: `42436c0` — "backup" (2026-06-05)
**Blast radius**: 8 files across 3 layers
  - auth/data/ — auth_repository.dart, supabase_auth_repository.dart
  - auth/application/ — auth_providers.dart
  - auth/presentation/ — login_screen.dart, register_screen.dart, auth_prompt_page.dart

**Lessons from docs**:
- docs/sprint-plan.md:34 — Auth is "Anonymous only, no phone OTP, no multi-provider"
- docs/product.md:82 — "Phone auth (OTP) | Phase 1 | 🔴 Critical"

**Takeaway**: Phone OTP is #1 planned but unbuilt critical feature.

### Precedent: Notification Infrastructure
**Commit(s)**: `42436c0` — "backup" (2026-06-05)
**Blast radius**: 6 files across 3 layers
  - core/services/ — notification_service.dart, local_notification_service.dart, notification_trigger_service.dart, notification_types.dart
  - migrations/ — 008_notifications.sql

**Takeaway**: Notification system is outgoing-only — no incoming message ingestion.

### Precedent: Boost/Revenue Extension
**Commit(s)**: `5015242` — "backup" (2026-06-06)
**Blast radius**: 6 files across 2 layers
  - Added PaymentType enum (subscription, listingBoost, sellerBadge)

**Lessons from docs**:
- .rpiv/artifacts/plans/2026-06-05_22-48-12_marketplace-revenue.md — Manual field copying causes silent data loss when new fields are added.

**Takeaway**: When extending domain models, update ALL copyWith/fromJson/toJson/toSupabaseJson locations.

### Composite Lessons
- No real-time bank integration exists — incoming SMS parsing is greenfield (`42436c0`)
- Phone OTP is #1 unbuilt critical feature — sprint plan already specifies architecture (A1-A10)
- Notification system is outgoing-only — Edge Functions are the only reasonable ingress for incoming webhooks
- Manual field copying causes silent data loss — track all serialization locations when extending models (`5015242`)
- All infrastructure was dumped in one commit — need incremental commits going forward
- Edge Functions infrastructure is minimal — only convert-stamp exists as pattern reference

## Historical Context (from `.rpiv/artifacts/`)
- `.rpiv/artifacts/research/2026-06-05_20-43-26_marketplace-revenue.md` — Marketplace monetization research (isFeatured dead feature lesson)
- `.rpiv/artifacts/plans/2026-06-05_22-48-12_marketplace-revenue.md` — Marketplace revenue implementation plan (field copying lesson)
- `.rpiv/artifacts/discover/2026-06-06_17-39-27_launch-gap-closure.md` — Launch gap closure FRD (QPay excluded, notifications separate)

## Developer Context
**Q (SMS receiving approach): Which SMS receiving approach should we architect for incoming payment messages from Khanbank?**
A: Android SMS forwarding for MVP + GSM gateway for production. Flexible architecture supporting both.

**Q (OTP delivery): For phone OTP delivery to +976 numbers, which SMS provider?**
A: Supabase/Twilio — most cost-efficient. Already wired in code at supabase_auth_repository.dart:123. Configure Twilio in Supabase dashboard.

**Q (Build order): What's the build order for phone OTP + payment SMS receiving?**
A: Shared infrastructure first (Edge Functions, webhook handling), then both features on top.

## Related Research
- `.rpiv/artifacts/research/2026-06-05_20-43-26_marketplace-revenue.md` — Marketplace revenue

## Open Questions
- What is the exact format of Khan Bank's "Тань дансанд орлого орлоо" SMS? Need sample messages to build the parser regex.
- Does the Supabase project `dgoqhlcqhpabbthamtrj` have Twilio configured for phone auth? (Dashboard check needed)
- What is the `owner_id` column referenced in `005_payment_system.sql:123` and `008_notifications.sql:180`? The `profiles` table schema shows `id` as primary key — is `owner_id` an alias or missing from visible migrations?
- Should the `_getPreferences()` bug (reading non-existent JSONB column) be fixed as part of this work or separately?
