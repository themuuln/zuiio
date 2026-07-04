# Zatly — Master Plan

> **Product**: Visual Facebook Messenger Bot Builder  
> **Codename**: ZatBot Flow Builder  
> **Stack**: Next.js 16 + Supabase + React Flow + Tailwind CSS v4  
> **Version**: 0.2.0 (pre-revenue, pre-launch)  
> **Last Updated**: 2026-06-15

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Architecture](#2-architecture)
3. [Pages & Routes](#3-pages--routes)
4. [Features — Current State](#4-features--current-state)
5. [Features — Planned / In Progress](#5-features--planned--in-progress)
6. [Node System](#6-node-system)
7. [Facebook Messenger Integration](#7-facebook-messenger-integration)
8. [UI & UX](#8-ui--ux)
9. [API Layer](#9-api-layer)
10. [Database Schema (Supabase)](#10-database-schema-supabase)
11. [Project Configuration & Tooling](#11-project-configuration--tooling)
12. [Business Model & Pricing (Aspirational)](#12-business-model--pricing-aspirational)
13. [Roadmap](#13-roadmap)
14. [Competitive Landscape](#14-competitive-landscape)
15. [Security & Risk Assessment](#15-security--risk-assessment)

---

## 0. Strategic Context (From Competitive Research — June 2026)

This section summarizes key findings from deep competitive research conducted June 2026. It is meant to inform all product, pricing, and go-to-market decisions going forward.

### 0.1 The Market Opportunity

The chatbot builder market is at an inflection point. ManyChat's March 2026 pricing overhaul (free tier cut from 1,000 to 25 contacts, contact-based billing) triggered widespread user dissatisfaction. Legacy tools (Chatfuel, MobileMonkey) have stagnant UX and limited AI. AI-native newcomers (FlowGent, SetSmart) are VC-funded but not Messenger-specialized.

Zatly can exploit three converging opportunities:
1. **Disruption of ManyChat's pricing grip** — flat-rate pricing directly attacks their #1 complaint
2. **Mongolian market first-mover** — 2.7M Facebook users, 2.3M Messenger users, 83% internet penetration, and **zero self-serve visual builder competition**. The "local competition" is ManyChat resellers (Nathouse, BZP) and custom dev shops (GreenSoft). No one offers a Mongolian-language visual flow builder.
3. **Self-hostable alternative** — growing data sovereignty demand has no Messenger-specialized solution

### 0.2 Immediate Priorities

| Priority | Action | Why |
|----------|--------|-----|
| 🔴 P0 | Fix security gaps (API auth, input validation, .gitignore) | Cannot launch without these |
| 🔴 P0 | Ship Mongolian UI + market launch | Zero visual builder competition right now. The window won't last — global players could localize. |
| 🟠 P1 | Flat-rate pricing at $9-99/mo (localized MN pricing tier ~$5-50/mo) | Direct attack on ManyChat's pain point. Local benchmark is GreenSoft at ~$14/mo. |
| 🟠 P1 | Template library with Mongolian-use-case templates | Needed to match ManyChat's easiest onboarding and serve local businesses |
| 🟠 P1 | Partner program for agencies currently reselling ManyChat | Nathouse, BZP, and others could switch to Zatly if it offers better economics |
| 🟡 P2 | RAG/LLM AI integration | Beat ManyChat's fake "AI Step" with real AI |
| 🟡 P2 | Self-hosted license ($299) | Unique offering, no competitor matches this |

### 0.3 Key Differentiators vs Each Competitor

| Competitor | Their Weakness | Zatly's Advantage |
|-----------|---------------|-------------------|
| **ManyChat** | Contact-based pricing spikes; fake AI; no data portability | Flat pricing; real LLM AI (planned); Supabase data ownership |
| **Chatfuel** | Outdated UI; no cross-channel flow dup; no website widget | Modern React Flow; multi-channel arch; web chat widget (planned) |
| **MobileMonkey** | Clunky UX; confusing pricing; B2B-limited | Clean UX; simple pricing; all-business focus |
| **SendPulse** | Email-first not Messenger-first; shallow bot builder | Messenger-native; 10 button types; rich flow builder |
| **Tidio** | Messenger is an afterthought; expensive at scale | Messenger-first; affordable at all tiers |
| **FlowGent/SetSmart** | Not Messenger-specialized; no visual flow control | Visual builder + Messenger-specific features |
| **Intercom/Zendesk** | Enterprise pricing ($74-149/seat); overkill for SMB | SMB-friendly pricing; right-sized for small teams |
| **UChat** | No real AI/KB training; no auto-translation; no self-host; English-only | Real AI (planned); Mongolian-first; self-hostable; per-node analytics |
| **Voiceflow** | No Messenger/IG/WA native; no live chat; no contact mgmt; $60/mo start | Native Messenger; live chat; contact mgmt; $9/mo start |
| **Botpress** | Per-conversation pricing ($150/250 convos); no Messenger marketing; dev-heavy | Flat pricing; Messenger marketing; easy setup |
| **Rasa** | $35K/yr jump; engineering-intensive; no visual builder for Messenger | Self-hostable at $299 flat; visual builder; Messenger-native |
| **BotPenguin** | Less mature flow builder; limited community; no Mongolian | Modern React Flow builder; Mongolian UI; growing community |
| **Kore.ai** | Opaque pricing; session-based billing; enterprise complexity | Transparent flat pricing; self-serve; SMB-friendly |
| **Nathouse / BZP (MN ManyChat resellers)** | Resell ManyChat's weaknesses; no self-serve platform | Self-serve builder + better economics; could become partners |
| **GreenSoft (MN custom dev)** | Custom builds only; no self-serve SaaS; English admin | Self-serve SaaS in Mongolian; instant deployment |
| **Botsify** | Global platform with MN landing page; English-only | Mongolian-native; Messenger-specialized; offline-capable |

---

## 1. Product Overview

Zatly is a **visual automation builder for Facebook Messenger** that allows businesses to create sophisticated chatbot conversations without writing code. Users drag, connect, and configure nodes on a canvas to build message flows, then publish them to their Facebook Page.

### Core Value Proposition

- **No-code visual builder** — build Messenger bots by dragging nodes onto a canvas
- **Rich conversation logic** — conditions, fields, actions, delays, card carousels
- **One-click publish** — push flows directly to production via Supabase
- **Contact management** — view, tag, filter, and manage subscribers
- **Full Messenger integration** — OAuth connection, persistent menu, webhook handling

### Target Audience

- Small & medium businesses using Facebook Messenger for customer engagement
- Marketing agencies managing Messenger bots for multiple clients
- Content creators / publishers building Messenger subscriber lists
- E-commerce stores using Messenger for order updates and support
- **Mongolian market** — seed data and contact defaults are Mongolian-language (language default: 'Mongolian'), indicating initial focus

---

## 2. Architecture

```
┌─────────────────────────────────────────────────┐
│              Next.js 16 App                      │
│  ┌──────────┐  ┌────────────┐  ┌─────────────┐  │
│  │  Pages   │  │  API       │  │  Middleware  │  │
│  │  (5)     │  │  Routes(16)│  │  (Auth SSR) │  │
│  └────┬─────┘  └─────┬──────┘  └──────┬──────┘  │
│       │               │                │          │
│  ┌────▼───────────────▼────────────────▼───────┐  │
│  │          Zustand Stores                     │  │
│  │   (flowStore + uiStore)                     │  │
│  └───────────────────┬─────────────────────────┘  │
│                      │                             │
│  ┌───────────────────▼─────────────────────────┐  │
│  │       React Flow (@xyflow/react v12)        │  │
│  │  8 custom node types on drag-drop canvas    │  │
│  │  with minimap, controls, background         │  │
│  └───────────────────┬─────────────────────────┘  │
└──────────────────────┬───────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────┐
│            Supabase (Backend)                     │
│  ┌──────────┐  ┌────────────┐  ┌──────────────┐  │
│  │  Auth    │  │  Postgres  │  │  Edge        │  │
│  │ (SSR)    │  │  (REST v1) │  │  Functions   │  │
│  └──────────┘  └────────────┘  │  (Deno v2)   │  │
│                                └──────┬───────┘  │
│  ┌─────────────────────────────────────▼────────┐ │
│  │       Facebook Graph API (v21.0 / v25.0)      │ │
│  │     (Version inconsistency — see §7.2)       │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘

### Infrastructure: Local-Only / Single-Server

- No Docker, no CI/CD, no containerization
- Node.js version pinned to 22.x via `.nvmrc`
- Turbopack for development builds
- Supabase local dev on ports 54321 (API), 54322 (DB), 54323 (Studio)
- Facebook connection stored as JSON file in `.data/` directory (not in DB)
```

### Key Technologies

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | ^16.1.6 | React app with API routes + SSR |
| Runtime | Node.js | >=20.9.0 <25 (22.x) | Server-side execution |
| Flow Canvas | @xyflow/react | ^12.4.0 | Visual node editor |
| Styling | Tailwind CSS | ^4.0.0 | Utility-first CSS |
| UI Library | shadcn/ui (base-nova) | — | Component primitives |
| Low-level UI | @base-ui/react | ^1.4.1 | Unstyled UI primitives |
| State | Zustand | ^5.0.0 | Client state management |
| Auth | Supabase SSR | ^0.10.3 | Email/password auth |
| Database | Supabase Postgres | v17 | Automations, contacts, flows |
| Edge Runtime | Supabase Edge Functions (Deno) | v2 | Production webhook handler |
| Messenger | Facebook Graph API | v21.0 / v25.0 | Send/receive messages |
| Icons | Lucide React | ^1.14.0 | UI icons |
| CSS Animation | tw-animate-css | ^1.4.0 | Animation utilities |
| ID Generation | nanoid | ^5.0.9 | Unique IDs for nodes, buttons, cards |

---

## 3. Pages & Routes

### 3.1 Page Inventory

| Path | Type | Purpose | Auth Required |
|------|------|---------|---------------|
| `/` | Client (RSC) | Main app with workspace tabs | Yes |
| `/login` | Client | Sign in / Sign up | No (public) |
| `/auth/callback` | Server (API) | Supabase OAuth code exchange | No (public) |
| `/facebook/select` | Client | Pick Facebook page after OAuth | No (public) |
| `/facebook/menu` | Client | Manage Messenger persistent menu | Yes |
| `/admin/facebook` | Server (RSC) | Manual Facebook page connection | Yes |

### 3.2 App Shell

- **Root layout** (`layout.tsx`): wraps all pages in `TooltipProvider` → `SidebarProvider`
- **Metadata**: title "ZatBot Flow Builder", description "Lightweight chatbot flow creator"
- **Font stack**: `"Space Grotesk", "IBM Plex Sans", "Avenir Next", "Segoe UI", sans-serif`
- **Dark theme only**: `<html lang="en" class="dark">` — no light mode toggle
- **No error boundary**: no `error.tsx`, `not-found.tsx`, or `loading.tsx` at app level
- **No SEO**: no `robots.ts`, `sitemap.ts`, or Open Graph tags

### 3.3 Main App Page (`/`)

The single-page app renders workspaces conditionally based on `activeTab`:

| Tab | View | Component |
|-----|------|-----------|
| `home` | Dashboard | `HomeDashboard` (inline) — automation count + contact count |
| `contacts` | List | `ContactsWorkspace` |
| `automation` | List | `AutomationWorkspace` |
| `automation` | Builder | `FlowCanvas` + `NodeEditor` (side panel) |
| `settings` | Config | Settings section with `FacebookConnector` |

**States handled**:
- **Loading**: full-screen "Loading…" (checks auth + mounted)
- **Unauthenticated**: redirect to `/login`
- **Authenticated**: render workspace
- **Unknown tab**: fallback "X workspace" message

---

## 4. Features — Current State

### 4.1 Flow Builder (Core)

- **Visual canvas** with drag-and-drop node placement (8 node types)
- **Node connections** via edge dragging (smoothstep edges, configurable animated toggle)
- **Quick-add menu** ("+" button) — categorized into Content and Logic sections
- **Right-click context menu** on nodes (Radix Context Menu): Edit, Duplicate, Delete
- **Right-click context menu** on canvas: Add Node, Organize (auto-layout)
- **Connect-and-add** workflow: drag from a node handle to empty space → menu to pick a new node
- **Undo/Redo** (Ctrl+Z / Ctrl+Shift+Z) with 100-level history stack, persisted to localStorage
- **Auto-layout** — layered graph layout algorithm: topological sort → layer assignment → column/row grid (360px × 180px spacing)
- **Snap-to-grid** (16px)
- **Zoom**: scroll-to-pan, pinch-to-zoom (zoom-on-scroll disabled)
- **Minimap** (bottom-right) with color-coded nodes by type
- **Controls** (bottom-left) with zoom in/out/fit
- **Export/Import** flows as JSON files
- **Auto-save** with 1800ms debounce to Supabase per-automation
- **Publish** to Supabase Management API (writes to `FB_BOT_FLOW_JSON` secret)
- **Preview mode** toggle showing simulated per-node stats (sent, delivered%, opened%, clicked%)
- **Status indicators**: green checkmark when synced, status text for publish/auto-save
- **Keyboard shortcuts**: Backspace/Delete to remove selected node

### 4.2 Automation Management

- **List view** of all automations with search bar
- **Filter by trigger type**: Any, Keyword, Default, Button, Ref
- **Filter by trigger state**: Any, Active, Inactive
- **Create automation** with name
- **Inline rename** via "More" menu
- **Duplicate automation** (copies name with " (Copy)" suffix, resets status to draft)
- **Delete automation** with confirmation
- **Folder display** (currently shows folders, "New Folder" button exists)
- Sidebar navigation: My Automations, Keywords, Sequences, Rules (placeholder)
- Status badges: Live (red) / Draft (gray)
- Metrics displayed: Runs, CTR %, relative modified time
- **"More" menu**: Rename, Duplicate, Convert channels, Move to, Share, Duplicate to another page, Delete

### 4.3 Contacts Management

- **Contact list** with table view (Checkbox, Avatar, Name, Gender, Status, Subscribed date)
- **Search** by name or PSID
- **Filter** by status (Subscribed/Unsubscribed) and gender (Female/Male/Unknown)
- **Contact detail modal** with:
  - Profile image area (placeholder)
  - Pause/Resume Automations toggle
  - Start Chat button
  - Tags management (add/remove tags)
  - Subscribed sequences display
  - Opt-in source
  - System fields: First Name, Last Name, Gender, PSID
- **Sidebar** showing unique Tags and Subscription Lists from the dataset
- **Create New Contact** button (UI only — API support may exist)
- **Import** button (UI only)  
- **Pagination**: "X of Y contacts" display

### 4.4 Facebook Page Connection

- **Facebook Login OAuth flow** with app ID / app secret
- **Page selection** UI after OAuth — user picks which Facebook Page to connect
- **Persistent connection** stored in `.data/facebook-page-connection.json`
- **Connection status** display in Settings (connected/disconnected, page name)
- **Reconnect / Disconnect** controls
- **Persistent Menu management** page at `/facebook/menu`:
  - Add/remove menu items (Postback or Web URL types)
  - Disable free text input mode
  - Save to Facebook via Graph API
  - Reload current menu from Facebook
  - Delete menu from Facebook Page

### 4.5 Authentication

- **Email/password sign-in** via Supabase Auth
- **Email/password sign-up** flow
- **Session management** via Supabase SSR middleware
- **Protected routes** — middleware redirects to `/login` if unauthenticated
- **Public paths**: `/login`, `/auth`, `/api/webhook`, `/api/facebook/callback`
- **Sign out** button in header
- **Graceful degradation** when Supabase is not configured

### 4.6 Dashboard / Home

- **Overview cards**: Automation count, Contact count (fetched from API)
- **Quick actions**: View Automations, View Contacts
- **Breadcrumb navigation** in header (Automations > Flow Name)
- **Preview mode** toggle in builder view

### 4.7 Settings Page

- Placeholder workspace preference section
- Facebook Connector integration panel

---

## 5. Features — Planned / In Progress

These are identified from the codebase as stubs, placeholders, or UI that references non-existent functionality:

| Feature | Evidence | Status |
|---------|----------|--------|
| **Keyword automations** | Sidebar link in automation list | Placeholder button |
| **Sequence automations** | Sidebar link in automation list | Placeholder button |
| **Rules** | Sidebar link in automation list | Placeholder button |
| **New Folder** creation | UI button exists, no API route | Stub |
| **Convert channels** | "More" menu item | Not implemented |
| **Move to** folder | "More" menu item | Not implemented |
| **Share automation** | "More" menu item | Not implemented |
| **Duplicate to another page** | "More" menu item | Not implemented |
| **Create New Contact** | Button in contacts toolbar | UI shell |
| **Import contacts** | Button in contacts toolbar | UI shell |
| **Bulk actions** | Checkbox in contact list rows exists, no action bar | Stub |
| **Start Chat** from contact detail | Button exists | UI shell |
| **Analytics / Node Stats** | `nodeStats.ts` generates preview stats (sent, delivered, opened, clicked) | Preview data only |
| **Pricing page** | Facebook persistent menu has default "Pricing" item with `MENU_PRICING` payload | Placeholder |
| **Tiered access / subscription** | No implementation exists | Not started |
| **Multi-page support** | "Duplicate to another page" in more menu | Not started |
| **Webhook on non-Next.js** | Supabase Edge Function (`facebook-webhook`) exists as alternative deployment path | Ready but optional |
| **Action execution** (tag, subscribe, etc.) | `actionType` fields defined: tag, subscribe, unsubscribe, notify, webhook | UI exists, runtime not fully wired |

---

## 6. Node System

### 6.1 Node Rendering Pattern

All 8 node types follow a consistent card pattern:

```
┌─────────────────────────────┐
│  ▲ Handle (target, top)     │ (except Start — no input)
│                             │
│  ┌───┬─────────────────────┐│
│  │ ██│ Label (header bar)  ││ ← Type-specific color
│  └───┴─────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │  PreviewStatsNode       ││ ← Only in preview mode (3 nodes)
│  │  [Sent] [Del] [Opn] [Ck]││
│  └─────────────────────────┘│
│                             │
│  Content area (varies)      │
│                             │
│  ▼ Handle (source, bottom)  │
│  Optional side handles      │
└─────────────────────────────┘
```

**Shared styles**: `min-w-[180px] max-w-[240px]`, `rounded-xl`, dark bg (`bg-surface`), selected state = accent border + shadow glow (`shadow-[0_0_0_2px_var(--accent)]/40`)

### 6.2 Node Types

| Node Type | Header Color | Preview Stats | Input Handle | Output Handle(s) |
|-----------|-------------|---------------|-------------|-----------------|
| Start | `#22c55e` (green) | No | None | `out` (bottom) |
| Send Message | `#3b82f6` (blue) | Yes | `in` (top) | `out` (bottom) + per-button (right) |
| Ask Question | `#eab308` (yellow) | Yes | `in` (top) | `out` (bottom) + per-button (right) |
| Condition | `#a855f7` (purple) | No | `in` (top) | `yes` (30% left), `no` (70% right) |
| Set Field | `#22c55e` (green) | No | `in` (top) | `out` (bottom) |
| Delay | `#f97316` (orange) | No | `in` (top) | `out` (bottom) |
| Action | `#ef4444` (red) | No | `in` (top) | `out` (bottom) |
| Card Carousel | `#ec4899` (pink) | Yes | `in` (top) | `out` (bottom) + per-card-button (right) |

### 6.3 Node Content Renderings

| Node | Content Display | Empty State |
|------|----------------|-------------|
| Start | Trigger type + keyword pills (max 4, "+N" overflow) | "Flow begins on any message" |
| Send Message | Message text, button list with names | "Type a message..." |
| Ask Question | Question text, "Save to: field", button list | "Ask something..." |
| Condition | `field operator value` expression | "Set a condition..." |
| Set Field | `field = value` assignment | "Set a field value..." |
| Delay | `Wait N unit` | — |
| Action | Icon + action type + optional value | "⚡ tag" (default) |
| Card Carousel | Image/placeholder, title, subtitle, buttons, pagination dots + prev/next | "No cards added" |

### 6.4 Preview Stats Component (`PreviewStatsNode`)

A 4-column grid shown on SendMessage, AskQuestion, and CardCarousel nodes when preview mode is on. Values are **deterministic pseudo-random** based on `hashString(nodeId)` — not real analytics:

| Sent | Delivered | Opened | Clicked |
|------|-----------|--------|---------|
| `40–800` | `92.0–99.9%` | `78.0–99.9%` | `12.0–89.9%` |

### 6.5 Button Types (Quick Replies)

Each Send Message and Ask Question node supports configurable buttons with action types:

| Action Type | Label | Value Example |
|------------|-------|--------------|
| Messenger | Default messaging action | Optional payload |
| AI Step | Trigger AI processing step | `qualify_lead` |
| Open Website | URL navigation | `https://example.com` |
| Call Number | Phone dial | `+1 555 555 5555` |
| Perform Actions | Execute automation action | `add_tag:vip` |
| Condition | Trigger a condition check | `has_email` |
| Randomizer | Random branching | `50/50 split` |
| Smart Delay | Timed delay | `2h` |
| Start another Automation | Cross-automation trigger | Automation name |
| Select Existing Step | Jump to specific step | Step name or id |

### 6.6 Flow Execution Engine

The flow engine (in the Supabase Edge Function `facebook-webhook/index.ts`) processes flows at runtime:

1. Receives incoming message from Messenger webhook
2. Parses `FB_BOT_FLOW_JSON` to build node/edge graph
3. Finds the Start node and checks trigger match
4. Traverses edges in BFS order (max 100 steps, max 3 replies)
5. Processes each node type:
   - **sendMessage** → builds text reply with optional quick_replies array
   - **askQuestion** → builds text + quick_replies, saves response to context
   - **condition** → evaluates expression, branches via `yes`/`no` handle
   - **setField** → stores field in runtime context
   - **cardCarousel** → builds generic template attachment
   - **delay/action** → passed through (runtime limitation — delays not executed)
6. Sends replies via Facebook Send API

---

## 7. Facebook Messenger Integration

### 7.1 OAuth Connection Flow

```
User clicks "Connect Facebook Page"
        │
        ▼
/api/facebook/connect
  └─ Sets fb_oauth_state cookie (CSRF)
  └─ Redirects to Facebook OAuth dialog
        │
        ▼
Facebook OAuth consent
        │
        ▼
/api/facebook/callback
  └─ Validates state + code
  └─ Exchanges code for short-lived token
  └─ Fetches user's Pages (GET /me/accounts)
  └─ Stores pages in pending selection (15 min expiry)
  └─ Redirects to /facebook/select?selection=<id>
        │
        ▼
/facebook/select
  └─ User picks which Page to connect
  └─ POST /api/facebook/select → saves connection to .data/ file
  └─ Redirects back to home with ?fb=connected
```

### 7.2 Webhook Endpoints (Two Implementations)

**⚠️ Graph API Version Inconsistency**: Next.js webhook uses `v21.0`, Edge Function uses `v25.0` (from env `FB_GRAPH_API_VERSION`). These should be unified to avoid unexpected behavior.

#### 1. Next.js Route (`/api/webhook`)
- GET: Webhook verification (`hub.mode`, `hub.verify_token`, `hub.challenge`)
- POST: HMAC-SHA256 signature verification via `x-hub-signature-256` + `FB_APP_SECRET`
- **Currently echoes messages**: `sendTextMessage(psid, "Echo: {text}")` — no flow engine
- Uses **Graph API v21.0** (hardcoded)
- Good for development / single-tenant

#### 2. Supabase Edge Function (`supabase/functions/facebook-webhook/`)
- **Full flow engine** — parses `FB_BOT_FLOW_JSON` and executes node graph
- Supports sendMessage, askQuestion, condition, setField, cardCarousel
- HMAC-SHA256 via Web Crypto API (Deno-native)
- Deno v2 runtime, `verify_jwt = false`
- Uses **Graph API v25.0** (configurable via `FB_GRAPH_API_VERSION` env)
- Production-ready for multi-tenant

### 7.3 Persistent Menu

Full CRUD for Messenger persistent menu:
- **GET** — Fetch current menu from Facebook
- **POST** — Set menu with call_to_actions array
- **DELETE** — Remove menu from page
- Supports postback (bot action) and web_url (website link) item types
- Composer input disable toggle

### 7.4 Flow Publishing

Two publishing mechanisms:

1. **Per-automation save**: PATCH `/api/automations/[id]/flow` — saves flow_json to Supabase `automations` table per-automation
2. **Global publish**: POST `/api/flow/publish` — sets `FB_BOT_FLOW_JSON` as a Supabase project secret via Management API (for the Edge Function to consume)

---

## 8. UI & UX

### 8.1 Layout

- **Collapsible sidebar** with icon mode: Home, Contacts, Automation, Settings
- **Header** with breadcrumb navigation, preview toggle, sign out
- **Workspace tabs**: Home (dashboard), Contacts, Automation (list + builder), Settings
- **Dark theme** with CSS variables (bg, surface, border, text, accent, etc.)

### 8.2 Design System

- shadcn/ui components (sidebar, sheet, tooltip, skeleton, separator, button, input, context-menu)
- Tailwind CSS v4 with `@tailwindcss/postcss`
- Custom CSS variables for theming
- `tw-animate-css` for animations
- `class-variance-authority` + `tailwind-merge` for component variants
- Lucide icons for navigation

### 8.3 UI States

- **Loading**: "Loading..." text, spinner-free minimal approach
- **Empty**: "No contacts found" / "No tags yet" messages
- **Error**: Red error banners with specific error messages
- **Saving**: "Saving...", "Publishing...", "Auto-save on" status indicators
- **Sync**: Green checkmark badge when flow is synced to Supabase

---

## 9. API Layer

All API routes are Next.js Route Handlers under `src/app/api/`:

### Automations

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/automations` | List automations (search, filter, pagination) |
| POST | `/api/automations` | Create automation |
| PATCH | `/api/automations/[id]` | Update automation (name, status, trigger, etc.) |
| DELETE | `/api/automations/[id]` | Delete automation |
| GET | `/api/automations/[id]/flow` | Get automation flow JSON |
| PATCH | `/api/automations/[id]/flow` | Save automation flow JSON |
| POST | `/api/automations/[id]/duplicate` | Duplicate automation |

### Contacts

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/contacts` | List contacts (search, filter by status/gender, paginated) |
| GET | `/api/contacts/[id]` | Get contact detail |
| PATCH | `/api/contacts/[id]` | Update contact (tags, paused_automations, status) |

### Facebook

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/facebook/status` | Check connection status |
| GET | `/api/facebook/connect` | Initiate OAuth (redirects to Facebook) |
| GET | `/api/facebook/callback` | OAuth callback handler |
| GET | `/api/facebook/pages` | Get pending page selection |
| POST | `/api/facebook/select` | Confirm page selection |
| POST | `/api/facebook/disconnect` | Clear connection |
| GET | `/api/facebook/persistent-menu` | Get persistent menu |
| POST | `/api/facebook/persistent-menu` | Set persistent menu |
| DELETE | `/api/facebook/persistent-menu` | Delete persistent menu |

### Flow

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/flow/publish` | Publish flow to Supabase secrets (Management API) |

### Webhook

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/webhook` | Facebook webhook verification |
| POST | `/api/webhook` | Receive incoming messages (echo bot) |

### Auth

| Path | Purpose |
|------|---------|
| `/login` | Sign in / Sign up page |
| Middleware | Session check, redirect protection |

---

## 10. Database Schema (Supabase)

### `automations` table

```sql
CREATE TABLE automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('live', 'draft', 'off')) DEFAULT 'draft',
  runs INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  trigger TEXT CHECK (trigger IN ('keyword', 'default', 'button', 'ref')) DEFAULT 'default',
  trigger_state TEXT CHECK (trigger_state IN ('active', 'inactive')) DEFAULT 'active',
  keywords TEXT[] DEFAULT '{}',
  folder TEXT DEFAULT 'General',
  flow_json JSONB DEFAULT '{"nodes":[],"edges":[]}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### `contacts` table

```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  gender TEXT CHECK (gender IN ('female', 'male', 'unknown')) DEFAULT 'unknown',
  language TEXT,
  status TEXT CHECK (status IN ('subscribed', 'unsubscribed')) DEFAULT 'subscribed',
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  contact_time TEXT,
  avatar_url TEXT,
  tags TEXT[] DEFAULT '{}',
  subscription_lists TEXT[] DEFAULT '{}',
  opted_in_through TEXT DEFAULT '',
  paused_automations BOOLEAN DEFAULT false,
  psid TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 10.4 Seed Data

Seed data is embedded directly in migration files (no separate `seed.sql` — file referenced in `config.toml` but absent):

**5 Contacts** (Mongolian names, initial market focus signal):
| First | Last | Gender | Tags | Subscriptions |
|-------|------|--------|------|---------------|
| Tsedev | Amgalan | female | `{vip}` | `{Promo & Updates}` |
| Ujin | Enkhtsogt | female | `{}` | `{Promo & Updates}` |
| Ganbaatar | Nomin Erdene | female | `{new lead}` | `{}` |
| Odnoo | Odgoo | female | `{}` | `{}` |
| Bayanmunkh | Bayarsaikhan | male | `{}` | `{}` |

**4 Automations**:
| Name | Status | Runs | CTR | Trigger | Keywords | Folder |
|------|--------|------|-----|---------|----------|--------|
| Mendchilgee | live | 914 | 83.5% | keyword | me, m3, hi, ca, эх, ge, үн | Help menu |
| Hugatsaa | live | 334 | 77.9% | keyword | her udaj garah we | Main Menu |
| Zahialga burtgel | draft | 0 | 0% | keyword | zахиалга | Main Menu |
| Comment Reply | live | 120 | 0% | default | specific post, reel | General |

### 10.5 Backend Access

| Key | Purpose | Source |
|-----|---------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side DB access (REST API) | Server env |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Client + server |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Client-side anon key (non-standard name) | Client env |
| `SUPABASE_MANAGEMENT_ACCESS_TOKEN` | Supabase Management API (for flow publishing) | Server env |

---

## 11. Project Configuration & Tooling

### 11.1 Environment

| Config | Value |
|--------|-------|
| Node.js | >=20.9.0 <25 (pinned: 22.x) via `.nvmrc` |
| Package manager | npm + pnpm (both lockfiles present) |
| Workspace builds | pnpm allows: msw, sharp, unrs-resolver |
| Dev server | `next dev --turbopack` |
| Build | `next build` |
| Lint | `next lint` (ESLint 9) |
| TypeScript | `^5.7.0`, strict mode |
| Path alias | `@/` → `./src/*` |

### 11.2 Bundle & Config Files

| File | Purpose |
|------|---------|
| `.nvmrc` | Node version pinning (22) |
| `tsconfig.json` | Strict TS, ES2017 target, bundler module resolution |
| `postcss.config.mjs` | Tailwind CSS v4 PostCSS plugin |
| `next.config.ts` | Turbopack root pin, disable filesystem cache |
| `components.json` | shadcn/ui config (base-nova style, RSC enabled) |
| `.gitignore` | Ignores `.next/{build,cache,dev,diagnostics}` and `node_modules` — **dangerously minimal** |
| `package.json` / `pnpm-lock.yaml` / `package-lock.json` | Dependencies (both npm and pnpm — **potential conflict**) |
| `pnpm-workspace.yaml` | Allows specific package builds |

### 11.3 Supabase Local Config

| Setting | Value |
|---------|-------|
| Project ID | `web` |
| API port | 54321 |
| DB port | 54322 |
| Studio port | 54323 |
| DB version | 17 |
| Auth: JWT expiry | 3600s (1 hour) |
| Auth: signup | Enabled |
| Auth: email confirm | Disabled |
| Auth: min password | 6 chars |
| Edge Runtime | Deno v2, per-worker policy |
| Facebook webhook fn | `verify_jwt = false` |
| Realtime | Enabled |
| Storage | Enabled (50MiB limit) |

### 11.4 Scripts

- **`scripts/check-node-for-turbopack.mjs`** — pre-dev script that validates Node.js version (even major >= 20.9, < 25). Exits with error + fix instructions if incompatible.

### 11.5 CI/CD & Infrastructure

| Concern | Status |
|---------|--------|
| Docker | None |
| CI/CD (GitHub Actions) | None |
| Testing (unit, e2e) | None |
| Error tracking | None |
| Logging | console.log only |
| Monitoring | None |
| Rate limiting | None |
| CDN / edge | Not configured |

### 11.6 Key Gaps in Tooling

- **No root README.md** — only a README exists in `supabase/functions/facebook-webhook/`
- **No ESLint config file** — only `next lint` defaults (ESLint v9 is a dependency but no config committed)
- **No Prettier, no lint-staged, no husky** — no code quality automation
- **No .editorconfig** — no cross-editor consistency
- **No PR/issue templates** — no contributing guide

---

## 12. Business Model & Pricing (Aspirational)

> **Note**: No pricing or subscription system is currently implemented. This section outlines a plausible model based on the product's feature set and competitive landscape.

### 12.1 Proposed Pricing Tiers (Market-Aligned)

Based on competitive research: ManyChat's contact-based pricing at 10K contacts = $131/mo, at 25K = $506/mo. Zatly can undercut significantly with flat-rate pricing while maintaining healthy margins. Mongolian market pricing would be adjusted for local purchasing power (~30-40% lower).

| Tier | Price (MO) | Contacts | Automations | Key Differentiator |
|------|-----------|----------|-------------|-------------------|
| **Free** | $0 | 100 | 3 | Full flow builder, 1 Facebook Page, community support |
| **Starter** | $9 | 500 | 10 | All nodes, contacts management, export/import, email support |
| **Pro** | $19 | 2,500 | Unlimited | Persistent menu, analytics, tags, sequences, priority support |
| **Business** | $49 | 10,000 | Unlimited | Multi-page support, all features, 24h support |
| **Agency** | $99 | 100,000 | Unlimited | White-label, share automation, dedicated Slack channel |
| **Self-hosted** | $299 | Unlimited | Unlimited | Full source access, custom deployment, enterprise SLA |

**Pricing strategy rationale**: Flat-rate beats ManyChat's contact-based billing at every tier. At 2,500 contacts: $19/mo (Zatly) vs $29/mo (ManyChat Pro). At 10,000 contacts: $49/mo (Zatly) vs $131.50/mo (ManyChat Business + overages). This is the #1 user complaint and our easiest differentiator.

### 12.2 Potential Revenue Streams

1. **Subscription tiers** — monthly/yearly plans based on contact count and feature access
2. **Usage-based addons** — extra messages, additional Facebook pages
3. **Agency plans** — multi-tenant, white-label, client management
4. **Premium nodes** — AI Step, advanced analytics, A/B testing
5. **Enterprise** — dedicated webhook, custom integrations, SLA

### 12.3 Monetization Hooks in Current Code

- Facebook persistent menu references "Pricing" (`MENU_PRICING` payload)
- "Convert channels" and "Duplicate to another page" suggest multi-tenant/agency plans
- "Share" automation implies collaboration features
- Node-level analytics (sent, delivered, opened, clicked rates) are premium-ripe

---

## 13. Roadmap (Updated with Competitive Insights)

### Phase 1 — Core Launch ✅
- [x] Flow builder canvas with 8 node types
- [x] Automation CRUD (create, read, update, delete, duplicate)
- [x] Contacts management with tags and filters
- [x] Facebook OAuth page connection
- [x] Persistent menu management
- [x] Supabase auth (email/password)
- [x] Flow auto-save and publish to Supabase
- [x] Webhook handling (Next.js echo bot)

### Phase 2 — Production Hardening & Launch Prep 🔧 (HIGHEST PRIORITY)
- [ ] **Fix API route auth** — add session validation to all API routes (critical security gap)
- [ ] **Add input validation** — zod schemas on all API routes (security + DX)
- [ ] **Move Facebook credentials from .data/ file to DB with encryption** — security risk
- [ ] **Add testing** — Vitest for unit tests, Playwright for E2E (zero tests currently)
- [ ] **Add CI/CD** — GitHub Actions for lint, typecheck, test on push
- [ ] **Resolve lockfile conflict** — decide npm vs pnpm, remove the other
- [ ] **Add .env.local to .gitignore** — prevents credential leakage
- [ ] Complete flow engine execution (delay, action execution at runtime)
- [ ] Unify Graph API version (v21.0 → v25.0 across both webhooks)
- [ ] Add rate limiting to webhook and auth endpoints
- [ ] Contact import (CSV/JSON)
- [ ] Multi-page support (connect multiple Facebook Pages)
- [ ] Action execution — tag, subscribe, unsubscribe, webhook calls
- [ ] Suppress raw Supabase error text in API responses
- [ ] Add error.tsx / not-found.tsx pages

### Phase 3 — Mongolian Market Launch 🇲🇳 (Q3 2026 — HIGHEST BUSINESS PRIORITY)

**Competitive context**: Zero visual builders exist in Mongolian. All "competitors" are ManyChat resellers (Nathouse, BZP) or custom dev shops (GreenSoft). First-mover window is open but may close as global players localize.

- [ ] **Full Mongolian language UI** — all interface strings translated (competitors are English-only; this is the single biggest differentiator)
- [ ] **Mongolian-language pre-built templates** — flows for local use cases (help menu, product ordering, service booking, promotions)
- [ ] **Localized onboarding** — Mongolian-language docs, video tutorials, tooltips throughout the builder
- [ ] **Mongolian payment gateway integration** — QPay, SocialPay, MonPay for in-chat payments and subscription billing
- [ ] **Facebook Group community building** — leverage Mongolia's group-centric social culture (more influential than Business Pages)
- [ ] **Agency partner program** — target Nathouse, BZP, and other ManyChat resellers with better economics than ManyChat's reseller program
- [ ] **Mobile-optimized builder** — 96% mobile social media access in Mongolia
- [ ] **Low-bandwidth mode** — optimize for connectivity variations in rural areas (30.5% of population is rural)
- [ ] **Mongolian-market pricing tier** — ~$5-50/mo adjusted for local purchasing power (benchmark: GreenSoft ~$14/mo for 5K users)
- [ ] **Micro-influencer partnerships** — Facebook groups and Instagram micro-influencers (10-50K followers) as distribution channels

### Phase 4 — Growth Features 🚀 (Competitive Parity)
- [ ] Sequence automations (multi-step drip campaigns) — ManyChat has this
- [ ] Rules engine (event → condition → action)
- [ ] Template library (pre-built flow templates) — ManyChat's #1 strength
- [ ] Node analytics dashboard (real sent/delivered/opened/clicked data)
- [ ] Automation folder management
- [ ] A/B testing for messages
- [ ] Email notifications for admin (notify action)

### Phase 5 — AI Differentiation 🤖 (Beat Competitors)
- [ ] **Knowledge base / RAG integration** — train bot on website, PDFs, docs. ManyChat cannot do this
- [ ] **Real LLM integration** — GPT/Claude for natural conversation (vs ManyChat's fake "AI Step")
- [ ] **AI Flow Builder Assistant** — generate flows from natural language descriptions
- [ ] **Smart reply suggestions** based on conversation history
- [ ] **Auto-translate flows** to multiple languages (ManyChat/Chatfuel require manual duplication)
- [ ] **Voice note processing** — handle growing Instagram voice message format
- [ ] In-chat appointment booking (many competitors lack this)

### Phase 6 — Monetization 💰
- [ ] Stripe subscription integration
- [ ] Tiered feature gating (free → starter → pro → business → agency)
- [ ] Self-hosted license tier (unique differentiator vs SaaS-only competitors)
- [ ] Agency plans with multi-tenant
- [ ] White-label option

### Phase 7 — Platform Expansion 🌐
- [ ] Instagram Messaging support
- [ ] WhatsApp Business API integration
- [ ] Web chat widget (competitors like Tidio have this)
- [ ] SMS integration (Twilio)
- [ ] API for custom integrations

### Strategic Recommendations Summary

| Priority | Action | Rationale | Impact |
|----------|--------|-----------|--------|
| 🔴 P0 | Fix security gaps (API auth, input validation, .env.local) | Prerequisite for any production deployment | Critical |
| 🔴 P0 | Launch Mongolian market first | Zero competition, 2.1M Facebook users, first-mover advantage | High |
| 🟠 P1 | Flat-rate pricing model | ManyChat's #1 complaint is cost escalation. Easy win. | High |
| 🟠 P1 | Build template library | ManyChat's strongest moat. Needed for parity. | Medium |
| 🟡 P2 | Add RAG/LLM integration | Differentiate from ManyChat's fake AI. Long-term moat. | High |
| 🟡 P2 | Self-hosted option | Unique in market. Appeals to privacy-conscious segment. | Medium |
| 🔵 P3 | Multi-channel (Instagram, WhatsApp) | User expectation in 2026. Competitors already have it. | Medium |
| 🔵 P3 | White-label / Agency | Enables partner channel and higher revenue per customer. | Medium |

---

## 14. Competitive Landscape — Deep Research

### 14.1 Market Overview & Key Trends

The chatbot builder market is projected to reach **$41.2B by 2033** (CAGR 19.6%), with the conversational AI segment at **$11B in 2026**. Facebook Messenger remains a critical channel with **1.3B+ monthly active users** and is the dominant social platform in emerging markets like Mongolia (75% penetration, 2.1M users).

**Critical 2026 trends** shaping the landscape:
- **AI-native shift**: Tools like FlowGent, SetSmart, and Chatbase are eating ManyChat's lunch by offering real conversational AI that trains on business content, not keyword-based flows
- **Pricing model backlash**: ManyChat's March 2026 move to contact-based billing (free tier cut from 1,000 to 25 contacts) triggered mass user exodus and complaints about cost escalation
- **Multi-channel expectation**: Users want one platform for Messenger, Instagram, WhatsApp, and web chat — not siloed tools
- **Self-hosted / data ownership demand**: Growing privacy consciousness creates demand for self-hostable alternatives to SaaS platforms
- **Emerging market opportunity**: Mongolia has 84.6% internet penetration, 82.4% social media adoption, 2.8M social media users, and Facebook dominance — yet zero local Messenger bot builder competition

### 14.2 Complete Competitive Tier Matrix (Expanded to 27+ Competitors)

The chatbot builder market is segmented into 9 distinct tiers based on focus, pricing, and maturity:

| Tier | Competitors | Pricing (Starting) | Primary Focus | Maturity | Messenger-native? | Visual Builder? | Self-Hostable? |
|------|-------------|-------------------|---------------|----------|-------------------|-----------------|----------------|
| **Market Leader** | ManyChat | $14/mo (effective $29-69 at scale) | Social DM marketing | Mature, 1M+ | ✅ | ✅ Flow builder | ❌ |
| **Legacy Messenger** | Chatfuel, MobileMonkey | $20-39/mo | Messenger automation | Declining | ✅ | ✅ Basic | ❌ |
| **Omnichannel (Chat+Bot)** | Tidio, SendPulse, Respond.io | $10-159/mo | Email + chat + bots | Mature | 🟡 Add-on | ✅ Basic | ❌ |
| **AI-Native Disruptors** | FlowGent, SetSmart, Chatbase, Heyy | $19-99/mo | Conversational AI agents | Growing fast | 🟡 Via API | ❌ Prompt-based | ❌ |
| **Omnichannel (Bot-First)** | **UChat**, BotPenguin | $12.50-15/mo | All-channel bot platform | Growing | ✅ 13 channels | ✅ Flow builder | ❌ (white-label) |
| **AI Agent Builders** | **Voiceflow**, Botpress | $60-150/mo | AI agents for web+voice | Growing fast | ❌ (API-only) | ✅ Advanced | ✅ Botpress OSS |
| **Developer Frameworks** | **Rasa**, Botpress OSS, **Dialogflow** | Free-$35K/yr | Custom AI agent dev | Mature | 🟡 Via integration | ❌ Code/Prompt | ✅ Self-hosted |
| **Enterprise Platforms** | Intercom, Zendesk, **Kore.ai**, **Yellow.ai** | $74-149+/seat/mo | Customer support, contact center | Mature | 🟡 Channel add-on | ✅ Enterprise | ❌ |
| **WhatsApp Specialists** | **WATI**, **Interakt**, **Gupshup** | $20-50+/mo | WhatsApp Business API | Growing | ❌ WhatsApp-focused | 🟡 Basic | ❌ |
| **▲ Zatly (Proposed)** | — | $9-99/mo SaaS, $299 self-hosted | **Messenger-first visual builder** | **Pre-launch** | ✅ Native Messenger | ✅ React Flow v12 | ✅ By design |

### 14.3 Deep Competitor Analysis (Expanded)

#### ManyChat
- **Position**: Market leader for Instagram/Facebook DM automation and marketing funnels
- **2026 Pricing**: Free (25 contacts) → Essential ($14/250) → Pro ($29/2,500) → Business ($69/7,500) + AI $29/mo.
  - Real cost: 10K contacts = $131/mo | 25K contacts = $506/mo
- **G2/Capterra**: 4.5/5, 4.6/5
- **Critical Weaknesses (Zatly Opportunity)**:
  - Pricing punishes growth (#1 complaint across G2, Reddit, Trustpilot)
  - AI Step ($29/mo) is keyword matching, not real AI
  - No knowledge base / content training
  - No auto-translation for multi-language
  - No in-chat booking (ext. Calendly link loses 15-30%)
  - 4-5 day email-only support
  - Per-channel rework needed
  - Free plan gutted to 25 contacts (was 1,000)

#### Chatfuel
- **Position**: Legacy beginner-friendly Messenger/IG/WA bot builder
- **2026 Pricing**: $20/mo (1K conversations). WA pricing separate at $49.49/mo
- **Critical Weaknesses**: No cross-channel flow duplication, outdated UI, limited AI (keyword only + ChatGPT block), no website widget, no auto-translation, limited analytics, poor support

#### MobileMonkey
- **Position**: Lead-gen focused omnichannel chatbot for B2B
- **2026 Pricing**: Starting at $99/mo
- **Critical Weaknesses**: Clunky interface, confusing pricing tiers, mixed support reviews, B2B-only focus

#### SendPulse
- **Position**: Multi-channel marketing suite (email + SMS + chatbots)
- **2026 Pricing**: Starting at ~$10/mo (subscriber-based, custom plans)
- **Critical Weaknesses**: Not Messenger-first, shallow bot builder (fewer node types), subscriber-based pricing unpredictable, shallow Messenger-specific features

#### Tidio
- **Position**: Website chat + basic Messenger for eCommerce
- **2026 Pricing**: Free → Starter $29/mo → Plus $749/mo
- **Critical Weaknesses**: Messenger is secondary, Lyro AI struggles with complexity, expensive jump from $29 to $749, no deep Messenger-native features

#### **UChat** (Key Emerging Competitor)
- **Position**: Omnichannel bot platform with white-label, 13 channels
- **2026 Pricing**: Free (200 users) → Business $15/mo (1K users) → Partner $199/mo (white-label)
- **G2**: 4.7/5 (76 reviews) — one of the highest rated
- **Key Strengths**: 13 channels (FB, IG, WA, Telegram, Web, SMS, Slack, Voice, WeChat, Line, Viber, VK, Google Business), 166 templates, white-label partner plan ($199/mo), built-in live chat, eCommerce (Shopify, Woo, PayPal, Stripe), mini-app store (119 apps), omnichannel unified inbox
- **Key Weaknesses (Zatly Opportunity)**:
  - No real AI knowledge base training (only keyword+intent)
  - No auto-translation for multi-language
  - Minimal analytics (no open/click rates per message)
  - No fallback rate tracking
  - UI can be overwhelming (too many features)
  - **No self-hosted option** (white-label but still on UChat infra)
  - **No Mongolian language** (English-only UI)
  - **Not Messenger-native** — channels are add-ons, not deeply integrated

#### **Voiceflow** (Key AI Competitor)
- **Position**: AI agent builder for websites and telephony
- **2026 Pricing**: Free (2 agents, 100 AI tokens) → Pro $60/mo → Business $150/mo → Enterprise custom
- **Key Strengths**: Excellent flow builder, AI knowledge base (train on website/docs), intents + entities, AI agents with instructions, LLM fallback, bring-your-own-LLM, telephony/voice support, 31 templates, Discord community (9K members)
- **Critical Weaknesses (Zatly Opportunity)**:
  - **No native Messenger, Instagram, or WhatsApp support** (only via third-party Flowbridge)
  - **No live chat built in** (must code handoff yourself)
  - **Minimal analytics** — no flow-level metrics, no conversion tracking
  - **No contact management** — no user profiles, no tags, no segments
  - **No broadcasts, sequences, or marketing features**
  - **No eCommerce** — no Shopify, no in-chat payments
  - **No Mongolian language** — English-only
  - **$60/mo starting price** — expensive for SMBs

#### **Botpress** (Key Open Source Competitor)
- **Position**: Open-source AI agent platform for building and deploying chatbots
- **2026 Pricing**: Free (100 conversations) → Plus $150/mo (250 convos) → Team $750/mo (1,500) → Enterprise custom
  - May 2026 update: Unlimited bots, AI Spend bundled, per-conversation billing
- **Key Strengths**: Open-source, self-hostable, AI-native, knowledge base, tables, integrations hub, AI helpdesk (Desk), visual flow editor, agentic reasoning, built-for-you managed service ($1,650/mo)
- **Critical Weaknesses (Zatly Opportunity)**:
  - **Pricing is expensive for volume** — $150/mo for only 250 conversations
  - **Developer-focused** — steep learning curve for non-technical users
  - **No native Messenger/IG marketing features** — no comment-to-DM, no broadcasts
  - **No eCommerce in-chat payments**
  - **No Mongolian language**
  - **No per-node analytics** (no preview stats)
  - Per-conversation billing — scales costly

#### **Rasa** (Key Open Source Framework)
- **Position**: Developer-first conversational AI framework, self-hosted
- **2026 Pricing**: Developer Edition (Free, up to 1K convos/mo) → Growth $35K/yr → Enterprise custom
- **Key Strengths**: Full control over models, data, hosting, CALM (LLM-native dialogue), Rasa Studio (no-code UI now available), strong in regulated industries, open-source foundations
- **Critical Weaknesses (Zatly Opportunity)**:
  - **Engineering-intensive** — requires dedicated team to maintain
  - **$35K/yr jump** from free to Growth tier is massive
  - **No visual flow builder for FB Messenger** (general NLU/CALM)
  - **No Messenger marketing features** (no comment-to-DM, broadcasts)
  - **No eCommerce features**
  - **No Mongolian language**
  - **No GUI for non-developers** (Studio is basic)

#### **BotPenguin** (Emerging AI Omnichannel)
- **Position**: AI-powered no-code chatbot platform for 6+ channels
- **2026 Pricing**: Free → Little $12.50/mo (3K msgs) → King $41.66/mo (12K msgs) → Enterprise custom
- **Key Strengths**: AI chatbot training on knowledge base, ChatGPT integration, multi-language support, unified inbox, live chat, 80+ integrations, Shopify/WooCommerce
- **Key Weaknesses**: Less mature than UChat/Botpress, limited flow builder, small community, no Mongolian language

#### **Kore.ai** (Enterprise AI)
- **Position**: Enterprise conversational AI platform
- **2026 Pricing**: Essential $50/mo → Advanced $150/mo → Enterprise custom (session-based + seat-based)
- **Key Strengths**: Enterprise-grade, voice AI, contact center AI, multi-language, agent assist
- **Critical Weaknesses**: Opaque pricing (no public page), session-based billing unpredictable, enterprise complexity, steep learning curve, long implementation cycles

#### AI-Native Newcomers (FlowGent, SetSmart, Heyy, Chatbase)
- **Position**: AI agents that train on business content, not flow builders
- **2026 Pricing**: $19-199/mo
- **Key Weaknesses (Zatly Opportunity)**: Less visual flow control, not Messenger-specialized, higher price points for full AI, no self-hosting, smaller user bases

#### WhatsApp Specialists (WATI, Interakt, Gupshup)
- **Position**: WhatsApp Business API platforms with basic chatbot capabilities
- **2026 Pricing**: $20-50+/mo + Meta per-conversation fees
- **Key Weaknesses (Zatly Opportunity)**: WhatsApp-only, no Messenger/IG native support, no visual flow builders (mostly template-based), complex pricing with Meta add-on fees

### 14.4 Complete Competitive Pricing Comparison at Scale

| Contacts/Month | ManyChat | Chatfuel | Tidio | UChat | Botpress | Voiceflow | Rasa | BotPenguin | SendPulse | **Zatly (Proposed)** |
|---------------|----------|----------|-------|-------|----------|-----------|------|-----------|-----------|---------------------|
| Free | 25 cont. | None | Unlimited msgs | 200 users | 100 convos | 2 agents | 1K convos | 1K msgs | 500 subs | **100 contacts** |
| 500 contacts | $14 | $20 | $29 | $15 | $150 | $60 | Free | $12.50 | ~$15 | **$9** |
| 2,500 contacts | $29 | $45 | $29 | $20 | $150 | $60 | Free | $12.50 | ~$30 | **$19** |
| 5,000 contacts | $69 | $300+ | $29 | $25 | $150* | $60* | Free* | $41.66 | ~$50 | **$29** |
| 10,000 contacts | $131 | $300+ | $749 | $35 | $450† | $150† | $35K/yr | $41.66 | ~$100 | **$49** |
| 25,000 contacts | $506 | Enterprise | Enterprise | $70 | $750† | $150† | $35K/yr | Custom | ~$250 | **$99** |
| Self-hostable | ❌ | ❌ | ❌ | ❌ (white-label) | ✅ Open source | ❌ | ✅ Open source | ❌ | ❌ | **✅ $299/mo** |

*\* Within free tier limits for light use. †Botpress conversation packs; Voiceflow credit packs.*

### 14.5 Feature Gap Analysis — What Competitors Are Missing (Expanded)

| Feature Gap | Competitors That Miss It | Zatly Status | Opportunity |
|------------|------------------------|-------------|-------------|
| **Self-hostable / data ownership** | All SaaS competitors (ManyChat, Tidio, UChat, Voiceflow, etc.) | ✅ Architected for this | Unique — no Messenger bot offers self-hosting |
| **Mongolian language / Central Asia focus** | All 27+ competitors (English-first) | ✅ Seed data exists | First-mover in untapped 2.7M user market |
| **Flow engine webhook (custom endpoint)** | Most (ManyChat, UChat locked to their servers) | ✅ Supabase Edge Function | Developer-friendly differentiation |
| **Supabase-native / data portability** | All competitors (proprietary DB) | ✅ Supabase Postgres | Users own their data, full export |
| **Modern UI (React Flow v12)** | ManyChat, Chatfuel, BotPenguin (dated) | ✅ React Flow v12, Tailwind v4 | UX advantage vs legacy builders |
| **10 button action types** | Most (3-5 max: ManyChat, Chatfuel, UChat) | ✅ 10 types inc. AI Step, Randomizer | Granularity unmatched |
| **Undo/Redo with 100-level history** | None (ManyChat ✗, Chatfuel ✗, UChat ✗) | ✅ Built-in | UX quality signal |
| **Auto-layout / snap-to-grid** | Few (Chatfuel basic, most don't) | ✅ Built-in | Flow builder polish |
| **Per-node preview analytics** | **None in market** | ✅ Built-in (deterministic) | **Unique UX delight** |
| **Contact tags + subscription lists** | ManyChat (basic), Chatfuel (basic), Tidio (basic) | ✅ Built-in dual system | Better segmentation |
| **In-chat payments** | ManyChat ✗, Chatfuel ✗, UChat ✅ (Stripe/PayPal), BotPenguin ✅ | 🟡 Planned | Important for Mongolia (QPay/SocialPay) |
| **Comment-to-DM automation** | ManyChat ✅ (best-in-class), UChat ✅ | 🟡 Planned | Must-have for parity |

### 14.6 User Pain Points Summary (from G2, Capterra, Reddit, Trustpilot, AppSumo)

| Pain Point | Frequency | Affected Competitors | Zatly Solution |
|-----------|-----------|---------------------|----------------|
| **Cost escalates with growth** | 🔴 Very High | ManyChat (#1 complaint), SendPulse, Botpress (conversation-based) | Flat-rate predictable pricing |
| **AI is not real AI** | 🔴 High | ManyChat, Chatfuel, MobileMonkey, UChat (keyword only) | Plan real LLM + RAG integration |
| **Customer support is slow/nonexistent** | 🔴 High | ManyChat (4-5 day email), Chatfuel, MobileMonkey | Small team = personal support |
| **Cannot duplicate flows across channels** | 🟡 Medium | Chatfuel, ManyChat | Architecture supports multi-channel |
| **Multi-language requires manual rebuild** | 🟡 Medium | ManyChat, Chatfuel, Voiceflow, UChat | Mongolian-first, plan i18n |
| **UI feels dated / overwhelming** | 🟡 Medium | Chatfuel, MobileMonkey, UChat (too complex) | Modern React Flow UI, progressive disclosure |
| **No knowledge base / content training** | 🟡 Medium | ManyChat, Chatfuel, UChat | Plan RAG-based AI integration |
| **Locked into proprietary data store** | 🟡 Medium | All SaaS competitors | Supabase Postgres — full data export |
| **No self-host / data sovereignty** | 🟡 Medium | All SaaS (ManyChat, UChat, Tidio, Voiceflow, BotPenguin) | Self-hostable by design (+$299 license) |
| **Analytics are too basic** | 🟡 Medium | Voiceflow, UChat, Chatfuel (no open/click rates, no fallback tracking) | Per-node preview + real analytics planned |
| **No built-in live chat** | 🟡 Medium | Voiceflow (must code), Rasa (none) | Plan live chat integration |
| **Overwhelming features / hard to start** | 🟡 Medium | UChat (#1 complaint: "too many features") | Progressive onboarding, guided flows |
| **No in-chat payments** | 🟢 Low | ManyChat, Chatfuel, Voiceflow | Plan in-chat payments (critical for Mongolia) |
| **Billing after cancellation** | 🟢 Low-Medium | ManyChat (multiple Trustpilot reports) | Clean, transparent billing |
| **No voice note support** | 🟢 Low | ManyChat, Chatfuel, UChat | Future opportunity |
| **Messenger is an afterthought** | 🟡 Medium | Tidio, SendPulse, Voiceflow, Botpress | Messenger-native by design |

### 14.8 Key Architectural Observations

1. **No competitor combines all three: visual flow builder + Messenger-native + self-hostable.** ManyChat has visual builder + Messenger-native but no self-host. Rasa has self-host + AI but no visual builder. Botpress has open-source + visual builder but no Messenger-native (and conversation pricing is expensive). This is Zatly's unique positioning.

2. **The pricing model landscape is shifting:**
   - Contact-based: ManyChat (billed for stored contacts)
   - Conversation-based: Botpress, Rasa (billed per conversation/session)
   - Feature-tiered: UChat ($15-199/mo), Voiceflow ($60-150/mo), BotPenguin ($12.50-41.66/mo)
   - Seat-based: Intercom, Zendesk, Kore.ai ($74-149/seat/mo)
   - Enterprise custom: Kore.ai, Rasa ($35K/yr), Yellow.ai
   - **Flat-rate (proposed)**: Zatly — most predictable, easiest to understand

3. **The AI divide is real:** Legacy tools (ManyChat, Chatfuel, UChat) use keyword matching. Modern tools (Voiceflow, Botpress, FlowGent) use LLMs + RAG. Zatly must bridge this gap in Phase 5.

4. **Open-source options exist but are developer-heavy:** Botpress and Rasa offer self-hosting but require engineering teams. No "self-hostable Messenger bot" is one-click deployable. Zatly could be the first.

5. **Mongolian market is completely uncontested:** None of the 27+ analyzed competitors offer Mongolian language UI, Mongolian payment integrations, or Central Asian market focus. Zatly's seed data already targets this.

6. **White-label is a growing segment:** UChat's partner plan at $199/mo is popular with agencies. Botpress offers "Built for You" at $1,650/mo. Zatly can target mid-market agencies with its self-hosted white-label option at $299/mo.

### 14.9 Mongolian Market Deep Dive

Research confirms Mongolia as a strategic beachhead with uniquely favorable conditions.

**Digital Landscape (DataReportal 2026)**:
- **2.70M social media users** (76.5% of 3.53M population) — growing 8% YoY
- **Facebook**: 2.70M users (76.5% penetration), equating to 92.2% of all internet users
- **Messenger**: 2.30M users (65.2% penetration) — 78.5% of all internet users
- **Instagram**: 1.20M users, growing 18.2% YoY — strong female skew (57.1%)
- **Internet penetration**: 83.0% (2.93M users), 92% broadband mobile
- **Median age**: 26.9 — extremely young, digitally native population
- **Mobile-first**: 141% mobile connection penetration, 92% on broadband
- **Facebook Groups as primary community hubs**: More influential than Business Pages for commerce
- **Localization expectation**: Mongolian-language content outperforms English 4:1 to 8:1

**Actual Competitors in Mongolia (Field Research)**:

The "competition" is not other visual flow builders — **it's ManyChat resellers and custom dev shops**:

| Competitor | Type | Platform | Est. Reach | Pricing | Zatly Advantage |
|-----------|------|----------|-----------|---------|-----------------|
| **Nathouse.mn** | ManyChat Reseller (Official Expert) | ManyChat | ~5K FB followers | Setup fee + monthly subscription | They resell ManyChat (same pricing pain, no self-host) |
| **BZP Digital** | ManyChat Reseller (Official Partner) | ManyChat | 80+ clients built | Setup fee + ManyChat sub | Same — reselling ManyChat's weaknesses |
| **GreenSoft.mn** | Custom Dev (GREENBOT system) | Proprietary | Established MN company | ~50K₮/mo ($14) for 5K users | Custom builds only, no self-serve builder |
| **Chatbot.mn** | SaaS chatbot platform | Proprietary React SPA | 10,731 FB likes | Unknown (HubSpot + GTM tracked) | Generic VS, not Messenger-specialized |
| **Chat.Co** | SMMA | ManyChat | 178 FB likes | Unknown | Tiny operation |
| **Botsify** | Global AI Agent Platform | Proprietary | 150K+ users globally | Paid (agency model) | Not local, English-only, not Messenger-focused |

**Critical Findings**:

1. **No Mongolian-language visual flow builder exists** — zero competitors offer a self-serve drag-and-drop bot builder in Mongolian
2. **The "local competition" is ManyChat's distribution channel** — Nathouse and BZP are ManyChat resellers. If Zatly offers a better product with Mongolian UI, these agencies could become Zatly partners instead
3. **GreenSoft's GREENBOT is custom dev only** — they build bespoke chatbots per client, no self-serve platform. Their pricing is the local benchmark: ~$14/mo for 5K users
4. **Botsify is a global player with a Mongolia landing page** — not a local company, likely no Mongolian-language support
5. **Custom dev shops dominate** — most Mongolian businesses that want chatbots must pay agencies for custom one-off builds. There's no SaaS product they can use directly
6. **Messenger is the undisputed channel** — 2.30M Messenger users vs 1.20M Instagram. Facebook Groups are the primary commerce and community hubs

**Updated Opportunity Assessment**:

| Factor | Assessment |
|--------|-----------|
| Direct visual builder competition | **Zero** — no competitor offers a self-serve visual flow builder in Mongolian |
| ManyChat reseller threat | **Low-moderate** — they'd drop ManyChat for a better Mongolian-language product with better economics |
| Custom dev shop threat | **Low** — they solve different needs (custom builds vs self-serve SaaS) |
| Market readiness | **High** — 2.3M Messenger users, 92.2% of internet users on Facebook, businesses already asking for chatbots |
| Pricing ceiling | ~$14/mo (local benchmark from GreenSoft) — but Zatly can offer more value at similar price |
| Growth trajectory | 8% YoY social media user growth, 18.2% Instagram growth, 7% Messenger growth |
| Gateway potential | Proven campaigns tested in Mongolia translate well to Kazakhstan, Kyrgyzstan markets |

**Key insight**: "Mongolia's social media landscape represents something increasingly rare in Asia: genuine first-mover advantage combined with a digitally native population hungry for international brands." — Hashmeta, 2026

### 14.10 Zatly's Strategic Differentiation

**Primary Moats**:
1. **Mongolian market first-mover** — zero competition, 2.1M Facebook users, untapped demand for Messenger automation in local language
2. **Self-hostable / Supabase-native** — users own their data, can deploy to own infrastructure. Growing privacy-conscious segment has no good option
3. **Modern tech stack** — React Flow v12 + Next.js 16 + Tailwind v4 creates UX that legacy competitors (Chatfuel, ManyChat's dated builder) cannot match
4. **Developer-friendly** — TypeScript, clean API, Supabase Edge Functions, full data portability. Competitors are no-code-only walled gardens

**Secondary Advantages**:
- Predictable flat-rate pricing (vs ManyChat's contact-based cost explosion)
- Rich node system (10 button action types vs competitors' 3-5)
- Undo/redo, auto-layout, snap-to-grid — UX polish absent from competitors
- Contact tags + subscription lists = better segmentation than any competitor at similar price point
- Per-node preview analytics — unique visual delight

**Critical Risks to Address Before Launch**:
1. No API route authentication (all data exposed)
2. No input validation (security risk)
3. File-based Facebook credentials in .data/ (encrypt or move to DB)
4. No testing infrastructure (zero tests)
5. No CI/CD
6. Graph API version inconsistency (v21.0 vs v25.0)
7. Dual lock files (npm + pnpm conflict) — choose one
8. Missing .env.local in .gitignore

---

## 15. Security & Risk Assessment

### 15.1 Current Risks

| Risk | Severity | Description |
|------|----------|-------------|
| **No API route auth** | High | API routes have no authentication — only page-level middleware protects pages. Direct API calls bypass all auth. |
| **Service role key exposure** | High | If any API route leaks Supabase service role key in error messages, full DB access is compromised |
| **No input validation** | Medium | No zod/joi validation on any API route — raw request bodies processed directly |
| **File-based credentials** | Medium | Facebook access tokens stored in `.data/` as plain JSON — not encrypted |
| **Seed data in migrations** | Low | Sample contacts with real-looking PSIDs mixed with schema — risk if deployed to production as-is |
| **No CSRF on mutation endpoints** | Medium | Only OAuth flow has CSRF protection via state cookie |
| **Graph API version inconsistency** | Low | v21.0 hardcoded in Next.js webhook vs v25.0 in Edge Function |
| **No rate limiting** | Medium | Public webhook endpoint has no rate limiting — vulnerable to abuse |
| **Missing .env.local in .gitignore** | High | Real credentials present in `.env.local` but not in `.gitignore` |
| **Dual lock files** | Low | Both `package-lock.json` and `pnpm-lock.yaml` present — version inconsistency risk |
| **No testing** | Medium | Zero test coverage — no unit, integration, or E2E tests |

### 15.2 Recommended Security Improvements

1. Add API route authentication (session check on all non-public routes)
2. Add input validation library (zod) for all API routes
3. Encrypt `.data/facebook-page-connection.json` or move to DB with encryption
4. Extract seed data into separate seed.sql (not in migrations)
5. Add CSRF tokens to mutation API routes
6. Add rate limiting to webhook and auth endpoints
7. Suppress raw Supabase error text in API error responses
8. Add `.env.local`, `.data/`, `.next/`, `*.tsbuildinfo` to `.gitignore`
9. Decide on npm vs pnpm and remove the unused lock file
10. Add basic test infrastructure (Vitest + Playwright)

---

*This plan reflects the current state of the codebase. All business model and pricing content is aspirational and not yet implemented.*
