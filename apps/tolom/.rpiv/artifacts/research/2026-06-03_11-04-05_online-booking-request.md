---
date: 2026-06-03T11:04:05+0800
author: Temuulen Undrakhbayar
commit: 185264e
branch: main
repository: tolom
topic: "Online Booking Request"
tags: [research, codebase, appointments, portal, booking, email]
status: complete
last_updated: 2026-06-03T11:04:05+0800
last_updated_by: Temuulen Undrakhbayar
---

# Research: Online Booking Request

## Research Question
Extend the existing appointments system — add a `requested` status, a `booking_token` column to the organizations table, a public Next.js route at `app/booking/[token]/page.tsx`, reuse Nodemailer for shop notifications, and add a "Book a Service" portal page.

## Summary
The existing appointments system has full CRUD (`appointment-service.ts`) but all functions require authenticated staff users via `getOrgId()` (`appointment-service.ts:14-20`). The public booking endpoint is a fundamentally new architecture: it uses a `service_role` Supabase client to bypass RLS (following the invoice PDF pattern at `src/app/api/invoice/public/[token]/pdf/route.ts:17-24`), resolves the org from a `booking_token` on the `organizations` table, and orchestrates customer-lookup-or-create, vehicle-lookup-or-create, and appointment-insert in sequence. No existing handler wrapper (`createRouteHandler`, `createSimpleRouteHandler`, `createPortalRouteHandler`) supports truly anonymous access. A new `createPublicBookingHandler` wrapper is needed. The `appointments` table's `created_by` FK constraint references `auth.users(id)` — a system/bot user will serve as the creator. The `appointments` CHECK constraint needs `requested` added via migration. The `organization_settings` table needs a `notification_email` column for shop notifications.

## Detailed Findings

### Auth/Infrastructure — Truly Anonymous Endpoint Required

- `createRouteHandler` (`src/lib/api-handler.ts:26-64`) requires auth + org membership — cannot be used.
- `createSimpleRouteHandler` (`src/lib/api-handler.ts:66-86`) still calls `supabase.auth.getUser()` and throws `UnauthorizedError` at line 77 if no user — NOT truly public.
- `createPortalRouteHandler` (`src/lib/portal-auth.ts:56-108`) requires either Bearer portal_token or Supabase session — still requires authentication.
- The truly public invoice PDF route (`src/app/api/invoice/public/[token]/pdf/route.ts:17-24`) uses `createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)` — this is the only existing pattern for unauthenticated writes. **Confirmed**: the new booking endpoint will follow this pattern with a new `createPublicBookingHandler` wrapper.
- Rate limiting: `authRateLimiter` (5 req/60s) is too restrictive for a booking form. `mutationRateLimiter` (60 req/60s, `rate-limit.ts:56`) is appropriate for a mutation endpoint.
- The `bookingRateLimiter` in `rate-limit.ts` is in-memory (`store = new Map()`) — resets on server restart. Use a custom 10 req/min limiter for the booking endpoint.

### Appointment Service — Auth Gates to Bypass

- `getOrgId()` (`appointment-service.ts:14-20`): calls `supabase.auth.getUser()` then `supabase.rpc("get_user_organization_id")`. Cannot be called from the public handler. Replacement: resolve `orgId` from the `booking_token` lookup.
- `createAppointment` (`appointment-service.ts:162-192`): hardcodes `getOrgId()` at line 175 and `user.id` at line 186 (`created_by`, `updated_by`). **Cannot be reused**. Solution: direct `supabase.from("appointments").insert()` with org ID from token lookup, status explicitly set to `'requested'`, `created_by` set to the system/bot user ID.
- `updateAppointment` (`appointment-service.ts:215-244`): also uses `getOrgId()` — cannot be reused for public flow.

### Customer Service — Duplicate Handling

- `createCustomer` (`customer-service.ts:134-180`): requires `orgId`, `params`, `userId`. Only validates name/phone as non-empty.
- **Duplicate phone check** (`customer-service.ts:147-162`): queries existing customer by phone, logs `console.warn` if found, but **continues to insert a duplicate**. The booking orchestration must look up the customer by phone first and reuse the existing record.
- **Solution**: Before calling `createCustomer`, query `customers` by `organization_id` + `phone`. If found, use existing `customer_id`. If not found, call `createCustomer` with the system/bot user ID.

### Vehicle Service — Duplicate Handling

- `createVehicle` (`vehicle-service.ts:130-160`): requires `db`, `orgId`, `params`, `userId`. Make/model both validated as required — pass `"Unknown"` for both.
- **Duplicate plate check** (`vehicle-service.ts:150-158`): queries existing vehicle by plate, and **throws `ConflictError`** if found. The booking orchestration must catch this and use the existing vehicle.
- **Solution**: Before calling `createVehicle`, query `vehicles` by `organization_id` + `plate_number`. If found, use existing `vehicle_id`. If not found, call `createVehicle`.

### Database Schema — Changes Required

1. **Appointments CHECK constraint** (`supabase/migrations/20260601000002_add_appointments_and_estimates.sql:20`): Add `'requested'` to the status list.
2. **`booking_token` on organizations**: Add column `booking_token uuid default gen_random_uuid()` with partial unique index (`WHERE booking_token IS NOT NULL AND deleted_at IS NULL`). Follows `customers.portal_token` pattern (`20260518000003_customer_portal.sql:8`).
3. **`notification_email` on organization_settings**: Add column `notification_email text`. Falls back to main `branches.email` if null.
4. **Make `created_by` nullable** on appointments, OR create a system/bot auth user. **Confirmed**: system/bot user approach.
5. **Type regeneration**: `src/lib/types/core.ts:24-31` — add `"requested"` to `AppointmentStatus` union. Run `supabase gen types typescript --linked > src/lib/database.types.ts` after migration.

### Email Notification — Gap Analysis

- `sendEmail` (`email-service.ts:39-57`): accepts `to`, `subject`, `html`, `from`. No `bcc` support.
- `sendInvoiceEmail` (`email-service.ts:348-362`): has a **bug** — `bccEmail` is destructured from params at line 351 but never forwarded to `sendEmail()` at lines 356-361.
- **Shop email source** (invoice pattern at `invoice-service.ts:606-619`): queries `branches.email` where `is_main=true`. The booking notification will use the new `notification_email` column on `organization_settings`, falling back to main branch email.
- **Pattern for non-blocking email** (`service-reminder-service.ts:434-447`): try/catch with `console.error` on failure. Email send must never block the booking response.

### Portal Integration

- **NAV_ITEMS** (`portal/layout.tsx:20-38`): hardcoded array of 5 portal nav items (dashboard, vehicles, work orders, invoices, settings). A 6th entry `{ href: "/portal/booking", labelKey: "portal.bookService", icon: CalendarPlus }` must be added.
- **Portal auth** (`use-portal-auth.ts`): returns `customer` with `first_name`, `phone`, `organization_id`. The portal booking page can pre-fill the form from this data.
- **Portal API auth** (`portal-auth.ts:30-50`): `authenticatePortalRequest` supports Bearer token OR Supabase session. `createPortalRouteHandler` wraps with auth + rate limiting.
- **Portal booking endpoint**: Cannot reuse `createAppointment` directly (still uses `getOrgId()`). Must either use a direct `supabase.from("appointments").insert()` with `customer.organization_id`, or create a new `createPortalAppointment` service function.
- **Type mismatch**: `CustomerPortalData` (`database-extras.types.ts:82-93`) is a subset of the `Customer` type. Portal booking form may need to fetch full customer record for pre-fill.

### Public Booking Form Component

- **`AppointmentForm`** (`appointment-form.tsx`): requires `orgId`, uses `CustomerSelect` + `VehicleSelect` (both require pre-existing data). **Cannot be used** for public booking.
- **`CustomerSelect`** (`customer-select.tsx`): requires `orgId`, returns full `Customer` object. Cannot be used.
- **`VehicleSelect`** (`vehicle-select.tsx`): requires `orgId` + `customerId`. Cannot be used.
- **Solution**: Build a new `BookingRequestForm` component with simple text inputs (name, phone, plate) + optional date/time picker + notes textarea. This mirrors the FRD decision of "Full: name + phone + vehicle plate + notes."
- **Portal booking form**: Can either reuse `AppointmentForm` with pre-selected customer/vehicle, or use `BookingRequestForm` with pre-filled text fields. Using a simplified variant is recommended.

### Dashboard UI Changes

- **Status filter** (`appointments/page.tsx:90-96`): hardcoded object `{ scheduled: "", checked_in: "", ... }` — must add `requested: ""`.
- **Status dropdown** (`appointments/page.tsx:193-199`): same hardcoded object — must add `requested: ""`.
- **Visual distinction**: `requested` appointments should have a distinct color (amber badge) and Accept/Decline action buttons.
- **i18n keys**: Add `"status_requested"` to both `en.json` and `mn.json`.

### Middleware Bypass Required

- **Two previous commits** (`ba86bbb`, `fe728e4`) added `/invoice/` to proxy.ts after it was forgotten. The `/booking/` route will need the same treatment.
- Must add `/booking` to middleware bypass in `proxy.ts` and public route detection in `src/lib/supabase/middleware.ts`.

## Code References

- `src/app/api/invoice/public/[token]/pdf/route.ts:17-24` — Pattern: service_role client for unauthenticated Supabase access
- `src/app/invoice/[token]/page.tsx` — Pattern: public token-based page (client component, fetch on mount)
- `src/lib/api-handler.ts:26-86` — All existing handler wrappers require auth
- `src/lib/services/appointment-service.ts:14-20` — `getOrgId()` — auth gate that booking flow must bypass
- `src/lib/services/appointment-service.ts:162-192` — `createAppointment()` — hardcodes auth, not reusable
- `src/lib/services/customer-service.ts:147-162` — Duplicate phone: warns but creates duplicate
- `src/lib/services/vehicle-service.ts:150-158` — Duplicate plate: throws ConflictError
- `src/lib/services/email-service.ts:39-57` — `sendEmail()` — no BCC support
- `src/lib/services/email-service.ts:348-362` — `sendInvoiceEmail()` — bccEmail bug (never forwarded)
- `src/lib/rate-limit.ts:10-82` — In-memory rate limiter with named presets
- `src/lib/portal-auth.ts:30-50` — `authenticatePortalRequest()` — two auth paths
- `src/hooks/use-portal-auth.ts:19-43` — Portal auth hook returning `CustomerPortalData`
- `src/app/[locale]/portal/layout.tsx:20-38` — NAV_ITEMS — add 6th entry for booking
- `src/lib/database-extras.types.ts:82-93` — `CustomerPortalData` type
- `src/lib/types/core.ts:24-31` — `AppointmentStatus` union — add `"requested"`
- `supabase/migrations/20260601000002_add_appointments_and_estimates.sql:20` — CHECK constraint to modify
- `supabase/migrations/20260518000003_customer_portal.sql:8` — portal_token pattern to follow
- `src/lib/services/invoice-service.ts:606-619` — Branch email lookup pattern for shop notifications
- `src/app/[locale]/dashboard/appointments/page.tsx:90-96, 193-199` — Hardcoded status lists to extend
- `src/app/api/portal/vehicles/route.ts` — Portal API route pattern (direct Supabase query, not service call)
- `src/components/work-orders/customer-select.tsx` — Cannot be reused for public booking
- `src/components/work-orders/vehicle-select.tsx` — Cannot be reused for public booking

## Integration Points

### Inbound References (what calls the booking system)
- **Public visitor** → `GET /booking/[token]` → booking form page
- **Public visitor** → `POST /api/booking/[token]` → booking submission endpoint
- **Portal customer** → `GET /portal/booking` → portal booking page
- **Portal customer** → `POST /api/portal/bookings` → portal booking endpoint

### Outbound Dependencies (what the booking system needs)
- `organizations.booking_token` — resolves org from token
- `customers` — lookup-or-create by phone
- `vehicles` — lookup-or-create by plate
- `appointments` — insert with `status='requested'`
- `organization_settings.notification_email` — shop notification target
- `email-service.sendEmail()` — send notification
- `auth.users` — system/bot user for `created_by`

### Infrastructure Wiring
- `proxy.ts` — must add `/booking` bypass
- `src/lib/supabase/middleware.ts` — must add `/booking` to public routes
- `src/app/booking/[token]/page.tsx` — new public page route
- `src/app/booking/[token]/error.tsx` — public page error boundary
- `src/app/booking/[token]/loading.tsx` — public page loading state
- `src/app/booking/[token]/layout.tsx` — public page layout wrapper
- `src/app/api/booking/[token]/route.ts` — new public API route
- `src/app/[locale]/portal/booking/page.tsx` — new portal booking page
- `src/app/api/portal/bookings/route.ts` — new portal booking API

## Architecture Insights

1. **No truly anonymous handler exists** — `createPublicBookingHandler` is a new wrapper needed. It must use `service_role` client (as the invoice PDF already does), apply its own rate limiting, and resolve org from the booking token in the URL rather than from auth.
2. **Customer dedup strategy is critical** — The existing `createCustomer` creates duplicates with a warning. The vehicle service throws `ConflictError` for duplicates. The booking orchestration must explicitly do look-before-create for both.
3. **Public and portal booking use different auth paths** — Public uses `booking_token` with `service_role` client. Portal uses `portal_token`/Supabase session with `authenticatePortalRequest`. They share the same booking form component but wire through completely different API endpoints and auth mechanisms.
4. **The appointments system is only 2 days old** — Committed in `64695ea` (June 1). No bug-fix commits yet. Extending with a new status should be straightforward.

## Precedents & Lessons

8 similar past changes analyzed.

### Precedent: Public token-based invoice pages
**Commit(s)**: `c0284eb` — "fix: resolve react-doctor warnings" (2026-05-19)
**Blast radius**: 8 files across 2 layers
- `src/app/invoice/[token]/page.tsx` — main public page
- `src/app/invoice/[token]/error.tsx`, `layout.tsx`, `loading.tsx` — wrappers

**Follow-up fixes**:
- `ba86bbc` — "fix: resolve middleware routing" (2026-05-21) — Added `/invoice/` bypass to proxy.ts (was 404)
- `fffa584` — "feat(ui): update auth, portal, pricing" (2026-05-22) — Updated invoice page

**Takeaway**: Public token pages need middleware bypass entries AND error/loading/layout wrappers from the start — the invoice page had to add both after the fact.

### Precedent: Portal rate limiting and security hardening
**Commit(s)**: `5fda8c0` — "fix(security): add org membership check, portal rate limiting" (2026-05-27)
**Blast radius**: 3 files across 2 layers
- `src/lib/api-handler.ts`, `src/lib/portal-auth.ts`, `src/app/api/portal/set-password/route.ts`

**Takeaway**: Public booking endpoints MUST have rate limiting from day 1. Follow the `authRateLimiter` pattern (5 req/60s) adapted for booking (10 req/min).

### Precedent: Explicit column selection
**Commit(s)**: `0cd74a2`, `e62f6a7`, `a3194c9` — three separate commits fixing `select(*)` across 50+ files
**Takeaway**: Never use `select(*)` in Supabase queries. All new booking queries must use explicit column lists from the start.

### Composite Lessons
- **Middleware bypass is always forgotten** — `/booking/` needs to be in proxy.ts from the start (`ba86bbc`).
- **Regenerate `database.types.ts` after every migration** — Adding `requested` to the CHECK constraint requires running `supabase gen types typescript --linked > src/lib/database.types.ts`. Skipping this is a recurring build-break (`7f5ef1b`, `a3194c9`).
- **Email failure must never block the booking** — Use try/catch on sendEmail, log the error, show success to the customer. The reminder email pattern at `service-reminder-service.ts:434` demonstrates this.
- **Form validation follows specific patterns** — Use `isValidMongolianPhone` and `isValidMongolianPlate` from `form-validation.ts`, required indicators (`*`), inline error messages, proper `<form>` wrappers (`f27b501`, `0de45f4`).

## Historical Context (from `.rpiv/artifacts/`)
- `.rpiv/artifacts/discover/2026-06-03_10-49-23_online-booking-request.md` — Source FRD with 9 requirements, 7 decisions, all resolved.

## Developer Context

**Q (discover: Primary channel): Which customer communication channel would have the biggest impact for a Mongolian auto shop owner?**
A: Online booking/self-scheduling

**Q (discover: Booking depth): What level of customer interaction should the booking support?**
A: Simple date/time request (customer picks date + optional time, shop confirms)

**Q (discover: Booking entry point): How should customers initiate a booking?**
A: Both — shareable link AND customer portal integration

**Q (discover: Notification flow): How should the shop be notified and the customer get confirmation?**
A: Email notification + manual confirmation by phone call

**Q (discover: Data model): Should booking requests use a separate table or integrate with the existing appointments system?**
A: Reuse appointments table with a new `requested` status

**Q (discover: Form fields): What info should the booking form collect?**
A: Full: name + phone + vehicle plate + notes

**Q (discover: Non-goal — no full calendar): Constraints and non-goals for the feature**
A: Keep it simple — no full calendar/slot management

**Q (api-handler.ts:66-86 — createSimpleRouteHandler requires auth): How should the public booking endpoint handle Supabase client auth?**
A: Use `SUPABASE_SERVICE_ROLE_KEY` (service_role client) — same pattern as invoice PDF at `src/app/api/invoice/public/[token]/pdf/route.ts:17-24`

**Q (appointments table FK on created_by): How to handle the created_by FK when there's no auth user?**
A: Create a system/bot auth user for TOLOM Booking System

**Q (booking_token storage): Single booking link per org or multiple?**
A: Single link — add `booking_token` column to `organizations` table

**Q (notification_email storage): Where should the shop's notification email come from?**
A: New `notification_email` column on `organization_settings`, falling back to main `branches.email`

## Related Research

- `.rpiv/artifacts/discover/2026-06-03_10-49-23_online-booking-request.md` — Source FRD

## Open Questions

None. All decisions were resolved during the interview and developer checkpoint.
