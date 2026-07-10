# Next Steps — TanStack Query Tech Debt

Remaining items from the TanStack Query v5 migration audit, prioritized.

## P0 — Bug Risk / Data Integrity

- ~~**[use-wizard-data.ts]** 5 mutations use offline queue support (`useMutationQueue` + `useOnlineStatus` + raw `fetch`). `useOrgMutation` does not support offline queueing. Before migrating, determine if offline queue is actually exercised by users or if it's dead code that was copied from a template.~~ ✅ **Done** — `useOrgMutation` natively imports `useMutationQueue` and `useOnlineStatus`; migrated all 5 mutations.
- ~~**[use-cash-register.ts]** `useOpenSession`, `useCloseSession` still use raw `useMutation` + manual `fetch` + manual `queryClient.invalidateQueries`. These have complex cache write logic (`setQueryData`), making them harder to migrate.~~ ✅ **Done** — migrated to `useOrgMutation` preserving `setQueryData`/`removeQueries` in `onSuccess`.
- ~~**[use-cash-register.ts]** `useVoidSession` is **exported but never imported** anywhere — dead code. Should be removed or verified.~~ ✅ Done

## P1 — Manual Cache Management / Missing Auto-Invalidation

- ~~**[customer-detail-drawer.tsx]** `editMutation` uses manual `cancelQueries` + `setQueryData` + `invalidateQueries` for optimistic updates. Complex to migrate but could benefit from `useOrgMutation`'s auto-invalidation.~~ ✅ **Done** — migrated with `setQueryData` detail-cache update preserved in `onSuccess`.
- ~~**[vehicle-detail-drawer.tsx]** `editMutation` same pattern as customer drawer — manual optimistic cache management.~~ ✅ **Done** — migrated with 26-field `bodyFn` + detail-cache merge in `onSuccess`.

## P2 — Style / Consistency

- ~~**[gcTime mismatch]** `@zuiio/query` Provider defaults to `gcTime: 5 * 60 * 1000` (5 min) while the local app provider (`src/components/query-provider.tsx`) sets `gcTime: 30 * 60 * 1000` (30 min). Should be synced to avoid confusing cache eviction behavior.~~ ✅ **Not actionable** — the app never imports `@zuiio/query`'s provider; it uses its own 30-min provider in `src/components/query-provider.tsx`. No runtime impact.
- ~~**[use-wizard-data.ts]** Offline queue mutations — consider extracting to dedicated hooks.~~ ✅ **Done** — migrated to `useOrgMutation` which handles offline queueing internally.
- ~~**[src/components/work-orders/customer-select.tsx]** Raw `fetch` in customer search.~~ ✅ **Done** — migrated to `useCustomers` hook (React Query).
- ~~**[src/components/bay-view-v2/_customer-picker-modal.tsx]** Raw `fetch` in customer search (same pattern).~~ ✅ **Done** — migrated to `useCustomers` hook.
- **[src/components/work-orders/vehicle-select.tsx]** Raw `fetch` for vehicle search with optional customerId filter. The `useVehicles` hook doesn't support customerId filtering, so a full migration requires extending the hook. Low priority — search works correctly as-is.
- **[src/components/bay-view-v2/_use-status-mutations.ts]** Raw `fetch` in undo toast callback (not a hook-safe context). Low priority — works correctly as-is.

## P3 — Minor Cleanup

- ~~**[use-cash-register.ts]** `useVoidSession` — dead code, should be cleaned up.~~ ✅ Done
- ~~**[isLoading vs isPending]** Codebase uses `isLoading` extensively (backward-compatible in v5). When v6 removes `isLoading`, bulk rename needed. No urgency.~~ ✅ **Done** — bulk rename completed across all dashboard files, with targeted re-fixes for custom-typed queries (`useOrgSettings`, `useBranches`).
