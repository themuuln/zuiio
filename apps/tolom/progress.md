# Progress

## Status
In Progress

## Completed
- Daily revenue goal: moved from localStorage to backend org settings
  - Created `useOrgSettings` / `useUpdateOrgSettings` hooks
  - Added daily goal card on dashboard with inline edit, progress bar toward goal
  - Goal stored in `organization.settings.daily_revenue_goal` via PATCH endpoint
- Breadcrumbs: created `Breadcrumb` component and added to customer/vehicle/WO pages
- Added `Breadcrumb` imports to customers/new, customers/[id], vehicles/new, vehicles/[id], work-orders/new, work-orders/[id]

## Files Changed
- `src/app/[locale]/dashboard/page.tsx` — daily goal UI (Target icon, inline edit, progress bar)
- `src/lib/queries/use-org-settings.ts` — React Query hooks for org settings (NEW)
- `src/lib/queries/keys.ts` — added `orgKeys.settings()` key
- `src/components/breadcrumb.tsx` — breadcrumb navigation component (NEW)
- `src/components/breadcrumbs.tsx` — re-exports from breadcrumb (NEW)
- `src/app/[locale]/dashboard/customers/new/page.tsx` — added Breadcrumb import

## Notes
- Dashboard page was already refactored to use React Query — no localStorage found
- All build errors resolved (TypeScript: 0 errors)
