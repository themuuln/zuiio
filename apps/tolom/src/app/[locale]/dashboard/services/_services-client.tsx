"use client";

import { useOrgMutation } from "@zuiio/query";
import { CarFront, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ExportButton } from "@/components/export-button";
import { ServiceForm } from "@/components/services/service-form";
import { ServiceModelPricesSheet } from "@/components/services/service-model-prices-drawer";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTablePage } from "@/components/ui/data-table-page";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useClientNow } from "@/hooks/use-client-now";

import type { ExportColumn } from "@/lib/export";
import { serviceKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useServiceLastUsedPrices } from "@/lib/queries/use-price-memory";
import { useServiceModelPriceCounts } from "@/lib/queries/use-service-vehicle-models";
import { useServiceCatalog } from "@/lib/queries/use-work-order-detail";
import type { ServiceCatalog } from "@/lib/types";
import { formatMNT } from "@/lib/utils";

import { createColumns } from "./_columns";
import { EditServiceSheet } from "./_edit-service-drawer";

export default function ServicesPageClient() {
  const st = useTranslations("services") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const now = useClientNow();
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;

  const { data: modelPriceCounts = {} } = useServiceModelPriceCounts(orgId);

  const {
    data: services = [],
    isPending: loading,
    error: queryError,
    refetch,
  } = useServiceCatalog(orgId);

  const error = queryError ? queryError.message : null;

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<ServiceCatalog | null>(
    null,
  );
  const [serviceToDelete, setServiceToDelete] = useState<ServiceCatalog | null>(
    null,
  );
  const [modelPricesService, setModelPricesService] =
    useState<ServiceCatalog | null>(null);

  const lastUsedPrices = useServiceLastUsedPrices(orgId ?? undefined);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const s of services) {
      if (s.category) cats.add(s.category);
    }
    return Array.from(cats).sort();
  }, [services]);

  const exportColumns: ExportColumn<ServiceCatalog>[] = useMemo(
    () => [
      { key: "name", label: st("serviceName") },
      { key: "category", label: st("category") },
      { key: "default_price", label: st("price"), format: "currency" as const },
    ],
    [st],
  );

  // ── Delete mutation ──

  const deleteMutation = useOrgMutation<unknown, { id: string }>({
    endpoint: (vars) => `/api/organizations/${orgId}/services/${vars.id}`,
    method: "DELETE",
    queryKey: serviceKeys.all(orgId ?? ""),
    successMessage: "Service deleted",
  });

  const confirmDelete = () => {
    if (!orgId || !serviceToDelete) return;
    deleteMutation.mutate(
      { id: serviceToDelete.id },
      {
        onSettled: () => setServiceToDelete(null),
        onError: (error) => {
          toast.error(st("failedToDelete"), {
            description: error instanceof Error ? error.message : undefined,
          });
        },
      },
    );
  };

  // ── Category + search filter ──

  const filteredServices = useMemo(() => {
    let filtered = services;
    if (selectedCategory) {
      filtered = filtered.filter((s) => s.category === selectedCategory);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.name_mn?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [services, selectedCategory, search]);

  // ── DataTable columns (stable reference) ──

  const columns = useMemo(
    () =>
      createColumns(
        {
          onEdit: (s) => setEditingService(s),
          onDelete: (s) => setServiceToDelete(s),
          onModelPrices: (s) => setModelPricesService(s),
        },
        { modelPriceCounts, lastUsedPrices: lastUsedPrices.data },
      ),
    [modelPriceCounts, lastUsedPrices.data],
  );

  // ── Empty state (two variants) ──

  const shouldShowAddCta =
    services.length === 0 && !search && !selectedCategory;

  const emptyState = shouldShowAddCta ? (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Pencil />
        </EmptyMedia>
        <EmptyTitle>{st("noServices")}</EmptyTitle>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={() => setShowAdd(true)}>
          <Plus className="size-4" />
          {st("addFirstService")}
        </Button>
      </EmptyContent>
    </Empty>
  ) : (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Pencil />
        </EmptyMedia>
        <EmptyTitle>{st("noServices")}</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );

  // ── Category filter badges ──

  const categoryFilters =
    categories.length > 0 ? (
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={!selectedCategory ? "default" : "outline"}
          className="cursor-pointer select-none"
          onClick={() => setSelectedCategory(null)}
        >
          All ({services.length})
        </Badge>
        {categories.map((cat) => (
          <Badge
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            className="cursor-pointer select-none"
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>
    ) : undefined;

  // ── Inline add form ──

  const addForm = showAdd ? (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>{st("addNewService")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ServiceForm
          onSuccess={() => {
            setShowAdd(false);
            toast.success(st("serviceCreated"));
          }}
          onCancel={() => setShowAdd(false)}
        />
      </CardContent>
    </Card>
  ) : undefined;

  return (
    <>
      <DataTablePage
        title={st("serviceCatalog")}
        description={st("managePrices")}
        loading={loading}
        error={
          error || (!orgId && !orgQuery.isPending ? st("noOrgFound") : null)
        }
        onRetry={refetch}
        columns={columns}
        data={filteredServices}
        getRowId={(row) => row.id}
        pageSize={20}
        search={{
          placeholder: st("searchPlaceholder"),
          value: search,
          onChange: setSearch,
          resultLabel: services.length
            ? st("serviceCount", { count: services.length })
            : undefined,
          emptyLabel: search ? st("noMatches", { search }) : undefined,
        }}
        stats={
          <span className="text-sm text-muted-foreground">
            {st("serviceCount", { count: services.length })}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              data={filteredServices}
              columns={exportColumns}
              filename={`services-${now.toISOString().split("T")[0]}.xlsx`}
              sheetName="Services"
            />
            <Button
              size="default"
              className="h-12"
              onClick={() => setShowAdd(!showAdd)}
            >
              <Plus className="size-5" />{" "}
              {showAdd ? st("cancel") : st("addService")}
            </Button>
          </div>
        }
        filters={categoryFilters}
        beforeTable={addForm}
        onRowClick={(row) => setEditingService(row)}
        emptyState={emptyState}
        renderMobileCard={(service) => {
          const count = modelPriceCounts[service.id] ?? 0;
          return (
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium truncate">{service.name}</span>
                <span className="font-semibold tabular-nums">
                  {formatMNT(service.default_price)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{service.category ?? st("uncategorized")}</span>
                <span className="flex items-center gap-1">
                  {lastUsedPrices.data?.[service.id] && (
                    <span className="text-amber-600">
                      {st("lastPrefix")}
                      {formatMNT(lastUsedPrices.data[service.id].unit_price)}
                    </span>
                  )}
                  {count > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <CarFront className="size-3" />
                      {count}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1 pt-1 border-t border-border/50">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingService(service);
                  }}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setServiceToDelete(service);
                  }}
                  className="text-destructive/70 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          );
        }}
      />

      <EditServiceSheet
        service={editingService}
        categories={categories}
        open={editingService !== null}
        onOpenChange={(open) => {
          if (!open) setEditingService(null);
        }}
      />

      <ServiceModelPricesSheet
        serviceId={modelPricesService?.id ?? null}
        serviceName={modelPricesService?.name ?? ""}
        defaultPrice={modelPricesService?.default_price ?? 0}
        open={modelPricesService !== null}
        onOpenChange={(open) => {
          if (!open) setModelPricesService(null);
        }}
      />

      <AlertDialog
        open={!!serviceToDelete}
        onOpenChange={(open) => {
          if (!open) setServiceToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{st("deleteService")}</AlertDialogTitle>
            <AlertDialogDescription>
              {st("deleteServiceDesc", { name: serviceToDelete?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {st("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? st("deleting") : st("deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
