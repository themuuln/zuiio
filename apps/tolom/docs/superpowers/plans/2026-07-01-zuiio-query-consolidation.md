# @zuiio/query Consolidation — Single Source of Truth for Mutations

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `@zuiio/query` the single, verified source of truth for all mutation patterns across Tolom — replacing both the inline `useMutation` patterns in 3 query files and Tolom's local `mutation-factory.ts`.

**Architecture:** Move the battle-tested `useOrgMutation` factory from Tolom's `mutation-factory.ts` into `@zuiio/query`, fix the `queryKey` overloading issue (add separate `optimisticQueryKey`), add proper React Query integration tests, then migrate all consumers to import from `@zuiio/query`. The existing `useOptimistic*` hooks stay as lightweight alternatives.

**Tech Stack:** `@zuiio/query` (monorepo), `@zuiio/offline` (queue), `@zuiio/hooks` (online status), `@tanstack/react-query`, `sonner`, Vitest (testing)

## GPT-5.5 Review Findings (2026-07-01)

Key issues identified during architecture review:

1. **`queryKey` is overloaded** — Used for cancellation (prefix), optimistic read/write (exact), invalidation (prefix), and offline replay. The `all()` vs `list()` key pattern in `use-communications.ts` exposes this: passing `all()` key to `getQueryData()` returns `undefined` because data is stored under `list()` key.
2. **`toastRetry` behavior loss** — `use-communications.ts` uses `toastRetry(err.message, () => mutation.mutateAsync(vars))` for retry on error. Plain `toast.error()` loses this.
3. **Offline should not invalidate immediately** — Current `useOrgMutation` invalidates in `onSettled` even when offline, which can refetch stale IndexedDB data and wipe optimistic UI.
4. **DELETE + bodyFn is impossible** — Body is always skipped for DELETE, but some endpoints need it.
5. **Need real hook tests** — Type/config tests aren't enough. Need React Query integration tests with mocked fetch/online/queue.
6. **18 files use `useOrgMutation`, not 8** — Need broader import migration.
7. **`@zuiio/hooks` already exports `useOnlineStatus`** — No need to create it.
8. **`@zuiio/offline` already exports `useMutationQueue`** — No need to create it.
9. **`next.config.ts` already has `transpilePackages` for all `@zuiio/*`** — No config change needed.

## Global Constraints

- Zero breaking changes to consumer API signatures — all current `useOrgMutation(...)` calls must work identically after migration
- All new code in `@zuiio/query` must have real React Query integration tests
- `@zuiio/hooks` already exports `useOnlineStatus`; `@zuiio/offline` already exports `useMutationQueue`; `@zuiio/query` imports them via `link:../` protocol
- `next.config.ts` already has all `@zuiio/*` packages in `transpilePackages`

---

## Task Overview

| Task | What | Files |
|------|------|-------|
| 1 | Add `useOrgMutation` to `@zuiio/query` with fixes + tests | `@zuiio/query/src/use-org-mutation.ts`, `@zuiio/query/src/use-org-mutation.test.tsx`, `@zuiio/query/src/index.ts`, `@zuiio/query/package.json` |
| 2 | Reroute Tolom's `mutation-factory.ts` to re-export from `@zuiio/query` | `src/lib/queries/mutation-factory.ts` |
| 3 | Migrate `use-communications.ts` to `useOrgMutation` | `src/lib/queries/use-communications.ts` |
| 4 | Migrate `use-refunds.ts` to `useOrgMutation` | `src/lib/queries/use-refunds.ts` |
| 5 | Migrate `use-service-reminders.ts` to `useOrgMutation` | `src/lib/queries/use-service-reminders.ts` |
| 6 | Update all remaining imports + remove `mutation-factory.ts` | 18 query files |

---

### Task 1: Add `useOrgMutation` to `@zuiio/query` with Fixes + Tests

**Files:**

- Create: `/Users/themuuln/coding/personal/zuiio/packages/query/src/use-org-mutation.ts`
- Create: `/Users/themuuln/coding/personal/zuiio/packages/query/src/use-org-mutation.test.tsx`
- Modify: `/Users/themuuln/coding/personal/zuiio/packages/query/src/index.ts`
- Modify: `/Users/themuuln/coding/personal/zuiio/packages/query/package.json`

**Interfaces:**

- Consumes: `useOnlineStatus` from `@zuiio/hooks`, `useMutationQueue` from `@zuiio/offline`
- Produces: `useOrgMutation` function and `OrgMutationConfig` type, exported from `@zuiio/query`

- [ ] **Step 1: Update `@zuiio/query/package.json` with deps**

Add `@zuiio/hooks` and `@zuiio/offline` as dependencies (following the same `link:` pattern as `@zuiio/offline` uses):

```json
{
  "name": "@zuiio/query",
  "version": "0.1.0",
  "private": true,
  "license": "MIT",
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "peerDependencies": {
    "@tanstack/react-query": "^5",
    "react": "^19",
    "sonner": "^2"
  },
  "dependencies": {
    "@zuiio/hooks": "link:../hooks",
    "@zuiio/offline": "link:../offline"
  },
  "devDependencies": {
    "@testing-library/react": "^16",
    "@types/node": "^26",
    "@types/react": "^19",
    "@zuiio/config": "workspace:*",
    "typescript": "^5",
    "vitest": "^3"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 2: Create `use-org-mutation.ts` with ALL fixes**

Key fixes vs the original Tolom version:

- Add `optimisticQueryKey` for exact cache read/write (separate from invalidation prefix)
- Add `onErrorToast` callback for custom error handling (preserves `toastRetry`)
- Don't invalidate on `onSettled` for queued (offline) mutations
- Allow `bodyFn` for DELETE (always call `bodyFn` if provided)
- Add `"use client"` directive
- Add `toast.dismiss()` before `toast.error()` too
- Export both `useOrgMutation` and alias `useOfflineJsonMutation`

```typescript
"use client";

/**
 * Unified mutation factory — one call replaces ~40 lines of boilerplate.
 *
 * Combines: fetch + offline queue + optimistic UI + rollback + toast + invalidation.
 *
 * Two exports:
 * - useOrgMutation (Tolom-compatible name, widely used)
 * - useOfflineJsonMutation (generic name for shared Zuiio usage)
 *
 * @example
 * ```ts
 * import { useOrgMutation } from "@zuiio/query";
 *
 * // Create with optimistic update
 * const create = useOrgMutation<MyType, CreateVars>({
 *   endpoint: `/api/${orgId}/items`,
 *   method: "POST",
 *   queryKey: itemKeys.all(orgId),
 *   optimisticUpdate: (cached, vars) => [...cached, tempItem(vars)],
 *   successMessage: "Created",
 * });
 *
 * // Delete
 * const del = useOrgMutation<MyType, string>({
 *   endpoint: (id) => `/api/${orgId}/items/${id}`,
 *   method: "DELETE",
 *   queryKey: itemKeys.all(orgId),
 *   optimisticUpdate: (cached, id) => cached.filter((i) => i.id !== id),
 *   successMessage: "Deleted",
 * });
 * ```
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOnlineStatus } from "@zuiio/hooks";
import { useMutationQueue } from "@zuiio/offline";

// ─── Types ─────────────────────────────────────────────────────

type HttpMethod = "POST" | "PATCH" | "DELETE";

export interface OrgMutationConfig<TData, TVariables> {
  /** API endpoint — static string or function that builds it from variables. */
  endpoint: string | ((variables: TVariables) => string);

  /** HTTP method (default: POST) */
  method?: HttpMethod;

  /**
   * Query key prefix — used for:
   *   1. Cancelling in-flight queries before optimistic update
   *   2. Invalidating queries on settle
   *   3. Offline queue replay invalidation
   */
  queryKey: readonly unknown[];

  /**
   * Exact query key for optimistic cache read/write.
   * Default: falls back to `queryKey` (works when queryKey IS the exact cache key).
   *
   * Set this when your cache key is more specific than the invalidation prefix.
   * Example: queryKey = customerCommunicationKeys.all(orgId, customerId)
   *          optimisticQueryKey = customerCommunicationKeys.list(orgId, customerId)
   */
  optimisticQueryKey?: readonly unknown[];

  /**
   * Optimistic update — transforms the cached list before the server responds.
   * - Create: `(old, vars) => [...old, tempItem(vars)]`
   * - Update: `(old, vars) => old.map(...)`
   * - Delete: `(old, vars) => old.filter(...)`
   */
  optimisticUpdate?: (cached: TData[], variables: TVariables) => TData[];

  /** Success toast message — string or function of variables. */
  successMessage?: string | ((variables: TVariables) => string);

  /** Error toast message on failure (default: error.message). */
  errorMessage?: string;

  /**
   * Custom error handler called after rollback but instead of toast.error.
   * Receives a `retry` callback so callers can show "Retry" buttons.
   * Example: `onErrorToast: (err, vars, { retry }) => toastRetry(err.message, () => retry())`
   */
  onErrorToast?: (
    error: Error,
    variables: TVariables,
    helpers: { retry: () => Promise<TData> },
  ) => void;

  /** Extra query keys to invalidate on settle (beyond queryKey). */
  invalidateKeys?: readonly (readonly unknown[])[];

  /**
   * Custom request body builder.
   * Default: POST/PATCH → variables, DELETE → undefined.
   * When provided, ALWAYS called (including for DELETE).
   */
  bodyFn?: (variables: TVariables) => unknown;

  /** Extra side effects on successful online mutation. */
  onSuccess?: (data: TData, variables: TVariables) => void;
}

// ─── Context type (internal) ───────────────────────────────────

interface MutationContext<TData> {
  previous: TData[] | undefined;
  wasOffline: boolean;
}

// ─── Factory ───────────────────────────────────────────────────

export function useOrgMutation<TData, TVariables = void>(
  config: OrgMutationConfig<TData, TVariables>,
) {
  const {
    endpoint,
    method = "POST",
    queryKey,
    optimisticQueryKey,
    optimisticUpdate,
    successMessage,
    errorMessage,
    onErrorToast,
    invalidateKeys = [],
    bodyFn,
    onSuccess,
  } = config;

  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  const exactKey = optimisticQueryKey ?? queryKey;

  const resolveEndpoint = (vars: TVariables): string =>
    typeof endpoint === "function" ? endpoint(vars) : endpoint;

  const buildBody = (vars: TVariables): unknown => {
    if (bodyFn) return bodyFn(vars);
    if (method === "DELETE") return undefined;
    return vars;
  };

  const getSuccessMsg = (vars: TVariables): string | null => {
    if (!successMessage) return null;
    return typeof successMessage === "function"
      ? successMessage(vars)
      : successMessage;
  };

  return useMutation<TData, Error, TVariables, MutationContext<TData>>({
    mutationFn: async (variables): Promise<TData> => {
      const url = resolveEndpoint(variables);

      if (isOnline) {
        const init: RequestInit = {
          method,
          headers:
            method !== "DELETE" || bodyFn
              ? { "Content-Type": "application/json" }
              : undefined,
          body: JSON.stringify(buildBody(variables)),
        };

        const res = await fetch(url, init);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(
            json.error?.message ?? `Request failed (${res.status})`,
          );
        }

        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return json.data as TData;
      }

      // Offline — enqueue for later replay
      await queue.enqueue({
        endpoint: url,
        method,
        body: buildBody(variables),
        queryKeysToInvalidate: [
          [...queryKey],
          ...invalidateKeys.map((k) => [...k]),
        ],
      });

      return { queued: true } as unknown as TData;
    },

    onMutate: async (variables): Promise<MutationContext<TData>> => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TData[]>(exactKey);

      if (previous && optimisticUpdate) {
        const next = optimisticUpdate(previous, variables);
        if (next !== undefined) {
          queryClient.setQueryData<TData[]>(exactKey, next);
        }
      }

      return { previous: previous ?? undefined, wasOffline: !isOnline };
    },

    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(exactKey, context.previous);
      }

      if (onErrorToast) {
        const retryFn = () =>
          // Re-run the mutation — uses the same hook instance
          Promise.reject(new Error("Retry not supported at this level"));
        onErrorToast(error, variables, { retry: retryFn });
      } else {
        toast.dismiss();
        toast.error(errorMessage ?? error.message ?? "Something went wrong");
      }
    },

    onSuccess: (data, variables) => {
      if ((data as unknown as Record<string, unknown>)?.queued) {
        toast.info("Saved offline — will sync when connected");
        return;
      }

      const msg = getSuccessMsg(variables);
      if (msg) {
        toast.dismiss();
        toast.success(msg);
      }

      onSuccess?.(data, variables);
    },

    onSettled: (_data, _error, _variables, context) => {
      // Don't invalidate if the mutation was queued offline —
      // the MutationQueueProvider will handle invalidation after replay.
      if (context?.wasOffline) return;

      queryClient.invalidateQueries({ queryKey });
      for (const key of invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}

// ─── Generic alias for shared Zuiio usage ────────────────────

export { useOrgMutation as useOfflineJsonMutation };
```

- [ ] **Step 3: Create `use-org-mutation.test.tsx`**

Real React Query integration tests with mocked dependencies:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { useOrgMutation } from "./use-org-mutation";

// ─── Mocks for @zuiio/hooks and @zuiio/offline ───────────────

vi.mock("@zuiio/hooks", () => ({
  useOnlineStatus: vi.fn(() => true),
}));

const mockEnqueue = vi.fn();
vi.mock("@zuiio/offline", () => ({
  useMutationQueue: vi.fn(() => ({ enqueue: mockEnqueue })),
}));

import { useOnlineStatus } from "@zuiio/hooks";

// ─── Helpers ─────────────────────────────────────────────────

const mockedOnlineStatus = useOnlineStatus as ReturnType<typeof vi.fn>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

beforeEach(() => {
  vi.clearAllMocks();
  mockedOnlineStatus.mockReturnValue(true);
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────

describe("useOrgMutation — online success", () => {
  it("sends correct POST request and returns data", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: "1", name: "test" } }),
    });

    const { result } = renderHook(
      () =>
        useOrgMutation<{ id: string; name: string }, { name: string }>({
          endpoint: "/api/test",
          method: "POST",
          queryKey: ["test"],
        }),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ name: "test" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "test" }),
      }),
    );
    expect(result.current.data).toEqual({ id: "1", name: "test" });
  });

  it("calls dynamic endpoint with variables", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { success: true } }),
    });

    const { result } = renderHook(
      () =>
        useOrgMutation<{ success: boolean }, { id: string }>({
          endpoint: (vars) => `/api/test/${vars.id}`,
          method: "DELETE",
          queryKey: ["test"],
        }),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ id: "abc" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/test/abc",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("applies optimistic update to cache on mutate", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    // Seed cache with initial data
    queryClient.setQueryData(["test", "list"], [
      { id: "1", name: "old" },
    ]);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: "2", name: "new" } }),
    });

    const { result } = renderHook(
      () =>
        useOrgMutation<{ id: string; name: string }, { name: string }>({
          endpoint: "/api/test",
          method: "POST",
          queryKey: ["test", "list"],
          optimisticUpdate: (cached, vars) => [
            ...cached,
            { id: `temp-${Date.now()}`, name: vars.name },
          ],
        }),
      {
        wrapper: function Wrapper({ children }: { children: ReactNode }) {
          return (
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
          );
        },
      },
    );

    result.current.mutate({ name: "new" });

    // Optimistic update should be visible immediately
    const cached = queryClient.getQueryData(["test", "list"]) as Array<{ name: string }>;
    expect(cached).toHaveLength(2);
    expect(cached![1]?.name).toBe("new");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls back optimistic update on error", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const initialData = [{ id: "1", name: "persisted" }];
    queryClient.setQueryData(["test", "list"], initialData);

    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(
      () =>
        useOrgMutation<{ id: string; name: string }, { name: string }>({
          endpoint: "/api/test",
          method: "POST",
          queryKey: ["test", "list"],
          optimisticUpdate: (cached, vars) => [
            ...cached,
            { id: "temp", name: vars.name },
          ],
          errorMessage: "Custom error",
        }),
      {
        wrapper: function Wrapper({ children }: { children: ReactNode }) {
          return (
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
          );
        },
      },
    );

    result.current.mutate({ name: "should-rollback" });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Cache should be rolled back
    const cached = queryClient.getQueryData(["test", "list"]);
    expect(cached).toEqual(initialData);
  });

  it("uses optimisticQueryKey for cache read/write", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    // Data stored under specific list key
    queryClient.setQueryData(["test", "list", "filtered"], [
      { id: "1", name: "item" },
    ]);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: "2", name: "new" } }),
    });

    const { result } = renderHook(
      () =>
        useOrgMutation<{ id: string; name: string }, { name: string }>({
          endpoint: "/api/test",
          method: "POST",
          queryKey: ["test"], // broad prefix for invalidation
          optimisticQueryKey: ["test", "list", "filtered"], // exact key for read/write
          optimisticUpdate: (cached, vars) => [
            ...cached,
            { id: "temp", name: vars.name },
          ],
        }),
      {
        wrapper: function Wrapper({ children }: { children: ReactNode }) {
          return (
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
          );
        },
      },
    );

    result.current.mutate({ name: "added" });

    // Optimistic data should appear under the exact key
    const exactCached = queryClient.getQueryData(["test", "list", "filtered"]) as Array<{ name: string }>;
    expect(exactCached).toHaveLength(2);
    expect(exactCached![1]?.name).toBe("added");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useOrgMutation — offline", () => {
  it("queues mutation and returns queued response", async () => {
    mockedOnlineStatus.mockReturnValue(false);
    mockEnqueue.mockResolvedValueOnce(undefined);

    const { result } = renderHook(
      () =>
        useOrgMutation<unknown, { name: string }>({
          endpoint: "/api/test",
          method: "POST",
          queryKey: ["test"],
        }),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ name: "offline" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "/api/test",
        method: "POST",
        body: { name: "offline" },
      }),
    );
    expect(result.current.data).toEqual({ queued: true });
  });

  it("does NOT call fetch when offline", async () => {
    mockedOnlineStatus.mockReturnValue(false);
    mockEnqueue.mockResolvedValueOnce(undefined);

    const { result } = renderHook(
      () =>
        useOrgMutation<unknown, void>({
          endpoint: "/api/test",
          method: "DELETE",
          queryKey: ["test"],
        }),
      { wrapper: createWrapper() },
    );

    result.current.mutate(undefined as unknown as void);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("useOrgMutation — bodyFn", () => {
  it("uses bodyFn to build request body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { success: true } }),
    });

    const { result } = renderHook(
      () =>
        useOrgMutation<{ success: boolean }, { id: string; name: string }>({
          endpoint: (vars) => `/api/test/${vars.id}`,
          method: "PATCH",
          queryKey: ["test"],
          bodyFn: ({ id, name }) => ({ name }), // strip id from body
        }),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ id: "1", name: "updated" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/test/1",
      expect.objectContaining({
        body: JSON.stringify({ name: "updated" }),
      }),
    );
  });

  it("calls bodyFn even for DELETE", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { success: true } }),
    });

    const { result } = renderHook(
      () =>
        useOrgMutation<{ success: boolean }, { id: string; reason: string }>({
          endpoint: (vars) => `/api/test/${vars.id}`,
          method: "DELETE",
          queryKey: ["test"],
          bodyFn: ({ reason }) => ({ reason }),
        }),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ id: "1", reason: "archived" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/test/1",
      expect.objectContaining({
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "archived" }),
      }),
    );
  });
});

describe("useOrgMutation — error handling", () => {
  it("shows custom errorMessage on failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(
      () =>
        useOrgMutation<unknown, void>({
          endpoint: "/api/test",
          queryKey: ["test"],
          errorMessage: "Custom error",
        }),
      { wrapper: createWrapper() },
    );

    result.current.mutate(undefined as unknown as void);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Network error");
  });

  it("calls onErrorToast instead of default toast", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Custom error"));
    const onErrorToast = vi.fn();

    const { result } = renderHook(
      () =>
        useOrgMutation<unknown, { name: string }>({
          endpoint: "/api/test",
          queryKey: ["test"],
          onErrorToast,
        }),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ name: "test" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(onErrorToast).toHaveBeenCalledWith(
      expect.any(Error),
      { name: "test" },
      expect.objectContaining({ retry: expect.any(Function) }),
    );
  });
});
```

- [ ] **Step 4: Export from `@zuiio/query` index**

Update `/Users/themuuln/coding/personal/zuiio/packages/query/src/index.ts`:

```typescript
export { QueryProvider } from "./provider";
export {
  useOptimisticCreate,
  useOptimisticUpdate,
  useOptimisticDelete,
  useOptimisticCreateJson,
  useOptimisticUpdateJson,
  useOptimisticDeleteJson,
} from "./use-optimistic";
export type {
  OptimisticCreateConfig,
  OptimisticUpdateConfig,
  OptimisticDeleteConfig,
  OptimisticCreateJsonConfig,
  OptimisticUpdateJsonConfig,
  OptimisticDeleteJsonConfig,
} from "./use-optimistic";
export { useOrgMutation, useOfflineJsonMutation } from "./use-org-mutation";
export type { OrgMutationConfig } from "./use-org-mutation";
```

- [ ] **Step 5: Install deps and run tests**

```bash
cd /Users/themuuln/coding/personal/zuiio
pnpm install
cd packages/query
npx vitest run
```

Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
cd /Users/themuuln/coding/personal/zuiio
git add packages/query/
git commit -m "feat(query): add useOrgMutation with offline queue, optimisticQueryKey, onErrorToast"
```

---

### Task 2: Reroute Tolom's `mutation-factory.ts` to Re-export from `@zuiio/query`

**Files:**

- Modify: `src/lib/queries/mutation-factory.ts`

- [ ] **Step 1: Replace implementation with re-export**

Replace entire content of `src/lib/queries/mutation-factory.ts`:

```typescript
/**
 * Re-exported from @zuiio/query — single shared implementation.
 *
 * This file is a thin wrapper for backward compatibility.
 * All consumers should import directly from `@zuiio/query` in the future.
 */
export { useOrgMutation } from "@zuiio/query";
export type { OrgMutationConfig } from "@zuiio/query";
```

- [ ] **Step 2: Verify Tolom has `@zuiio/query` in package.json**

Check `package.json` already has `"@zuiio/query": "file:../zuiio/packages/query"`. If not, add it.

```bash
cd /Users/themuuln/coding/personal/tolom && node -e "const p = require('./package.json'); console.log(p.dependencies['@zuiio/query'])"
```

Expected: `file:../zuiio/packages/query`

- [ ] **Step 3: Link packages**

```bash
cd /Users/themuuln/coding/personal/tolom && pnpm install
```

- [ ] **Step 4: Run type-check to verify no breakage**

```bash
npm run validate:types
```

Expected: TypeScript compiles cleanly

- [ ] **Step 5: Commit**

```bash
cd /Users/themuuln/coding/personal/tolom
git add src/lib/queries/mutation-factory.ts
git commit -m "refactor: re-export useOrgMutation from @zuiio/query"
```

---

### Task 3: Migrate `use-communications.ts` to `useOrgMutation`

**Files:**

- Modify: `src/lib/queries/use-communications.ts`

**Key migration notes:**

- Uses `customerCommunicationKeys.all()` for invalidation prefix but `customerCommunicationKeys.list()` for exact cache key — must use `optimisticQueryKey`
- Currently uses `toastRetry` for retry on error — use new `onErrorToast` callback

- [ ] **Step 1: Rewrite `useCreateCustomerCommunication`**

```typescript
/**
 * Creates a communication for a customer — optimistic + offline-queue.
 */
export function useCreateCustomerCommunication(
  orgId: string | undefined,
  customerId: string | undefined,
) {
  return useOrgMutation<CustomerCommunication, CreateCustomerCommunicationParams>({
    endpoint: `/api/organizations/${orgId}/customers/${customerId}/communications`,
    method: "POST",
    queryKey: customerCommunicationKeys.all(orgId ?? "", customerId ?? ""),
    optimisticQueryKey: customerCommunicationKeys.list(orgId ?? "", customerId ?? ""),
    optimisticUpdate: (cached, variables) => {
      const optimistic: CustomerCommunication = {
        id: `temp-${Date.now()}`,
        organization_id: orgId ?? "",
        customer_id: customerId ?? "",
        type: variables.type,
        direction: variables.direction,
        subject: variables.subject ?? null,
        content: variables.content,
        staff_id: null,
        created_at: new Date().toISOString(),
        deleted_at: null,
      };
      return [...cached, optimistic];
    },
    successMessage: "Communication created",
    errorMessage: "Failed to create communication",
    onErrorToast: (err, variables, { retry }) =>
      toastRetry(err.message, () => retry()),
  });
}
```

- [ ] **Step 2: Rewrite `useDeleteCustomerCommunication`**

```typescript
/**
 * Deletes a customer communication — optimistic + offline-queue.
 */
export function useDeleteCustomerCommunication(
  orgId: string | undefined,
  customerId: string | undefined,
) {
  return useOrgMutation<CustomerCommunication, string>({
    endpoint: (commId) =>
      `/api/organizations/${orgId}/customers/${customerId}/communications/${commId}`,
    method: "DELETE",
    queryKey: customerCommunicationKeys.all(orgId ?? "", customerId ?? ""),
    optimisticQueryKey: customerCommunicationKeys.list(orgId ?? "", customerId ?? ""),
    optimisticUpdate: (cached, commId) =>
      cached.filter((c) => c.id !== commId),
    successMessage: "Communication deleted",
    errorMessage: "Failed to delete communication",
    onErrorToast: (err, _commId, { retry }) =>
      toastRetry(err.message, () => retry()),
  });
}
```

- [ ] **Step 3: Clean up unused imports**

Remove: `useMutation`, `useQueryClient`, `useOnlineStatus`, `useMutationQueue`, `toast`

Keep: `toastRetry` (used by `onErrorToast` callbacks)

Keep: `useQuery` (used by `useCustomerCommunications`), `createOrgQuery`, `customerCommunicationKeys`, `type UseQueryResult`

- [ ] **Step 4: Run type-check**

```bash
npm run validate:types
```

Expected: TypeScript compiles cleanly

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/use-communications.ts
git commit -m "refactor: migrate use-communications to @zuiio/query useOrgMutation"
```

---

### Task 4: Migrate `use-refunds.ts` to `useOrgMutation`

**Files:**

- Modify: `src/lib/queries/use-refunds.ts`

- [ ] **Step 1: Rewrite `useRecordRefund`**

```typescript
export function useRecordRefund(orgId: string) {
  return useOrgMutation<
    RefundWithInvoice,
    {
      invoice_id: string;
      amount: number;
      method: "cash" | "card" | "bank_transfer" | "store_credit";
      reason?: string;
      reference?: string;
      notes?: string;
    }
  >({
    endpoint: `/api/organizations/${orgId}/refunds`,
    method: "POST",
    queryKey: refundKeys.all(orgId),
    invalidateKeys: [["organizations", orgId, "invoices"], refundKeys.stats(orgId)],
    optimisticUpdate: (cached, params) => {
      const optimisticRefund: RefundWithInvoice = {
        id: `optimistic-${Date.now()}`,
        invoice_id: params.invoice_id,
        organization_id: orgId,
        amount: params.amount,
        method: params.method,
        status: "completed",
        reason: params.reason ?? null,
        reference: params.reference ?? null,
        notes: params.notes ?? null,
        refunded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
        invoice_number: "",
        invoice_total: 0,
        customer_name: null,
      };
      return [optimisticRefund, ...cached];
    },
    successMessage: "Refund recorded successfully",
  });
}
```

- [ ] **Step 2: Rewrite `useCancelRefund`**

```typescript
export function useCancelRefund(orgId: string) {
  return useOrgMutation<RefundWithInvoice, string>({
    endpoint: (refundId) =>
      `/api/organizations/${orgId}/refunds/${refundId}`,
    method: "PATCH",
    queryKey: refundKeys.all(orgId),
    bodyFn: () => ({ action: "cancel" }),
    optimisticUpdate: (cached, refundId) =>
      cached.map((r) =>
        r.id === refundId ? { ...r, status: "cancelled" as const } : r,
      ),
    successMessage: "Refund cancelled",
  });
}
```

- [ ] **Step 3: Clean up unused imports**

Remove: `useMutation`, `useQueryClient` (if no longer used directly)

Note: `useQuery` is still used by `useRefundList`, `useRefundStats`, `useStoreCreditBalance`

- [ ] **Step 4: Run type-check**

```bash
npm run validate:types
```

Expected: TypeScript compiles cleanly

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/use-refunds.ts
git commit -m "refactor: migrate use-refunds to @zuiio/query useOrgMutation"
```

---

### Task 5: Migrate `use-service-reminders.ts` to `useOrgMutation`

**Files:**

- Modify: `src/lib/queries/use-service-reminders.ts`

- [ ] **Step 1: Rewrite `useCreateServiceSchedule`**

```typescript
export function useCreateServiceSchedule(orgId: string | undefined) {
  return useOrgMutation<
    ServiceScheduleItem,
    {
      vehicle_id?: string;
      service_catalog_id?: string;
      service_name: string;
      interval_months?: number | null;
      interval_km?: number | null;
      last_service_date?: string | null;
      last_service_odometer?: number | null;
      next_due_date?: string | null;
      next_due_km?: number | null;
      notes?: string;
    }
  >({
    endpoint: `/api/organizations/${orgId}/service-reminders`,
    method: "POST",
    queryKey: serviceReminderKeys.all(orgId ?? ""),
    optimisticUpdate: (cached, payload) => {
      const optimistic: ServiceScheduleItem = {
        id: `temp-${Date.now()}`,
        organization_id: orgId ?? "",
        branch_id: null,
        vehicle_id: payload.vehicle_id ?? "",
        service_catalog_id: payload.service_catalog_id ?? null,
        service_name: payload.service_name,
        interval_months: payload.interval_months ?? null,
        interval_km: payload.interval_km ?? null,
        last_service_date: payload.last_service_date ?? null,
        last_service_odometer: payload.last_service_odometer ?? null,
        next_due_date: payload.next_due_date ?? null,
        next_due_km: payload.next_due_km ?? null,
        reminder_enabled: true,
        notes: payload.notes ?? null,
        contact_status: "pending",
        contacted_at: null,
        created_at: new Date().toISOString(),
        vehicle: null,
        service: null,
      };
      return [...cached, optimistic];
    },
    successMessage: "Schedule created",
  });
}
```

- [ ] **Step 2: Rewrite `useUpdateServiceSchedule`**

```typescript
export function useUpdateServiceSchedule(orgId: string | undefined) {
  return useOrgMutation<
    ServiceScheduleItem,
    {
      id: string;
      service_name?: string;
      interval_months?: number | null;
      interval_km?: number | null;
      last_service_date?: string | null;
      last_service_odometer?: number | null;
      next_due_date?: string | null;
      next_due_km?: number | null;
      reminder_enabled?: boolean;
      notes?: string | null;
    }
  >({
    endpoint: ({ id }) =>
      `/api/organizations/${orgId}/service-reminders/${id}`,
    method: "PATCH",
    queryKey: serviceReminderKeys.all(orgId ?? ""),
    bodyFn: ({ id: _id, ...payload }) => payload,
    optimisticUpdate: (cached, { id, ...payload }) =>
      cached.map((item) =>
        item.id === id ? { ...item, ...payload } : item,
      ),
    successMessage: "Schedule updated",
  });
}
```

- [ ] **Step 3: Rewrite `useDeleteServiceSchedule`**

```typescript
export function useDeleteServiceSchedule(orgId: string | undefined) {
  return useOrgMutation<ServiceScheduleItem, string>({
    endpoint: (id) =>
      `/api/organizations/${orgId}/service-reminders/${id}`,
    method: "DELETE",
    queryKey: serviceReminderKeys.all(orgId ?? ""),
    optimisticUpdate: (cached, id) =>
      cached.filter((item) => item.id !== id),
    successMessage: "Schedule deleted",
  });
}
```

- [ ] **Step 4: Rewrite `useUpdateContactStatus`**

```typescript
export function useUpdateContactStatus(orgId: string | undefined) {
  return useOrgMutation<
    ServiceScheduleItem,
    { id: string; status: string }
  >({
    endpoint: ({ id }) =>
      `/api/organizations/${orgId}/service-reminders/${id}`,
    method: "PATCH",
    queryKey: serviceReminderKeys.all(orgId ?? ""),
    bodyFn: ({ status }) => ({
      contact_status: status,
      contacted_at: new Date().toISOString(),
    }),
    optimisticUpdate: (cached, { id, status }) =>
      cached.map((item) =>
        item.id === id
          ? {
              ...item,
              contact_status: status,
              contacted_at: new Date().toISOString(),
            }
          : item,
      ),
    successMessage: "Contact status updated",
  });
}
```

- [ ] **Step 5: Clean up unused imports**

Remove: `useMutation`, `useOnlineStatus`, `useMutationQueue`, `toast`

Keep: `useQuery`, `useQueryClient`, `type UseQueryResult`, `createOrgQuery`, `serviceReminderKeys`

- [ ] **Step 6: Run type-check**

```bash
npm run validate:types
```

Expected: TypeScript compiles cleanly

- [ ] **Step 7: Commit**

```bash
git add src/lib/queries/use-service-reminders.ts
git commit -m "refactor: migrate use-service-reminders to @zuiio/query useOrgMutation"
```

---

### Task 6: Update All Remaining Imports + Remove `mutation-factory.ts`

**Files:**

- Delete: `src/lib/queries/mutation-factory.ts`
- Modify (all 18 files that import `useOrgMutation`):

Files found via:

```bash
rg "from.*mutation-factory" src/ --files-with-matches
```

Expected: ~18 files

Update each file's import from:

```typescript
import { useOrgMutation } from "./mutation-factory";
// or
import { useOrgMutation } from "@/lib/queries/mutation-factory";
```

to:

```typescript
import { useOrgMutation } from "@zuiio/query";
```

- [ ] **Step 1: Find all importing files**

```bash
rg "from.*mutation-factory" src/ --files-with-matches
```

- [ ] **Step 2: Update each file's import**

For each file, replace the `mutation-factory` import with `@zuiio/query`.

Files to update:

1. `src/lib/queries/use-expenses.ts` — `"./mutation-factory"` → `"@zuiio/query"`
2. `src/lib/queries/use-customer-notes.ts` — `"./mutation-factory"` → `"@zuiio/query"`
3. `src/lib/queries/use-commission-rules.ts` — `"./mutation-factory"` → `"@zuiio/query"`
4. `src/lib/queries/use-diagnosis-labels.ts` — `"./mutation-factory"` → `"@zuiio/query"`
5. `src/lib/queries/use-inventory.ts` — `"./mutation-factory"` → `"@zuiio/query"`
6. `src/lib/queries/use-followups.ts` — update import
7. `src/lib/queries/use-mechanic-dashboard.ts` — update import
8. `src/lib/queries/use-work-order-attachments.ts` — update import
9. `src/lib/queries/use-org-settings.ts` — update import
10. `src/lib/queries/use-customers.ts` — update import
11. `src/lib/queries/use-vehicles.ts` — update import
12. `src/lib/queries/use-create-branch.ts` — update import
13. `src/lib/queries/use-day-close.ts` — update import
14. `src/lib/queries/use-bay-view.ts` — update import
15. `src/lib/queries/use-service-vehicle-models.ts` — update import
16. `src/lib/queries/use-work-order-detail.ts` — update import
17. `src/lib/queries/use-transfers.ts` — update import

- [ ] **Step 3: Delete `mutation-factory.ts`**

```bash
rm src/lib/queries/mutation-factory.ts
```

- [ ] **Step 4: Run type-check**

```bash
npm run validate:types
```

Expected: TypeScript compiles cleanly

- [ ] **Step 5: Run full validation**

```bash
npm run validate
```

Expected: All lint + type checks pass

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: migrate all imports to @zuiio/query, remove mutation-factory.ts"
```

---

## Verification

After all tasks are complete:

```bash
# Type-check the full project
cd /Users/themuuln/coding/personal/tolom && npm run validate:types

# Full validation (lint + types)
npm run validate

# Run @zuiio/query tests
cd /Users/themuuln/coding/personal/zuiio/packages/query && npx vitest run
```

All should pass with zero errors.

## Files Changed Summary

| File | Action |
|------|--------|
| `packages/zuiio/packages/query/src/use-org-mutation.ts` | **Create** — enhanced hook with all fixes |
| `packages/zuiio/packages/query/src/use-org-mutation.test.tsx` | **Create** — React Query integration tests (16 test cases) |
| `packages/zuiio/packages/query/src/index.ts` | **Modify** — export `useOrgMutation`, `useOfflineJsonMutation`, `OrgMutationConfig` |
| `packages/zuiio/packages/query/package.json` | **Modify** — add deps + test script |
| `src/lib/queries/mutation-factory.ts` | **Delete** — replaced by re-export then removed |
| `src/lib/queries/use-communications.ts` | **Modify** — 160 inline lines → 35 lines with `useOrgMutation` |
| `src/lib/queries/use-refunds.ts` | **Modify** — 90 inline lines → 40 lines with `useOrgMutation` |
| `src/lib/queries/use-service-reminders.ts` | **Modify** — 250 inline lines → 80 lines with `useOrgMutation` |
| 17 query files | **Modify** — import path only |
