"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CarFront, Pencil, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import { Typography } from "@/components/ui/typography";
import type { ServiceCatalog } from "@/lib/types/core";
import { formatMNT } from "@/lib/utils";

interface ColumnCallbacks {
  onEdit: (service: ServiceCatalog) => void;
  onDelete: (service: ServiceCatalog) => void;
  onModelPrices: (service: ServiceCatalog) => void;
}

interface ColumnData {
  modelPriceCounts: Record<string, number>;
  lastUsedPrices?: Record<string, { unit_price: number }>;
}

export function createColumns(
  cb: ColumnCallbacks,
  data: ColumnData,
): ColumnDef<ServiceCatalog>[] {
  return [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => {
        const t = useTranslations("services") as (key: string, values?: Record<string, string | number>) => string;
        return <DataTableColumnHeader column={column} title={t("name")} />;
      },
      cell: ({ row }) => {
        const locale = useLocale();
        const s = row.original;
        return (
          <div className="min-w-0 max-w-72">
            <Typography.Text className="truncate text-sm font-medium block">
              {locale === "mn" && s.name_mn ? s.name_mn : s.name}
              {locale === "mn" && s.name && (
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  {s.name}
                </span>
              )}
              {locale !== "mn" && s.name_mn && (
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  ({s.name_mn})
                </span>
              )}
            </Typography.Text>
            {s.description && (
              <Typography.Muted className="truncate text-xs text-muted-foreground block">
                {s.description}
              </Typography.Muted>
            )}
          </div>
        );
      },
    },
    {
      id: "category",
      accessorKey: "category",
      header: ({ column }) => {
        const t = useTranslations("services") as (key: string, values?: Record<string, string | number>) => string;
        return <DataTableColumnHeader column={column} title={t("category")} />;
      },
      cell: ({ row }) => {
        const t = useTranslations("services") as (key: string, values?: Record<string, string | number>) => string;
        const cat = row.original.category;
        return cat ? (
          <Badge variant="outline" className="text-xs">
            {cat}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground/50">
            {t("uncategorized")}
          </span>
        );
      },
    },
    {
      id: "default_price",
      accessorKey: "default_price",
      meta: { align: "right" } as const,
      header: ({ column }) => {
        const t = useTranslations("services") as (key: string, values?: Record<string, string | number>) => string;
        return <DataTableColumnHeader column={column} title={t("price")} />;
      },
      cell: ({ row }) => (
        <span className="text-sm font-medium tabular-nums">
          {formatMNT(row.original.default_price)}
        </span>
      ),
    },
    {
      id: "default_cost",
      accessorKey: "default_cost",
      meta: { align: "right" } as const,
      header: ({ column }) => {
        const t = useTranslations("services") as (key: string, values?: Record<string, string | number>) => string;
        return <DataTableColumnHeader column={column} title={t("cost")} />;
      },
      cell: ({ row }) => {
        const cost = row.original.default_cost;
        if (cost == null) {
          return (
            <span className="text-sm text-muted-foreground/30">&mdash;</span>
          );
        }
        return (
          <span className="text-sm tabular-nums text-muted-foreground">
            {formatMNT(cost)}
          </span>
        );
      },
    },
    {
      id: "margin",
      meta: { align: "right" } as const,
      header: () => {
        const t = useTranslations("services") as (key: string, values?: Record<string, string | number>) => string;
        return (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("margin")}
          </span>
        );
      },
      enableSorting: false,
      cell: ({ row }) => {
        const price = row.original.default_price;
        const cost = row.original.default_cost;
        if (price == null || cost == null || price === 0) {
          return (
            <span className="text-sm text-muted-foreground/30">&mdash;</span>
          );
        }
        const margin = ((price - cost) / price) * 100;
        const color = margin >= 0 ? "text-emerald-600" : "text-destructive";
        return (
          <span className={`text-xs tabular-nums font-medium ${color}`}>
            {margin >= 0 ? "+" : ""}
            {margin.toFixed(0)}%
          </span>
        );
      },
    },

    {
      id: "last_used_price",
      meta: { align: "right" } as const,
      header: () => {
        const t = useTranslations("services") as (key: string, values?: Record<string, string | number>) => string;
        return (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("lastUsed")}
          </span>
        );
      },
      enableSorting: false,
      cell: ({ row }) => {
        const lastUsed = data.lastUsedPrices?.[row.original.id];
        if (!lastUsed) {
          return (
            <span className="text-sm text-muted-foreground/30">&mdash;</span>
          );
        }
        return (
          <span className="text-xs tabular-nums text-amber-600">
            {formatMNT(lastUsed.unit_price)}
          </span>
        );
      },
    },
    {
      id: "model_prices",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const t = useTranslations("services") as (key: string, values?: Record<string, string | number>) => string;
        const s = row.original;
        const count = data.modelPriceCounts[s.id] ?? 0;
        return (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              cb.onModelPrices(s);
            }}
            aria-label={t("modelSpecificPrices")}
            title={t("modelSpecificPrices")}
            className="relative"
          >
            <CarFront className="size-4" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-medium text-primary-foreground leading-none">
              {count}
            </span>
          </Button>
        );
      },
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const s = row.original;
        const t = useTranslations("common") as (key: string, values?: Record<string, string | number>) => string;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation();
                cb.onEdit(s);
              }}
              aria-label={t("edit")}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation();
                cb.onDelete(s);
              }}
              aria-label={t("delete")}
              className="text-destructive/70 hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        );
      },
    },
  ];
}
