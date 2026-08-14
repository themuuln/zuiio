"use client";

import { Plus, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ListPageShell } from "@/components/list-page-shell";
import { ListToolbar } from "@/components/list-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { usePageHeader } from "@/hooks/use-page-header";
import { Link } from "@/lib/i18n/navigation";
import { usePartsCars } from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { formatMNT } from "@/lib/utils";

export default function PartsCarsListPage() {
  const t = useTranslations("partsCars") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const { data: cars = [], isPending } = usePartsCars(orgId);
  const { setDetailPartsCarId } = usePageHeader();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return cars;
    const q = search.toLowerCase();
    return cars.filter(
      (c) =>
        c.make.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q) ||
        (c.vin ?? "").toLowerCase().includes(q) ||
        (c.license_plate ?? "").toLowerCase().includes(q),
    );
  }, [cars, search]);

  if (!orgId) return null;

  return (
    <div className="px-4 pt-4 pb-6 md:px-6">
      <ListPageShell title={t("title")} description={t("subtitle")}>
        <ListToolbar
          search={{
            placeholder: t("searchPlaceholder"),
            value: search,
            onChange: setSearch,
          }}
          stats={<span>{t("count", { count: filtered.length })}</span>}
          actions={
            <Button
              size="default"
              render={<Link href="/dashboard/inventory/parts-cars/new" />}
              nativeButton={false}
            >
              <Plus className="size-4" />
              {t("newCar")}
            </Button>
          }
        />

        {isPending ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : filtered.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Truck />
              </EmptyMedia>
              <EmptyTitle>{t("empty")}</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                render={<Link href="/dashboard/inventory/parts-cars/new" />}
                nativeButton={false}
              >
                {t("emptyAction")}
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((car) => (
              <button
                type="button"
                key={car.id}
                onClick={() => setDetailPartsCarId(car.id)}
                className="text-left"
              >
                <Card className="transition-colors hover:bg-muted/50 cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <Typography.Text className="font-semibold truncate">
                          {car.make} {car.model}
                        </Typography.Text>
                        {car.year && (
                          <Typography.Muted className="text-sm text-muted-foreground">
                            {car.year}
                          </Typography.Muted>
                        )}
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {t(`status.${car.status}`)}
                      </Badge>
                    </div>

                    <div className="flex flex-col gap-1.5 text-sm">
                      {car.vin && (
                        <Typography.Muted className="text-muted-foreground font-mono text-xs truncate">
                          VIN: {car.vin}
                        </Typography.Muted>
                      )}
                      {car.license_plate && (
                        <Typography.Muted className="text-muted-foreground font-mono text-xs">
                          {car.license_plate}
                        </Typography.Muted>
                      )}
                      <Typography.Muted className="text-muted-foreground">
                        {t("fields.cost")}:{" "}
                        <span className="font-semibold text-foreground">
                          {formatMNT(car.purchase_cost)}
                        </span>
                      </Typography.Muted>
                      {car.status === "completed" && (
                        <>
                          <Typography.Muted className="text-muted-foreground">
                            {t("fields.parts")}:{" "}
                            <span className="font-semibold text-foreground">
                              {t("fields.partsCount", {
                                count: car.total_parts_actual,
                              })}
                            </span>
                          </Typography.Muted>
                          <Typography.Muted className="text-muted-foreground">
                            {t("fields.value")}:{" "}
                            <span className="font-semibold text-green-600">
                              {formatMNT(car.total_estimated_value)}
                            </span>
                          </Typography.Muted>
                          <Typography.Muted className="text-muted-foreground">
                            {t("fields.profit")}:{" "}
                            <span
                              className={`font-semibold ${
                                car.total_estimated_value - car.purchase_cost >
                                0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {formatMNT(
                                car.total_estimated_value - car.purchase_cost,
                              )}
                            </span>
                          </Typography.Muted>
                        </>
                      )}
                      {car.status === "disassembling" && (
                        <Typography.Text className="text-xs text-amber-600 font-medium">
                          {t("fields.disassemblingLabel")}
                        </Typography.Text>
                      )}
                      {car.status === "arrived" && (
                        <Typography.Text className="text-xs text-blue-600 font-medium">
                          {t("fields.notDisassembled")}
                        </Typography.Text>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}
      </ListPageShell>
    </div>
  );
}
