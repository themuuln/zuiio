# Feature: Digital Vehicle Inspections (DVI)

## Overview

### Problem Statement
Auto repair shops lose **$45-80k/year in unapproved add-ons** because customers don't trust verbal recommendations. Paper checklists are static, photos never get shared, and the customer can't see what the technician sees until it's too late.

### User Value
- **Shop**: 20-30% ARO lift ($80-150/ticket), 78% faster approvals, trust-building with visual evidence
- **Technician**: Guided 50-point checklist with photo capture, eliminates paper, upsells become visual
- **Customer**: See photos of their car on their phone, approve/decline each item with one tap, no app needed

### Success Metrics
| Metric | Target | Industry Benchmark |
|--------|--------|-------------------|
| DVI completion rate | 90%+ | Industry: 85-90% |
| Inspection-to-estimate conversion | 80%+ | Industry: 80% |
| Estimate-to-approval (yellow/safety items) | 55%+ | Industry: 55%+ |
| Time from inspection → customer notification | < 3 min | Industry: < 3 min |
| Additional items found per vehicle | 2-3 | Industry: 1.5-3.0 |
| Customer approval rate | 65-85% | Paper: 45-55%, DVI: 65-85% |

### Stakeholders
- Shop owners (primary buyer — DVI is a demo-winning feature)
- Technicians (daily users on tablets)
- Service advisors (review and send to customers)
- Vehicle owners (review and approve on phone)

---

## Requirements

### Functional (EARS format)
- REQ-F-01: Technicians shall complete a structured multi-point inspection checklist per vehicle, organized into categories (exterior, interior, tires, brakes, under-hood, under-vehicle, lights, fluids, battery, belts/hoses)
- REQ-F-02: Technicians shall capture photos per inspection item, uploaded to R2 storage and linked to the specific item
- REQ-F-03: The system shall calculate a condition status (good/fair/poor/fail/not_checked) per item based on technician input
- REQ-F-04: The system shall generate a customer-facing inspection report with photos and send via SMS/email as a unique tokenized link
- REQ-F-05: Customers shall view inspection results and approve or decline each recommended service item from their phone — no app download, no login required
- REQ-F-06: Approved items shall automatically convert into work order line items (services + parts)
- REQ-F-07: Declined items shall be saved to the vehicle profile for follow-up marketing
- REQ-F-08: The system shall capture measurement values (tread depth in mm, brake pad thickness in mm, battery voltage, etc.)
- REQ-F-09: Technicians shall add custom notes per inspection item
- REQ-F-10: The system shall estimate total cost based on linked catalog services + parts

### Non-functional
- REQ-NF-01: Customer review page must load under 2s on 4G in Mongolia (mobile-first)
- REQ-NF-02: Photos must be compressed server-side before R2 upload (max 1MB per image)
- REQ-NF-03: Customer token must be a cryptographically random 32-byte string, stored hashed
- REQ-NF-04: All inspection data must be organization-scoped via RLS

---

## Acceptance Criteria

### Scenario 1: Complete an inspection
```
Given a technician opens a DVI for a checked-in vehicle
When they complete all required categories with photos and measurements
Then the system saves the inspection as "draft" status
And generates unique customer_token
And calculates estimated total cost
And marks it ready to send
```

### Scenario 2: Customer approves items
```
Given a customer receives an SMS with inspection link
When they open the link and see 3 recommended services (2 green, 1 yellow)
And they tap "Approve" on the yellow item and "Decline" on one green
Then the system saves per-item approval status
And approved item auto-converts to work order line
And declined item is saved to vehicle profile
```

### Scenario 3: Convert to work order
```
Given an inspection has approved items
When the technician or advisor triggers "Convert to Work Order"
Then the system creates work_order_services + work_order_parts from approved items
And links the original inspection to the work order
And transitions inspection status to "converted"
```

---

## Competitor Research

| Competitor | DVI Depth | Pricing (mo) | Customer Approval | Differentiator |
|-----------|-----------|-------------|-------------------|----------------|
| **Tekmetric** | Interactive multimedia, drag-drop photos | $199-699 | SMS link, real-time | Parts integration (PartsTech) |
| **AutoLeap** | Certified checklists, multi-point video | $179-449 | One-tap text/email | AI upsell recommendations |
| **Shopmonkey** | Photo/video annotations | $149-349 | SMS link | Workflow automation |
| **Pitlane** | Pass/Attention/Fail per checkpoint | N/A | SMS link, no app needed | Item-by-item approval |
| **Garage360** | HD photos/video + annotations | N/A | SMS link, 85-90% approval | Highest approval rate claimed |
| **Torque360** | Photo/video/voice notes | N/A | SMS link, one-tap approve | Declined work recovery |
| **Kimoby** | Color-coded findings (green/yellow/red) | N/A | SMS link, per-line approval | VIN scan + OpCode estimates |
| **Solera MultiPoint** | VIN-specific guided workflows | Enterprise | Dealer-focused | Enterprise-grade |

### Revenue Impact Evidence
| Source | Metric | Value |
|--------|--------|-------|
| Branch Automotive (Tekmetric) | ARO increase | 77% ($583 → $1,000+) |
| DriveLine | Approval lift | 45-55% → 65-75% |
| Garage360 | Approval rate | 85-90% (vs 50-60% paper) |
| Shop Commander | ARO lift per ticket | $80-$150 (20-30%) |
| SolidNumber | Approval with AI summaries | Up to 80% |
| Bolton Technology | Revenue recovery from declined work | $45,000+ |

---

## Technical Approach

### Architecture
```
Tech Tablet (PWA)                Tolom API                   Supabase + R2
     │                              │                            │
     ├─ Open DVI for vehicle ──────►│                            │
     │                              ├─ Create inspection ──────►│ dvi_inspections
     │◄─────── inspection_id ───────┤                            │
     │                              │                            │
     ├─ Capture photo per item ────►│                            │
     │                              ├─ Upload to R2 ───────────►│ R2 /inspections/{id}/
     │◄─────── photo_url ───────────┤                            │
     │                              │                            │
     ├─ Submit inspection ─────────►│                            │
     │                              ├─ Save items ─────────────►│ dvi_inspection_items
     │                              ├─ Generate token ──────────►│
     │                              ├─ Enqueue SMS ────────────►│ customer_communications
     │◄─────── customer_link ───────┤                            │
     │                              │                            │
  CUSTOMER                          │                            │
     │                              │                            │
     ├─ Open link ─────────────────►│ (public route, token auth) │
     │                              ├─ Fetch inspection ────────►│
     │◄─────── photos + items ──────┤                            │
     ├─ Approve/Decline items ─────►│                            │
     │                              ├─ Update approvals ────────►│ dvi_inspection_items
     │                              └─ Convert approved → WO ──►│ work_order_services
```

### Data Model

#### `digital_vehicle_inspections`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| organization_id | uuid | FK → organizations |
| vehicle_id | uuid | FK → vehicles |
| work_order_id | uuid | FK → work_orders (nullable, set on conversion) |
| status | text | draft \| ready \| sent \| partially_approved \| approved \| declined \| converted |
| odometer | int | Captured at inspection time |
| fuel_level | text | 1/4, 1/2, 3/4, Full |
| customer_token_hash | text | SHA-256 of random token |
| customer_viewed_at | timestamptz | |
| customer_decision_at | timestamptz | |
| technician_notes | text | |
| created_by | uuid | FK → users |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `dvi_inspection_items`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| inspection_id | uuid | FK → digital_vehicle_inspections |
| category | text | exterior \| interior \| tires \| brakes \| under_hood \| under_vehicle \| lights \| fluids \| battery \| belts_hoses |
| item_name | text | e.g. "Driver front tire tread depth" |
| condition | text | good \| fair \| poor \| fail \| not_checked |
| measurement_value | numeric | mm, voltage, etc. |
| measurement_unit | text | mm, V, % |
| severity | text | info \| monitor \| recommend \| urgent \| critical |
| has_photo | boolean | |
| photo_urls | text[] | R2 keys |
| technician_notes | text | |
| recommended_service_id | uuid | FK → service_catalog |
| recommended_part_ids | uuid[] | FK → parts_catalog |
| estimated_cost | numeric | Computed from linked catalog |
| customer_approved | boolean | null = pending, true/false |
| sort_order | int | Display order within category |
| created_at | timestamptz | |

### New Files to Create
| Layer | File | Purpose |
|-------|------|---------|
| Migration | `supabase/migrations/20260731000000_create_dvi.sql` | Both tables + RLS + indexes |
| Types | `src/lib/types/core.ts` | DVI types |
| Service | `src/lib/services/dvi-service.ts` | CRUD, send to customer, convert |
| API Routes | `app/api/organizations/[id]/dv-inspections/route.ts` | List, create |
| API Routes | `app/api/organizations/[id]/dv-inspections/[inspectionId]/route.ts` | Get, update, submit |
| API Routes | `app/api/dv-inspections/public/[token]/route.ts` | Public customer view (no auth) |
| API Routes | `app/api/dv-inspections/public/[token]/approve/route.ts` | Customer approve/decline |
| Queries | `src/lib/queries/use-dvi.ts` | React Query hooks |
| Components | `src/components/dvi/dvi-checklist.tsx` | Tech-side checklist UI |
| Components | `src/components/dvi/dvi-camera-capture.tsx` | Photo capture component |
| Components | `src/components/dvi/dvi-customer-review.tsx` | Public customer page |
| Components | `src/components/dvi/dvi-summary-card.tsx` | Dashboard summary |
| i18n | `en.json` + `mn.json` | Translation keys |

### Dependencies
- `@zuiio/core` — existing validation helpers
- R2 storage — existing `r2-service.ts`
- SMS/communications — existing `customer_communications` table
- work_order_service — existing, for conversion

### OSS References
- **inspectiq** (`manynames3/inspectiq`): React-based inspection workflow with camera capture, image quality checks, S3 storage. Architecture reference.
- **work-tracker** (`mrdotss/work-tracker`): Next.js + Prisma full inspection app. Similar stack. Reference for data model patterns.
- **Pre-Delivery-Check-Application** (`coderkarishma/...`): Full-stack checklist with photo uploads. Basic pattern reference.

---

## UX / UI Notes

### Tech Tablet Flow
1. **Open DVI** — Button on check-in screen or vehicle detail
2. **Walk-around** — Swipeable categories (Exterior → Interior → Tires → Brakes → etc.)
3. **Per-item** — Tap item → condition buttons (Good/Fair/Poor/Fail) → capture photo → add notes → optional measurement
4. **Preview** — Summary screen with all findings, categorized, total estimate
5. **Send** — Generates token, sends SMS/WhatsApp, status → "sent"

### Customer Phone Flow
1. **SMS arrives** — "🔧 Your Tolom inspection is ready: see.photos/link"
2. **Tap link** — Opens in browser, no login
3. **See car overview** — Photo of vehicle, mileage, fuel level
4. **Category cards** — Green/Yellow/Red severity cards, expand to see items
5. **Per-item** — Photo, technician note, condition badge
6. **Approve/Decline** — Big green/red buttons per recommended item
7. **Total** — Running total of approved items
8. **Done** — "Thanks! Your approved work has been queued."

### States

| Component | Loading | Empty | Error | Success |
|-----------|---------|-------|-------|---------|
| Tech checklist | Inline skeleton on categories | "No items in this category" | Toast "Failed to save item" | Green checkmark per saved item |
| Customer review | Skeleton card grid | "No inspection found" (bad link) | "Something went wrong — call the shop" | Photos + items + approve buttons |
| Photo capture | Upload spinner on thumbnail | Camera placeholder | "Upload failed — tap to retry" | Thumbnail with checkmark |

---

## Implementation Checklist

### Phase 1: Foundation (Day 1)
- [ ] Create DB migration with both tables, RLS, indexes, audit triggers
- [ ] Add DVI types to `src/lib/types/core.ts`
- [ ] Create `dvi-service.ts` with create, get, list, addItem, removeItem
- [ ] Create basic API routes (list + create)
- [ ] Add `dviKeys` to query key factories + cache keys
- [ ] Write service + route tests

### Phase 2: Tech UI (Day 2)
- [ ] Build `dvi-checklist.tsx` — category navigation + item list
- [ ] Build `dvi-camera-capture.tsx` — browser camera API + R2 upload + drag-and-drop
- [ ] Wire React Query hooks
- [ ] Write component tests

### Phase 3: Customer Review (Day 3)
- [ ] Build public route `public/[token]` — no auth, token validation
- [ ] Build `dvi-customer-review.tsx` — photo gallery + approve/decline buttons
- [ ] Build public approve/decline API routes
- [ ] Wire SMS send on inspection submission
- [ ] Write API + component tests

### Phase 4: Conversion & Polish (Day 4)
- [ ] Build "Convert to Work Order" flow — approved items → work_order_services + parts
- [ ] Build `dvi-summary-card.tsx` for dashboard
- [ ] Add declined-items page for follow-up marketing
- [ ] i18n: all UI strings in MN + EN
- [ ] Full test pass + typecheck

---

## Red-Team Review

### What could make this recommendation wrong?
1. **Shops don't have tablets** — If Mongolian shops primarily use desktop PCs at the counter and never walk around with a tablet, the entire DVI premise fails. Mitigation: Phone-based capture works too; every tech has a smartphone. Plan B: Use the tech's phone, not a shared tablet.
2. **Customers won't click SMS links** — In Mongolia, SMS spam is rampant. Customers might ignore the link. Mitigation: Include the shop name + vehicle plate in SMS preview. Provide QR code on receipt as backup.
3. **Photo storage costs explode** — 30 photos per inspection × 20 cars/day × 250 days = 150,000 photos/year. At ~500KB each after compression = 75GB/year. R2 charges ~$0.015/GB/mo = ~$1.13/mo for storage + negligible egress. Cost is immaterial.

### Evidence gaps
- **Mongolian customer behavior with DVI links** — No data on whether Mongolian car owners would tap an SMS link. Assumed (from international data) but unvalidated locally.
- **Tablet prevalence in Mongolian shops** — Assumed but not verified. Should validate before building Phase 2.

### What's cheapest to validate first?
Build the customer-facing review page with mock data and test with 5 real customers at a local shop. If they use it and approve items, the tech-side UI is worth building.

---

## Open Questions
1. Should DVI be a separate check-in step or embedded in the existing check-in flow?
   → **Decision: Separate step.** Less disruption to existing flow, cleaner data model.
2. Photo upload: browser camera API (MediaDevices) or native app?
   → **Decision: Browser camera API + drag-and-drop fallback.** No native app needed.
3. Should we support video clips?
   → **Decision: Phase 2.** Photos first, video if customers ask for it.
4. What's the default checklist template?
   → **Decision: Fixed 50-point list organized into 10 categories.** Configurable templates deferred.
5. SMS provider?
   → **Decision: Use existing customer_communications table.** Provider-agnostic.
