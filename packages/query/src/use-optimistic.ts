"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

/**
 * Shared config fields across all optimistic mutations.
 * `queryKey` is lazy (function) to avoid stale closures.
 */
interface BaseOptimisticConfig<TVars> {
  /** Mutation function — FormData-based for Server Actions. */
  mutationFn: (variables: TVars) => Promise<unknown>;
  /**
   * Lazy query key factory. Called at mutation time, so it always
   * reflects the latest org/branch IDs. Contrast with hook-time
   * values which may be stale in closures.
   */
  queryKey: () => readonly string[];
  /** Default error message when the thrown error is not an Error instance. */
  defaultErrorMessage?: string;
}

// ── FormData variants ──────────────────────────────────────────

export interface OptimisticCreateConfig {
  mutationFn: (formData: FormData) => Promise<unknown>;
  queryKey: () => readonly string[];
  buildOptimistic: (formData: FormData) => Record<string, unknown>;
  defaultErrorMessage?: string;
}

export interface OptimisticUpdateConfig {
  mutationFn: (formData: FormData) => Promise<unknown>;
  queryKey: () => readonly string[];
  getId: (formData: FormData) => string;
  buildOptimistic: (formData: FormData) => Record<string, unknown>;
  defaultErrorMessage?: string;
}

export interface OptimisticDeleteConfig {
  mutationFn: (formData: FormData) => Promise<unknown>;
  queryKey: () => readonly string[];
  getId: (formData: FormData) => string;
  defaultErrorMessage?: string;
}

// ── JSON variants ─────────────────────────────────────────────

export interface OptimisticCreateJsonConfig<TVars> extends BaseOptimisticConfig<TVars> {
  buildOptimistic: (variables: TVars) => Record<string, unknown>;
}

export interface OptimisticUpdateJsonConfig<TVars> extends BaseOptimisticConfig<TVars> {
  getId: (variables: TVars) => string;
  buildOptimistic: (variables: TVars) => Record<string, unknown>;
}

export interface OptimisticDeleteJsonConfig<TVars> extends BaseOptimisticConfig<TVars> {
  getId: (variables: TVars) => string;
}

// ═══════════════════════════════════════════════════════════════
// Internal helpers
// ═══════════════════════════════════════════════════════════════

type QuerySnapshot = Array<[readonly unknown[], unknown]>;

/**
 * Snapshot ALL active queries matching `queryKey()` prefix and apply
 * `setter` to each array-type cache. Returns the snapshot for rollback.
 */
function snapshotAndApply(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: () => readonly string[],
  setter: (old: unknown) => unknown,
): QuerySnapshot {
  const key = queryKey();
  // Cancel in-flight queries so we don't overwrite our optimistic data
  queryClient.cancelQueries({ queryKey: key });

  // Snapshot ALL matching caches (not just the first match)
  const snapshot = queryClient.getQueriesData({ queryKey: key });

  // Apply optimistic update to every active query
  queryClient.setQueriesData({ queryKey: key, type: "active" }, setter);

  return snapshot;
}

/** Rollback ALL snapped queries on error. */
function rollbackAll(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshot: QuerySnapshot | undefined,
) {
  if (!snapshot) return;
  for (const [key, data] of snapshot) {
    queryClient.setQueryData(key, data);
  }
}

function getErrorMsg(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

// ═══════════════════════════════════════════════════════════════
// FormData-based hooks (for Server Actions)
// ═══════════════════════════════════════════════════════════════

/**
 * Optimistic create — immediately prepends the built item to all
 * active list caches matching `queryKey()`. Rolls back on error.
 *
 * @example
 * ```tsx
 * const createMutation = useOptimisticCreate({
 *   mutationFn: async (formData) => {
 *     const result = await serverAction(undefined, formData);
 *     if (result?.error) throw new Error(result.error);
 *     return result;
 *   },
 *   queryKey: () => productKeys.all,
 *   buildOptimistic: (formData) => ({
 *     id: `opt-${Date.now()}`,
 *     name: formData.get("name") as string,
 *     created_at: new Date().toISOString(),
 *   }),
 * });
 *
 * // In submit handler:
 * createMutation.mutate(formData, {
 *   onSuccess: () => { setOpen(false); toast.success("Created"); },
 * });
 * ```
 */
export function useOptimisticCreate(config: OptimisticCreateConfig) {
  const {
    mutationFn,
    queryKey,
    buildOptimistic,
    defaultErrorMessage = "Алдаа гарлаа.",
  } = config;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (formData) => {
      const optimistic = buildOptimistic(formData);
      return snapshotAndApply(queryClient, queryKey, (old) => {
        if (Array.isArray(old)) return [optimistic, ...old];
        return old;
      });
    },
    onError: (err, _vars, context) => {
      rollbackAll(queryClient, context);
      toast.error(getErrorMsg(err, defaultErrorMessage));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey() });
    },
  });
}

/**
 * Optimistic update — merges partial into the cached item matching
 * `getId(formData)`. Rolls back on error.
 */
export function useOptimisticUpdate(config: OptimisticUpdateConfig) {
  const {
    mutationFn,
    queryKey,
    getId,
    buildOptimistic,
    defaultErrorMessage = "Алдаа гарлаа.",
  } = config;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (formData) => {
      const id = getId(formData);
      const updates = buildOptimistic(formData);
      return snapshotAndApply(queryClient, queryKey, (old) => {
        if (Array.isArray(old)) {
          return old.map((item: Record<string, unknown>) =>
            item.id === id ? { ...item, ...updates } : item,
          );
        }
        return old;
      });
    },
    onError: (err, _vars, context) => {
      rollbackAll(queryClient, context);
      toast.error(getErrorMsg(err, defaultErrorMessage));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey() });
    },
  });
}

/**
 * Optimistic delete — removes the item matching `getId(formData)`
 * from all active list caches. Rolls back on error.
 */
export function useOptimisticDelete(config: OptimisticDeleteConfig) {
  const {
    mutationFn,
    queryKey,
    getId,
    defaultErrorMessage = "Алдаа гарлаа.",
  } = config;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (formData) => {
      const id = getId(formData);
      return snapshotAndApply(queryClient, queryKey, (old) => {
        if (Array.isArray(old)) {
          return old.filter(
            (item: Record<string, unknown>) =>
              item.id !== id &&
              (item as { productId?: string }).productId !== id,
          );
        }
        return old;
      });
    },
    onError: (err, _vars, context) => {
      rollbackAll(queryClient, context);
      toast.error(getErrorMsg(err, defaultErrorMessage));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey() });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// JSON-based hooks (for fetch/REST APIs)
// ═══════════════════════════════════════════════════════════════

/**
 * JSON variant of useOptimisticCreate. Use when `mutationFn` accepts
 * a typed object instead of FormData (e.g. fetch-based APIs).
 *
 * @example
 * ```ts
 * const createMutation = useOptimisticCreateJson<CreateNote, Note>({
 *   mutationFn: (vars) => fetch("/api/notes", { method: "POST", body: JSON.stringify(vars) }),
 *   queryKey: () => noteKeys.all(orgId),
 *   buildOptimistic: (vars) => ({
 *     id: `temp-${Date.now()}`,
 *     content: vars.content,
 *     created_at: new Date().toISOString(),
 *   }),
 * });
 * ```
 */
export function useOptimisticCreateJson<TVars>(
  config: OptimisticCreateJsonConfig<TVars>,
) {
  const {
    mutationFn,
    queryKey,
    buildOptimistic,
    defaultErrorMessage = "Something went wrong",
  } = config;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      const optimistic = buildOptimistic(variables);
      return snapshotAndApply(queryClient, queryKey, (old) => {
        if (Array.isArray(old)) return [optimistic, ...old];
        return old;
      });
    },
    onError: (err, _vars, context) => {
      rollbackAll(queryClient, context);
      toast.error(getErrorMsg(err, defaultErrorMessage));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey() });
    },
  });
}

/**
 * JSON variant of useOptimisticUpdate.
 */
export function useOptimisticUpdateJson<TVars>(
  config: OptimisticUpdateJsonConfig<TVars>,
) {
  const {
    mutationFn,
    queryKey,
    getId,
    buildOptimistic,
    defaultErrorMessage = "Something went wrong",
  } = config;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      const id = getId(variables);
      const updates = buildOptimistic(variables);
      return snapshotAndApply(queryClient, queryKey, (old) => {
        if (Array.isArray(old)) {
          return old.map((item: Record<string, unknown>) =>
            item.id === id ? { ...item, ...updates } : item,
          );
        }
        return old;
      });
    },
    onError: (err, _vars, context) => {
      rollbackAll(queryClient, context);
      toast.error(getErrorMsg(err, defaultErrorMessage));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey() });
    },
  });
}

/**
 * JSON variant of useOptimisticDelete.
 */
export function useOptimisticDeleteJson<TVars>(
  config: OptimisticDeleteJsonConfig<TVars>,
) {
  const {
    mutationFn,
    queryKey,
    getId,
    defaultErrorMessage = "Something went wrong",
  } = config;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      const id = getId(variables);
      return snapshotAndApply(queryClient, queryKey, (old) => {
        if (Array.isArray(old)) {
          return old.filter(
            (item: Record<string, unknown>) =>
              item.id !== id &&
              (item as { productId?: string }).productId !== id,
          );
        }
        return old;
      });
    },
    onError: (err, _vars, context) => {
      rollbackAll(queryClient, context);
      toast.error(getErrorMsg(err, defaultErrorMessage));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey() });
    },
  });
}
