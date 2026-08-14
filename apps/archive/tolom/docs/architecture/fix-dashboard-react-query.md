# Fix: Dashboard Migrated to React Query

## What Changed

### Problem
Dashboard page (`src/app/[locale]/dashboard/page.tsx`) used raw `useEffect` + `fetch()` for data fetching:
- Manual `useState` for `data`, `loading`, `error`, `orgId`
- Double-fetch pattern: first call `/api/organizations`, then use the result to call `/api/organizations/[id]/reports`
- No caching, dedup, retry, or stale-while-revalidate
- Manual error handling with `toast.error()`

### Solution

**1. New: `src/lib/queries/keys.ts` — added `dashboardKeys` factory**
```typescript
export const dashboardKeys = {
  all: (orgId: string) => ["organizations", orgId, "dashboard"] as const,
  summary: (orgId: string, period: string) =>
    [...dashboardKeys.all(orgId), "summary", period] as const,
};
```

**2. New: `src/lib/queries/use-dashboard.ts` — React Query hook**
```typescript
export function useDashboard(
  orgId: string | undefined,
  period: string = "month",
): UseQueryResult<DashboardData, Error> {
  return useQuery({
    queryKey: dashboardKeys.summary(orgId ?? "", period),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/reports?type=dashboard&period=${period}`,
      );
      // ...error handling...
      return json.data as DashboardData;
    },
    enabled: !!orgId,
    staleTime: 5_000,   // background refetch at most every 5s
    retry: 1,
  });
}
```

**3. Updated: `src/app/[locale]/dashboard/page.tsx`**
- Replaced manual `useState` + `useEffect` + `fetch()` with `useCurrentOrg()` + `useDashboard()`
- Removed manual `fetchDashboard()` callback, `fetch("/api/organizations")` effect, and `router.replace` on mount
- Used React Query's `isPending`, `error`, `data` state fields instead of manual state
- Used `refetch()` from React Query for the "Retry" button instead of calling `fetchDashboard` directly
- Org loading triggers skeleton; loading dashboard with cached data shows loading spinners on KPI cards
- Period change sets state → React Query automatically refetches with new query key
- Error states handled by React Query (`error` object with `message`, `refetch` for retry)

### Benefits

| Before | After |
|--------|-------|
| 3 useState + 1 useEffect + 1 useCallback for data management | 2 React Query hooks, 2 useState for UI state only |
| `toast.error()` for API failures | React Query handles errors, retries once |
| Manual `router.replace('/auth/select-organization')` on missing org | `useCurrentOrg` returns `null`, page shows error + retry |
| Double-fetch: first get org, then get dashboard | `useDashboard` auto-enabled when `orgId` is truthy |
| No caching — re-fetches on every mount | 5s stale time, cached across navigations |
| No retry — one failure = broken page | 1 retry on failure |

### Files Changed
- `src/lib/queries/keys.ts` — added `dashboardKeys` factory
- `src/lib/queries/use-dashboard.ts` — created (new file)
- `src/app/[locale]/dashboard/page.tsx` — migrated to React Query

### Validation
- `npx tsc --noEmit` passes (only pre-existing `recharts` module resolution errors)
- Pattern matches existing `useCustomers` and `useCurrentOrg` hooks
