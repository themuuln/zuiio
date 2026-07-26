# Full-Width Dashboard Header

## Context

The dashboard header bar (`flex h-12 items-center gap-2 px-4` in `PageHeader`) currently spans only the content area inside `SidebarInset`. The user wants it to span the full viewport width — above and behind the sidebar.

## Problem

The sidebar container uses `fixed inset-y-0 z-[60]` (`top: 0` through `bottom: 0`). Simply moving the header outside `SidebarInset` into a `flex-col` layout causes the fixed sidebar to **overlay the header's left side** because the sidebar container starts from `top: 0`.

## Solution

1. **Keep the `flex-col` layout** in `_dashboard-client-shell.tsx` — header at top full-width, sidebar+content in a wrapped flex-row below
2. **Offset the fixed sidebar container** below the header by overriding its `top` and `height` via the `style` prop that flows through `AppSidebar` → `Sidebar` → the fixed container div
3. **Define `--sidebar-top` CSS variable** on `SidebarProvider` so the offset value is inheritable

The header base height is `h-12` (3rem). No dashboard page calls `setTabs()`, so the tabs row never renders — header height is always 3rem + 1px border.

## Files to Change

| File | Action | What changes |
|------|--------|--------------|
| `src/app/[locale]/dashboard/_dashboard-client-shell.tsx` | Modify | Keep flex-col layout, add `--sidebar-top: 3rem` CSS variable to `SidebarProvider` |
| `src/components/app-sidebar.tsx` | Modify | Pass `style={{ top: "var(--sidebar-top, 0)", height: "calc(100svh - var(--sidebar-top, 0))" }}` to `<Sidebar>` |

## Implementation Order

1. Update `_dashboard-client-shell.tsx` to add `style` prop with `--sidebar-top` CSS variable
2. Update `app-sidebar.tsx` to pass style override to `<Sidebar>`

No ordering dependency between these two — they're in different files and don't conflict.

## Props Flow

```
_dashboard-client-shell.tsx
  renders <SidebarProvider style={{ "--sidebar-top": "3rem" }}>
    var(--sidebar-top) inherits to descendants
    renders <AppSidebar />
app-sidebar.tsx
  renders <Sidebar style={{ top: "var(--sidebar-top, 0)", height: "calc(100svh - ...)" }}>
sidebar.tsx
  Sidebar puts non-destructured props ({...props}) on the fixed container div
  Container has: fixed inset-y-0 z-[60] h-svh ← inline style overrides top & height
```

- `fixed inset-y-0` → inline `top: var(--sidebar-top, 0)` overrides `top: 0` (higher specificity). `bottom: 0` remains.
- `h-svh` → inline `height: calc(100svh - var(--sidebar-top, 0))` overrides `height: 100svh`.
- `--sidebar-top` resolves via CSS inheritance from `SidebarProvider`'s wrapper.

## Edge Cases

| Case | Behavior |
|------|----------|
| Sidebar collapsed to icons | Offset still applies — sidebar container starts below header, icons align properly |
| Sidebar hover-expanded | Same offset — container transitions width but stays below header |
| Mobile | Sidebar uses Drawer (not fixed), so no conflict; header still full-width |
| Header with tabs | No dashboard page calls `setTabs()`, so this never happens. If it did, `3rem` offset would be wrong — but it doesn't |
| Page scroll | Header is in a non-scrolling flex area at top; content scrolls independently below |

## Verification

1. `pnpm validate:types` — zero new type errors
2. `pnpm build` — builds successfully
3. Open dashboard in browser — header spans full viewport width, sidebar starts below header
4. Toggle sidebar collapse — sidebar repositions correctly below header
5. Navigate to a sub-page (e.g., /dashboard/customers) — header remains full-width
