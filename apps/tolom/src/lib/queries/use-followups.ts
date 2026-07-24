"use client";

import { useQuery } from "@tanstack/react-query";
import { useOrgMutation } from "@zuiio/query";
import { useMemo } from "react";

// ── Query Keys ─────────────────────────────────────────────────

export const followupKeys = {
  all: (orgId: string) => ["organizations", orgId, "followups"] as const,
  lists: (orgId: string) => [...followupKeys.all(orgId), "list"] as const,
  list: (orgId: string, params: Record<string, unknown>) =>
    [...followupKeys.lists(orgId), params] as const,
  details: (orgId: string) => [...followupKeys.all(orgId), "detail"] as const,
  detail: (orgId: string, id: string) =>
    [...followupKeys.details(orgId), id] as const,
};

// ── Types ──────────────────────────────────────────────────────

interface FollowupFilters {
  customerId?: string;
  status?: string;
  assignedTo?: string;
  page?: number;
  limit?: number;
}

interface FollowupData {
  id: string;
  subject: string;
  type: string;
  status: string;
  due_at: string;
  notes: string | null;
  outcome: string | null;
  outcome_notes: string | null;
  customer?: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  vehicle?: {
    plate_number: string | null;
    make: string | null;
    model: string | null;
  } | null;
  assigned_user?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

// ── Hooks ──────────────────────────────────────────────────────

export function useFollowups(orgId: string, filters: FollowupFilters = {}) {
  const params = useMemo(
    () => ({
      customerId: filters.customerId,
      status: filters.status,
      assignedTo: filters.assignedTo,
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
    }),
    [
      filters.customerId,
      filters.status,
      filters.assignedTo,
      filters.page,
      filters.limit,
    ],
  );

  return useQuery<{
    data: FollowupData[];
    count: number;
  }>({
    queryKey: followupKeys.list(orgId, params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.customerId) searchParams.set("customerId", params.customerId);
      if (params.status) searchParams.set("status", params.status);
      if (params.assignedTo) searchParams.set("assignedTo", params.assignedTo);
      if (params.page && params.page > 1)
        searchParams.set("page", String(params.page));
      if (params.limit && params.limit !== 20)
        searchParams.set("limit", String(params.limit));

      const qs = searchParams.toString();
      const res = await fetch(
        `/api/organizations/${orgId}/followups${qs ? `?${qs}` : ""}`,
      );
      if (!res.ok) throw new Error("Failed to fetch follow-ups");
      return res.json();
    },
    staleTime: 30_000,
  });
}

export function useFollowupDetail(orgId: string, followupId: string | null) {
  return useQuery<{ data: FollowupData }>({
    queryKey: followupKeys.detail(orgId, followupId ?? ""),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/followups/${followupId}`,
      );
      if (!res.ok) throw new Error("Failed to fetch follow-up");
      return res.json();
    },
    enabled: !!followupId,
    staleTime: 30_000,
  });
}

export function useCreateFollowup(orgId: string) {
  return useOrgMutation<
    unknown,
    {
      customer_id: string;
      vehicle_id?: string;
      work_order_id?: string;
      estimate_id?: string;
      invoice_id?: string;
      type?: string;
      subject: string;
      notes?: string;
      due_at: string;
      assigned_to?: string;
    }
  >({
    endpoint: `/api/organizations/${orgId}/followups`,
    method: "POST",
    queryKey: followupKeys.all(orgId),
    successMessage: "Follow-up created",
  });
}

export function useUpdateFollowup(orgId: string) {
  return useOrgMutation<
    unknown,
    {
      followupId: string;
      type?: string;
      subject?: string;
      notes?: string;
      due_at?: string;
      assigned_to?: string;
      action?: "complete" | "cancel";
      outcome?: string;
      outcome_notes?: string;
    }
  >({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/followups/${vars.followupId}`,
    method: "PATCH",
    queryKey: followupKeys.all(orgId),
    successMessage: "Follow-up updated",
  });
}

export function useDeleteFollowup(orgId: string) {
  return useOrgMutation<unknown, string>({
    endpoint: (followupId) =>
      `/api/organizations/${orgId}/followups/${followupId}`,
    method: "DELETE",
    queryKey: followupKeys.all(orgId),
    successMessage: "Follow-up deleted",
  });
}
