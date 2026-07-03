"use client";

import { useState } from "react";
import type { VariantSelection } from "@/components/services/variant-picker";
import type { CatalogPartItem, CatalogServiceItem } from "./_drawer-types";

// ─── Types ──────────────────────────────────────────────────────

export interface PendingVariantItem {
  entityType: "service" | "part";
  entityId: string;
  entityName: string;
  defaultPrice: number;
  onConfirm: (selection: VariantSelection | null) => void;
  onSkip: () => void;
}

interface UseVariantSelectionOptions {
  orgId: string | null;
  addService: (svc: CatalogServiceItem) => void;
  addPart: (part: CatalogPartItem) => void;
}

// ─── Hook ───────────────────────────────────────────────────────

export function useVariantSelection({
  orgId,
  addService,
  addPart,
}: UseVariantSelectionOptions) {
  const [pendingVariantItem, setPendingVariantItem] =
    useState<PendingVariantItem | null>(null);

  async function handleServiceSelect(svc: CatalogServiceItem) {
    if (svc.id && svc._source !== "global") {
      try {
        const res = await fetch(
          `/api/organizations/${orgId}/catalog-variants`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "list-items",
              entity_type: "service",
              entity_id: svc.id,
            }),
          },
        );
        const json = await res.json();
        const items = json.data as Array<{ id: string }>;
        if (items.length > 0) {
          setPendingVariantItem({
            entityType: "service",
            entityId: svc.id,
            entityName: svc.name,
            defaultPrice: Number(svc.last_price ?? svc.default_price ?? 0),
            onConfirm: (selection) => {
              if (selection) {
                const svcWithVariant = {
                  ...svc,
                  last_price: selection.price,
                  variant_id: selection.variantId,
                  variant_label: selection.label,
                } as CatalogServiceItem & {
                  variant_id?: string | null;
                  variant_label?: string;
                };
                addService(svcWithVariant);
              } else {
                addService(svc);
              }
            },
            onSkip: () => addService(svc),
          });
          return;
        }
      } catch {
        // If variant check fails, proceed as normal
      }
    }
    addService(svc);
  }

  async function handlePartSelect(part: CatalogPartItem) {
    if (part.id && part._source !== "global") {
      try {
        const res = await fetch(
          `/api/organizations/${orgId}/catalog-variants`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "list-items",
              entity_type: "part",
              entity_id: part.id,
            }),
          },
        );
        const json = await res.json();
        const items = json.data as Array<{ id: string }>;
        if (items.length > 0) {
          setPendingVariantItem({
            entityType: "part",
            entityId: part.id,
            entityName: part.name,
            defaultPrice: Number(part.last_price ?? part.default_price ?? 0),
            onConfirm: (selection) => {
              if (selection) {
                const partWithVariant = {
                  ...part,
                  last_price: selection.price,
                  variant_id: selection.variantId,
                  variant_label: selection.label,
                } as CatalogPartItem & {
                  variant_id?: string | null;
                  variant_label?: string;
                };
                addPart(partWithVariant);
              } else {
                addPart(part);
              }
            },
            onSkip: () => addPart(part),
          });
          return;
        }
      } catch {
        // proceed as normal
      }
    }
    addPart(part);
  }

  return {
    pendingVariantItem,
    setPendingVariantItem,
    handleServiceSelect,
    handlePartSelect,
  };
}
