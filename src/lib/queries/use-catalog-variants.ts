/**
 * React Query hooks for the Catalog Variant system.
 * Groups (dimensions), Options (values), and Item Variants (priced combos).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  CatalogItemVariant,
  CatalogVariantGroup,
  CatalogVariantOption,
} from "@/lib/types";
import { catalogVariantKeys } from "./keys";

// ── API helper ──────────────────────────────────────────────

async function apiCall<T>(
  orgId: string,
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`/api/organizations/${orgId}/catalog-variants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.data as T;
}

// ═══════════════════════════════════════════════════════════════
// VARIANT GROUPS
// ═══════════════════════════════════════════════════════════════

export function useVariantGroups(
  orgId: string | undefined,
  appliesTo?: "service" | "part" | "both",
) {
  return useQuery({
    queryKey: catalogVariantKeys.groups(orgId ?? ""),
    queryFn: () =>
      apiCall<CatalogVariantGroup[]>(orgId!, {
        action: "list-groups",
        applies_to: appliesTo,
      }),
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

export function useCreateVariantGroup(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      name: string;
      name_mn?: string;
      applies_to: "service" | "part" | "both";
      sort_order?: number;
    }) =>
      apiCall<CatalogVariantGroup>(orgId!, {
        action: "create-group",
        ...params,
      }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: catalogVariantKeys.groups(orgId ?? ""),
      });
      toast.success("Variant group created");
    },
  });
}

export function useDeleteVariantGroup(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiCall<void>(orgId!, { action: "delete-group", id }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: catalogVariantKeys.groups(orgId ?? ""),
      });
      toast.success("Variant group deleted");
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// VARIANT OPTIONS
// ═══════════════════════════════════════════════════════════════

export function useVariantOptions(orgId: string | undefined, groupId?: string) {
  return useQuery({
    queryKey: catalogVariantKeys.options(orgId ?? "", groupId),
    queryFn: () =>
      apiCall<CatalogVariantOption[]>(orgId!, {
        action: "list-options",
        group_id: groupId,
      }),
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

export function useCreateVariantOption(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      group_id: string;
      label: string;
      label_mn?: string;
      sort_order?: number;
    }) =>
      apiCall<CatalogVariantOption>(orgId!, {
        action: "create-option",
        ...params,
      }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: catalogVariantKeys.options(orgId ?? ""),
      });
      toast.success("Variant option created");
    },
  });
}

export function useDeleteVariantOption(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiCall<void>(orgId!, { action: "delete-option", id }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: catalogVariantKeys.options(orgId ?? ""),
      });
      toast.success("Variant option deleted");
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// ITEM VARIANTS (concrete priced variants for a service/part)
// ═══════════════════════════════════════════════════════════════

export function useItemVariants(
  orgId: string | undefined,
  entityType: "service" | "part",
  entityId: string | undefined,
) {
  return useQuery({
    queryKey: catalogVariantKeys.items(orgId ?? "", entityType, entityId ?? ""),
    queryFn: () =>
      apiCall<CatalogItemVariant[]>(orgId!, {
        action: "list-items",
        entity_type: entityType,
        entity_id: entityId,
      }),
    enabled: !!orgId && !!entityId,
    staleTime: 30_000,
  });
}

export function useUpdateItemVariant(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      id: string;
      price?: number | null;
      cost?: number | null;
      sku?: string | null;
      is_active?: boolean;
    }) =>
      apiCall<CatalogItemVariant>(orgId!, { action: "update-item", ...params }),
    onSuccess: (_data, _vars) => {
      qc.invalidateQueries({
        queryKey: catalogVariantKeys.items(orgId ?? "", "", ""),
      });
      toast.success("Variant updated");
    },
  });
}

export function useDeleteItemVariant(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiCall<void>(orgId!, { action: "delete-item", id }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: catalogVariantKeys.items(orgId ?? "", "", ""),
      });
      toast.success("Variant deleted");
    },
  });
}

/**
 * Bulk-generate variants from dimension options.
 * Uses the cartesian product of all selected options to create/update variants.
 */
export function useBulkGenerateVariants(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      entity_type: "service" | "part";
      entity_id: string;
      dimension_options: Record<string, string[]>;
      get_price?: Record<string, number>;
    }) =>
      apiCall<CatalogItemVariant[]>(orgId!, {
        action: "bulk-items",
        ...params,
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: catalogVariantKeys.items(
          orgId ?? "",
          vars.entity_type,
          vars.entity_id,
        ),
      });
      toast.success(`Generated ${_data.length} variants`);
    },
  });
}
