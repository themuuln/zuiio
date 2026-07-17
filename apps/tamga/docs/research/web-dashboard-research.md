# Tamga Web Dashboard & Analytics — Research Document

> Prepared 2026-07-16 · Covers two features for Tamga's web expansion
> Stack context: Flutter + Supabase mobile app · Next.js 16 monorepo at `~/coding/zuiio`

---

## Table of Contents

1. [Feature 1: Web Dashboard](#feature-1-web-dashboard)
   - [Executive Summary](#11-executive-summary)
   - [Architecture Decision](#12-architecture-decision)
   - [Auth & Session Sharing](#13-auth--session-sharing)
   - [Data Access Strategy](#14-data-access-strategy)
   - [Feature Scope & Page Map](#15-feature-scope--page-map)
   - [Design System Bridge](#16-design-system-bridge)
   - [Deployment](#17-deployment)
   - [Day-by-Day Breakdown](#18-day-by-day-breakdown)
   - [Risks & Mitigations](#19-risks--mitigations)
2. [Feature 2: Analytics Dashboard](#feature-2-analytics-dashboard)
   - [Executive Summary](#21-executive-summary)
   - [Analytics KPIs by Domain](#22-analytics-kpis-by-domain)
   - [Visualization Libraries](#23-visualization-libraries)
   - [Data Aggregation Strategy](#24-data-aggregation-strategy)
   - [Export Capabilities](#25-export-capabilities)
   - [Tier-Gated Analytics](#26-tier-gated-analytics)
   - [Day-by-Day Breakdown](#27-day-by-day-breakdown)
   - [Risks & Mitigations](#28-risks--mitigations)
3. [Cross-Feature Dependencies](#3-cross-feature-dependencies)

---

## Feature 1: Web Dashboard

### 1.1 Executive Summary

Build a Next.js 16 web companion for Tamga's Flutter mobile app. The web dashboard provides horse owners, breeders, and stable managers with a browser-based view of their herd data — optimized for desktop screens where deeper analysis, bulk management, and reporting make more sense than on mobile.

**Key insight:** The mobile app is offline-first with Isar local storage and a sync queue to Supabase. The web dashboard reads directly from Supabase (the source of truth) — there is no offline-first concern. This dramatically simplifies architecture: server-side rendering with Supabase SSR, same RLS policies, same data.

**Scope:** 5-day MVP covering herd overview, horse detail, health timeline, breeding tracker, and basic marketplace management. Analytics deep-dive is Feature 2.

---

### 1.2 Architecture Decision

#### Decision: New standalone Next.js app at `apps/tamga-web`

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **New `apps/tamga-web`** | Clean separation, independent deploy, own Vercel project, can iterate fast | Some code duplication with other web apps | **✅ Chosen** |
| Merge into `apps/zer` | Zero duplication | Tamga is consumer-facing, Zer is B2B ERP — different auth, different users, different domain | ❌ |
| Merge into `apps/tolom` | Same reasoning as Zer | Tolom is gym management, not horse management | ❌ |
| New package in `packages/` | Shared code | Wrong abstraction — this is an app, not a library | ❌ |

#### Why standalone

1. **Different users.** Tamga users are Mongolian herders and horse owners. Zer/Tolom users are business operators. Mixing them creates auth confusion and feature creep.
2. **Different auth flow.** Tamga uses phone OTP + anonymous auth. Zer/Tolom use email/password. The Supabase project is the same, but the UX is different.
3. **Independent deployment.** Tamga web can deploy to `tamga.mn` or `app.tamga.mn` without affecting other apps.
4. **Monorepo-native.** `apps/*` is already a workspace glob in `pnpm-workspace.yaml`. Adding `apps/tamga-web` requires zero config changes.

#### Project structure

```
apps/tamga-web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login, signup, OTP
│   │   │   ├── login/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/        # Authenticated shell
│   │   │   ├── layout.tsx      # Sidebar + top bar
│   │   │   ├── page.tsx        # Herd overview (home)
│   │   │   ├── horses/
│   │   │   │   ├── page.tsx           # Horse list
│   │   │   │   └── [id]/page.tsx     # Horse detail
│   │   │   ├── health/page.tsx        # Health timeline
│   │   │   ├── breeding/page.tsx      # Breeding tracker
│   │   │   ├── marketplace/page.tsx   # My listings
│   │   │   └── analytics/page.tsx     # Analytics dashboard
│   │   └── layout.tsx          # Root: fonts, providers, metadata
│   ├── components/
│   │   ├── ui/                 # shadcn components (copy-paste)
│   │   ├── dashboard/          # Dashboard-specific components
│   │   ├── charts/             # Chart components (Feature 2)
│   │   └── shared/             # Layout shell, sidebar, topbar
│   ├── lib/
│   │   ├── supabase/           # Server + client Supabase setup
│   │   │   ├── server.ts
│   │   │   ├── client.ts
│   │   │   ├── env.ts
│   │   │   └── types.ts        # Generated Database type
│   │   └── utils.ts
│   └── hooks/                  # Custom React hooks
├── supabase/
│   └── config.toml             # Supabase CLI config (point to same project)
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── tailwind.config.ts
└── components.json             # shadcn config
```

---

### 1.3 Auth & Session Sharing

#### How Supabase Auth works cross-platform

Supabase Auth uses JWTs backed by cookies. The critical insight:

- **Flutter mobile app** stores the JWT in secure storage (flutter_secure_storage) and sends it as a Bearer token in headers.
- **Next.js web app** stores the JWT in HTTP-only cookies and reads it via `@supabase/ssr`.
- **Both hit the same Supabase project**, the same RLS policies apply, the same `auth.uid()` resolves the same user.

**There is no "session sharing" needed.** A user logs in via phone OTP on mobile → creates a Supabase auth session → that session is tied to their `auth.users` row. The same user logs in via phone OTP on web → creates a new Supabase auth session → same `auth.uid()`. They're the same person in the database, with the same data access.

#### Auth flow for web

```
1. User visits app.tamga.mn
2. Redirected to /login
3. Enter phone number → Supabase sends OTP
4. Enter OTP → Supabase creates session → sets HTTP-only cookie
5. Redirected to / (dashboard home)
6. All subsequent requests carry the cookie → RLS resolves user_id → data loads
```

#### Supabase SSR setup (copy from zer)

The exact pattern from `zer/src/lib/supabase/` applies:

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          try { return cookieStore.getAll(); }
          catch { return []; }  // During prerendering
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch { /* Server Component — Next.js handles */ }
        },
      },
    }
  );
}
```

```typescript
// src/lib/supabase/client.ts
"use client";
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
```

#### Environment variables needed

| Variable | Value | Source |
|----------|-------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` | Supabase dashboard |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `<anon-key>` | Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | `<service-role-key>` | Supabase dashboard (server only, for admin ops) |

Same project as the Flutter app — no separate Supabase project needed.

---

### 1.4 Data Access Strategy

#### Server-side vs Client-side

| Data Type | Strategy | Rationale |
|-----------|----------|-----------|
| **Herd overview** (horse list, stats) | Server Component (SSR) | Fast initial load, SEO-friendly, benefits from RLS on server |
| **Horse detail** | Server Component + Client hydration | Static shell SSR, interactive parts (edit, photos) client-side |
| **Health timeline** | Server Component with `use cache` | Computed data, changes infrequently, benefits from caching |
| **Breeding tracker** | Server Component | Tabular data, server-rendered for speed |
| **Marketplace listings** | Client-side with TanStack Query | Dynamic filtering, sorting, search — benefits from client interactivity |
| **Analytics charts** (Feature 2) | Client-side with TanStack Query | Charts need client-side rendering, data is computed/aggregated |
| **Real-time updates** | Client-side Supabase Realtime | WebSocket subscriptions for live data |

#### Key difference from mobile

The mobile app uses Riverpod providers + Isar local DB + sync queue. The web app uses:
- **TanStack Query** for server state (fetching from Supabase)
- **Server Components** for initial data
- **No local database** — Supabase IS the database

This means no sync queue, no conflict resolution, no Isar. Data is always fresh from Supabase.

#### Database type generation

Use the Supabase CLI to generate TypeScript types from the live schema:

```bash
npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
```

This generates the `Database` type used by `createServerClient<Database>` and `createBrowserClient<Database>`, giving full type safety for all 17+ tables.

#### RLS policies — no changes needed

The existing RLS policies from the Flutter app apply identically:
- Users see their own data (`owner_id = auth.uid()`)
- Co-owners see shared horses
- Marketplace listings are publicly readable (published status only)

No new RLS policies are needed for the web dashboard.

---

### 1.5 Feature Scope & Page Map

#### 5-day MVP scope

| Page | Route | Priority | Day |
|------|-------|----------|-----|
| **Login** (phone OTP) | `/login` | P0 | 1 |
| **Dashboard Home** | `/` | P0 | 1 |
| **Horse List** | `/horses` | P0 | 2 |
| **Horse Detail** | `/horses/[id]` | P0 | 2 |
| **Health Timeline** | `/health` | P0 | 3 |
| **Breeding Tracker** | `/breeding` | P1 | 3-4 |
| **Marketplace (My Listings)** | `/marketplace` | P1 | 4 |
| **Basic Analytics** | `/analytics` | P2 | 5 |
| **Profile / Settings** | `/settings` | P2 | 5 |

#### What makes sense on web but not mobile

| Web Advantage | Why |
|---------------|-----|
| **Herd overview with sortable table** | Desktop: scan 50+ horses in a data table. Mobile: card list. |
| **Bulk operations** | Select multiple horses, bulk health log entry, bulk export |
| **Detailed health timeline** | Full-width charts, side-by-side comparison of horses |
| **Marketplace management** | Draft/edit/publish listings with full keyboard, image upload |
| **PDF/CSV export** | Download to filesystem, not just share sheet |
| **Breeding planning** | Spreadsheet-like interface for breeding decisions |
| **Multi-horse comparison** | Side-by-side view of health/breeding metrics |

#### What does NOT belong on web

| Skip | Reason |
|------|--------|
| Offline mode | Desktops are online. No Isar, no sync queue. |
| GPS/map features | No GPS on desktop. Lost horse features stay mobile-only. |
| Push notification setup | Device-level, mobile-only. |
| Camera/photo capture | Use file upload instead. |

#### Navigation (sidebar)

```
┌──────────────────────────────────────────────────────┐
│ Tamga 🐎                                    [Avatar]  │
├──────────────────────────────────────────────────────┤
│ 🏠 Нүүр (Overview)                                   │
│ 🐎 Морьд (Horses)                                    │
│ ❤️ Эрүүл мэнд (Health)                               │
│ 🌳 Угшил (Breeding)                                  │
│ 🛍️ Зах (Marketplace)                                │
│ 📊 Аналитик (Analytics)                              │
│ ────────────────                                     │
│ ⚙️ Тохиргоо (Settings)                               │
└──────────────────────────────────────────────────────┘
```

Mirror the mobile's 5-tab structure, but adapted for sidebar navigation (desktop pattern).

---

### 1.6 Design System Bridge

#### The challenge: Hermes Orange (mobile) vs zuiio Violet/Teal (web)

The monorepo design system (`docs/design.md`) uses:
- **Brand violet** `oklch(0.50 0.26 275)` as the global brand
- **Teal** `oklch(0.70 0.16 195)` as the semantic primary (interactive)
- Each product overrides the accent hue per `products.tamga.accent-hue: 285` (purple)

The Flutter mobile app uses:
- **Hermes Orange** `#F06A2E` (hue 42) as the brand primary
- Warm neutrals (hue 42 ultra-low chroma)
- iOS-inspired minimal design

#### Decision: Use the monorepo's shadcn design system with Tamga product accent

The web dashboard should use the **zuiio monorepo design system** (shadcn + Tailwind v4 + oklch tokens) because:
1. It's the standard for all web apps in the monorepo
2. shadcn/ui components are built for this token system
3. Consistency with the broader zuiio ecosystem matters for brand recognition
4. Tamga's accent hue (285° purple) provides visual distinction within the system

**The mobile and web don't need to look identical.** They need to feel like the same product family. The shared elements are:
- Brand name "Tamga" and logo
- Mongolian language support
- Same data, same workflows
- Similar information architecture

#### Token mapping: Flutter → Web

| Flutter Token | Hex | Web OKLCH Equivalent | CSS Variable |
|---------------|-----|---------------------|--------------|
| `primary` (Orange) | `#F06A2E` | `oklch(0.68 0.18 42)` | `--primary` (override product accent) |
| `background` | `#FDF6F3` | `oklch(0.99 0.004 42)` | `--background` |
| `foreground` | `#2E2D2C` | `oklch(0.56 0.002 42)` | `--foreground` |
| `muted` | `#F1E6E2` | `oklch(0.97 0.006 42)` | `--muted` |
| `border` | `#D4CBC8` | `oklch(0.93 0.005 42)` | `--border` |
| `primary` (success) | `#2D8A4E` | `oklch(0.62 0.16 148)` | `--success` |
| `surface` | `#F1E6E2` | `oklch(0.97 0.006 42)` | `--secondary` |

#### Implementation: Override product accent in `globals.css`

```css
/* apps/tamga-web/src/app/globals.css */
@import "@zuiio/branding/globals.css";

@theme inline {
  /* Tamga product accent — Hermes Orange */
  --color-primary: oklch(0.68 0.18 42);
  --color-primary-light: oklch(0.93 0.07 42);
  --color-primary-dark: oklch(0.60 0.16 42);

  /* Warm neutrals (hue 42) — matches Flutter app */
  --color-background: oklch(0.99 0.004 42);
  --color-foreground: oklch(0.56 0.002 42);
  --color-muted: oklch(0.97 0.006 42);
  --color-border: oklch(0.93 0.005 42);

  /* Semantic overrides */
  --color-success: oklch(0.62 0.16 148);
  --color-warning: oklch(0.70 0.14 78);
  --color-destructive: oklch(0.57 0.20 25);
}
```

This gives Tamga web its own identity (orange accent, warm neutrals) while staying within the monorepo's design system architecture.

---

### 1.7 Deployment

#### Vercel project setup

| Setting | Value |
|---------|-------|
| **Project name** | `tamga-web` |
| **Framework** | Next.js |
| **Root directory** | `apps/tamga-web` |
| **Build command** | `cd ../.. && pnpm --filter tamga-web build` |
| **Output** | `.next` (default) |
| **Node version** | 20+ (per monorepo standard) |

#### Domain strategy

| Option | Recommendation | Rationale |
|--------|---------------|-----------|
| `tamga.mn` | **Primary — landing + marketing** | Brand domain, short, memorable. Currently likely available via `.mn` registrar. |
| `app.tamga.mn` | **App dashboard** | Subdomain for the authenticated app. Standard pattern (app.*.com). |
| `www.tamga.mn` | Redirect → `tamga.mn` | No separate site. |

**For the 5-day MVP:** Use `app.tamga-mn.vercel.app` (Vercel preview URL). Configure custom domain after launch.

#### Environment variables on Vercel

| Variable | Environment | Value |
|----------|-------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production + Preview | Same as Flutter app |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Production + Preview | Same as Flutter app |
| `SUPABASE_SERVICE_ROLE_KEY` | Production only | Admin operations |

#### Monorepo deploy considerations

Since this is a pnpm monorepo on Vercel:
- Use `installCommand: "pnpm install"` (monorepo-compatible)
- Use `buildCommand: "pnpm --filter tamga-web build"`
- If Git integration fails (private submodules), use the archive upload pattern from `vercel-monomodule-cli-deploy`

---

### 1.8 Day-by-Day Breakdown

#### Day 1: Scaffold + Auth + Dashboard Shell

**Morning:**
- Create `apps/tamga-web` from Next.js 16 template
- Configure `next.config.ts` with Cache Components + partial prefetching
- Install shadcn/ui, configure `components.json` with Tamga tokens
- Set up Tailwind v4 + oklch Tamga theme in `globals.css`
- Set up Supabase SSR (`server.ts`, `client.ts`, `env.ts`)

**Afternoon:**
- Build login page with phone OTP flow (Supabase Auth)
- Build root layout with sidebar navigation
- Build dashboard home page — herd overview stats (horses count, health summary, upcoming tasks)
- Wire Supabase session management (middleware for auth redirect)

**Deliverable:** Working login → dashboard home with real data from Supabase.

#### Day 2: Horse List + Horse Detail

**Morning:**
- Horse list page: data table with sort/filter (TanStack Table + shadcn)
- Horse card components: photo, name, breed, age, health badge
- Search and filter by name, gender, coat

**Afternoon:**
- Horse detail page: full profile with photo gallery, stat chips
- Health summary sidebar on detail page
- Co-ownership display
- Digital certificate status

**Deliverable:** Browse horses, view detailed profiles. All data from Supabase.

#### Day 3: Health Timeline + Breeding Tracker

**Morning:**
- Health timeline page: filterable health log list grouped by horse
- Health log entry form (new vaccination, deworming, treatment, farrier)
- Upcoming due items (reminder_templates)

**Afternoon:**
- Breeding tracker page: active breeding records table
- Breeding record detail: sire/dam info, gestation progress, expected foaling date
- New breeding record form

**Deliverable:** Full health management and breeding tracking on web.

#### Day 4: Marketplace Management

**Morning:**
- My listings page: active/sold/expired tabs
- Listing detail with edit capability
- Status badges and boost/VIP indicators

**Afternoon:**
- New listing form: title, description, price, sale type, photos
- Image upload to Supabase Storage
- Draft → publish flow

**Deliverable:** Complete marketplace listing management.

#### Day 5: Analytics Shell + Polish

**Morning:**
- Basic analytics page with stat cards (herd total, health rate, active listings, revenue)
- Placeholder chart areas (populated in Feature 2)
- Export buttons (CSV/PDF) wired to server actions

**Afternoon:**
- Profile/settings page
- Responsive layout fixes
- Error boundaries, loading states
- Final testing and deploy to Vercel preview

**Deliverable:** Complete MVP deployed and accessible.

---

### 1.9 Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Supabase type generation mismatch** | Type errors at runtime | Medium | Generate types from the same Supabase project as Flutter app. Verify after generation. |
| **RLS policy gaps** | Data leaks or access denied | Low | Existing RLS policies are comprehensive. Test each page with different user roles. |
| **Phone OTP UX on desktop** | User friction | Medium | Ensure OTP input is large, auto-advance, and handles paste. Consider email/password as secondary auth for web. |
| **Monorepo build conflicts** | Slow deploys | Low | Turbopack + pnpm filter ensures isolated builds. Use `--filter` consistently. |
| **Mongolian font rendering** | Uglified text | Low | System fonts (SF Pro/Roboto) handle Cyrillic. Test with Mongolian text early. |
| **Mobile-web data sync delay** | User sees stale data on web | Low | Supabase writes are immediate. RLS reads are real-time. No sync queue involved. |

---

## Feature 2: Analytics Dashboard

### 2.1 Executive Summary

Transform the existing Flutter analytics (3 domain models: `HerdAnalytics`, `HealthAnalytics`, `FinancialAnalytics`) into a rich dashboard experience — both enhancing the mobile analytics screen and building a comprehensive web analytics page.

The mobile app already has the foundation: domain models computing herd stats, health vaccination rates, upcoming due items, and financial metrics from market listings. The web dashboard extends this with visual charts, time-series analysis, and exportable reports.

**Key design principle:** Analytics are computed from Supabase data. On web, use server-side aggregation (Postgres views/functions) for performance. On mobile, continue using client-side computation from the synced Isar data.

---

### 2.2 Analytics KPIs by Domain

#### Herd Analytics

| KPI | Source Tables | Computation | Free | Pro | Breeder | Stable |
|-----|--------------|-------------|------|-----|---------|--------|
| **Total horses** | `horses` | COUNT | ✅ | ✅ | ✅ | ✅ |
| **Gender distribution** | `horses` | GROUP BY gender | ✅ | ✅ | ✅ | ✅ |
| **Age distribution** | `horses` | AGE buckets | ✅ | ✅ | ✅ | ✅ |
| **Coat/breed breakdown** | `horses` | GROUP BY coat | ✅ | ✅ | ✅ | ✅ |
| **Ownership distribution** | `co_ownerships` | JOIN + COUNT | ❌ | ✅ | ✅ | ✅ |
| **Herd growth over time** | `horses` | created_at GROUP BY month | ❌ | ✅ | ✅ | ✅ |
| **Herd composition trends** | `horses` | Window function over time | ❌ | ❌ | ✅ | ✅ |

#### Health Analytics

| KPI | Source Tables | Computation | Free | Pro | Breeder | Stable |
|-----|--------------|-------------|------|-----|---------|--------|
| **Vaccination rate** | `health_logs` | COUNT vaccinated / total horses | ✅ | ✅ | ✅ | ✅ |
| **Upcoming due items** | `health_logs` + `reminder_templates` | JOIN + date math | ✅ | ✅ | ✅ | ✅ |
| **Health event timeline** | `health_logs` | GROUP BY date + log_type | ❌ | ✅ | ✅ | ✅ |
| **Cost per horse** | `health_logs` | SUM(cost) / horses | ❌ | ✅ | ✅ | ✅ |
| **Health cost trends** | `health_logs` | Monthly SUM with trend | ❌ | ✅ | ✅ | ✅ |
| **Treatment efficacy** | `health_logs` | Follow-up analysis | ❌ | ❌ | ✅ | ✅ |
| **Seasonal health patterns** | `health_logs` | Year-over-year comparison | ❌ | ❌ | ✅ | ✅ |
| **Predictive health alerts** | `health_logs` | ML-lite anomaly detection | ❌ | ❌ | ❌ | ✅ |

#### Breeding Analytics

| KPI | Source Tables | Computation | Free | Pro | Breeder | Stable |
|-----|--------------|-------------|------|-----|---------|--------|
| **Active breedings** | `breeding_records` | COUNT WHERE status='active' | ❌ | ❌ | ✅ | ✅ |
| **Foaling success rate** | `breeding_records` | foaled / total (12mo) | ❌ | ❌ | ✅ | ✅ |
| **Average gestation length** | `breeding_records` | AVG(expected - breeding_date) | ❌ | ❌ | ✅ | ✅ |
| **Breeding season calendar** | `breeding_records` | Timeline view | ❌ | ❌ | ✅ | ✅ |
| **Sire/dam performance** | `breeding_records` + `pedigree_links` | Per-sire foaling stats | ❌ | ❌ | ❌ | ✅ |
| **Inbreeding coefficient trends** | `pedigree_links` | Coefficient over generations | ❌ | ❌ | ❌ | ✅ |

#### Financial Analytics

| KPI | Source Tables | Computation | Free | Pro | Breeder | Stable |
|-----|--------------|-------------|------|-----|---------|--------|
| **Active listings count** | `market_listings` | COUNT WHERE status='active' | ❌ | ✅ | ✅ | ✅ |
| **Sold listings count** | `market_listings` | COUNT WHERE status='sold' | ❌ | ✅ | ✅ | ✅ |
| **Total revenue** | `market_listings` | SUM(price) WHERE sold | ❌ | ✅ | ✅ | ✅ |
| **Average sale price** | `market_listings` | AVG(price) WHERE sold | ❌ | ✅ | ✅ | ✅ |
| **Price history trends** | `price_history` | Time series of listing prices | ❌ | ❌ | ✅ | ✅ |
| **Marketplace ROI** | `market_listings` | (revenue - commission) / commission | ❌ | ❌ | ✅ | ✅ |
| **Revenue by sale type** | `market_listings` | GROUP BY sale_type | ❌ | ❌ | ❌ | ✅ |
| **Seasonal market trends** | `market_listings` + `price_history` | Quarter-over-quarter | ❌ | ❌ | ❌ | ✅ |

#### Event/Competition Analytics

| KPI | Source Tables | Computation | Free | Pro | Breeder | Stable |
|-----|--------------|-------------|------|-----|---------|--------|
| **Total events** | `events` | COUNT | ❌ | ✅ | ✅ | ✅ |
| **Events by type** | `events` | GROUP BY event_type | ❌ | ✅ | ✅ | ✅ |
| **Award rate** | `events` | COUNT WHERE award_label != '' / total | ❌ | ✅ | ✅ | ✅ |
| **Horse performance ranking** | `events` | Awards per horse, sorted | ❌ | ❌ | ✅ | ✅ |
| **Seasonal event calendar** | `events` | Timeline with aggregation | ❌ | ❌ | ✅ | ✅ |

---

### 2.3 Visualization Libraries

#### Web: Recharts (chosen)

| Library | Pros | Cons | Verdict |
|---------|------|------|---------|
| **Recharts** | React-native, composable, good docs, widely used in shadcn ecosystem, SVG-based | Limited interactivity vs D3 | **✅ Chosen** |
| Chart.js | Mature, lots of plugins | Canvas-based (can't use React components inside charts), older API | ❌ |
| Tremor | Beautiful pre-built dashboards | Too opinionated, harder to customize, adds heavy dependency | ❌ |
| D3.js | Maximum control | Way too much work for MVP, low-level | ❌ |
| Visx (Airbnb) | Low-level + React | Steep learning curve, overkill for dashboard charts | ❌ |

**Why Recharts:**
- shadcn/ui has built-in Chart component powered by Recharts — zero integration work
- SVG-based → responsive, accessible, styleable with CSS
- Composable API: `<LineChart>`, `<BarChart>`, `<PieChart>` — covers all needs
- Active maintenance, large community

#### Flutter mobile: fl_chart

| Library | Pros | Cons | Verdict |
|---------|------|------|---------|
| **fl_chart** | Pure Dart, beautiful, actively maintained, SVG output | Learning curve for complex charts | **✅ Chosen** |
| syncfusion_flutter_charts | Feature-rich, enterprise | Commercial license for some features, heavy | ❌ |
| grial_chart | Simple API | Limited chart types, less maintained | ❌ |

The existing mobile code already uses custom painted charts (age bar, gender pie, health timeline). `fl_chart` would replace these with a more maintainable approach.

---

### 2.4 Data Aggregation Strategy

#### Web: Server-side aggregation with Postgres views/functions

For the web dashboard, analytics should be computed server-side for two reasons:
1. **Performance** — Aggregating thousands of rows client-side is slow. Postgres is orders of magnitude faster.
2. **Cost** — Transferring raw data to the client wastes bandwidth and Supabase's Data Transfer.

#### Recommended approach: Postgres views + Supabase RPC

**Step 1: Create analytics views in Supabase**

```sql
-- Herd overview stats
CREATE VIEW herd_stats AS
SELECT
  owner_id,
  COUNT(*) as total_horses,
  COUNT(*) FILTER (WHERE gender = 'stallion') as stallions,
  COUNT(*) FILTER (WHERE gender = 'mare') as mares,
  COUNT(*) FILTER (WHERE gender = 'gelding') as geldings,
  COUNT(*) FILTER (WHERE gender = 'foal') as foals,
  EXTRACT(YEAR FROM now()) - AVG(birth_year) as avg_age
FROM horses
GROUP BY owner_id;

-- Monthly health costs
CREATE VIEW health_cost_monthly AS
SELECT
  h.owner_id,
  DATE_TRUNC('month', hl.date) as month,
  hl.log_type,
  COUNT(*) as event_count,
  COALESCE(SUM(hl.cost), 0) as total_cost
FROM health_logs hl
JOIN horses h ON h.id = hl.horse_id
WHERE hl.cost IS NOT NULL
GROUP BY h.owner_id, DATE_TRUNC('month', hl.date), hl.log_type;

-- Breeding stats
CREATE VIEW breeding_stats AS
SELECT
  br.owner_id,
  COUNT(*) as total_breedings,
  COUNT(*) FILTER (WHERE br.status = 'active') as active,
  COUNT(*) FILTER (WHERE br.status = 'foaled') as foaled,
  COUNT(*) FILTER (WHERE br.status = 'aborted') as aborted,
  ROUND(
    COUNT(*) FILTER (WHERE br.status = 'foaled')::numeric /
    NULLIF(COUNT(*), 0) * 100, 1
  ) as success_rate
FROM breeding_records br
GROUP BY br.owner_id;

-- Marketplace performance
CREATE VIEW marketplace_stats AS
SELECT
  ml.seller_id,
  COUNT(*) as total_listings,
  COUNT(*) FILTER (WHERE ml.status = 'active') as active,
  COUNT(*) FILTER (WHERE ml.status = 'sold') as sold,
  COALESCE(SUM(ml.price_amount) FILTER (WHERE ml.status = 'sold'), 0) as total_revenue,
  COALESCE(AVG(ml.price_amount) FILTER (WHERE ml.status = 'sold'), 0) as avg_sale_price
FROM market_listings ml
GROUP BY ml.seller_id;
```

**Step 2: Create an RPC function for the dashboard overview**

```sql
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id UUID)
RETURNS JSON AS $$
SELECT json_build_object(
  'herd', (SELECT row_to_json(hs) FROM herd_stats hs WHERE owner_id = p_user_id),
  'health', (SELECT json_build_object(
    'total_logs', (SELECT COUNT(*) FROM health_logs hl JOIN horses h ON h.id = hl.horse_id WHERE h.owner_id = p_user_id),
    'vaccination_rate', (SELECT ROUND(
      COUNT(*) FILTER (WHERE log_type = 'vaccination')::numeric /
      NULLIF((SELECT COUNT(*) FROM horses WHERE owner_id = p_user_id), 0) * 100, 1
    ) FROM health_logs hl JOIN horses h ON h.id = hl.horse_id WHERE h.owner_id = p_user_id)
  )),
  'breeding', (SELECT row_to_json(bs) FROM breeding_stats bs WHERE owner_id = p_user_id),
  'marketplace', (SELECT row_to_json(ms) FROM marketplace_stats ms WHERE seller_id = p_user_id)
);
$$ LANGUAGE sql SECURITY DEFINER;
```

**Step 3: Call from Next.js server component or server action**

```typescript
// src/app/(dashboard)/page.tsx
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: stats } = await supabase.rpc('get_dashboard_stats', {
    p_user_id: user!.id
  });

  return <DashboardOverview stats={stats} />;
}
```

#### Mobile: Client-side computation (unchanged)

The mobile app continues computing analytics from Isar local data using the existing Dart domain models (`HerdAnalytics`, `HealthAnalytics`, `FinancialAnalytics`). These models are already efficient for the scale of data a single herder would have (typically 1-100 horses).

**Future optimization:** For Breeder/Stable tier users with large herds, consider adding a similar RPC function and calling it from the Flutter app for heavy analytics, falling back to client-side for basic stats.

#### Real-time updates

For live analytics on web:
- Use Supabase Realtime to subscribe to changes on key tables
- On mutation (new health log, new listing), invalidate the TanStack Query cache
- Charts re-render with fresh data

```typescript
// In a client component
const supabase = createClient();
const channel = supabase
  .channel('analytics-updates')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'health_logs' }, () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  })
  .on('postgres_changes', { event: '*', schema: 'public', table: 'market_listings' }, () => {
    queryClient.invalidateQueries({ queryKey: ['marketplace-stats'] });
  })
  .subscribe();
```

---

### 2.5 Export Capabilities

#### Web export

| Format | Implementation | Notes |
|--------|---------------|-------|
| **CSV** | Server Action → generate CSV from Supabase query → stream download | No client-side library needed. Use Postgres `COPY TO` or simple string building. |
| **PDF** | Server Action → @react-pdf/renderer or Puppeteer → stream download | @react-pdf/renderer is React-native, good for structured reports. |
| **Excel** | Server Action → exceljs → stream download | Useful for Stable tier users doing business reporting. |

#### Mobile export (existing)

The existing `AnalyticsExportService` already handles:
- **CSV export** via `csv` package
- **PDF export** via `pdf` package
- Share via `share_plus` (system share sheet)

**No changes needed for mobile.** The export service is functional and well-structured.

#### Web export architecture

```
User clicks "Export PDF"
  → Client calls Server Action
    → Server Action fetches data via Supabase (with RLS)
    → Generates PDF using @react-pdf/renderer (or puppeteer for complex layouts)
    → Returns binary stream
  → Client triggers download
```

Server-side generation is preferred because:
1. No need to send all data to the client first
2. PDF rendering is CPU-intensive — better on server
3. Supports larger datasets (100+ horses)

---

### 2.6 Tier-Gated Analytics

#### Enforcement strategy

Analytics tier gating should be enforced at **two levels**:

1. **API level (RLS / RPC):** The `get_dashboard_stats` function checks `subscription_tier` from the `profiles` table and only returns data the user is authorized to see.

2. **UI level (components):** The dashboard shows the full UI but grays out / locks premium analytics behind an upgrade CTA. This creates desire (Endowment Effect — see what you're missing).

```sql
-- Example: tier check in RPC
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_tier TEXT;
BEGIN
  SELECT subscription_tier INTO v_tier FROM profiles WHERE id = p_user_id;

  RETURN json_build_object(
    'herd', (SELECT row_to_json(hs) FROM herd_stats hs WHERE owner_id = p_user_id),
    'health', CASE
      WHEN v_tier IN ('free') THEN json_build_object('total_logs', ...)
      ELSE json_build_object('total_logs', ..., 'vaccination_rate', ..., 'cost_trends', ...)
    END,
    'breeding', CASE
      WHEN v_tier IN ('breeder', 'stable') THEN (SELECT row_to_json(bs) FROM breeding_stats bs WHERE owner_id = p_user_id)
      ELSE NULL
    END,
    'marketplace', CASE
      WHEN v_tier IN ('pro', 'breeder', 'stable') THEN (SELECT row_to_json(ms) FROM marketplace_stats ms WHERE seller_id = p_user_id)
      ELSE NULL
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Tier → Feature matrix (web analytics)

| Analytics Feature | Free | Pro (₮9,900) | Breeder (₮24,900) | Stable (₮49,900) |
|-------------------|------|-------------|-------------------|------------------|
| **Herd overview** (count, gender, age) | ✅ | ✅ | ✅ | ✅ |
| **Vaccination rate** | ✅ | ✅ | ✅ | ✅ |
| **Upcoming due items** | ✅ | ✅ | ✅ | ✅ |
| **Health timeline chart** | 🔒 | ✅ | ✅ | ✅ |
| **Health cost tracking** | 🔒 | ✅ | ✅ | ✅ |
| **Event statistics** | 🔒 | ✅ | ✅ | ✅ |
| **Marketplace revenue** | 🔒 | ✅ | ✅ | ✅ |
| **Herd growth trends** | 🔒 | ✅ | ✅ | ✅ |
| **Breeding analytics** | 🔒 | 🔒 | ✅ | ✅ |
| **Inbreeding coefficient** | 🔒 | 🔒 | ✅ | ✅ |
| **Pedigree PDF export** | 🔒 | 🔒 | ✅ | ✅ |
| **Seasonal patterns** | 🔒 | 🔒 | ✅ | ✅ |
| **Multi-user analytics** | 🔒 | 🔒 | 🔒 | ✅ |
| **Revenue by category** | 🔒 | 🔒 | 🔒 | ✅ |
| **Predictive health alerts** | 🔒 | 🔒 | 🔒 | ✅ |
| **CSV/PDF export** | 1/month | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| **Custom date ranges** | 🔒 | ✅ 30d/90d/1y | ✅ Custom | ✅ Custom |

*(🔒 = locked behind upgrade CTA)*

---

### 2.7 Day-by-Day Breakdown

#### Day 1: Analytics Schema + Server-Side Aggregation

**Morning:**
- Create Postgres views (`herd_stats`, `health_cost_monthly`, `breeding_stats`, `marketplace_stats`)
- Create `get_dashboard_stats` RPC function
- Test via Supabase SQL editor with real data
- Verify RLS still applies (users can only see their own stats)

**Afternoon:**
- Generate Supabase types with new views
- Create analytics API route in Next.js (Server Action or Route Handler)
- Set up TanStack Query hooks for analytics data
- Create basic analytics page shell with stat cards

**Deliverable:** Server-side analytics computation working, data flowing to Next.js.

#### Day 2: Chart Components

**Morning:**
- Install Recharts + shadcn Chart component
- Build reusable chart components:
  - `<HerdCompositionChart>` — stacked bar (gender × age)
  - `<HealthTimelineChart>` — line chart (health events over time)
  - `<GenderPieChart>` — donut chart (gender distribution)
  - `<AgeBarChart>` — bar chart (age buckets)

**Afternoon:**
- Build `<FinancialOverviewChart>` — bar chart (monthly revenue)
- Build `<BreedingSuccessChart>` — stacked bar (active/foaled/aborted)
- Build `<EventPerformanceChart>` — area chart (events per month)
- Wire all charts to TanStack Query data

**Deliverable:** Interactive charts displaying real analytics data.

#### Day 3: Dashboard Pages + Tier Gating

**Morning:**
- Build full analytics page with tabbed sections:
  - Tab 1: Herd Overview (composition, growth)
  - Tab 2: Health (timeline, costs, vaccination)
  - Tab 3: Breeding (active, success rate, calendar)
  - Tab 4: Financial (revenue, listings, ROI)
  - Tab 5: Events (performance, awards)

**Afternoon:**
- Implement tier-gating UI (locked cards with upgrade CTAs)
- Implement tier-check in RPC function
- Add custom date range filter (Pro+ feature)
- Add real-time subscription for live data updates

**Deliverable:** Complete analytics dashboard with tier-gated features.

---

### 2.8 Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Postgres views performance** | Slow dashboard load for large herds | Low | Mongolia herders typically have 1-100 horses. Index on `owner_id` covers this scale. |
| **Recharts bundle size** | Slow initial load | Medium | Use dynamic import (`next/dynamic`) for chart components. Charts load after initial page shell. |
| **Mobile analytics divergence** | Different results on mobile vs web | Medium | Share the same Supabase data. Mobile computes client-side from synced data, web computes server-side. Results should match. Document any differences. |
| **Tier bypass via API** | Users get premium analytics for free | Low | Tier check in both RPC (server) and UI (client). Server is authoritative. RLS ensures data access is correct; tier check ensures feature access is correct. |
| **PDF export performance** | Timeout on large datasets | Medium | Use streaming responses. Paginate exports. Set server timeout limits. |
| **Chart responsiveness** | Charts don't look good on small screens | Medium | Test at 768px (tablet) and 1024px (small desktop). Use Recharts responsive container. |

---

## 3. Cross-Feature Dependencies

| Dependency | Feature 1 (Web) | Feature 2 (Analytics) | Impact |
|------------|-----------------|----------------------|--------|
| **Supabase project** | Same project as Flutter app | Same | No conflict — both features read from the same DB |
| **RLS policies** | Uses existing policies | Uses existing policies | No new policies needed |
| **Database types** | Generated from Supabase schema | Generated from Supabase schema | Generate once, use in both features |
| **Auth flow** | Phone OTP via Supabase Auth | Uses same auth | Web auth must work before analytics can load |
| **shadcn components** | Installed in Day 1 | Used in Day 2 | Feature 2 depends on Feature 1's component setup |
| **Postgres views** | Not needed for basic pages | Required for aggregation | Views can be created in parallel with web scaffold |
| **Vercel deployment** | Single project deployment | Same project | Analytics is a page within the web dashboard |

### Recommended execution order

```
Week 1 (Feature 1 — Web Dashboard):
  Day 1: Scaffold + Auth + Shell
  Day 2: Horses
  Day 3: Health + Breeding
  Day 4: Marketplace
  Day 5: Analytics shell + Polish + Deploy

  [Concurrent with Day 1-2]: Create Postgres analytics views (DB migration)

Week 2 (Feature 2 — Analytics Enhancement):
  Day 1: Analytics schema + server aggregation (builds on Day 5 shell)
  Day 2: Chart components
  Day 3: Dashboard pages + tier gating

  [Concurrent]: Enhance mobile analytics screen with fl_chart
```

### Shared code opportunities

If future web apps in the monorepo need analytics, consider extracting:
- `packages/analytics-charts/` — Recharts-based chart components
- `packages/supabase-analytics/` — RPC functions and views

For now (5+3 day scope), keep everything in `apps/tamga-web`. Extract after the patterns stabilize.

---

## Appendix A: Supabase Project Configuration

The web dashboard uses the **same Supabase project** as the Flutter mobile app.

| Config | Value |
|--------|-------|
| Supabase URL | Same `SUPABASE_URL` from `.env` |
| Anon key | Same `SUPABASE_ANON_KEY` from `.env` |
| Database | Same PostgreSQL instance |
| Auth | Same auth.users, same phone OTP provider |
| Storage | Same buckets (horse photos, documents) |
| RLS | Same policies |

No schema migration conflicts: the web dashboard reads from existing tables. Analytics views are additive (new objects, no changes to existing tables).

## Appendix B: Key File References

| File | Purpose | Referenced For |
|------|---------|---------------|
| `apps/zer/src/lib/supabase/server.ts` | Supabase SSR server setup pattern | Copy for tamga-web |
| `apps/zer/src/lib/supabase/client.ts` | Supabase SSR client setup pattern | Copy for tamga-web |
| `lib/src/features/analytics/domain/*.dart` | Mobile analytics models | Understand what metrics exist |
| `lib/src/features/analytics/presentation/export_service.dart` | Mobile CSV/PDF export | Ensure web exports are compatible |
| `docs/design/palette.md` | Hermes Orange color system | Token mapping for web theme |
| `docs/design/shell.md` | Mobile tab navigation | Adapt for web sidebar |
| `docs/tech/database.md` | Full database schema | Understand data model |
| `docs/product/pricing.md` | Tier definitions | Tier-gate analytics features |
| `docs/design.md` (monorepo) | zuiio design system | shadcn token architecture |
| `pnpm-workspace.yaml` | Monorepo config | Add tamga-web as workspace |
