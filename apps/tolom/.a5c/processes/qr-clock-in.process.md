# QR Phone Clock-In — Implementation Process

## Overview
Implement QR-based identity verification for mechanic clock-in/out. Mechanics use their personal phone (mobile website) to scan a QR code shown on the shop tablet, confirming their identity via their own authenticated session.

## Phases

### Phase 1: Database Migration
**Tables:**
- `mechanic_devices` — links a phone device to a mechanic (one device per mechanic, revocable)
- `clock_in_tokens` — short-lived (60s) single-use QR tokens

**RPCs:**
- `generate_clock_token(org_id, action_type)` — returns `{ rawToken, sessionId }`
- `verify_clock_token(raw_token, mechanic_id)` — validates + claims token
- `register_mechanic_device(org_id, registration_token)` — links phone to mechanic

**Output:** Migration file + regenerated types + passing build

### Phase 2: Services + API Routes
**Service (`qr-token-service.ts`):**
- `generateClockToken()` — calls RPC, returns token for QR encoding
- `verifyAndClaimClockToken()` — validates QR scan
- `registerDevice()` — links phone after registration scan
- `getRegisteredDevices()` / `revokeDevice()` — admin management

**API Routes (5):**
- `POST /clock/qr` — generate QR token for clock-in/out
- `POST /clock/verify` — phone calls this after scanning QR
- `POST /clock/register-device` — phone registration
- `GET/DELETE /clock/devices` — device management
- `POST /clock/generate-registration` — admin generates registration QR

**Output:** Service file + 5 route files + passing build

### Phase 3: Phone Scanner Page
- `/clock/scan` — mobile web page with camera viewfinder (html5-qrcode)
- Auto-starts camera, decodes QR, shows confirmation
- Fallback: manual token entry
- `use-qr-scanner.ts` hook wrapping html5-qrcode lifecycle
- i18n: full Mongolian + English strings

**Output:** Scanner page + hook + i18n strings + passing build

### Phase 4: Tablet QR Display
- `qr-clock-display.tsx` — modal with animated QR code, 45s auto-refresh
- Realtime subscription: listens for clock-in confirmation
- Integrates into Bay View toolbar and Mechanic Dashboard clock button
- Replaces direct clock-in POST with QR flow

**Output:** QR display component + integration + passing build

### Phase 5: Admin Device Registration
- `device-registration-dialog.tsx` — admin selects mechanic, generates QR
- `/dashboard/organization/devices` — device list with revoke action
- i18n: full Mongolian + English strings

**Output:** Registration dialog + management page + i18n + passing build

### Phase 6: Tests
- QR token service: generation, validation, expiry, replay prevention, registration
- Extended clock-in tests: QR-based flow
- Device registration dialog: renders, generates QR, success state

**Output:** 3 test files + passing tests + passing build + clean lint

## Quality Gates
- Every phase has a build check (`npm run build`)
- Phase 6 has full test suite + lint
- Final gate: build + lint + all tests

## Breakpoints
- User approves each phase before it starts
- Build failures auto-trigger a fix loop
- Test failures auto-trigger a fix loop
