---
name: performance
description: Tolom performance optimization — Core Web Vitals, lazy loading, image optimization, bundle size, React Query caching, and Next.js-specific patterns. Use when optimizing pages, fixing Lighthouse scores, reducing bundle size, or reviewing for performance regressions.
---

# Performance

Keep tolom fast. Every feature ships with performance in mind.

---

## Core Web Vitals Targets

| Metric | Target | Measure |
|--------|--------|---------|
| LCP (Largest Contentful Paint) | < 2.5s | Hero image, heading, card |
| FID (First Input Delay) | < 100ms | First click/tap response |
| CLS (Cumulative Layout Shift) | < 0.1 | Layout stability |
| INP (Interaction to Next Paint) | < 200ms | All interactions |

### Measuring

```bash
# Lighthouse
npx lighthouse http://localhost:3000 --view

# Web Vitals in code
import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    console.log(metric); // Send to analytics
  });
  return null;
}
```

---

## Next.js Patterns

### Server Components (Default)

Use Server Components by default. Only add `"use client"` when you need interactivity:

```tsx
// ✅ CORRECT — Server Component (no JS shipped)
export default async function CustomersPage() {
  const customers = await getCustomers();
  return <CustomerList customers={customers} />;
}

// ❌ FORBIDDEN — unnecessary client component
"use client";
export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  useEffect(() => { fetchCustomers().then(setCustomers); }, []);
  return <CustomerList customers={customers} />;
}
```

### Dynamic Imports

Lazy-load heavy components that aren't needed on initial render:

```tsx
import dynamic from "next/dynamic";

// ✅ CORRECT — lazy-load chart library
const RevenueChart = dynamic(() => import("./revenue-chart"), {
  loading: () => <Skeleton className="h-[300px] w-full" />,
  ssr: false,
});

// ✅ CORRECT — lazy-load modal content
const HeavyForm = dynamic(() => import("./heavy-form"));
```

**When to dynamic import:**

| Component | Dynamic? | Why |
|-----------|----------|-----|
| Charts (recharts) | ✅ Yes | Heavy library, not always visible |
| Rich text editors | ✅ Yes | Large bundle |
| Modals with complex forms | ✅ Yes | Not needed until opened |
| Above-the-fold content | ❌ No | Must render immediately |
| Simple UI components | ❌ No | Already small |

### Parallel Routes

Use for simultaneous data loading:

```tsx
// app/dashboard/layout.tsx
export default function Layout({ children, stats }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">{children}</div>
      <div>{stats}</div>  {/* Loads in parallel */}
    </div>
  );
}

// app/dashboard/@stats/page.tsx
export default async function Stats() {
  const data = await getDashboardStats();
  return <StatsPanel data={data} />;
}
```

---

## Image Optimization

### Next.js Image Component

Always use `next/image`:

```tsx
import Image from "next/image";

// ✅ CORRECT — optimized image
<Image
  src="/photos/customer-car.jpg"
  alt="Customer's vehicle in service bay"
  width={400}
  height={300}
  priority={isAboveFold}
  placeholder="blur"
  blurDataURL={blurHash}
/>

// ❌ FORBIDDEN — raw img tag
<img src="/photos/customer-car.jpg" alt="Car" />
```

### Rules

| Rule | Why |
|------|-----|
| Always specify `width` and `height` | Prevents CLS |
| Use `priority` for above-fold images | Preloads LCP image |
| Use `placeholder="blur"` with `blurDataURL` | Shows preview while loading |
| Use `sizes` for responsive images | Browser picks optimal size |
| Never use `layout="fill"` without `position: relative` parent | Breaks layout |

### Vehicle/Logo Images

```tsx
// ✅ CORRECT — responsive vehicle image
<Image
  src={vehicle.photo_url}
  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
  width={200}
  height={150}
  sizes="(max-width: 768px) 100vw, 200px"
  className="rounded-lg object-cover"
/>
```

---

## React Query Optimization

### Query Keys

Structured keys enable targeted invalidation:

```tsx
// ✅ CORRECT — hierarchical keys
export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (orgId: string) => [...customerKeys.lists(), orgId] as const,
  details: () => [...customerKeys.all, "detail"] as const,
  detail: (orgId: string, id: string) =>
    [...customerKeys.details(), orgId, id] as const,
};

// Invalidate all customers: queryClient.invalidateQueries({ queryKey: customerKeys.all })
// Invalidate specific list: queryClient.invalidateQueries({ queryKey: customerKeys.list(orgId) })
```

### Stale Time

```tsx
// ✅ CORRECT — appropriate stale times
useQuery({
  queryKey: customerKeys.list(orgId),
  queryFn: () => fetchCustomers(orgId),
  staleTime: 5 * 60 * 1000,  // 5 min — list data
});

useQuery({
  queryKey: customerKeys.detail(orgId, id),
  queryFn: () => fetchCustomer(orgId, id),
  staleTime: 30 * 1000,  // 30 sec — detail data
});

// ❌ FORBIDDEN — no stale time (refetches every visit)
useQuery({
  queryKey: ["customers"],
  queryFn: fetchCustomers,
});
```

### Prefetching

```tsx
// ✅ CORRECT — prefetch on hover
const queryClient = useQueryClient();

<Link
  href={`/customers/${id}`}
  onMouseEnter={() => {
    queryClient.prefetchQuery({
      queryKey: customerKeys.detail(orgId, id),
      queryFn: () => fetchCustomer(orgId, id),
      staleTime: 30 * 1000,
    });
  }}
>
  View customer
</Link>
```

### Infinite Queries

For paginated lists:

```tsx
useInfiniteQuery({
  queryKey: customerKeys.list(orgId),
  queryFn: ({ pageParam }) => fetchCustomers(orgId, pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  initialPageParam: 0,
});
```

---

## Bundle Optimization

### Analyze Bundle

```bash
# Build with analysis
ANALYZE=true npm run build

# Check specific import impact
npx next-build-visualizer
```

### Import Hygiene

```tsx
// ✅ CORRECT — import only what you need
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";

// ❌ FORBIDDEN — importing entire library
import * as dateFns from "date-fns";
import * as lucide from "lucide-react";
```

### Heavy Libraries

| Library | Alternative | Savings |
|---------|------------|---------|
| `moment.js` | `date-fns` | ~300KB |
| `lodash` | `lodash-es` or individual imports | ~70KB |
| `@heroicons/react` | `lucide-react` | ~20KB |
| `axios` | Native `fetch` | ~30KB |

---

## Loading States

### Skeleton Screens

Always show skeletons, never spinners for data loading:

```tsx
// ✅ CORRECT — skeleton preserves layout
function CustomerListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ❌ FORBIDDEN — spinner for list loading
if (isLoading) return <Spinner />;
```

### Progressive Loading

After first load, preserve page chrome:

```tsx
// ✅ CORRECT — only skeleton data-dependent content
function CustomersPage() {
  const { data, isLoading } = useCustomers();
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    if (data) setHasLoadedOnce(true);
  }, [data]);

  return (
    <div>
      <PageHeader title="Customers" /> {/* Always visible */}
      <Toolbar /> {/* Always visible */}
      {isLoading && !hasLoadedOnce ? (
        <CustomerListSkeleton />
      ) : (
        <CustomerList customers={data} />
      )}
    </div>
  );
}
```

---

## Caching Strategies

### Static Data

```tsx
// ✅ CORRECT — long cache for reference data
useQuery({
  queryKey: ["vehicle-makes"],
  queryFn: fetchVehicleMakes,
  staleTime: 24 * 60 * 60 * 1000,  // 24 hours
  gcTime: 7 * 24 * 60 * 60 * 1000,  // 7 days
});
```

### Mutations

```tsx
// ✅ CORRECT — optimistic update with rollback
const mutation = useMutation({
  mutationFn: updateCustomer,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: customerKeys.detail(orgId, id) });
    const previous = queryClient.getQueryData(customerKeys.detail(orgId, id));
    queryClient.setQueryData(customerKeys.detail(orgId, id), newData);
    return { previous };
  },
  onError: (_err, _vars, context) => {
    queryClient.setQueryData(customerKeys.detail(orgId, id), context?.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: customerKeys.list(orgId) });
  },
});
```

---

## Tablet Performance

### Touch Interactions

```tsx
// ✅ CORRECT — optimized for touch
<div className="tablet-touch">
  <Button
    className="min-h-[44px] touch-manipulation"
    onClick={handleAction}
  >
    Action
  </Button>
</div>
```

### Debounced Search

```tsx
// ✅ CORRECT — debounced input
const [search, setSearch] = useState("");
const debouncedSearch = useDeferredValue(search);

useEffect(() => {
  // Only fires after user stops typing
}, [debouncedSearch]);
```

---

## Anti-Patterns

| Anti-Pattern | Impact | Fix |
|---|---|---|
| Raw `fetch()` + `useState` in pages | No caching, no deduplication | Use React Query |
| Spinner instead of skeleton | Layout shift, poor UX | Use skeleton screens |
| Importing entire libraries | Bundle bloat | Import specific functions |
| No `staleTime` on queries | Unnecessary refetches | Set appropriate stale times |
| Client components for static content | Ships JS unnecessarily | Use Server Components |
| `<img>` instead of `next/image` | No optimization, CLS | Use `next/image` |
| No `priority` on LCP image | Delayed LCP | Add `priority` to above-fold images |
| Spinner for all loading states | Poor perceived performance | Skeleton for data, spinner only for actions |
| Auto-playing video/audio | Bandwidth, UX | Never auto-play |

---

## Validation Checklist

Before merging any UI change:

- [ ] Server Components by default — `"use client"` only when needed
- [ ] Heavy components (charts, editors) use `dynamic()` import
- [ ] Images use `next/image` with `width`/`height`
- [ ] LCP image has `priority` prop
- [ ] Skeleton screens, not spinners, for data loading
- [ ] React Query with structured keys and appropriate `staleTime`
- [ ] No raw `fetch()` + `useState` for server data
- [ ] Specific imports, not `import *`
- [ ] Page chrome preserved during refetch (`hasLoadedOnce` pattern)
- [ ] Touch targets ≥ 44px in tablet sections
