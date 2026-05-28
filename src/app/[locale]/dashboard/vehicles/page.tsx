"use client";

import { BarChart3, Car, Clock, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useClientNow } from "@/hooks/use-client-now";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { ExportColumn } from "@/lib/export";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useVehicles, useDeleteVehicle } from "@/lib/queries/use-vehicles";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { usePageHeader } from "@/hooks/use-page-header";
import { StatusSummary } from "@/components/sidebar-tabs/status-summary";
import { RecentList } from "@/components/sidebar-tabs/recent-list";
import { VehicleDetailDrawer } from "@/components/vehicles/vehicle-detail-drawer";
import { VehicleEditSheet } from "@/components/vehicles/vehicle-edit-sheet";
import { Typography } from "@/components/ui/typography";
import { createColumns, type VehicleRow } from "./_columns";

export default function VehiclesPage() {
  const [search, setSearch] = useState("");
  const { setNewVehicleDialogOpen } = usePageHeader();
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
  const deleteVehicle = useDeleteVehicle(org?.orgId);

  const list: VehicleRow[] = vehicles ?? [];

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null,
  );
  const [vehicleToDelete, setVehicleToDelete] = useState<VehicleRow | null>(
    null,
  );
  const [vehicleToEditId, setVehicleToEditId] = useState<string | null>(null);
  const { registerTab } = useRightSidebar();

  const handleEdit = useCallback((vehicle: VehicleRow) => {
    setVehicleToEditId(vehicle.id);
  }, []);

  const handleDelete = useCallback((vehicle: VehicleRow) => {
    setVehicleToDelete(vehicle);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!vehicleToDelete) return;
    deleteVehicle.mutate(vehicleToDelete.id, {
      onSettled: () => setVehicleToDelete(null),
    });
  }, [vehicleToDelete, deleteVehicle]);

  const columns = useMemo(
    () => createColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    [handleEdit, handleDelete],
  );

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
        <DataTable columns={[]} data={[]} loading />
      </div>
    );
  }

  if (isError || orgError) {
    return (
      <div className="flex flex-col gap-6 tablet:gap-6 tablet:px-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Typography.H1 className="text-2xl font-semibold tracking-tight">
              {t("title")}
            </Typography.H1>
            <Typography.Muted className="text-muted-foreground">
              {t("subtitle")}
            </Typography.Muted>
          </div>
          <Button onClick={() => setNewVehicleDialogOpen(true)} size="default">
            <Plus className="size-4" />
            {t("addVehicle")}
          </Button>
        </div>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Typography.Text className="text-sm text-destructive">
                {error?.message ?? t("noOrganization")}
              </Typography.Text>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                {t("retry")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const exportColumns: ExportColumn<VehicleRow>[] = [
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
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </Typography.H1>
          <Typography.Muted className="text-muted-foreground">
            {t("searchResults", { count: list.length })}
          </Typography.Muted>
        </div>
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
              onClick={() => setNewVehicleDialogOpen(true)}
              size="default"
            >
              <Plus className="size-4" />
              {t("addVehicle")}
            </Button>
          </div>
        }
      />

      <Card className="py-0">
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
                    onClick={() => setNewVehicleDialogOpen(true)}
                    variant="outline"
                  >
                    {t("addFirstVehicle")}
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <DataTable
              columns={columns}
              data={list}
              getRowId={(row) => row.id}
              pageSize={20}
              onRowClick={(row) => setSelectedVehicleId(row.id)}
            />
          )}
        </CardContent>
      </Card>

      <VehicleDetailDrawer
        open={!!selectedVehicleId}
        onOpenChange={(open) => {
          if (!open) setSelectedVehicleId(null);
        }}
        vehicleId={selectedVehicleId}
      />

      <VehicleEditSheet
        open={!!vehicleToEditId}
        onOpenChange={(open) => {
          if (!open) setVehicleToEditId(null);
        }}
        vehicleId={vehicleToEditId}
      />

      <AlertDialog
        open={!!vehicleToDelete}
        onOpenChange={(open) => {
          if (!open) setVehicleToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete vehicle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {vehicleToDelete?.plate_number}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteVehicle.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteVehicle.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteVehicle.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
