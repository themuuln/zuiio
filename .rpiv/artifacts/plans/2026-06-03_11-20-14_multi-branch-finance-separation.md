---
date: 2026-06-03T11:20:14+0800
author: Temuulen Undrakhbayar
commit: 185264e
branch: main
repository: tolom
topic: "Multi-branch finance separation & sidebar branch selector (remaining work)"
tags: [plan, branch-management, finance, sidebar]
status: ready
parent: ".rpiv/artifacts/research/2026-06-02_23-28-58_multi-branch-finance-separation.md"
phase_count: 1
unresolved_phase_count: 0
last_updated: 2026-06-03T11:20:14+0800
last_updated_by: Temuulen Undrakhbayar
---

# Multi-Branch Finance Separation & Sidebar Branch Selector — Implementation Plan

## Overview

Replace the placeholder `AddBranchDialog` inline component in `_sidebar-branch-select.tsx` with the existing `QuickCreateBranchSheet`, following the exact same pattern already established in `_branches-section.tsx`. Fix a misplaced `useTranslations` import in `quick-create-branch-sheet.tsx`. The entire multi-branch finance separation feature (Zustand store extension, finance toggle, dashboard/reports migration, sidebar branch selector, settings branch management) is already implemented — only these two surgical fixes remain.

## Requirements

- Sidebar "Add Branch" button (rendered in `SidebarBranchSelect` → `BranchSelect` with `onAddBranch` prop) must open the `QuickCreateBranchSheet` dialog
- Must follow the same pattern as `_branches-section.tsx:197-200` — import `QuickCreateBranchSheet`, render with `open`/`onOpenChange` state
- Remove the stub `AddBranchDialog` inline component entirely
- Fix the `useTranslations` import that's placed at the bottom of `quick-create-branch-sheet.tsx:46` instead of at the top of the file

## Current State Analysis

### What's Already Implemented

- **Zustand store** (`src/lib/stores/ui-store.ts`): `selectedBranchId` field, `setSelectedBranchId` action, persisted via `partialize`, selector hooks exported from barrel
- **Dashboard page** (`src/app/[locale]/dashboard/page.tsx`): Uses `useSelectedBranchId()` from store, `useSelectedBranchGuard(orgId)`, `useDashboard` with `branchFilter` — all working
- **Reports page** (`src/app/[locale]/dashboard/reports/page.tsx`): Same pattern as dashboard — uses store + guard + branch-filtered hooks
- **Finance page** (`src/app/[locale]/dashboard/finance/page.tsx`): Uses `useDashboard` hook, reads `selectedBranchId` from store, gates with `finance_separate_per_branch` toggle from settings
- **Sidebar branch selector** (`src/components/app-sidebar/_sidebar-branch-select.tsx`): Renders `BranchSelect` in sidebar header, collapse-aware, role-gated (admin/manager only), reads/writes Zustand store — **but `AddBranchDialog` is a placeholder**
- **BranchSelect** (`src/components/branch-select.tsx`): Accepts `onAddBranch` prop that renders an "Add Branch" action at dropdown bottom
- **Settings Branches section** (`src/app/[locale]/dashboard/settings/_branches-section.tsx`): Finance separation `Switch` + branch list table + fully functional `QuickCreateBranchSheet`
- **QuickCreateBranchSheet** (`src/components/branches/quick-create-branch-sheet.tsx`): Responsive modal wrapping `BranchForm` — **but has misplaced `useTranslations` import**
- **BranchForm** (`src/components/branches/branch-form.tsx`): Zod schema validation, `useCreateBranch` mutation, standard form pattern
- **useCreateBranch** (`src/lib/queries/use-create-branch.ts`): Mutation hook with query invalidation
- **useSelectedBranchGuard** (`src/hooks/use-selected-branch-guard.ts`): Resets branch to "all" when branch deleted
- **All i18n keys** present in both `en.json` and `mn.json`

### What Needs Changing

1. `src/components/app-sidebar/_sidebar-branch-select.tsx` — Replace `AddBranchDialog` inline stub with `QuickCreateBranchSheet` import and usage
2. `src/components/branches/quick-create-branch-sheet.tsx` — Move `useTranslations` import to top of file

### Key Discoveries

- `QuickCreateBranchSheet` accepts an `orgId` prop but `BranchForm` resolves it internally via `useCurrentOrg()` — the prop is vestigial but harmless. We omit it from the sidebar call for consistency.
- The pattern for sidebar integration is identical to `_branches-section.tsx:197-200`: import → render with `open`/`onOpenChange` → no wrapper div needed (ResponsiveFormModal handles its own open state).
- Both English and Mongolian locale files are already complete for all branch-related keys.

## Desired End State

```tsx
// _sidebar-branch-select.tsx — After change
import { QuickCreateBranchSheet } from "@/components/branches/quick-create-branch-sheet";

// In the component:
const [addBranchOpen, setAddBranchOpen] = useState(false);

// In the JSX (replacing the AddBranchDialog conditional):
<QuickCreateBranchSheet
  open={addBranchOpen}
  onOpenChange={setAddBranchOpen}
/>
```

```tsx
// quick-create-branch-sheet.tsx — After change
"use client";

import { useTranslations } from "next-intl";
// ... rest of imports ...

import { ResponsiveFormModal } from "@/components/ui/responsive-form-modal";
// ... component body ... (no duplicate import at bottom)
```

## What We're NOT Doing

- **Writing tests**: No component tests for branch UI components — consistent with existing test coverage level
- **Fixing hardcoded "+ Add Branch" text in BranchSelect**: Minor, acceptable trade-off for simplicity
- **Removing vestigial `orgId` prop from QuickCreateBranchSheet/QuickCreateCustomerSheet**: Harmless, low priority
- **Breaking changes**: No schema changes, no API changes, no store migration needed
- **Additional features**: Branch editing, branch deletion, branch reordering — all deferred

## Decisions

### Decision 1: Import pattern for sidebar QuickCreateBranchSheet

**Evidence**: `src/app/[locale]/dashboard/settings/_branches-section.tsx:32` imports `QuickCreateBranchSheet` from `@/components/branches/quick-create-branch-sheet`. Usage at lines 197-200 shows `<QuickCreateBranchSheet open={...} onOpenChange={...} />`.

**Decision**: Follow the exact same import and usage pattern. No wrapper div needed — the ResponsiveFormModal component manages open/close lifecycle internally.

### Decision 2: `orgId` prop omitted from sidebar call

**Evidence**: `BranchForm` at `src/components/branches/branch-form.tsx:46-48` resolves orgId internally via `useCurrentOrg()` — the `orgId` prop on `QuickCreateBranchSheet` is vestigial and never used by the child form.

**Decision**: Omit `orgId` from the sidebar's `QuickCreateBranchSheet` call. Simpler, matches the pattern where props not needed aren't passed.

## Phase 1: Sidebar AddBranch placeholder replacement

### Overview

Replace the inline `AddBranchDialog` placeholder component in `_sidebar-branch-select.tsx` with a direct import and usage of `QuickCreateBranchSheet`. Fix the misplaced `useTranslations` import in `quick-create-branch-sheet.tsx`. No dependencies on other phases — this is the only phase.

### Changes Required:

#### 1. src/components/app-sidebar/_sidebar-branch-select.tsx:30-77

**File**: `src/components/app-sidebar/_sidebar-branch-select.tsx`

**Changes**: MODIFY — Replace inline `AddBranchDialog` component and its conditional rendering with `QuickCreateBranchSheet` import and usage. Remove the placeholder span.

```tsx
"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { BranchSelect } from "@/components/branch-select";
import { QuickCreateBranchSheet } from "@/components/branches/quick-create-branch-sheet";
import { useCurrentUserRole } from "@/hooks/use-current-user-role";
import { useBranches } from "@/lib/queries/use-branches";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useSelectedBranchId, useSetSelectedBranchId } from "@/lib/stores";

/**
 * Branch selector for the sidebar header.
 * - Reads/writes the Zustand store (global state, persisted across reloads).
 * - Only visible to admin/manager roles (mechanics see no branch filter).
 * - Hides entirely when sidebar is collapsed (consistent with nav label pattern).
 * - Includes "Add Branch" option that opens the quick-create dialog.
 */
export function SidebarBranchSelect() {
  const t = useTranslations();
  const { data: orgInfo } = useCurrentOrg();
  const orgId = orgInfo?.orgId;
  const { isAdmin, isManager } = useCurrentUserRole();
  const selectedBranchId = useSelectedBranchId();
  const setSelectedBranchId = useSetSelectedBranchId();
  const { data: branches = [] } = useBranches(orgId);
  const [addBranchOpen, setAddBranchOpen] = useState(false);

  // Only show for admin/manager roles
  if (!isAdmin && !isManager) return null;

  return (
    <>
      <div className="px-2 group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:group-hover:block">
        <BranchSelect
          value={selectedBranchId}
          onChange={setSelectedBranchId}
          branches={branches}
          placeholder={t("dashboard.branch")}
          allLabel={t("dashboard.allBranches")}
          className="w-full"
          onAddBranch={() => setAddBranchOpen(true)}
        />
      </div>

      {/* Quick-create branch dialog */}
      <QuickCreateBranchSheet
        open={addBranchOpen}
        onOpenChange={setAddBranchOpen}
      />
    </>
  );
}
```

#### 2. src/components/branches/quick-create-branch-sheet.tsx:1-48

**File**: `src/components/branches/quick-create-branch-sheet.tsx`

**Changes**: MODIFY — Move `useTranslations` import from line 46 to the top of the file alongside the other imports. Remove the duplicate import at the bottom.

```tsx
"use client";

import { useTranslations } from "next-intl";
import { ResponsiveFormModal } from "@/components/ui/responsive-form-modal";
import type { Branch } from "@/lib/types";
import { BranchForm } from "./branch-form";

interface QuickCreateBranchSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Called with the newly created branch after successful creation */
  onCreated?: (branch: Branch) => void;
  orgId?: string;
}

/**
 * Quick-create branch dialog.
 * Follows the exact pattern of QuickCreateCustomerSheet (quick-create-customer-sheet.tsx).
 * Uses ResponsiveFormModal for responsive display (Sheet on desktop, Drawer on mobile).
 */
export function QuickCreateBranchSheet({
  open,
  onOpenChange,
  onCreated,
}: QuickCreateBranchSheetProps) {
  const t = useTranslations();

  return (
    <ResponsiveFormModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("settings.addBranch")}
      sheetSize="md"
    >
      <BranchForm
        onSuccess={(branch) => {
          onCreated?.(branch);
          onOpenChange(false);
        }}
        onCancel={() => onOpenChange(false)}
      />
    </ResponsiveFormModal>
  );
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `npm run validate:types`
- [ ] Lint passes: `npm run validate:lint`

#### Manual Verification:
- [ ] Build succeeds: `npm run build`
- [ ] Sidebar "Add Branch" option opens the QuickCreateBranchSheet dialog
- [ ] Creating a branch via the sidebar form succeeds and the branch list updates
- [ ] "Add Branch" is only visible for admin/manager roles (not mechanics)
- [ ] "Add Branch" button in the Settings → Branches section still works (regression check)
- [ ] No `useTranslations` import at the bottom of `quick-create-branch-sheet.tsx`

## Ordering Constraints

Single-phase — no ordering constraints. This phase has no dependencies.

## Verification Notes

- **No schema or API changes**: The entire feature is client-side UI wiring. If the build passes and the sidebar dialog opens, the change is verified.
- **Precedent**: The `_branches-section.tsx:197-200` pattern is already working. The sidebar integration is identical — just importing the same component in a different parent.
- **Regression risk**: Low. Removing the `AddBranchDialog` inline component doesn't affect any other import or module. The `QuickCreateBranchSheet` is already used in `_branches-section.tsx` — this only adds a second use site.

## Performance Considerations

None — single component instance, rendered on demand (gated by `open` state), not in a hot path.

## Migration Notes

Not applicable — no existing data, schema, or persistent state changes.

## Plan Review (Step 8)

_Independent post-finalization review by artifact-code-reviewer and artifact-coverage-reviewer subagents. Findings triaged at Step 9._

| source   | plan-loc          | codebase-loc                | severity   | dimension             | finding   | recommendation         | resolution         |
| -------- | ----------------- | --------------------------- | ---------- | --------------------- | --------- | ---------------------- | ------------------ |
| coverage | ## Precedents & Lessons §1 | <n/a> | blocker | verification-coverage | Note "Any new branch-filter page MUST default to `"all"`, never auto-select." — no Success Criteria bullet tests default-to-all behavior; no code-level guard or store-initialization mirror visible in any phase | Add a manual verification bullet under Phase 1's `#### Manual Verification:` confirming Zustand store initializes `selectedBranchId` to `"all"` | deferred: already implemented in `ui-store.ts:27`, out of scope for this plan |
| coverage | ## Precedents & Lessons §6 | <n/a> | blocker | verification-coverage | Note "New store additions must follow the exact same pattern: separate State/Actions interfaces, immer for immutable updates, devtools for debugging, granular selector hooks" — no Success Criteria bullet audits the store pattern | Add a manual verification bullet under Phase 1's `#### Manual Verification:` confirming `ui-store.ts` extension follows the established store pattern | deferred: already implemented in `ui-store.ts`, out of scope for this plan |
| coverage | ## Precedents & Lessons §7 | <n/a> | blocker | verification-coverage | Note "Never auto-select a branch — always default to `"all"`" — same gap as §1 | Add the same manual bullet as §1 (or a combined bullet) under Phase 1's `#### Manual Verification:` | deferred: combined with §1 — already implemented |
| coverage | ## Precedents & Lessons §10 | <n/a> | blocker | verification-coverage | Note "Use existing `withBranchFilter` pattern — don't reinvent it" — no Success Criteria bullet checks finance page routes through `withBranchFilter`-based reports API | Add a manual verification bullet under Phase 1's `#### Manual Verification:` confirming finance page uses `useDashboard` hook (which routes through reports API / `withBranchFilter`) | deferred: already implemented in finance page via `useDashboard` hook, out of scope for this plan |
| coverage | ## Precedents & Lessons §11 | <n/a> | blocker | verification-coverage | Note "Settings save is column-level replace — read-then-spread or lose data" — no Success Criteria bullet tests settings save integrity | Add a manual verification bullet under Phase 1's `#### Manual Verification:` confirming settings toggle uses read-then-spread pattern | deferred: already implemented in `_branches-section.tsx:57-63` (spreads `...orgSettings`), out of scope for this plan |
| code     | Phase 1 (Overview, Decisions, Pattern References) | `_branches-section.tsx:32,197-200` | suggestion | codebase-fit | Plan cites import at `_branches-section.tsx:2` and usage at `:193-199`, but at HEAD the import is at line 32 and usage at lines 197-200 | Update all citations to `_branches-section.tsx:32` (import) and `_branches-section.tsx:197-200` (usage) | applied: citations updated in Overview, Decisions, Pattern References, Verification Notes |

## Pattern References

- `src/app/[locale]/dashboard/settings/_branches-section.tsx:32` — Import pattern: `import { QuickCreateBranchSheet } from "@/components/branches/quick-create-branch-sheet"`
- `src/app/[locale]/dashboard/settings/_branches-section.tsx:197-200` — Usage pattern: `<QuickCreateBranchSheet open={...} onOpenChange={...} />`
- `src/components/branches/quick-create-branch-sheet.tsx` — Target file for import fix
- `src/components/customers/quick-create-customer-sheet.tsx` — Sibling pattern (identical architecture)

## Developer Context

**Step 4 — Directional confirm**: User confirmed "Follow pattern" — replace placeholder with QuickCreateBranchSheet import, remove inline stub, fix import ordering. No tests added, no vestigial prop cleanup.

**Step 5 — Decomposition**: 1 slice approved. Single-phase plan.

## Plan History

- Phase 1: Sidebar AddBranch placeholder replacement — approved as generated

## References

- Research: `.rpiv/artifacts/research/2026-06-02_23-28-58_multi-branch-finance-separation.md`
- `src/components/app-sidebar/_sidebar-branch-select.tsx` — Target file (placeholder stub at lines 57-77)
- `src/components/branches/quick-create-branch-sheet.tsx` — Target file (import ordering issue at line 46)
