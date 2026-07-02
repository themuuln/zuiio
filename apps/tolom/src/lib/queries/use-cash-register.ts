/**
 * React Query hooks for cash register operations.
 */

import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  CashRegisterEntry,
  CashRegisterSession,
  CashRegisterSessionWithEntries,
} from "@/lib/types";
import { createOrgQuery } from "./factory";
import { cashRegisterKeys } from "./keys";

// ── Types ──────────────────────────────────────────────────

interface SessionListResponse {
  data: CashRegisterSession[];
  total: number;
}

// ── Fetchers ───────────────────────────────────────────────

const fetchCurrentSession =
  createOrgQuery<CashRegisterSessionWithEntries | null>("/cash-register");
const fetchSessions = createOrgQuery<SessionListResponse>(
  "/cash-register/sessions",
);

// ── Hooks ──────────────────────────────────────────────────

/**
 * Get the current open session for today (with entries).
 */
export function useCurrentSession(
  orgId: string | undefined,
  branchId?: string | null,
): UseQueryResult<CashRegisterSessionWithEntries | null, Error> {
  return useQuery({
    queryKey: cashRegisterKeys.current(orgId ?? "", branchId),
    queryFn: async () => {
      if (!orgId) throw new Error("Organization is required");
      return fetchCurrentSession(orgId, {
        params: branchId ? { branch_id: branchId } : undefined,
      });
    },
    enabled: !!orgId,
    staleTime: 10_000,
    retry: 1,
  });
}

/**
 * Get a single session with entries.
 */
export function useCashRegisterSession(
  orgId: string | undefined,
  sessionId: string | undefined,
): UseQueryResult<CashRegisterSessionWithEntries, Error> {
  const fetchSession = createOrgQuery<CashRegisterSessionWithEntries>(
    `/cash-register/${sessionId ?? ""}`,
  );

  return useQuery({
    queryKey: cashRegisterKeys.session(orgId ?? "", sessionId ?? ""),
    queryFn: async () => {
      if (!orgId || !sessionId)
        throw new Error("Organization and session ID required");
      return fetchSession(orgId);
    },
    enabled: !!orgId && !!sessionId,
    staleTime: 10_000,
    retry: 1,
  });
}

/**
 * List sessions with filters.
 */
export function useCashRegisterSessions(
  orgId: string | undefined,
  filters?: {
    status?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  },
): UseQueryResult<SessionListResponse, Error> {
  return useQuery({
    queryKey: cashRegisterKeys.list(
      orgId ?? "",
      filters as Record<string, string>,
    ),
    queryFn: async () => {
      if (!orgId) throw new Error("Organization is required");
      return fetchSessions(orgId, {
        params: filters as Record<string, string>,
      });
    },
    enabled: !!orgId,
    staleTime: 30_000,
    retry: 1,
  });
}

/**
 * Mutation to open a new session.
 */
export function useOpenSession(
  orgId: string | undefined,
): UseMutationResult<
  CashRegisterSession,
  Error,
  { opening_balance: number; branch_id?: string | null }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params) => {
      if (!orgId) throw new Error("No org selected");

      const res = await fetch(`/api/organizations/${orgId}/cash-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message ?? "Failed to open session");
      }

      const json = await res.json();
      return json.data as CashRegisterSession;
    },
    onSuccess: (data) => {
      if (orgId) {
        // Set all possible branch keys so the UI updates immediately
        // regardless of which branch filter the user has selected.
        queryClient.setQueryData(
          cashRegisterKeys.current(orgId, data.branch_id),
          { ...data, entries: [] },
        );
        queryClient.setQueryData(cashRegisterKeys.current(orgId, null), {
          ...data,
          entries: [],
        });
        queryClient.setQueryData(cashRegisterKeys.current(orgId, "all"), {
          ...data,
          entries: [],
        });
        // Only invalidate the list, not the current query —
        // we already have fresh data from the mutation response.
        queryClient.invalidateQueries({
          queryKey: cashRegisterKeys.list(orgId),
        });
      }
      toast.success("Cash register opened");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Mutation to close a session.
 */
export function useCloseSession(orgId: string | undefined): UseMutationResult<
  CashRegisterSession,
  Error,
  {
    sessionId: string;
    closing_balance: number;
    note?: string | null;
  }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, ...params }) => {
      if (!orgId) throw new Error("No org selected");

      const res = await fetch(
        `/api/organizations/${orgId}/cash-register/${sessionId}/close`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message ?? "Failed to close session");
      }

      const json = await res.json();
      return json.data as CashRegisterSession;
    },
    onSuccess: (data) => {
      if (orgId) {
        queryClient.setQueryData(
          cashRegisterKeys.current(orgId, data.branch_id),
          null,
        );
        queryClient.invalidateQueries({
          queryKey: cashRegisterKeys.all(orgId),
        });
        queryClient.invalidateQueries({
          queryKey: cashRegisterKeys.session(orgId, data.id),
        });
      }
      toast.success("Cash register closed");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Mutation to record a cash out.
 */
export function useCashOut(
  orgId: string | undefined,
): UseMutationResult<
  CashRegisterEntry,
  Error,
  { sessionId: string; amount: number; description: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, ...params }) => {
      if (!orgId) throw new Error("No org selected");

      const res = await fetch(
        `/api/organizations/${orgId}/cash-register/${sessionId}/cash-out`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message ?? "Failed to record cash out");
      }

      const json = await res.json();
      return json.data as CashRegisterEntry;
    },
    onSuccess: (_data, variables) => {
      if (orgId) {
        queryClient.invalidateQueries({
          queryKey: cashRegisterKeys.session(orgId, variables.sessionId),
        });
        queryClient.invalidateQueries({
          queryKey: cashRegisterKeys.all(orgId),
        });
      }
      toast.success("Cash out recorded");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Mutation to void a session.
 */
export function useVoidSession(
  orgId: string | undefined,
): UseMutationResult<void, Error, { sessionId: string }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId }) => {
      if (!orgId) throw new Error("No org selected");

      const res = await fetch(
        `/api/organizations/${orgId}/cash-register/${sessionId}`,
        { method: "DELETE" },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message ?? "Failed to void session");
      }
    },
    onSuccess: () => {
      if (orgId) {
        queryClient.invalidateQueries({
          queryKey: cashRegisterKeys.all(orgId),
        });
      }
      toast.success("Session voided");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
