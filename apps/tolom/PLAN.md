# TOLOM — UI/UX Flow Fix Plan

## Context

The TOLOM app (garage operating system) has significant UI/UX issues throughout the user flow. The code was built with functionality as the primary concern, resulting in inconsistent patterns, poor tablet UX, missing core features from the MASTER_PLAN (like price memory display), and navigation/information architecture problems.

This plan addresses **Phase 1 tablet-first startup CRM** issues only — aligning with the MASTER_PLAN scope.

## Approach

Address issues in 4 rounds of increasing depth, each building on the previous:

1. **Round A: Fix the homepage + auth flow + nav IA** (highest user-facing impact)
2. **Round B: Fix the core work order flow** (tablet UX + price memory)
3. **Round C: Fix feedback/consistency/trust signals** (loading, errors, confirmations)
4. **Round D: Polish and accessibility**

Within each round, touch the highest-priority pages first.

---

## Files to Modify

| File | Round | Why |
|------|-------|-----|
| `src/app/[locale]/page.tsx` | A | Default Next.js homepage — wrong |
| `src/app/[locale]/dashboard/layout.tsx` | A | Nav IA — hide vehicle-models, rename sections |
| `src/app/[locale]/dashboard/finance/page.tsx` | A | Empty shell — remove from nav or fill |
| `src/app/[locale]/dashboard/work-orders/new/page.tsx` | B | 6-step wizard too heavy; no price memory shown |
| `src/app/[locale]/dashboard/work-orders/[id]/page.tsx` | B, C | Status without confirmation; no notes on transition; no undo |
| `src/app/[locale]/dashboard/work-orders/page.tsx` | B | List improvements |
| `src/app/[locale]/dashboard/vehicles/[id]/page.tsx` | B | Progressive disclosure for fields |
| `src/app/[locale]/dashboard/customers/new/page.tsx` | B | Quick-create from WO flow |
| `src/app/[locale]/dashboard/vehicles/new/page.tsx` | B | Quick-create from WO flow |
| `src/app/[locale]/dashboard/page.tsx` | B, C | Daily goal to backend, mechanic workload |
| `src/components/price-display.tsx` | B | New — reusable last-sold-price + price hint |
| `src/components/ui/input.tsx` | C | Verify consistency |
| `src/components/status-badge.tsx` | C | Fix dark mode variant duplication |
| All page files with error/loading | C | Standardize patterns |
| All page files with button sizing | D | Touch target audit |

---

## Reuse

| Existing Utility | File Path | Use It For |
|-----------------|-----------|------------|
| `SearchInput` | `src/components/search-input.tsx` | Reuse pattern (already done in customer list, replicate to WO list) |
| `MechanicSelect` | `src/components/mechanic-select.tsx` | Already used — good |
| `StatusBadge` | `src/components/status-badge.tsx` | Use everywhere, remove local `_statusBadge` duplicates |
| `Button` | `src/components/ui/button.tsx` | Already used but audit `size` prop usage |
| `Input` | `src/components/ui/input.tsx` | Use consistently, replace raw `<input>` |
| `formatCurrency` | `src/lib/utils.ts` | Already used — good |
| `useCurrentOrg` | `src/lib/queries/use-organization.ts` | Reuse pattern across more pages |

---

## Steps

### Round A — Homepage + Nav IA

- [ ] **A1**: Redirect authenticated users from `/` to `/dashboard`; show a basic landing for unauthenticated (or just redirect everyone to `/auth/login`)
- [ ] **A2**: Remove "Vehicle Models" from sidebar `mainItems`, move it under a sub-section or into Settings
- [ ] **A3**: Merge "Organization" and "Settings" sidebar items into a single "Settings" group with sub-items (or move Organization under Settings)
- [ ] **A4**: Either implement a basic Finance page (show revenue summary, unpaid work orders) OR hide/remove the nav item entirely — an empty page is worse than no page
- [ ] **A5**: Group sidebar into logical sections: **Operations** (Dashboard, Work Orders, Customers, Vehicles, Bay View) | **Settings** (Settings, Organization) | remove Vehicle Models from top level

### Round B — Core Work Order Flow

- [ ] **B1**: Collapse the 6-step wizard into a single-page scrollable form with logical sections:
  - Top row: customer search + vehicle search side by side (compact)
  - Quick-create inline for customer (don't show separate page)
  - Quick-create inline for vehicle
  - Services section: catalog browser with category filter + "last sold price" shown beside each service
  - Parts section: manual entry with last-sold-price hint
  - Mechanic selector
  - Notes field
  - Grand total + Create button always visible (sticky footer)
- [ ] **B2**: Build `PriceDisplay` component that shows: current editable price + "(last: ₮XXX)" hint in muted text, with color coding if price differs from catalog default
- [ ] **B3**: Add plate-number auto-complete to vehicle search (search as you type in the WO form)
- [ ] **B4**: Pre-fill form when customer selected — auto-load their last used vehicle and last service set
- [ ] **B5**: Quick-create customer: inline form (name + phone) that creates and selects in 2 steps, not 6
- [ ] **B6**: Quick-create vehicle: inline form (plate + make/model) that creates and selects in 2 steps
- [ ] **B7**: Add "Save Draft" button that stores to localStorage (so accidental navigation doesn't lose data)
- [ ] **B8**: Replace raw `<input>` elements in service lines with `Input` component for styling consistency

### Round B — Work Order Detail

- [ ] **B9**: Add status change confirmation dialog (especially for "Completed" and "Cancelled")
- [ ] **B10**: Add a notes textarea when changing status — capture mechanic's handover notes
- [ ] **B11**: Add undo snackbar/toast when deleting a service or part (show "Deleted Oil Change — Undo" for 5s)
- [ ] **B12**: Replace the inline add-service search with a scrollable catalog grid that shows categories as tabs — faster for tablet
- [ ] **B13**: Show "last sold price" column in both services and parts lists on the detail page
- [ ] **B14**: Add inline editing for service quantity and price (instead of separate form)

### Round B — Price Memory

- [ ] **B15**: Ensure every price input field in WO new + detail shows the "last sold price" hint from `price_history`
- [ ] **B16**: Add price history tooltip or dropdown when clicking the hint
- [ ] **B17**: Ensure price history is saved on EVERY service/part addition (verify backend saves it)

### Round C — Feedback & Consistency

- [ ] **C1**: Standardize all list loading states to use `<Skeleton>` with proper layout (match customer list pattern which uses TanStack Query + Skeleton)
- [ ] **C2**: Standardize error display: prefer inline error card with retry button + toast for destructive failures
- [ ] **C3**: Add confirmation before all destructive actions (delete customer, delete vehicle, delete service from catalog, cancel work order)
- [ ] **C4**: Move daily goal from localStorage to backend (org settings API) — shared across all users
- [ ] **C5**: Add mechanic workload summary to dashboard (how many WOs per mechanic, who's free)
- [ ] **C6**: Fix the duplicate `_statusBadge` function in work-order detail — use the imported `StatusBadge` component consistently

### Round D — Polish & Tablet UX

- [ ] **D1**: Audit every interactive element for minimum 44px touch target on tablet (check `h-9` buttons, inline icon buttons, select elements)
- [ ] **D2**: Add breadcrumbs to all depth >1 pages (e.g., Work Orders > #12345)
- [ ] **D3**: Add `aria-label` to all icon-only buttons
- [ ] **D4**: Add subtle transitions for: status badge changes, step progression, modal open/close
- [ ] **D5**: Add a global search in the header (search customers/vehicles/WOs from anywhere)
- [ ] **D6**: Clean up form field consistency — replace all raw `<input type="text">` and `<textarea>` with proper `Input`/`Textarea` components
- [ ] **D7**: Add pull-to-refresh on list pages (customers, vehicles, work orders)

---

## Verification

1. **Auth flow**: Start from `/` → should redirect to login or dashboard. Signup → login → dashboard.
2. **Homepage**: Unauthenticated users see a basic page; authenticated users land on dashboard.
3. **New WO flow (tablet)**: Create a WO in ≤5 taps (select customer → vehicle → pick service → assign mechanic → create). No page transitions during creation.
4. **Price memory**: When adding a service that was used before, the last sold price appears in muted text beside the price input.
5. **Status transitions**: Changing status shows a confirmation + optional notes field. Cancelled requires confirmation.
6. **Undo**: Deleting a service/part shows an undo toast.
7. **Sidebar**: Only relevant Phase 1 items visible. Vehicle Models is behind Settings.
8. **Touch targets**: Every interactive element ≥44px on viewports <1024px.
9. **Consistency**: All forms use `Input` component. All lists show skeletons during load. All errors show inline card + toast.
10. **Daily goal**: Shared across all users (stored in backend), not per-browser.
