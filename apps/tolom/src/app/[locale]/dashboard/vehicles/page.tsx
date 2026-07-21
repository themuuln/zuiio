"use client";

import { Car, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { ExportButton } from "@/components/export-button";
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
import { Button } from "@/components/ui/button";
import { DataTablePage } from "@/components/ui/data-table-page";
import { useClientNow } from "@/hooks/use-client-now";
import { usePageHeader } from "@/hooks/use-page-header";
import type { ExportColumn } from "@/lib/export";
import { useTableFilters } from "@/lib/hooks/use-table-filters";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useDeleteVehicle, useVehicles } from "@/lib/queries/use-vehicles";
import { useSelectedBranchId } from "@/lib/stores";
import { createColumns, type VehicleRow } from "./_columns";

export default function VehiclesPage() {
  const { search, setSearch } = useTableFilters("vehicles");
  const { setNewVehicleDialogOpen, setDetailVehicleId } = usePageHeader();
  const t = useTranslations("vehicles") as (key: string, values?: Record<string, string | number>) => string;
  const now = useClientNow();

  const { data: org, isError: orgError } = useCurrentOrg();
  const selectedBranchId = useSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;
  const {
    data: vehicles,
    isPending,
    isFetching,
    isError,
    error,
    refetch,
  } = useVehicles(org?.orgId, search, branchFilter);
  const deleteVehicle = useDeleteVehicle(org?.orgId);

  const list: VehicleRow[] = vehicles ?? [];

  const [vehicleToDelete, setVehicleToDelete] = useState<VehicleRow | null>(
    null,
  );
  const handleEdit = useCallback(
    (vehicle: VehicleRow) => {
      setDetailVehicleId(vehicle.id);
    },
    [setDetailVehicleId],
  );

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

  const exportColumns: ExportColumn<VehicleRow>[] = [
    { key: "plate_number", label: "Plate" },
    { key: "year", label: "Year" },
    { key: "make", label: "Make" },
    { key: "model", label: "Model" },
    { key: "vin", label: "VIN" },
    { key: "owner_name", label: "Owner" },
  ];

  const displayError =
    isError || orgError ? (error?.message ?? t("noOrganization")) : null;

  return (
    <div className="px-4 pt-4 pb-6 md:px-6">
      <DataTablePage
        title={t("title")}
        description={
          isFetching
            ? "Searching\u2026"
            : t("searchResults", { count: list.length })
        }
        loading={isPending}
        error={displayError}
        onRetry={refetch}
        headerAction={
          <Button onClick={() => setNewVehicleDialogOpen(true)} size="default">
            <Plus className="size-4" />
            {t("addVehicle")}
          </Button>
        }
        columns={columns}
        data={list}
        getRowId={(row) => row.id}
        pageSize={20}
        search={{
          placeholder: t("searchByPlateOrVin"),
          value: search,
          onChange: setSearch,
          loading: isFetching,
        }}
        actions={
          <ExportButton
            data={list}
            columns={exportColumns}
            filename={`vehicles-${now.toISOString().split("T")[0]}.xlsx`}
            sheetName="Vehicles"
          />
        }
        onRowClick={(row) => setDetailVehicleId(row.id)}
        renderMobileCard={(v) => (
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 ring-1 ring-border">
                <Car className="size-4 text-muted-foreground/70" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-mono text-sm font-semibold tracking-wide truncate block">
                  {v.plate_number}
                </span>
                <span className="text-xs text-muted-foreground">
                  {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs text-muted-foreground">
              <span className="truncate font-mono">{v.vin || "\u2014"}</span>
              <span>{v.owner_name ?? "\u2014"}</span>
            </div>
          </div>
        )}
        emptyTitle={search ? t("noMatchForPlateOrVin") : t("noVehicles")}
        emptyIcon={Car}
        emptyAction={
          !search ? (
            <Button
              onClick={() => setNewVehicleDialogOpen(true)}
              variant="outline"
            >
              {t("addFirstVehicle")}
            </Button>
          ) : undefined
        }
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
