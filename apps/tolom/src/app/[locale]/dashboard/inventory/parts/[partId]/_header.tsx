"use client";

import { AlertTriangle, Package } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CreatePageHeader } from "@/components/ui/create-page-header";
import { Skeleton } from "@/components/ui/skeleton";
import type { PartsCatalogItem } from "@/lib/types";
import { formatMNT } from "@/lib/utils";

interface PartHeaderProps {
  part: PartsCatalogItem | undefined;
  onHand: number;
  minThreshold: number;
  isPending: boolean;
}

export function PartHeader({
  part,
  onHand,
  minThreshold,
  isPending,
}: PartHeaderProps) {
  const t = useTranslations("inventory") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;

  if (isPending) {
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
      {/* Header */}
      <div className="flex items-center gap-3">
        {part.image_url ? (
          <div className="relative size-10 shrink-0 overflow-hidden rounded-xl">
            <Image
              src={part.image_url}
              alt={part.name}
              width={40}
              height={40}
              className="size-full object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Package className="size-5 text-primary" />
          </div>
        )}
        <CreatePageHeader
          backHref="/dashboard/inventory"
          title={part.name}
          subtitle={part.name_mn ?? undefined}
          className="flex-1 min-w-0"
          actions={
            <Badge
              variant={statusBadge.variant}
              className={statusBadge.className}
            >
              {status === "low" && <AlertTriangle className="size-3 mr-1" />}
              {statusBadge.label}
            </Badge>
          }
        />
      </div>

      {/* Quick stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
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
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Байршил</p>
            <p className="text-xl font-semibold truncate">
              {part.location ? (
                <span className="flex items-center gap-1">
                  📍 {part.location}
                </span>
              ) : (
                "—"
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
