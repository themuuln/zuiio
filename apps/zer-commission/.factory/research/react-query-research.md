# React Query v5 + Next.js App Router Research

## Recommendation: @tanstack/react-query v5

**Verdict:** TanStack React Query v5 is the optimal choice for this project. Alternatives:

| Library | Rating | Reasoning |
|---------|--------|-----------|
| **@tanstack/react-query v5** | ✅ **Best fit** | Full-featured mutation API with `onMutate` optimistic updates, stale-while-revalidate, devtools, SSR support, huge ecosystem |
| SWR | ❌ Too minimal | No built-in optimistic mutation API as clean as React Query's `onMutate`/`onSettled` |
| tRPC | ❌ Wrong architecture | Requires a typed API layer — this project uses Supabase directly + Server Actions |
| RTK Query | ❌ Too heavy | Would conflict with existing patterns, no benefit over React Query |

## Setup Pattern for Next.js App Router

### Provider Pattern (client component)

```typescript
// src/lib/query/provider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30s — data considered fresh
            gcTime: 5 * 60 * 1000, // 5min — keep in cache
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Integration in Root Layout

```typescript
// src/app/layout.tsx
import { QueryProvider } from "@/lib/query/provider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

## Optimistic Update Pattern

### useMutation with onMutate

```typescript
const mutation = useMutation({
  mutationFn: async (formData: FormData) => {
    const result = await createShopSale(undefined, formData);
    if (result?.error) throw new Error(result.error);
    return result as { saleId: string };
  },
  onMutate: async (formData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: [...keys] });
    
    // Snapshot previous value
    const previous = queryClient.getQueryData([...keys]);
    
    // Optimistically update cache
    queryClient.setQueryData([...keys], (old) => ({
      ...old,
      // optimistic update logic
    }));
    
    return { previous }; // context for rollback
  },
  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previous) {
      queryClient.setQueryData([...keys], context.previous);
    }
  },
  onSettled: () => {
    // Always refetch after mutation settles
    queryClient.invalidateQueries({ queryKey: [...keys] });
  },
});
```

## Query Key Factory Pattern

```typescript
// src/lib/query/keys.ts
// Organization-scoped keys — all queries scoped to organization
export const queryKeys = {
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (orgId: string) => [...queryKeys.products.lists(), orgId] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
  },
  sales: {
    all: ["sales"] as const,
    lists: () => [...queryKeys.sales.all, "list"] as const,
    list: (orgId: string) => [...queryKeys.sales.lists(), orgId] as const,
    details: () => [...queryKeys.sales.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.sales.details(), id] as const,
  },
  contacts: {
    all: ["contacts"] as const,
    list: (orgId: string) => [...queryKeys.contacts.all, "list", orgId] as const,
  },
  inventory: {
    all: ["inventory"] as const,
    list: (orgId: string) => [...queryKeys.inventory.all, "list", orgId] as const,
  },
  expenses: {
    all: ["expenses"] as const,
    list: (orgId: string) => [...queryKeys.expenses.all, "list", orgId] as const,
  },
  dashboard: {
    metrics: (orgId: string, date: string) => ["dashboard", orgId, date] as const,
  },
};
```

## Supabase Query Hook Pattern

```typescript
// src/lib/query/hooks/use-products.ts
export function useProductsList(orgId: string) {
  return useQuery({
    queryKey: queryKeys.products.list(orgId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, unit, sale_price, current_stock, category_id")
        .eq("organization_id", orgId)
        .order("name");
      if (error) throw error;
      return data;
    },
    staleTime: 30_000, // 30s
    enabled: !!orgId,
  });
}
```

## Combining with Server Actions

Server Actions remain the mutation source of truth. React Query wraps them:

```typescript
// Client component wraps the server action
const mutation = useMutation({
  mutationFn: async (formData: FormData) => {
    const result = await serverAction(undefined, formData);
    if (result?.error) throw new Error(result.error);
    return result;
  },
  onSuccess: () => {
    // Server-side revalidatePath still runs from the action
    // Client also invalidates its React Query cache
    queryClient.invalidateQueries({ queryKey: ["products"] });
  },
});
```

This creates a **dual invalidation** — Server Action calls `revalidatePath` for Server Component RSC payloads, and React Query invalidates its client cache. Both are needed: the server action revalidation updates RSC data, while React Query invalidation updates the client-side cache for components using `useQuery`.
