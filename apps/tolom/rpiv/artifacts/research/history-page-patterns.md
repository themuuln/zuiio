# Research: Түүх (History) Sidebar Page Patterns

> Generated: 2026-06-03
> Source: git archaeology across payroll (ec149be), expenses (411ae27), work-orders, finance, and DataTable migration commits

## Overview

This document captures the established patterns for creating a new sidebar page with DataTable + filters + right-side detail sheet, using the payroll system (commit `ec149be`) and expenses pages as canonical reference implementations.

---

## 1. Data Model Layer

### Migration File
- Create: `supabase/migrations/YYYYMMDDHHMMSS_history_*.sql`
- Pattern: New table(s) + RLS policies + indexes
- Every table must include: `organization_id`, `created_at`, `updated_at`, `deleted_at`

### Permission Migration (if new resource)
- File: `supabase/migrations/YYYYMMDDHHMMSS_add_history_permissions.sql`
- Pattern: Edit `seed_org_permissions()` to add `history.read`, `history.write`
- Edit `seed_org_role_permissions()` to grant to appropriate roles

### TypeScript Types
- Export from: `src/lib/types/index.ts`
- Never import from: `src/lib/database.types.ts` (regenerated, unstable)

---

## 2. Service Layer

### File: `src/lib/services/history-service.ts`
- Server-side Supabase queries
- Uses `createClient()` from `@/lib/supabase/server`
- Each function: `supabase.from("history_table")` with org_id filter
- Revalidates cache via `revalidateTag(cacheTags.history(orgId), "default")`

**Pattern (from payroll-service.ts):**
```ts
import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache/keys";
import { createClient } from "@/lib/supabase/server";

export interface HistoryRecord { /* ... */ }

export async function getHistoryRecords(orgId: string): Promise<HistoryRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("history_table")
    .select("*, profiles!inner(full_name)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as any[]).map((r) => ({
    ...r,
    mechanic_name: (r as any).profiles?.full_name ?? null,
  })) as HistoryRecord[];
}
```

---

## 3. API Route Layer

### File: `src/app/api/organizations/[id]/history/route.ts`
- Uses `createRouteHandler` from `@/lib/api-handler`
- Permission-gated with `requiredPermission: { resource: "history", action: "read" }`

**Pattern:**
```ts
import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { getHistoryRecords } from "@/lib/services/history-service";

export const GET = createRouteHandler(
  async ({ request, orgId }) => {
    const { searchParams } = new URL(request.url);
    // Extract filters from query params
    const type = searchParams.get("type") ?? undefined;
    const records = await getHistoryRecords(orgId, { type });
    return NextResponse.json({ data: records });
  },
  { requiredPermission: { resource: "history", action: "read" } },
);
```

---

## 4. Query Layer

### Query Keys — `src/lib/queries/keys.ts`

Add hierarchical keys:
```ts
export const historyKeys = {
  all: (orgId: string) => [...orgKeys.detail(orgId), "history"] as const,
  list: (orgId: string, type?: string) =>
    [...historyKeys.all(orgId), "list", type ?? "all"] as const,
};
```

### React Query Hooks — `src/lib/queries/use-history.ts`

Uses `createOrgQuery` from `@/lib/queries/factory.ts`:

```ts
import { createOrgQuery } from "./factory";
import { historyKeys } from "./keys";

const fetchHistory = createOrgQuery<HistoryRecord[]>("/history");

export function useHistory(orgId: string | undefined, type?: string) {
  return useQuery({
    queryKey: historyKeys.list(orgId ?? "", type),
    queryFn: () => fetchHistory(orgId!, { params: { type } }),
    enabled: !!orgId,
    staleTime: 30_000,
  });
}
```

For mutations, use `useMutation` with manual `fetch()` and `onSuccess` invalidation:
```ts
export function useCreateHistoryRecord(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { /* ... */ }) => {
      const res = await fetch(`/api/organizations/${orgId}/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Failed");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: historyKeys.all(orgId ?? "") });
    },
  });
}
```

---

## 5. Sidebar Navigation — `src/hooks/use-navigation.ts`

Add a nav item in the appropriate group. For the Financials group (under `navGroups`):

```ts
const navGroups: NavGroup[] = [
  // ...
  {
    labelKey: "nav.group.financials",
    icon: DollarSign,
    children: [
      // existing items ...
      {
        labelKey: "nav.history",
        href: "/dashboard/history",
        icon: History,  // or Clock, ClipboardList, etc.
      },
    ],
  },
];
```

Also add feature flag mapping:
```ts
const navFeatureMap: Record<string, FeatureKey | undefined> = {
  // ...
  "nav.history": FEATURE_KEYS.HISTORY,
};
```

---

## 6. Feature Flag — `src/lib/plan-features.ts`

```ts
export const FEATURE_KEYS = {
  // ...
  HISTORY: "history",
} as const;
```

Add to appropriate plan tiers:
```ts
const PRO_FEATURES: FeatureKey[] = [
  ...STARTER_FEATURES,
  // ...
  FEATURE_KEYS.HISTORY,
];
```

---

## 7. Page Component — `src/app/[locale]/dashboard/history/page.tsx`

Follows this structure (from work-orders page):

1. **"use client"** directive
2. **Imports**: hooks, components, shadcn/ui
3. **Helper functions** (formatting, display)
4. **Export columns** for Excel export
5. **Main component** with:
   - `useTranslations()`, `useCurrentOrg()`, `useTableFilters()`
   - `usePageHeader()` for detail sheet control
   - `useHistory()` query hook
   - Filter states (type, date range, etc.)
   - Loading skeleton (using `hasLoadedOnce` pattern)
   - Error state
   - Empty state (using `<Empty>` component)
   - Data table wrapper with `<ListToolbar>`, `<DataTable>`

**Critical patterns:**
```tsx
// Layout-preserving loading (from AGENTS.md)
const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
useEffect(() => { if (data) setHasLoadedOnce(true); }, [data]);

if (isPending && !hasLoadedOnce && !data) {
  return <FullPageSkeleton />;
}
```

**DataTable usage:**
```tsx
<DataTable
  columns={columns}
  data={list}
  getRowId={(row) => row.id}
  pageSize={20}
  onRowClick={(row) => setDetailHistoryId(row.id)}
  showColumnVisibility
  renderMobileCard={(record) => (/* ... */)}
/>
```

---

## 8. Columns — `src/app/[locale]/dashboard/history/_columns.tsx`

**Pattern (from expenses):**
```tsx
"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import type { HistoryRecord } from "@/lib/types";

export const columns: ColumnDef<HistoryRecord>[] = [
  {
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => (/* ... */),
  },
  // ...
];
```

**Or with callbacks (from work-orders):**
```tsx
export function createColumns(cb: ColumnCallbacks): ColumnDef<...>[] { /* ... */ }
```

---

## 9. i18n — `src/messages/en.json` and `src/messages/mn.json`

Add to both files:
```json
{
  "nav": {
    "history": "Түүх"  // "History" in en.json
  },
  "history": {
    "title": "Түүх",
    "subtitle": "Үйл явдлын түүх",
    "tabs": {
      "all": "Бүгд",
      "invoices": "Нэхэмжлэл",
      "payments": "Төлбөр"
    },
    "searchPlaceholder": "Хайх...",
    // ... column headers, empty states, etc.
  }
}
```

---

## 10. Detail Sheet — `src/components/history/history-detail-sheet.tsx`

**Pattern** (from expense-detail-sheet.tsx):

1. Props: `{ open, onOpenChange, recordId }`
2. Sheet with `SheetContent side="right" className="w-full sm:max-w-2xl p-0 gap-0"`
3. `DetailSheetHeader` with icon, title, actions (edit/delete)
4. Loading/Error/NotFound states
5. Read-only view with sections
6. Edit mode with form (optional)

---

## 11. Global Registration — `src/app/[locale]/dashboard/_global-dialogs.tsx`

Add lazy-loaded import and JSX:

```tsx
const HistoryDetailSheet = dynamic(
  () => import("@/components/history/history-detail-sheet").then((m) => m.HistoryDetailSheet),
  { ssr: false },
);

export function GlobalDialogs() {
  const { detailHistoryId, setDetailHistoryId } = usePageHeader();
  return (
    <>
      {/* ... existing sheets ... */}
      <HistoryDetailSheet
        open={detailHistoryId !== null}
        onOpenChange={(open) => setDetailHistoryId(open ? detailHistoryId : null)}
        recordId={detailHistoryId}
      />
    </>
  );
}
```

---

## 12. Page Header — `src/hooks/use-page-header.tsx`

Add state and setters:
```ts
const [detailHistoryId, setDetailHistoryId] = useState<string | null>(null);

// In provider value:
detailHistoryId,
setDetailHistoryId,
```

---

## 13. Complete File Manifest

| Layer | File | Action |
|-------|------|--------|
| Migration | `supabase/migrations/...` | Create |
| Permissions | `supabase/migrations/...` | Update seed functions |
| Types | `src/lib/types/index.ts` | Add type exports |
| Cache keys | `src/lib/cache/keys.ts` | Add cacheTags |
| Service | `src/lib/services/history-service.ts` | Create |
| API route | `src/app/api/organizations/[id]/history/route.ts` | Create |
| Query keys | `src/lib/queries/keys.ts` | Add `historyKeys` |
| Query hook | `src/lib/queries/use-history.ts` | Create |
| Nav | `src/hooks/use-navigation.ts` | Add nav item + feature map |
| Feature flags | `src/lib/plan-features.ts` | Add `HISTORY` flag |
| i18n (en) | `src/messages/en.json` | Add keys |
| i18n (mn) | `src/messages/mn.json` | Add keys (same keys) |
| Page header | `src/hooks/use-page-header.tsx` | Add detail state |
| Page | `src/app/[locale]/dashboard/history/page.tsx` | Create |
| Columns | `src/app/[locale]/dashboard/history/_columns.tsx` | Create |
| Detail sheet | `src/components/history/history-detail-sheet.tsx` | Create |
| Global dialogs | `src/app/[locale]/dashboard/_global-dialogs.tsx` | Add lazy import |
| Validation | `npm run validate` | Run after all changes |

---

## 14. Key Decisions & Patterns

1. **DataTable** — use `src/components/ui/data-table.tsx` (self-contained with pagination, sorting, column visibility)
2. **ListToolbar** — use `src/components/list-toolbar.tsx` for search + filters + actions layout
3. **FilterChips** — use `src/components/filter-chips.tsx` for status/tab filters
4. **Right-side detail sheet** — lazy-loaded via `_global-dialogs.tsx`, state in `usePageHeader`
5. **Two tabs** — use internal state (like finance page's `TabBar`) or `Tabs` component
6. **API handler** — `createRouteHandler` with `requiredPermission` for auth
7. **Query factory** — `createOrgQuery<T>(path)` eliminates fetch+unwrap boilerplate
8. **Cache revalidation** — `revalidateTag` in service layer for tag-based cache invalidation
9. **Mobile cards** — `renderMobileCard` prop on `<DataTable>` for responsive UI
10. **Layout-preserving loading** — `hasLoadedOnce` pattern to keep UI chrome visible on refetch
11. **Export** — use `<ExportButton>` for Excel export if needed
12. **Branch filter** — use `BranchSelect` + `useOrgSettings` pattern from finance page if per-branch history is needed
