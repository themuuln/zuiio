"use client";

import { AlertTriangle, ArrowLeft, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/lib/i18n/navigation";
import type { PartsCatalogItem } from "@/lib/types";
import { formatMNT } from "@/lib/utils";

interface PartHeaderProps {
  part: PartsCatalogItem | undefined;
  onHand: number;
  minThreshold: number;
  isLoading: boolean;
}

export function PartHeader({
  part,
  onHand,
  minThreshold,
  isLoading,
}: PartHeaderProps) {
  const t = useTranslations("inventory");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!part) return null;

  const status = onHand <= 0 ? "out" : onHand < minThreshold ? "low" : "ok";

  const statusBadge = {
    ok: {
      label: t("inStock"),
      variant: "outline" as const,
      className: "bg-green-50 text-green-700 border-green-200",
    },
    low: {
      label: t("lowStock"),
      variant: "outline" as const,
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    out: {
      label: t("outOfStock"),
      variant: "outline" as const,
      className: "bg-red-50 text-red-700 border-red-200",
    },
  }[status];

  return (
    <div className="flex flex-col gap-4">
      {/* Back link */}
      <Link
        href="/dashboard/inventory"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft className="size-3.5" />
        {t("backToInventory")}
      </Link>

      {/* Title row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Package className="size-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight truncate">
              {part.name}
            </h1>
            {part.name_mn && (
              <p className="text-sm text-muted-foreground">{part.name_mn}</p>
            )}
          </div>
          <Badge
            variant={statusBadge.variant}
            className={statusBadge.className}
          >
            {status === "low" && <AlertTriangle className="size-3 mr-1" />}
            {statusBadge.label}
          </Badge>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{t("onHand")}</p>
            <p
              className={`text-xl font-semibold tabular-nums ${
                status === "out"
                  ? "text-red-600"
                  : status === "low"
                    ? "text-amber-600"
                    : "text-green-600"
              }`}
            >
              {onHand}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                {part.unit}
              </span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">
              {t("defaultPrice")}
            </p>
            <p className="text-xl font-semibold tabular-nums">
              {part.default_price ? formatMNT(part.default_price) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">
              {t("category")}
            </p>
            <p className="text-xl font-semibold truncate">
              {part.category ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">
              {t("partNumber")}
            </p>
            <p className="text-xl font-semibold font-mono truncate text-sm">
              {part.part_number ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
