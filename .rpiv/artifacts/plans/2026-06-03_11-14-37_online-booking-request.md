---
date: 2026-06-03T11:14:37+0800
author: Temuulen Undrakhbayar
commit: 185264e
branch: main
repository: tolom
topic: "Online Booking Request"
tags: [plan, bookings, appointments, portal]
status: ready
parent: .rpiv/artifacts/research/2026-06-03_11-04-05_online-booking-request.md
phase_count: 4
unresolved_phase_count: 0
last_updated: 2026-06-03T11:14:37+0800
last_updated_by: Temuulen Undrakhbayar
---

# Online Booking Request — Implementation Plan

## Overview
Add online booking request functionality to TOLOM. Customers can submit appointment requests via a shareable link (no login) or via the customer portal. The shop receives email notification and confirms manually by phone. Reuses the existing appointments table with a new `requested` status. Uses `service_role` Supabase client for the public endpoint (invoice PDF pattern), `createPortalRouteHandler` for portal auth, and Nodemailer for email.

## Requirements
- Customers can submit booking requests via shareable link (name + phone + plate + notes + date)
- Portal customers can pre-filled booking via "Book a Service" page
- Booking creates appointment with `requested` status
- Shop receives email notification on new booking
- Dashboard shows `requested` appointments with visual distinction
- Staff can convert `requested` → `scheduled` or `cancelled` via existing status dropdown
- No real-time calendar, no auto-confirmation, no slot management

## Current State Analysis
- Appointments table exists with 6 statuses (no `requested`)
- All `appointment-service.ts` functions use `getOrgId()` requiring auth — cannot be reused for public flow
- No truly anonymous API handler exists — `createSimpleRouteHandler` still requires auth
- Invoice PDF route at `src/app/api/invoice/public/[token]/pdf/route.ts` uses `service_role` client — the only unauthenticated pattern
- `portal-auth.ts` has `createPortalRouteHandler` for authenticated portal access
- Email service exists (Nodemailer) with sendInvoiceEmail and sendReminderEmail patterns
- No `notification_email` column on `organization_settings`
- No `booking_token` on `organizations`
- Portal layout has hardcoded `NAV_ITEMS` with 5 entries
- Dashboard appointments page hardcodes status filter/dropdown with 6 statuses
- Precedent: invoice page at `app/invoice/[token]/` needed middleware bypass added after initial deploy

### Key Discoveries
- `createSimpleRouteHandler` (`src/lib/api-handler.ts:66-86`) calls `supabase.auth.getUser()` and throws UnauthorizedError — NOT truly public
- Invoice PDF pattern (`src/app/api/invoice/public/[token]/pdf/route.ts:17-24`): `createServiceClient(URL, SERVICE_ROLE_KEY)` is the correct template
- `createCustomer` (`customer-service.ts:147-162`) warns but creates duplicates on phone match — booking orchestration must look before create
- `createVehicle` (`vehicle-service.ts:150-158`) throws `ConflictError` on plate match — booking orchestration must catch and reuse
- `createAppointment` (`appointment-service.ts:162-192`) hardcodes `getOrgId()` and `user.id` — cannot be reused
- Portal API routes do direct `supabase.from(...)` queries, not service calls

## Desired End State
```typescript
// Public booking: customer visits shareable link
// GET /booking/<token> → renders booking form
// POST /api/booking/<token> → { name: "Bold", phone: "+97699119911", plate: "4444УНА", notes: "...", date: "2026-06-10" }
// → returns { success: true, appointmentId: "..." }

// Portal booking: logged-in customer
// GET /portal/booking → pre-filled form
// POST /api/portal/bookings → { vehicle_id: "...", date: "..." }
// → returns { success: true, appointmentId: "..." }

// Email sent to shop: "New booking request from Bold (+97699119911)"
// Appointment shows in dashboard with amber "requested" badge
// Staff changes status to "scheduled" or "cancelled" via dropdown
```

## What We're NOT Doing
- **No real-time bay/mechanic availability calendar** — shop confirms manually
- **No auto-confirmation** — shop calls customer to confirm
- **No Accept/Decline buttons in MVP** — use existing status dropdown
- **No SMS notifications** — email only (SMS infrastructure was removed)
- **No payments during booking**
- **No service selection on booking form** — notes field captures description
- **No `booking_links` table** — single token per org on `organizations` table

## Decisions

### Public handler uses service_role client
Follow the invoice PDF pattern (`src/app/api/invoice/public/[token]/pdf/route.ts:17-24`). Dynamic import `@supabase/supabase-js`, create service_role client with `SUPABASE_SERVICE_ROLE_KEY`, resolve org from `booking_token`.

### System/bot user for created_by
Create a system auth user (INSERT into auth.users + profiles) for the TOLOM Booking System so the `created_by` FK on appointments is satisfied. All booking-created appointments use this user ID.

### booking_token on organizations
Single column `booking_token uuid default gen_random_uuid()` with partial unique index. Follows `customers.portal_token` pattern (`supabase/migrations/20260518000003_customer_portal.sql:8`).

### notification_email on organization_settings
New nullable `notification_email text` column. Falls back to main `branches.email` if null. Shop configures via settings.

### Direct Supabase queries for portal booking
Portal API route uses `createPortalRouteHandler` and direct `supabase.from("appointments").insert()` — follows existing portal API pattern (vehicles, work-orders, invoices all do direct queries).

### New BookingRequestForm component
`AppointmentForm` requires `orgId`, `CustomerSelect`, and `VehicleSelect` — none of which work for the public booking flow. Build a new component with simple text inputs.

## Phase 1: Foundation — Migration + Types + Email

### Overview
Database migration adding `booking_token` to organizations, `notification_email` to organization_settings, `requested` to appointments CHECK constraint, and system/bot auth user. Update TypeScript types. Add `sendBookingRequestEmail` to email service. Depends on: nothing (foundation).

### Changes Required:

#### 1. supabase/migrations/20260603000001_online_booking_request.sql
**File**: supabase/migrations/20260603000001_online_booking_request.sql
**Changes**: NEW — Migration adding booking_token, notification_email, requested status, and system user

```sql
-- Online Booking Request: Foundation migration
-- Adds booking_token to organizations, notification_email to org settings,
-- requested status to appointments, and a system auth user for public bookings.

-- 1. booking_token on organizations (follows portal_token pattern)
alter table organizations
  add column if not exists booking_token uuid default gen_random_uuid();

create unique index if not exists idx_organizations_booking_token
  on organizations(booking_token)
  where booking_token is not null and deleted_at is null;

-- Populate tokens for existing orgs
update organizations
  set booking_token = gen_random_uuid()
  where booking_token is null and deleted_at is null;

-- 2. notification_email on organization_settings
alter table organization_settings
  add column if not exists notification_email text;

-- 3. Add 'requested' to appointments status check constraint
alter table appointments
  drop constraint if exists appointments_status_check;

alter table appointments
  add constraint appointments_status_check
  check (status in ('requested','scheduled','checked_in','in_progress','completed','cancelled','no_show'));

-- 4. Create system auth user for public booking requests
-- Used as created_by/updated_by on appointments created via public booking form
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, confirmation_sent_at, is_super_admin)
select
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'booking@tolom.app',
  '',
  now(),
  '{"full_name":"TOLOM Booking System"}'::jsonb,
  now(),
  now(),
  '',
  now(),
  false
where not exists (
  select 1 from auth.users where id = '00000000-0000-0000-0000-000000000001'
);

-- Also create a profile entry for the system user
insert into public.profiles (id, full_name, role)
select
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TOLOM Booking System',
  'org_owner'
where not exists (
  select 1 from public.profiles where id = '00000000-0000-0000-0000-000000000001'
);
```

#### 2. src/lib/types/core.ts:24-31
**File**: src/lib/types/core.ts
**Changes**: MODIFY — Add `"requested"` to AppointmentStatus union

```typescript
export type AppointmentStatus =
  | "scheduled"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show"
  | "requested";
```

#### 3. src/lib/services/email-service.ts
**File**: src/lib/services/email-service.ts
**Changes**: MODIFY — REPLACE existing `sendBookingRequestEmail` function (lines 448-530) with the Mongolian-localized version below

```typescript
// ── Booking Request Email ───────────────────────────────────────

export interface SendBookingRequestEmailParams {
  to: string;
  customerName: string;
  customerPhone: string;
  vehiclePlate: string;
  notes: string | null;
  requestedDate: string;
  orgName: string;
  dashboardUrl: string;
}

function renderBookingRequestEmailHtml(
  params: SendBookingRequestEmailParams,
): string {
  return `
<!DOCTYPE html>
<html lang="mn">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Шинэ цаг товлох хүсэлт</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
          <tr>
            <td style="background-color:#ffffff;border-radius:12px;padding:40px 32px;text-align:center;">
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">🔧 Шинэ цаг товлох хүсэлт</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">${params.orgName}</p>
              <div style="background-color:#f3f4f6;border-radius:8px;padding:20px;margin-bottom:24px;text-align:left;">
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;">Үйлчлүүлэгч</td>
                    <td style="padding:6px 0;font-weight:600;color:#111827;text-align:right;">${params.customerName}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;">Утас</td>
                    <td style="padding:6px 0;font-weight:600;color:#111827;text-align:right;">${params.customerPhone}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;">Машин</td>
                    <td style="padding:6px 0;font-weight:600;color:#111827;text-align:right;">${params.vehiclePlate}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;">Хүссэн огноо</td>
                    <td style="padding:6px 0;font-weight:600;color:#111827;text-align:right;">${params.requestedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;vertical-align:top;">Тэмдэглэл</td>
                    <td style="padding:6px 0;font-weight:400;color:#374151;text-align:right;font-style:italic;">${params.notes || '—'}</td>
                  </tr>
                </table>
              </div>
              <a href="${params.dashboardUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;">Хүсэлтийг харах</a>
              <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">Энэхүү цаг товлох хүсэлтийг баталгаажуулахын тулд үйлчлүүлэгчтэй холбогдож, тохирох цагийг баталгаажуулна уу.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">${params.orgName} &middot; TOLOM систем</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendBookingRequestEmail(
  params: SendBookingRequestEmailParams,
): Promise<{ id: string }> {
  const html = renderBookingRequestEmailHtml(params);

  const { id } = await sendEmail({
    from: `${params.orgName} <${getFromEmail()}>`,
    to: [params.to],
    subject: `🔧 Шинэ захиалга — ${params.customerName} (${params.vehiclePlate})`,
    html,
  });

  return { id };
}
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript passes: `npm run check`
- [ ] Migration file exists at correct path

#### Manual Verification:
- [ ] Run migration: `npx supabase migration up`
- [ ] Regenerate TypeScript types: `npx supabase gen types typescript --linked > src/lib/database.types.ts`
- [ ] Verify `booking_token` column exists on organizations
- [ ] Verify `notification_email` column exists on organization_settings
- [ ] Verify `requested` is accepted in appointments.status
- [ ] Verify system auth user `00000000-0000-0000-0000-000000000001` exists in auth.users
- [ ] Verify AppointmentStatus union includes `"requested"`

## Phase 2: Public Backend — Handler Wrapper + Booking Service + API Route

### Overview
Create `createPublicBookingHandler` wrapper, booking orchestration service, and the public API route. Depends on: Phase 1 (migration + types).

### Changes Required:

#### 1. src/lib/public-booking-handler.ts
**File**: src/lib/public-booking-handler.ts
**Changes**: NEW — Handler wrapper for truly public (no-auth) booking endpoints

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { mutationRateLimiter } from "@/lib/rate-limit";

interface BookingOrg {
  id: string;
  name: string;
  slug: string | null;
}

export interface BookingContext {
  request: NextRequest;
  org: BookingOrg;
  token: string;
  supabase: SupabaseClient;
}

type BookingHandler = (ctx: BookingContext) => Promise<NextResponse>;

/**
 * Creates a handler wrapper for truly public (no-auth) booking endpoints.
 *
 * 1. Rate limits by IP (60 req/min)
 * 2. Resolves organization from booking_token in the URL
 * 3. Creates a service_role Supabase client for unauthenticated DB access
 * 4. Passes org context and supabase client to the handler
 *
 * Follows the pattern established at
 * `src/app/api/invoice/public/[token]/pdf/route.ts:17-24`.
 *
 * Does NOT call supabase.auth.getUser(). Does NOT require any auth.
 */
export function createPublicBookingHandler(handler: BookingHandler) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    try {
      // 1. Rate limit by IP — mutationRateLimiter (60 req/60s)
      const ip = request.headers.get("x-forwarded-for") ?? "unknown";
      const rateCheck = mutationRateLimiter.check(ip);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          { error: { code: "RATE_LIMITED", message: "Too many requests" } },
          {
            status: 429,
            headers: {
              "Retry-After": String(
                Math.ceil((rateCheck.resetAt - Date.now()) / 1000),
              ),
            },
          },
        );
      }

      // 2. Resolve token from URL params
      const params = await context.params;
      const token = params.token;
      if (!token) {
        return NextResponse.json(
          { error: { code: "BAD_REQUEST", message: "Missing booking token" } },
          { status: 400 },
        );
      }

      // 3. Create service_role client (bypasses RLS — no auth user)
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );

      // 4. Look up organization by booking_token
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .eq("booking_token", token)
        .is("deleted_at", null)
        .single();

      if (orgError || !org) {
        return NextResponse.json(
          {
            error: {
              code: "NOT_FOUND",
              message: "Booking link not found or has been deactivated",
            },
          },
          { status: 404 },
        );
      }

      // 5. Call the actual handler with org context + supabase client
      return await handler({ request, org, token, supabase });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Internal server error";
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message } },
        { status: 500 },
      );
    }
  };
}
```

#### 2. src/lib/services/booking-service.ts
**File**: src/lib/services/booking-service.ts
**Changes**: NEW — Booking orchestration service (lookup-or-create customer/vehicle, create appointment, send email)

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";

// System user used as created_by/updated_by for public booking records
const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001";

// ── Types ───────────────────────────────────────────────────────

export interface BookingRequestParams {
  orgId: string;
  name: string;
  phone: string;
  plate: string;
  notes?: string;
  requestedDate?: string;
}

export interface BookingResult {
  appointmentId: string;
  customerId: string;
  vehicleId: string;
}

// ── Booking Orchestration ───────────────────────────────────────

/**
 * Submits a public booking request:
 * 1. Look up or create customer by phone
 * 2. Look up or create vehicle by plate
 * 3. Create appointment with status='requested'
 * 4. Send notification email (fire-and-forget)
 */
export async function submitBookingRequest(
  supabase: SupabaseClient,
  orgId: string,
  params: BookingRequestParams,
): Promise<BookingResult> {
  // 1. Resolve customer (lookup by phone, create if not found)
  const customer = await resolveCustomer(supabase, orgId, params);

  // 2. Resolve vehicle (lookup by plate, create if not found)
  const vehicle = await resolveVehicle(supabase, orgId, customer.id, params);

  // 3. Create appointment with status='requested'
  const appointment = await createBookingAppointment(
    supabase,
    orgId,
    customer.id,
    vehicle.id,
    params,
  );

  // 4. Send notification email (fire-and-forget — never block the response)
  sendBookingNotification(supabase, orgId, params).catch((err) => {
    console.error("Booking notification email failed:", err);
  });

  return {
    appointmentId: appointment.id,
    customerId: customer.id,
    vehicleId: vehicle.id,
  };
}

// ── Customer Resolution ─────────────────────────────────────────

async function resolveCustomer(
  supabase: SupabaseClient,
  orgId: string,
  params: BookingRequestParams,
) {
  // Look up existing customer by phone
  const { data: existing } = await supabase
    .from("customers")
    .select("id, first_name, last_name, phone")
    .eq("organization_id", orgId)
    .eq("phone", params.phone)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) return existing;

  // Create new customer
  const { data: newCustomer, error } = await supabase
    .from("customers")
    .insert({
      organization_id: orgId,
      type: "individual",
      first_name: params.name,
      phone: params.phone,
      source: "booking",
      created_by: SYSTEM_USER_ID,
      updated_by: SYSTEM_USER_ID,
    })
    .select("id, first_name, last_name, phone")
    .single();

  if (error) throw new Error(`Failed to create customer: ${error.message}`);
  return newCustomer;
}

// ── Vehicle Resolution ──────────────────────────────────────────

async function resolveVehicle(
  supabase: SupabaseClient,
  orgId: string,
  customerId: string,
  params: BookingRequestParams,
) {
  // Look up existing vehicle by plate
  const { data: existing } = await supabase
    .from("vehicles")
    .select("id, plate_number")
    .eq("organization_id", orgId)
    .eq("plate_number", params.plate)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) return existing;

  // Create new vehicle with "Unknown" make/model
  const { data: newVehicle, error } = await supabase
    .from("vehicles")
    .insert({
      organization_id: orgId,
      plate_number: params.plate,
      make: "Unknown",
      model: "Unknown",
      created_by: SYSTEM_USER_ID,
      updated_by: SYSTEM_USER_ID,
    })
    .select("id, plate_number")
    .single();

  if (error) throw new Error(`Failed to create vehicle: ${error.message}`);

  // Link vehicle to customer (non-fatal if fails)
  const { error: ownerError } = await supabase
    .from("vehicle_owners")
    .insert({
      organization_id: orgId,
      vehicle_id: newVehicle.id,
      customer_id: customerId,
      is_primary: true,
      created_by: SYSTEM_USER_ID,
    });

  if (ownerError) {
    console.error("Failed to link vehicle to customer:", ownerError);
  }

  return newVehicle;
}

// ── Appointment Creation ────────────────────────────────────────

async function createBookingAppointment(
  supabase: SupabaseClient,
  orgId: string,
  customerId: string,
  vehicleId: string,
  params: BookingRequestParams,
) {
  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      organization_id: orgId,
      customer_id: customerId,
      vehicle_id: vehicleId,
      title: `Online booking request from ${params.name}`,
      description: params.notes?.trim() ?? null,
      scheduled_at: params.requestedDate ?? new Date().toISOString(),
      status: "requested",
      created_by: SYSTEM_USER_ID,
      updated_by: SYSTEM_USER_ID,
    })
    .select("id")
    .single();

  if (error)
    throw new Error(`Failed to create appointment: ${error.message}`);
  return appointment;
}

// ── Email Notification ──────────────────────────────────────────

async function sendBookingNotification(
  supabase: SupabaseClient,
  orgId: string,
  params: BookingRequestParams,
) {
  // Fetch org name, notification_email, and branch email fallback
  const [{ data: org }, { data: settings }, { data: branch }] =
    await Promise.all([
      supabase.from("organizations").select("name").eq("id", orgId).single(),
      supabase
        .from("organization_settings")
        .select("notification_email")
        .eq("organization_id", orgId)
        .single(),
      supabase
        .from("branches")
        .select("email")
        .eq("organization_id", orgId)
        .eq("is_main", true)
        .maybeSingle(),
    ]);

  const orgName = org?.name ?? "Your Shop";
  const notificationEmail =
    settings?.notification_email ?? branch?.email ?? null;

  if (!notificationEmail) {
    console.warn(
      `No notification email configured for org ${orgId} — booking created without notification`,
    );
    return;
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://tolom.app";
  const dashboardUrl = `${siteUrl}/dashboard/appointments`;

  // Dynamic import to avoid circular dependency
  const { sendBookingRequestEmail } = await import(
    "@/lib/services/email-service"
  );

  await sendBookingRequestEmail({
    to: notificationEmail,
    customerName: params.name,
    customerPhone: params.phone,
    vehiclePlate: params.plate,
    notes: params.notes ?? null,
    requestedDate: params.requestedDate ?? "As soon as possible",
    orgName,
    dashboardUrl,
  });
}
```

#### 3. src/app/api/booking/[token]/route.ts
**File**: src/app/api/booking/[token]/route.ts
**Changes**: NEW — Public POST endpoint for booking submissions

```typescript
import { NextResponse } from "next/server";
import { createPublicBookingHandler } from "@/lib/public-booking-handler";
import { submitBookingRequest } from "@/lib/services/booking-service";

/**
 * POST /api/booking/[token]
 *
 * Public endpoint for submitting a booking request.
 * No authentication required — org resolved from the booking_token URL param.
 *
 * Body: { name, phone, plate, notes?, requestedDate? }
 */
export const POST = createPublicBookingHandler(
  async ({ request, org, supabase }) => {
    const body = await request.json();

    // ── Validation ─────────────────────────────────────────────
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "Name is required" } },
        { status: 400 },
      );
    }
    if (!body.phone?.trim()) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "Phone number is required" } },
        { status: 400 },
      );
    }
    if (!body.plate?.trim()) {
      return NextResponse.json(
        {
          error: { code: "VALIDATION", message: "Vehicle plate is required" },
        },
        { status: 400 },
      );
    }

    // ── Submit booking ──────────────────────────────────────────
    const result = await submitBookingRequest(supabase, org.id, {
      orgId: org.id,
      name: body.name.trim(),
      phone: body.phone.trim(),
      plate: body.plate.trim(),
      notes: body.notes?.trim(),
      requestedDate: body.requestedDate,
    });

    return NextResponse.json(
      {
        data: {
          id: result.appointmentId,
          message:
            "Booking request submitted. The shop will contact you to confirm.",
        },
      },
      { status: 201 },
    );
  },
);
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript passes: `npm run check`

#### Manual Verification:
- [ ] `createPublicBookingHandler` returns 404 for invalid booking_token
- [ ] `createPublicBookingHandler` returns 429 for rate-limited requests
- [ ] POST to `/api/booking/<token>` with valid body creates appointment with status='requested'
- [ ] POST with new phone creates a new customer record
- [ ] POST with existing phone reuses existing customer
- [ ] POST with new plate creates new vehicle
- [ ] POST with existing plate reuses existing vehicle
- [ ] Email sent to notification_email when configured
- [ ] Booking succeeds even when email send fails (fire-and-forget)
- [ ] Response returned with 201 status and appointment ID

## Phase 3: Public UI — Booking Form Page + Component

### Overview
Public booking form page at `app/booking/[token]/` with form component, error/loading/layout wrappers. Depends on: Phase 2 (handler + service).

### Changes Required:

#### 1. src/app/booking/[token]/page.tsx
**File**: src/app/booking/[token]/page.tsx
**Changes**: NEW — Public booking form page

```tsx
"use client";

import { Car } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { BookingRequestForm } from "@/components/booking/booking-request-form";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

function BookingSuccess({ message }: { message?: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center p-8">
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-5 py-16">
          <div className="flex size-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/20">
            <Car className="size-8 text-green-400" />
          </div>
          <div className="text-center">
            <Typography.H2 className="text-lg font-semibold">
              Booking Request Sent!
            </Typography.H2>
            <Typography.Muted className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              {message ||
                "The shop will contact you shortly to confirm your appointment."}
            </Typography.Muted>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BookingPage() {
  const params = useParams();
  const token = params.token as string;

  const [pageState, setPageState] = useState<"form" | "submitted">("form");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setPageState("submitted");
  };

  if (pageState === "submitted") {
    return <BookingSuccess message={successMessage ?? undefined} />;
  }

  return (
    <div className="mx-auto max-w-lg p-4 md:p-8">
      <div className="mb-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 mb-4">
          <Car className="size-6 text-primary" />
        </div>
        <Typography.H1 className="text-xl font-semibold">
          Book a Service
        </Typography.H1>
        <Typography.Muted className="text-sm text-muted-foreground mt-1">
          Fill out the form below and the shop will contact you to confirm.
        </Typography.Muted>
      </div>

      <BookingRequestForm token={token} onSuccess={handleSuccess} />
    </div>
  );
}
```

#### 2. src/app/booking/[token]/error.tsx
**File**: src/app/booking/[token]/error.tsx
**Changes**: NEW — Error boundary for booking page

```tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Booking page error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center flex flex-col gap-4">
        <Typography.H2 className="text-2xl font-semibold text-destructive">
          Something went wrong!
        </Typography.H2>
        <Typography.Muted className="text-muted-foreground">
          An unexpected error occurred. Please try again.
        </Typography.Muted>
        <Button onClick={() => reset()} variant="default">
          Try Again
        </Button>
      </div>
    </div>
  );
}
```

#### 3. src/app/booking/[token]/loading.tsx
**File**: src/app/booking/[token]/loading.tsx
**Changes**: NEW — Loading skeleton for booking page

```tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin size-8 rounded-full border-b-2 border-primary" />
    </div>
  );
}
```

#### 4. src/app/booking/[token]/layout.tsx
**File**: src/app/booking/[token]/layout.tsx
**Changes**: NEW — Layout wrapper for booking page

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Service | TOLOM",
  description:
    "Request an appointment with your trusted auto service shop.",
};

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

#### 5. src/components/booking/booking-request-form.tsx
**File**: src/components/booking/booking-request-form.tsx
**Changes**: NEW — Booking request form component (name, phone, plate, notes, date)

```tsx
"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";

interface BookingRequestFormProps {
  token: string;
  onSuccess: (message: string) => void;
  apiEndpoint?: string;
  initialName?: string;
  initialPhone?: string;
}

export function BookingRequestForm({
  token,
  onSuccess,
  apiEndpoint,
  initialName,
  initialPhone,
}: BookingRequestFormProps) {
  const [name, setName] = useState(initialName ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [plate, setPlate] = useState("");
  const [notes, setNotes] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else {
      const normalized = phone.trim().replace(/[\s-]/g, "");
      if (!/^\+976\d{8}$/.test(normalized)) {
        newErrors.phone =
          "Enter a valid Mongolian phone number (e.g. +976 9911 9911)";
      }
    }
    if (!plate.trim()) {
      newErrors.plate = "Vehicle plate is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSending(true);
    try {
      const endpoint = apiEndpoint ?? `/api/booking/${token}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          plate: plate.trim(),
          notes: notes.trim() || undefined,
          requestedDate: requestedDate || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrors({
          submit:
            json.error?.message ?? "Failed to submit. Please try again.",
        });
        return;
      }

      onSuccess(
        json.data?.message ??
          "Booking request submitted. The shop will contact you to confirm.",
      );
    } catch {
      setErrors({ submit: "Network error. Please check your connection." });
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card className="border-border">
        <CardContent className="p-6 flex flex-col gap-4">
          <Field>
            <FieldLabel>
              Name <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
              {errors.name && <FieldError>{errors.name}</FieldError>}
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>
              Phone <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +976 9911 9911"
                type="tel"
              />
              {errors.phone && <FieldError>{errors.phone}</FieldError>}
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>
              Vehicle Plate <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Input
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="e.g. 4444УНА"
              />
              {errors.plate && <FieldError>{errors.plate}</FieldError>}
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Preferred Date</FieldLabel>
            <FieldContent>
              <Input
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Notes</FieldLabel>
            <FieldContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe what service is needed (optional)"
                rows={3}
              />
            </FieldContent>
          </Field>

          {errors.submit && (
            <Typography.Muted className="text-xs text-destructive text-center">
              {errors.submit}
            </Typography.Muted>
          )}

          <Button type="submit" disabled={sending} className="w-full">
            {sending && <Loader2 className="size-4 animate-spin mr-2" />}
            {sending ? "Submitting..." : "Request Appointment"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript passes: `npm run check`

#### Manual Verification:
- [ ] Visit `/booking/<valid-token>` — page renders form, does not redirect to login
- [ ] Visit `/booking/<invalid-token>` — shows error state, not login
- [ ] Submit valid form → 201 response, shows success message
- [ ] Submit with missing fields → inline validation errors shown
- [ ] Mobile-responsive: form stacks properly on small screens
- [ ] Submit with existing phone/plate → reuses customer/vehicle (no duplicates)
- [ ] Error boundary at `/booking/<token>/error` shows "Try Again" button
- [ ] Loading skeleton renders while page initializes

## Phase 4: Portal + Dashboard + Middleware

### Overview
Add "Book a Service" to portal NAV_ITEMS, portal booking page and API, dashboard appointments status filter + i18n keys, middleware bypass. Depends on: Phase 1 (types). Can run in parallel with Phases 2-3.

### Changes Required:

#### 1. src/app/[locale]/portal/layout.tsx
**File**: src/app/[locale]/portal/layout.tsx
**Changes**: MODIFY — Add 6th NAV_ITEMS entry for booking. Import `CalendarPlus` from lucide-react and add entry after vehicles.

```typescript
// Add to the import at the top of the file:
// import { CalendarPlus, Car, ClipboardList, FileText, LogOut, Settings, Wrench } from "lucide-react";

// Add to NAV_ITEMS array (after vehicles entry):
  { href: "/portal/booking", labelKey: "portal.bookService", icon: CalendarPlus },
```

#### 2. src/app/[locale]/portal/booking/page.tsx
**File**: src/app/[locale]/portal/booking/page.tsx
**Changes**: NEW — Portal booking page

```tsx
"use client";

import { Car } from "lucide-react";
import { useState } from "react";
import { BookingRequestForm } from "@/components/booking/booking-request-form";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { usePortalAuth } from "@/hooks/use-portal-auth";

function PortalBookingSuccess() {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-lg items-center justify-center p-8">
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-5 py-16">
          <div className="flex size-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/20">
            <Car className="size-8 text-green-400" />
          </div>
          <div className="text-center">
            <Typography.H2 className="text-lg font-semibold">
              Booking Request Sent!
            </Typography.H2>
            <Typography.Muted className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              The shop will contact you to confirm your appointment.
            </Typography.Muted>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PortalBookingPage() {
  const { customer, loading } = usePortalAuth();
  const [submitted, setSubmitted] = useState(false);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg p-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (submitted) {
    return <PortalBookingSuccess />;
  }

  return (
    <div className="mx-auto max-w-lg p-4">
      <Typography.H1 className="text-xl font-semibold mb-6">
        Book a Service
      </Typography.H1>
      <Typography.Muted className="text-sm text-muted-foreground mb-6">
        Request an appointment and we will contact you to confirm.
      </Typography.Muted>
      <BookingRequestForm
        token=""
        apiEndpoint="/api/portal/bookings"
        initialName={
          customer ? `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() : undefined
        }
        initialPhone={customer?.phone ?? undefined}
        onSuccess={() => setSubmitted(true)}
      />
    </div>
  );
}
```

#### 3. src/app/api/portal/bookings/route.ts
**File**: src/app/api/portal/bookings/route.ts
**Changes**: NEW — Portal booking API endpoint (POST)

```typescript
import { NextResponse } from "next/server";
import { createPortalRouteHandler } from "@/lib/portal-auth";

/**
 * POST /api/portal/bookings
 *
 * Creates a booking request from an authenticated portal customer.
 * The customer is already known — pre-fills from the portal session.
 */
export const POST = createPortalRouteHandler(
  async ({ request, customer, supabase }) => {
    const body = await request.json();

    // Validate
    if (!body.vehicle_id) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION",
            message: "Vehicle is required",
          },
        },
        { status: 400 },
      );
    }

    // Create appointment directly (cannot reuse createAppointment which calls getOrgId())
    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        organization_id: customer.organization_id,
        customer_id: customer.id,
        vehicle_id: body.vehicle_id,
        title: `Online booking request from ${customer.first_name ?? "Customer"}`,
        description: body.notes?.trim() ?? null,
        scheduled_at: body.requestedDate ?? new Date().toISOString(),
        status: "requested",
        created_by: customer.id,
        updated_by: customer.id,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { error: { code: "ERROR", message: "Failed to create booking" } },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        data: {
          id: appointment.id,
          message:
            "Booking request submitted. The shop will contact you to confirm.",
        },
      },
      { status: 201 },
    );
  },
);
```

#### 4. src/app/[locale]/dashboard/appointments/page.tsx
**File**: src/app/[locale]/dashboard/appointments/page.tsx
**Changes**: MODIFY — Add `requested` to status filter/dropdown, amber badge visual distinction

```tsx
// Change 1 — Status filter dropdown (add requested: "" to the inline object):
// Before:
{Object.keys({
  scheduled: "",
  checked_in: "",
  in_progress: "",
  completed: "",
  cancelled: "",
  no_show: "",
}).map((value) => ( ... ))}

// After:
{Object.keys({
  scheduled: "",
  checked_in: "",
  in_progress: "",
  completed: "",
  cancelled: "",
  no_show: "",
  requested: "",
}).map((value) => ( ... ))}

// Change 2 — Per-appointment status dropdown (same addition):
{Object.keys({
  scheduled: "",
  checked_in: "",
  in_progress: "",
  completed: "",
  cancelled: "",
  no_show: "",
  requested: "",
}).map((value) => ( ... ))}

```

#### 5. src/messages/en.json
**File**: src/messages/en.json
**Changes**: MODIFY — Add `status_requested` and `portal.bookService` keys

```json
// In the appointments section (around line 1151, after status_no_show):
"status_requested": "Requested",

// In the portal section (after portal.settings):
"portal.bookService": "Book a Service",
```

#### 6. src/messages/mn.json
**File**: src/messages/mn.json
**Changes**: MODIFY — Add Mongolian translations for `status_requested` and `portal.bookService`

```json
// In the appointments section (after status_no_show):
"status_requested": "Хүсэлт илгээсэн",

// In the portal section (after portal.settings):
"portal.bookService": "Цаг товлох",
```

#### 7. src/proxy.ts
**File**: src/proxy.ts
**Changes**: MODIFY — Add `/booking/` to bypass list

*Note: There is no proxy.ts at HEAD — the middleware bypass is handled in auth-routes.ts + middleware.ts. See Routes 8 and 9.*

```typescript
// If proxy.ts exists, add this to the bypass condition:
// pathname.startsWith("/booking/") ||
```

#### 8. src/lib/supabase/auth-routes.ts
**File**: src/lib/supabase/auth-routes.ts
**Changes**: MODIFY — Add `isBookingRoute` and return, register in RouteMatch

```typescript
// 1. Add to RouteMatch interface (after isInvoiceRoute):
  isBookingRoute: boolean;

// 2. Add to matchRoutes body (after isInvoiceRoute line):
  const isBookingRoute = p.startsWith("/booking/");

// 3. Add to the return object (after isInvoiceRoute):
  isBookingRoute,
```

#### 9. src/lib/supabase/middleware.ts
**File**: src/lib/supabase/middleware.ts
**Changes**: MODIFY — Add `!routes.isBookingRoute` to auth redirect guard

```typescript
// In the middleware guard condition, add after isInvoiceRoute:
  !routes.isBookingRoute &&
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript passes: `npm run check`

#### Manual Verification:
- [ ] Portal navigation shows "Book a Service" entry
- [ ] Portal booking page pre-fills customer name and phone
- [ ] Portal POST to `/api/portal/bookings` creates appointment with `requested` status
- [ ] Dashboard appointments filter includes "Requested" option
- [ ] `status_requested` i18n key renders correctly in both en.json and mn.json
- [ ] Visiting `/booking/<token>` without auth session does NOT redirect to login
- [ ] `auth-routes.ts` returns `isBookingRoute: true` for `/booking/...` paths
- [ ] `middleware.ts` skips auth redirect for `/booking/...` paths

## Ordering Constraints
- Phase 1 must complete before any other phase (migration + types)
- Phases 2 and 4 are independent of each other (both depend on Phase 1 only)
- Phase 3 depends on Phase 2 (needs the handler + service)
- All phases should be executed in numerical order for safety (1→2→3→4)

## Verification Notes
- [ ] Migration must run successfully: `npx supabase migration up`
- [ ] TypeScript types regenerate: `npx supabase gen types typescript --linked > src/lib/database.types.ts`
- [ ] Type check passes: `npm run check`
- [ ] Public booking page renders at `/booking/<org-token>` without auth redirect
- [ ] POST to `/api/booking/<token>` creates appointment with `requested` status
- [ ] Portal booking creates appointment via authenticated session
- [ ] Email sent to shop `notification_email` on successful booking
- [ ] Dashboard appointments filter includes `requested`
- [ ] Middleware bypass doesn't 404 on `/booking/` routes (lesson from `ba86bbb`)

## Performance Considerations
- Rate limiting: 60 req/min per IP via mutationRateLimiter for public booking endpoint
- Email send is non-blocking (fire-and-forget with .catch())
- In-memory rate limiter resets on server restart (acceptable for MVP)
- No heavy queries — booking creates at most 3 records (customer + vehicle + appointment)

## Migration Notes
- `booking_token` auto-populated for existing orgs via `UPDATE organizations SET booking_token = gen_random_uuid() WHERE booking_token IS NULL`
- `notification_email` is nullable — no backfill needed
- System/bot user must be created via Supabase Auth admin API or raw SQL INSERT into auth.users
- `appointments` CHECK constraint dropped and re-added (safe — no existing `requested` rows to conflict)
- Run type regeneration immediately after migration

## Plan Review (Step 8)

_Independent post-finalization review by artifact-code-reviewer and artifact-coverage-reviewer subagents. Findings triaged at Step 9._

| source   | plan-loc          | codebase-loc                | severity   | dimension             | finding   | recommendation   | resolution         |
| -------- | ----------------- | --------------------------- | ---------- | --------------------- | --------- | ---------------- | ------------------ |
| code | Phase 1 §3 (email-service.ts) | src/lib/services/email-service.ts:448-530 | blocker | actionability | SendBookingRequestEmail already exists at HEAD — "Add" should be "REPLACE" | Change instruction from "Add" to "REPLACE" | applied: instruction updated |
| code | Phase 3 §1 (page.tsx) | <n/a> | blocker | code-quality | BookingSuccess signature `message: string` incompatible with `string \| null` passed | Change to `{ message?: string }` | applied: signature fixed |
| code | Phase 4 §4 (appointments/page.tsx) | <n/a> | concern | actionability | Amber badge placeholder is non-actionable | Remove or provide real code | applied: removed |
| code | Phase 1 §3 (email-service.ts) | <n/a> | concern | codebase-fit | Mongolian vs English email template not stated | Make intent explicit | applied: confirmed Mongolian |
| code | Phase 1 §2 (core.ts) | src/lib/types/core.ts:31 | suggestion | codebase-fit | `requested` already exists at HEAD — no-op | Remove this change | applied: acknowledged, skip |
| code | Performance Considerations | <n/a> | suggestion | code-quality | Says 10 req/min but code uses 60 req/min | Align text to match code | applied: updated to 60 req/min |
| coverage | ## Verification Notes §2 | <n/a> | suggestion | verification-coverage | Missing type regeneration command in Phase 1 manual verification | Add to Phase 1 Manual Verification | applied: added |

## Pattern References
- `src/app/api/invoice/public/[token]/pdf/route.ts:17-24` — service_role client for unauthenticated access
- `src/app/invoice/[token]/page.tsx` — public token-based page (client component, fetch on mount, error/loading/layout wrappers)
- `src/lib/portal-auth.ts:78-108` — `createPortalRouteHandler` pattern for portal endpoints
- `src/app/api/portal/vehicles/route.ts:3-35` — Portal API route pattern (direct Supabase query)
- `src/lib/services/email-service.ts:348-362` — `sendInvoiceEmail` pattern for new `sendBookingRequestEmail`
- `supabase/migrations/20260518000003_customer_portal.sql:8` — `portal_token uuid default gen_random_uuid()` pattern
- `src/app/[locale]/portal/layout.tsx:20-38` — NAV_ITEMS pattern for adding booking entry
- `src/lib/supabase/auth-routes.ts:39-48` — Route classification for middleware bypass

## Developer Context

**Q (api-handler.ts:66-86 — createSimpleRouteHandler requires auth): How should the public booking endpoint handle Supabase client auth?**
A: Use `SUPABASE_SERVICE_ROLE_KEY` (service_role client) — same pattern as invoice PDF at `src/app/api/invoice/public/[token]/pdf/route.ts:17-24`

**Q (appointments table FK on created_by): How to handle the created_by FK when there's no auth user?**
A: Create a system/bot auth user for TOLOM Booking System

**Q (booking_token storage): Single booking link per org or multiple?**
A: Single link — add `booking_token` column to `organizations` table

**Q (notification_email storage): Where should the shop's notification email come from?**
A: New `notification_email` column on `organization_settings`, falling back to main `branches.email`

**Q (Directional confirm — service_role, portal patterns, middleware bypass): Follow existing patterns?**
A: Follow all patterns as established.

## Plan History
- Phase 1: Foundation — approved as generated
- Phase 2: Public Backend — approved as generated
- Phase 3: Public UI — approved as generated
- Phase 4: Portal + Dashboard + Middleware — approved as generated

## References
- `.rpiv/artifacts/discover/2026-06-03_10-49-23_online-booking-request.md` — Source FRD
- `.rpiv/artifacts/research/2026-06-03_11-04-05_online-booking-request.md` — Research with code-level findings
