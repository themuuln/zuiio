/**
 * 🏭 createCrudHooks — factory that generates all CRUD hooks for a simple list entity.
 *
 * Replaces ~50 lines of boilerplate per entity (createOrgQuery + useQuery + 3x useOrgMutation)
 * with a single call that returns four hooks.
 *
 * NOT a React hook itself — call at module level. The returned hooks follow hook rules.
 *
 * @example
 * // src/lib/queries/use-diagnosis-labels.ts
 * import { createCrudHooks } from "./use-crud-list";
 * import type { DiagnosisLabel } from "@/lib/types";
 * import { diagnosisLabelKeys } from "./keys";
 *
 * const crud = createCrudHooks<DiagnosisLabel>({
 *   path: "/diagnosis-labels",
 *   queryKey: (orgId) => diagnosisLabelKeys.list(orgId),
 *   optimisticCreate: (body, orgId, { optimisticId }) => ({
 *     id: optimisticId,
 *     organization_id: orgId,
 *     name: body.name ?? "",
 *     name_mn: null,
 *     color: body.color ?? null,
 *     sort_order: 0,
 *     is_active: body.is_active ?? true,
 *     created_by: null,
 *     created_at: new Date().toISOString(),
 *     updated_at: new Date().toISOString(),
 *     deleted_at: null,
 *   }),
 * });
 *
 * export const {
 *   useList: useDiagnosisLabels,
 *   useCreate: useCreateDiagnosisLabel,
 *   useUpdate: useUpdateDiagnosisLabel,
 *   useDelete: useDeleteDiagnosisLabel,
 * } = crud;
 */

import {
  type QueryKey,
  type UseMutationResult,
  type UseQueryResult,
  useQuery,
} from "@tanstack/react-query";
import { type OptimisticContext, useOrgMutation } from "@zuiio/query";
import * as React from "react";
import { toast } from "sonner";
import { reportServerError } from "@/lib/sentry-report-server";
import { createOrgQuery } from "./factory";

// ── Config ────────────────────────────────────────────────────

export interface CrudHooksConfig<
  TList extends { id: string },
  TCreate = Partial<TList>,
  TUpdate = Partial<TList>,
> {
  /** API path relative to `/api/organizations/:orgId` (e.g. `"/diagnosis-labels"`). */
  path: string;
  /** Query key factory — receives orgId, returns the exact list cache key. */
  queryKey: (orgId: string) => QueryKey;
  /**
   * Build an optimistic item for create mutations.
   * Receives the form body, orgId, and optimistic context (stable temp ID + timestamp).
   */
  optimisticCreate?: (
    body: TCreate,
    orgId: string,
    ctx: OptimisticContext,
  ) => TList;
  /**
   * Override the default optimistic update for PATCH mutations.
   * Default: shallow-merge body into the item with matching `id`.
   */
  optimisticUpdate?: (
    cached: TList[],
    vars: { id: string; body: TUpdate },
    ctx: OptimisticContext,
  ) => TList[];
  /** Stale time for the list query in ms (default: 5 minutes). */
  staleTime?: number;
  /** Polling interval in ms. Set to enable automatic refetching (default: disabled). */
  pollInterval?: number;
  /** Unwrap mode — `"direct"` for `json.data`, `"paginated"` for `json.data?.data ?? []` (default: `"direct"`). */
  unwrap?: "direct" | "paginated";
  /** Toast messages for create/update/delete. */
  messages?: {
    create?: string;
    update?: string;
    delete?: string;
    deleteError?: string;
  };
}

// ── Return type ───────────────────────────────────────────────

export interface CrudHooksReturn<TList, TCreate, TUpdate> {
  useList: (
    orgId: string | undefined,
    params?: Record<string, string | number | boolean | undefined>,
  ) => UseQueryResult<TList[], Error>;
  useCreate: (
    orgId: string | undefined,
  ) => UseMutationResult<TList, Error, TCreate>;
  useUpdate: (
    orgId: string | undefined,
  ) => UseMutationResult<TList, Error, { id: string; body: TUpdate }>;
  useDelete: (
    orgId: string | undefined,
  ) => UseMutationResult<unknown, Error, string>;
}

// ── Default optimistic update (shallow merge by id) ───────────

function defaultOptimisticUpdate<TList extends { id: string }>(
  cached: TList[],
  { id, body }: { id: string; body: Partial<TList> },
  _ctx: OptimisticContext,
): TList[] {
  return cached.map((item) =>
    item.id === id
      ? ({ ...item, ...body, updated_at: new Date().toISOString() } as TList)
      : item,
  );
}

// ── Factory ────────────────────────────────────────────────────

/**
 * Generate all CRUD hooks for a simple list entity.
 *
 * Call at MODULE LEVEL (not inside a component). The returned hooks
 * follow normal hook rules and can be used in any component.
 */
export function createCrudHooks<
  TList extends { id: string },
  TCreate = Partial<TList>,
  TUpdate = Partial<TList>,
>(
  config: CrudHooksConfig<TList, TCreate, TUpdate>,
): CrudHooksReturn<TList, TCreate, TUpdate> {
  const fetchFn = createOrgQuery<TList[]>(config.path, {
    unwrap: config.unwrap ?? "direct",
  });
  const staleTime = config.staleTime ?? 5 * 60_000;
  const pollInterval = config.pollInterval;
  const msgs = config.messages;

  return {
    useList(orgId, params) {
      return useQuery<TList[], Error>({
        queryKey: [...config.queryKey(orgId ?? ""), params ?? {}],
        queryFn: () => fetchFn(orgId ?? "", { params }),
        enabled: !!orgId,
        staleTime,
        ...(pollInterval ? { refetchInterval: pollInterval } : {}),
      });
    },

    useCreate(orgId) {
      return useOrgMutation<TList, TCreate>({
        endpoint: `/api/organizations/${orgId}${config.path}`,
        method: "POST",
        queryKey: config.queryKey(orgId ?? ""),
        optimisticUpdate: config.optimisticCreate
          ? (cached: TList[], body: TCreate, ctx: OptimisticContext) => [
              ...cached,
              config.optimisticCreate?.(body, orgId ?? "", ctx) as TList,
            ]
          : undefined,
        successMessage: msgs?.create,
        errorMessage: "Failed to create",
        onError: (err) => reportServerError(`create${config.path}`, err),
      });
    },

    useUpdate(orgId) {
      return useOrgMutation<TList, { id: string; body: TUpdate }>({
        endpoint: (vars) =>
          `/api/organizations/${orgId}${config.path}/${vars.id}`,
        method: "PATCH",
        queryKey: config.queryKey(orgId ?? ""),
        optimisticUpdate: config.optimisticUpdate
          ? (
              cached: TList[],
              vars: { id: string; body: TUpdate },
              ctx: OptimisticContext,
            ) => config.optimisticUpdate?.(cached, vars, ctx) ?? cached
          : (
              cached: TList[],
              vars: { id: string; body: TUpdate },
              ctx: OptimisticContext,
            ) =>
              defaultOptimisticUpdate(
                cached,
                vars as { id: string; body: Partial<TList> },
                ctx,
              ),
        successMessage: msgs?.update,
        errorMessage: "Failed to update",
        onError: (err) => reportServerError(`update${config.path}`, err),
      });
    },

    useDelete(orgId) {
      return useOrgMutation<unknown, string, TList>({
        endpoint: (id) => `/api/organizations/${orgId}${config.path}/${id}`,
        method: "DELETE",
        queryKey: config.queryKey(orgId ?? ""),
        optimisticUpdate: (
          cached: TList[],
          id: string,
          _ctx: OptimisticContext,
        ) => cached.filter((item) => item.id !== id),
        successMessage: msgs?.delete ?? "Deleted",
        errorMessage: msgs?.deleteError ?? "Failed to delete",
        onError: (err) => reportServerError(`delete${config.path}`, err),
      });
    },
  };
}

// ── Pending state helper ──────────────────────────────────────

/**
 * Track which item IDs are currently being processed (pending).
 * Use with CRUD mutations to show per-item spinners.
 *
 * @example
 * ```tsx
 * const { markPending, clearPending, isPending } = usePendingIds();
 *
 * const handleDelete = async (id: string) => {
 *   markPending(id);
 *   try {
 *     await deleteMutation.mutateAsync(id);
 *   } finally {
 *     clearPending(id);
 *   }
 * };
 *
 * // In JSX:
 * <Button disabled={isPending(item.id)}>
 *   {isPending(item.id) ? <Loader2 className="animate-spin" /> : <Trash2 />}
 * </Button>
 * ```
 */
export function usePendingIds() {
  const [pendingIds, setPendingIds] = React.useState<Set<string>>(new Set());

  const markPending = React.useCallback((id: string) => {
    setPendingIds((prev) => new Set(prev).add(id));
  }, []);

  const clearPending = React.useCallback((id: string) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const isPending = React.useCallback(
    (id: string) => pendingIds.has(id),
    [pendingIds],
  );

  return { pendingIds, markPending, clearPending, isPending };
}

// ── Undo toast helper ─────────────────────────────────────────

/**
 * Show an undo toast after a successful mutation.
 * The user can click "Undo" to revert the change.
 *
 * @example
 * ```tsx
 * const { showUndoToast } = useUndoToast();
 *
 * const handleDelete = async (id: string) => {
 *   await deleteMutation.mutateAsync(id);
 *   showUndoToast("Deleted", () => createMutation.mutateAsync(deletedItem));
 * };
 * ```
 */
export function useUndoToast() {
  const showUndoToast = React.useCallback(
    (message: string, onUndo: () => Promise<void>, duration = 5000) => {
      toast.dismiss();
      toast(message, {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await onUndo();
              toast.success("Reverted");
            } catch {
              toast.error("Failed to revert");
            }
          },
        },
        duration,
      });
    },
    [],
  );

  return { showUndoToast };
}
