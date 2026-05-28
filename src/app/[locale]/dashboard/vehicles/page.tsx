"use client";

import { BarChart3, Car, Clock, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useClientNow } from "@/hooks/use-client-now";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { ExportColumn } from "@/lib/export";
import { Link } from "@/lib/i18n/navigation";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useVehicles } from "@/lib/queries/use-vehicles";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { StatusSummary } from "@/components/sidebar-tabs/status-summary";
import { RecentList } from "@/components/sidebar-tabs/recent-list";
import type { Vehicle } from "@/lib/types";

interface VehicleWithOwner extends Vehicle {
  owner_name?: string;
}

function VehicleRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-border p-4">
      <Skeleton className="size-10 rounded-lg bg-muted" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="size-40" />
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

export default function VehiclesPage() {
  const [search, setSearch] = useState("");
  const t = useTranslations("vehicles");
  const now = useClientNow();

  const { data: org, isError: orgError } = useCurrentOrg();
  const {
    data: vehicles,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useVehicles(org?.orgId, search);

  const list: Array<Vehicle & { owner_name?: string }> = vehicles ?? [];

  const { registerTab } = useRightSidebar();

  useEffect(() => {
    if (!list.length) return;
    const makes = [...new Set(list.map((v) => v.make).filter(Boolean))];
    registerTab(
      "stats",
      "Stats",
      <StatusSummary
        title="Stats"
        items={[
          { label: "Total", count: list.length },
          { label: "Makes", count: makes.length },
        ]}
      />,
      <BarChart3 className="size-4" />,
    );
    registerTab(
      "recent",
      "Recent",
      <RecentList
        title="Recently Added"
        items={[...list]
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )
          .slice(0, 5)
          .map((v) => ({
            id: v.id,
            primary: v.plate_number,
            secondary: [v.make, v.model].filter(Boolean).join(" "),
            timestamp: v.created_at
              ? new Date(v.created_at).toLocaleDateString()
              : undefined,
            href: `/dashboard/vehicles/${v.id}`,
          }))}
      />,
      <Clock className="size-4" />,
    );
  }, [list, registerTab]);

  if (isLoading && !vehicles) {
    return (
      <div className="flex flex-col gap-6 tablet:gap-6 tablet:px-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <Card>
          <CardContent className="p-0">
            {[1, 2, 3].map((i) => (
              <VehicleRowSkeleton key={`skeleton-${i}`} />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || orgError) {
    return (
      <div className="flex flex-col gap-6 tablet:gap-6 tablet:px-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("title")}
            </h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
          <Button
            render={<Link href="/dashboard/vehicles/new" />}
            size="default"
          >
            <Plus className="size-4" />
            {t("addVehicle")}
          </Button>
        </div>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-destructive">
                {error?.message ?? t("noOrganization")}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                {t("retry")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const exportColumns: ExportColumn<Vehicle & { owner_name?: string }>[] = [
    { key: "plate_number", label: "Plate" },
    { key: "year", label: "Year" },
    { key: "make", label: "Make" },
    { key: "model", label: "Model" },
    { key: "vin", label: "VIN" },
    { key: "owner_name", label: "Owner" },
  ];

  return (
    <div className="flex flex-col gap-6 tablet:gap-6 tablet:px-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">
            {t("searchResults", { count: list.length })}
          </p>
        </div>
        <Button render={<Link href="/dashboard/vehicles/new" />} size="default">
          <Plus className="size-4" />
          {t("addVehicle")}
        </Button>
      </div>

      <ListToolbar
        search={{
          placeholder: t("searchByPlateOrVin"),
          value: search,
          onChange: setSearch,
          loading: isFetching,
        }}
        stats={<span>{t("searchResults", { count: list.length })}</span>}
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              data={list}
              columns={exportColumns}
              filename={`vehicles-${now.toISOString().split("T")[0]}.xlsx`}
              sheetName="Vehicles"
            />
            <Button
              render={<Link href="/dashboard/vehicles/new" />}
              size="default"
            >
              <Plus className="size-4" />
              {t("addVehicle")}
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-0">
          {list.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Car />
                </EmptyMedia>
                <EmptyTitle>
                  {search ? t("noMatchForPlateOrVin") : t("noVehicles")}
                </EmptyTitle>
                <EmptyDescription>{t("noVehiclesDesc") || ""}</EmptyDescription>
              </EmptyHeader>
              {!search && (
                <EmptyContent>
                  <Button
                    render={<Link href="/dashboard/vehicles/new" />}
                    variant="outline"
                  >
                    {t("addFirstVehicle")}
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <div className="divide-y divide-border">
              {list.map((vehicle) => (
                <Link
                  key={vehicle.id}
                  href={`/dashboard/vehicles/${vehicle.id}`}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 min-h-[72px]"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Car className="size-5" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-base font-semibold font-mono tracking-wide">
                      {vehicle.plate_number}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {[vehicle.year, vehicle.make, vehicle.model]
                        .filter(Boolean)
                        .join(" ")}
                    </span>
                    {vehicle.vin && (
                      <span className="text-xs font-mono text-muted-foreground">
                        {t("vinLabel", { vin: vehicle.vin })}
                      </span>
                    )}
                  </div>
                  {vehicle.owner_name && (
                    <span className="text-sm text-muted-foreground text-right">
                      {vehicle.owner_name}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
