# Component Layer Analysis

> Generated: 2026-05-12
> Scope: `src/components/`, `src/app/[locale]/dashboard/*/page.tsx` patterns

---

## 1. Component Hierarchy Depth

### Layout stack (app-wide)

```
RootLayout (src/app/layout.tsx)
 └─ LocaleLayout (src/app/[locale]/layout.tsx)
     ├─ NextIntlClientProvider
     │   └─ QueryProvider (React Query)
     └─ DashboardLayout (src/app/[locale]/dashboard/layout.tsx)
         ├─ SidebarProvider (context)
         ├─ MobileOverlay (full-screen backdrop)
         ├─ Sidebar
         │   ├─ Branding link
         │   ├─ Nav links (main + settings)
         │   └─ UserMenu
         │       ├─ Avatar, AvatarFallback
         │       └─ DropdownMenu (complex)
         └─ MainContent
             └─ <page component>
```

**Depth**: 4-5 levels of React component nesting from app root to page content. Reasonable.

### Bay View (deepest page — 3 sub-layers)

```
BayViewClient (container, ~400 lines)
 ├─ DndContext
 │   ├─ BaySlot (×N)  ← uses useDroppable
 │   │   ├─ StatusPill
 │   │   ├─ VehicleCard  ← uses useDraggable
 │   │   │   └─ Colored make badge (inline)
 │   │   ├─ MechanicBadge  ← uses useDraggable
 │   │   │   └─ Avatar, AvatarFallback
 │   │   ├─ ElapsedTimer (inline useEffect clock)
 │   │   └─ Action buttons (inline)
 │   ├─ MechanicRoster
 │   │   └─ MechanicChip (×N)  ← uses useDraggable
 │   │       └─ Avatar, AvatarFallback
 │   ├─ WaitingQueue
 │   │   └─ QueuedVehicleCard (×N)  ← uses useDraggable
 │   └─ DragOverlay
 ├─ BayStats (inline component)
 ├─ BayViewToolbar
 ├─ StatusNotesModal
 │   └─ Card, Input, Button
 └─ ToastMessage
```

**Depth within BaySlot**: 5 (BaySlot → VehicleCard → make badge). **Justified** because `BaySlot` composites genuinely distinct visual sub-components (mechanic, status, vehicle, timer, actions). Moving inline action buttons into a separate component would add negligible value.

### New Work Order (single-page wizard)

```
NewWorkOrderPage (~400 lines)
 └─ Step indicator bar (inline)
 └─ Conditional Card per step:
     ├─ Step 1: Customer (SearchInput + customer list + quick-create form)
     ├─ Step 2: Vehicle (SearchInput + vehicle list)
     ├─ Step 3: Services (catalog list + inline service line editor)
     ├─ Step 4: Parts (inline part line editor array)
     ├─ Step 5: Mechanic (MechanicSelect)
     └─ Step 6: Review (summary + totals + Notes input + Create button)
```

**Depth**: Variable (1-3 levels). No extracted sub-steps despite repeated inline-editor patterns (service lines vs part lines share similar structure but are not unified).

---

## 2. Pass-through Components (interface vs implementation)

### Clear keepers (non-trivial logic justifies extraction)

| Component | Lines | Why it earns its file |
|-----------|-------|-----------------------|
| `SearchInput` | 65 | Debounced input, loading spinner, clear button, state management |
| `FilterChips` | 55 | Active/inactive styling, color dots, counts, min-touch targets |
| `ListToolbar` | 60 | Composition & responsive layout for search/filters/actions/stats |
| `DataTable` | 115 | Skeleton loading, empty state, column-based rendering, mobile label pattern |
| `StatusPill` | 45 | Status → icon + styling map, active-pulse for "In Progress" |
| `MechanicBadge` | 70 | DRY drag integration + Avatar + unassigned fallback |
| `MechanicChip` | 80 | DRY drag integration + overload warning + job count |
| `MechanicSelect` | 65 | Wraps `<select>` with icon, job count in options, multiple sizes |
| `StatusNotesModal` | 60 | Modal with escape-to-close, auto-focus, Enter-to-submit |
| `ToastMessage` | 40 | Timer-based auto-dismiss, manual positioning, info/error variants |
| `UserMenu` | 95 | Profile fetch, skeleton loading, dropdown, signout flow |
| `OrganizationSelectionForm` | 140 | Server action integration, PIN setup/verify flow, memoized org selection |
| `DropdownMenu` (composite) | 140 | Context-based open/close, click-outside, compound component pattern |

### Acceptable thin wrappers (justified by pattern)

| Component | Lines | Justification |
|-----------|-------|---------------|
| `ChartContainer` | 20 | A single `ResponsiveContainer` with aspect/height params — thin but provides a consistent chart sizing interface |
| `DynamicAreaChart` etc. | 15 each | Exist solely for dynamic `import()` code-splitting; the `any` types are a downside but intentional |
| `Button`, `Input`, `Card`, `Skeleton`, `Avatar` etc. | 15-40 | Standard shadcn/ui pattern: styled HTML wrappers with CVA/classname merging. Project convention. |
| `PriceDisplay` | 20 | Small but encapsulates MNT formatting + "Last sold" strikethrough — prevents scattered formatting |
| `StatusBadge` | 35 | Simple map lookup + styled span — overlaps with `StatusPill` but uses different styling (traditional badges vs pills). Duplication noted below. |

### Redundancies

- **`StatusBadge` vs `StatusPill`**: Both map status → style. `StatusBadge` uses rounded-full border with bg/text colors. `StatusPill` adds icons and pulse animation. **Recommendation**: Merge into a single `StatusBadge` with a `variant="badge" | "pill"` prop, or delete `StatusBadge` and use `StatusPill` everywhere.
- **`ToastMessage` (hand-rolled) + `sonner`/`<Toaster>`**. The `<Toaster>` from sonner is already wired in `LocaleLayout`. Two different toast systems are active. `ToastMessage` is used only in `bay-view-client.tsx`. **Recommendation**: Migrate bay view to `toast.sonner` and delete `ToastMessage`.

---

## 3. Recurring Patterns

### Pattern A: List Page

Used by: work-orders, customers, vehicles, inventory, services, vehicle-models.

```typescript
// Every list page follows:
function ListPage() {
  // 1. State — items[], loading, error, orgId, search, filter
  // 2. Fetch orgId → fetch items (useEffect with fetch())
  // 3. ListToolbar — SearchInput + FilterChips + actions + stats
  // 4. Card/DataTable — loading skeleton OR error state OR empty state OR rows
  // 5. Row click → router.push to detail page
}
```

**Problem**: The fetch-org-then-fetch-data pattern repeats across every page. No shared hook or HoC abstracts this. Pages wait on org fetch before fetching their data, serializing 2 round-trips.

**Deletion test**: If you delete a list page's component, you lose ~120 lines of custom code that's 85% boilerplate. A shared `useOrg()` hook + `useList()` hook could save ~50 lines per page × 10 pages = ~500 lines.

### Pattern B: Multi-step Form

Used by: New Work Order.

- Step indicator bar (buttons rendering STEP keys with icon/checkmark)
- Per-step `Card` with `CardHeader`/`CardTitle` + `CardContent`
- Back/Continue buttons
- Selected-item preview + "Change" button
- Async submission at final step, sequential POST to API

**Not extracted**, but this is the only full wizard form. Would benefit from extraction if more wizards appear.

### Pattern C: Drag-and-Drop Wiring

Used by: bay-view (3+ draggable types).

Each draggable component uses identical `useDraggable` wiring:
```typescript
const { attributes, listeners, setNodeRef, transform, isDragging } =
  useDraggable({ id, data: { type, ... } });
const style = transform ? { transform: ..., zIndex: 50 } : undefined;
```

Repeated in `VehicleCard`, `MechanicBadge`, `MechanicChip`, `QueuedVehicleCard`. A `Draggable` wrapper component or render-prop could eliminate the repetition, but the current approach gives each component full control over styling and layout — acceptable for now.

### Pattern D: Inline Components

**`BayStats`** in `bay-view-client.tsx` — three stats cards. Could be extracted to its own file but not harmful inline.

**`KpiCard`, `TabBar`, `PeriodBar`, `EmptyDashboardState`, `SectionHeader`** in `dashboard/page.tsx` — these are repeated-use primitives buried in a page. **Recommendation**: Extract `KpiCard` and `SectionHeader` to `src/components/`. The inline `<table>` in the activity tab should use `DataTable` or be replaced with a more consistent abstraction.

### Pattern E: Loading Skeleton

Every page manually maps skeleton arrays:
```typescript
{[1,2,3,4,5].map(n => <Skeleton key={n} className="..." />)}
```

`DataTable` handles this internally, but pages using custom layouts repeat the pattern. A `SkeletonList` or `SkeletonGrid` component could unify this.

---

## 4. Data Flow Patterns

### Current state: three strategies co-exist

| Strategy | Where used | Characteristics |
|----------|-----------|-----------------|
| **Server actions** (`"use server"`) | bay-view, dashboard stats, forms | Direct DB calls from service files. No API route needed. Optimistic updates only in bay count. |
| **Client `useEffect` + `fetch`** | Most list pages, dashboard page, new work order | Two-step: fetch org from `/api/organizations`, then fetch data. No React Query usage despite `QueryProvider`. |
| **Server actions + client fetch hybrid** | New Work Order page | Config data (services, mechanics) fetched in useEffect, create action uses fetch to API routes sequentially. |

### Key observations

1. **React Query is set up but unused**. `QueryProvider` wraps the app, but zero pages use `useQuery`/`useMutation`. All data fetching uses raw `useEffect` + `fetch()`, meaning:
   - No caching between route changes
   - No deduplication of concurrent fetches
   - No request retry
   - No loading/error state abstraction
   - Refetch requires manual `window.location.reload()` or additional effect re-triggering

2. **Org ID bootstrapping is duplicative**. Every page fetches `/api/organizations` (or `/api/profile`) to get the org ID before making data requests. This is a consistent 2-round-trip waterfall. A shared hook or context (e.g., `useOrg()`) could eliminate this.

3. **API routes vs server actions inconsistency**. Bay view uses `"use server"` functions called directly from the client (server actions). Work order pages use REST API routes. The new work order page sends sequential POSTs to multiple API routes rather than a single transaction.

4. **Error handling varies**. Some pages use `toast.error()` (dashboard), some use inline error state (`error` → render error UI + retry button), some mix both (work orders list).

### Recommended data flow

```
@/hooks/use-organization.ts (provides orgId, role, branch)
    ↓
@/lib/services/*.ts (server-side service files, "use server")
    ↓
Pages use either:
  a) Direct server action calls (client components calling "use server" functions)
  b) API routes (for webhook-compatible or 3rd-party accessible endpoints)
  c) useQuery wrapping server actions for caching/refetch
```

---

## 5. Deletion Test Results

### Should be deleted or merged

| Component | Action | Reason |
|-----------|--------|--------|
| `StatusBadge` | Merge into `StatusPill` | Duplicate of `StatusPill` with less functionality |
| `ToastMessage` | Delete, use `sonner` | Project already has `<Toaster>` in layout; adding a second toast system |

### Inline components that should be extracted

| Component | Location | Action |
|-----------|----------|--------|
| `KpiCard` | `dashboard/page.tsx` | Extract to `src/components/kpi-card.tsx` |
| `SectionHeader` | `dashboard/page.tsx` | Extract to shared component or use pattern from `ListToolbar` |
| `TabBar` | `dashboard/page.tsx` | Extract if tab bars appear elsewhere |
| `PeriodBar` | `dashboard/page.tsx` | Extract if period filters appear elsewhere |
| `EmptyDashboardState` | `dashboard/page.tsx` | Extract or merge with `DataTable` empty state pattern |

### Components that pass the deletion test (keep)

All other shared components in `src/components/` pass: each encapsulates enough logic or styling to justify its file.

---

## Summary of Findings

### Strengths

1. ✅ **Coherent layout hierarchy** — sidebar, mobile overlay, content area pattern is clean
2. ✅ **Good separation of UI primitives** — Button, Input, Card, Skeleton follow shadcn convention
3. ✅ **Drag-and-drop composability** — bay-view's DndContext pattern cleanly separates drag sources from droppable targets
4. ✅ **Server-side service layer** — `src/lib/services/` provides clean, testable DB logic
5. ✅ **Consistent list page skeleton** — all list pages follow the same shape (ListToolbar + card/list + rows)

### Weaknesses

1. ❌ **React Query underutilized** — `QueryProvider` wired but unused. Every page re-implements loading/error/empty states with raw `fetch()`.
2. ❌ **Org ID bootstrap waterfall** — every page fetches org/profile before fetching data. Missing a shared `useOrg()` context or hook.
3. ❌ **Duplicate toast system** — `ToastMessage` (hand-rolled) + `sonner` coexist.
4. ❌ **Duplicate status badge** — `StatusBadge` and `StatusPill` overlap.
5. ❌ **Inline page components** — `KpiCard`, `TabBar`, `PeriodBar`, `SectionHeader`, `EmptyDashboardState` are page-scoped and not reusable.
6. ❌ **Manual skeleton mapping** — skeletons duplicated across pages as `[1,2,3,4].map(...)` rather than a shared `SkeletonList` component.
7. ❌ **Grand total computation duplication** — New Work Order page computes `servicesTotal + partsTotal` inline; the same logic lives in work-order detail views.
8. ❌ **Mixed server action / API route pattern** — two patterns for the same thing without clear criteria for choosing one.

### Recommended next file to open

**`src/app/[locale]/dashboard/page.tsx`** — contains the most inline-page components (KpiCard, TabBar, PeriodBar, SectionHeader, EmptyDashboardState) and the best candidate for extraction refactoring. Also demonstrates the org-bootstrap waterfall and raw-fetch pattern that propagates across all pages.

### Estimated extraction savings

| Change | Files touched | Lines saved | Complexity |
|--------|---------------|-------------|------------|
| Merge `StatusBadge` → `StatusPill` | 3 | ~30 | Low |
| Delete `ToastMessage`, migrate bay view to sonner | 3 | ~50 | Low |
| Extract `KpiCard` from dashboard page | 2 | Inline → one import per page | Low |
| Build `useOrg()` hook | 8+ pages | ~40-60 lines saved per page | Medium |
| Migrate list pages to `useQuery` | 10+ pages | ~80-100 lines saved per page with shared error/loading/empty | Medium |

**Total estimated elimination**: ~600-900 lines of duplicated boilerplate.
