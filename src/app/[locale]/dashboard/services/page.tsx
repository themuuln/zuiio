"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CarFront, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { ServiceForm } from "@/components/services/service-form";
import { ServiceModelPricesSheet } from "@/components/services/service-model-prices-sheet";
import { RecentList } from "@/components/sidebar-tabs/recent-list";
import { StatusSummary } from "@/components/sidebar-tabs/status-summary";
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
import { DataTable } from "@/components/ui/data-table";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useClientNow } from "@/hooks/use-client-now";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import type { ExportColumn } from "@/lib/export";
import { serviceKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useServiceLastUsedPrices } from "@/lib/queries/use-price-memory";
import { useServiceModelPriceCounts } from "@/lib/queries/use-service-vehicle-models";
import type { ServiceCatalog } from "@/lib/types";
import { formatMNT } from "@/lib/utils";

import { createColumns } from "./_columns";
import { EditServiceSheet } from "./_edit-service-sheet";

export default function ServicesPage() {
  const t = useTranslations();
  const now = useClientNow();
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;
  const queryClient = useQueryClient();

  const { data: modelPriceCounts = {} } = useServiceModelPriceCounts(orgId);

  const {
    data: services = [],
    isLoading: loading,
    error: queryError,
    isError,
    refetch,
  } = useQuery({
    queryKey: serviceKeys.list(orgId ?? ""),
    queryFn: async () => {
      const r = await fetch(`/api/organizations/${orgId}/services`);
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      return (d.data ?? []) as ServiceCatalog[];
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });

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
      { key: "name", label: "Name" },
      { key: "category", label: "Category" },
      { key: "default_price", label: "Price", format: "currency" },
    ],
    [],
  );

  // ── Delete mutation ──

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/organizations/${orgId}/services/${id}`, {
        method: "DELETE",
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: serviceKeys.list(orgId ?? ""),
      });
      const previous = queryClient.getQueryData<ServiceCatalog[]>(
        serviceKeys.list(orgId ?? ""),
      );
      queryClient.setQueryData<ServiceCatalog[]>(
        serviceKeys.list(orgId ?? ""),
        (old) => (old ?? []).filter((s) => s.id !== id),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          serviceKeys.list(orgId ?? ""),
          context.previous,
        );
      }
      toast.error("Failed to delete service");
    },
    onSuccess: () => toast.success("Service deleted"),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: serviceKeys.list(orgId ?? ""),
      });
    },
  });

  const confirmDelete = () => {
    if (!orgId || !serviceToDelete) return;
    deleteMutation.mutate(serviceToDelete.id, {
      onSettled: () => setServiceToDelete(null),
    });
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
          (s.name_mn && s.name_mn.toLowerCase().includes(q)) ||
          (s.description && s.description.toLowerCase().includes(q)),
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

  // ── Sidebar tabs ──

  const sidebar = useRightSidebar();

  useEffect(() => {
    if (services.length === 0) return;

    const catCount = new Map<string, number>();
    for (const s of services) {
      const cat = s.category ?? "Uncategorized";
      catCount.set(cat, (catCount.get(cat) ?? 0) + 1);
    }

    const top5 = [...services]
      .sort((a, b) => b.default_price - a.default_price)
      .slice(0, 5);

    sidebar.setActiveTab("categories");

    sidebar.registerTab(
      "categories",
      "Categories",
      <StatusSummary
        items={Array.from(catCount.entries()).map(([label, count]) => ({
          label,
          count,
        }))}
      />,
    );

    sidebar.registerTab(
      "popular",
      "Popular",
      <RecentList
        items={top5.map((s) => ({
          id: s.id,
          primary: s.name,
          secondary: s.category ?? null,
        }))}
        emptyMessage="No services"
      />,
    );

    return () => {
      sidebar.unregisterTab("categories");
      sidebar.unregisterTab("popular");
    };
  }, [
    services,
    sidebar.registerTab,
    sidebar.setActiveTab,
    sidebar.unregisterTab,
  ]);

  const isFirstLoad = loading && services.length === 0;

  // ── Render: First load skeleton ──

  if (isFirstLoad) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-12 w-full" />
        <DataTable columns={[]} data={[]} loading />
      </div>
    );
  }

  // ── Render: Error state ──

  if (isError || (!orgId && !orgQuery.isLoading)) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            Service Catalog
          </Typography.H1>
          <Typography.Muted className="text-muted-foreground">
            Manage your service prices
          </Typography.Muted>
        </div>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center justify-between p-4">
            <Typography.Text className="text-sm text-destructive">
              {error ?? "No organization found"}
            </Typography.Text>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render: Normal ──

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-1">
        <Typography.H1 className="text-2xl font-semibold tracking-tight">
          Service Catalog
        </Typography.H1>
        <Typography.Muted className="text-muted-foreground">
          Manage your service prices
        </Typography.Muted>
      </div>

      {/* ── Toolbar ── */}
      <ListToolbar
        search={{
          placeholder: "Search services...",
          value: search,
          onChange: setSearch,
          resultLabel: services.length
            ? `${services.length} service${services.length === 1 ? "" : "s"}`
            : undefined,
          emptyLabel: search ? `No matches for "${search}"` : undefined,
        }}
        stats={
          <span className="text-sm text-muted-foreground">
            {services.length} service{services.length !== 1 ? "s" : ""}
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
              <Plus className="size-5" /> {showAdd ? "Cancel" : "Add Service"}
            </Button>
          </div>
        }
      />

      {/* ── Add Service Card ── */}
      {showAdd && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Add New Service</CardTitle>
          </CardHeader>
          <CardContent>
            <ServiceForm
              onSuccess={() => {
                setShowAdd(false);
                toast.success("Service created");
              }}
              onCancel={() => setShowAdd(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Category Badges ── */}
      {categories.length > 0 && (
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
      )}

      {/* ── Table / Empty State ── */}
      <Card className="py-0">
        <CardContent className="p-0">
          {services.length === 0 && !search && !selectedCategory ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Pencil />
                </EmptyMedia>
                <EmptyTitle>{t("services.noServices")}</EmptyTitle>
                <EmptyDescription>{t("services.noServices")}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" onClick={() => setShowAdd(true)}>
                  <Plus className="size-4" />
                  Add your first service
                </Button>
              </EmptyContent>
            </Empty>
          ) : filteredServices.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Pencil />
                </EmptyMedia>
                <EmptyTitle>{t("services.noServices")}</EmptyTitle>
                <EmptyDescription>
                  Try a different search term or category.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <DataTable
              columns={columns}
              data={filteredServices}
              getRowId={(row) => row.id}
              pageSize={20}
              onRowClick={(row) => setEditingService(row)}
              renderMobileCard={(service) => {
                const count = modelPriceCounts[service.id] ?? 0;
                return (
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">
                        {service.name}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {formatMNT(service.default_price)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {service.category ?? t("services.uncategorized")}
                      </span>
                      <span className="flex items-center gap-1">
                        {lastUsedPrices.data?.[service.id] && (
                          <span className="text-amber-600">
                            Last:{" "}
                            {formatMNT(
                              lastUsedPrices.data[service.id].unit_price,
                            )}
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
          )}
        </CardContent>
      </Card>

      {/* ── Edit Service Sheet ── */}
      <EditServiceSheet
        service={editingService}
        categories={categories}
        open={editingService !== null}
        onOpenChange={(open) => {
          if (!open) setEditingService(null);
        }}
      />

      {/* ── Model-Specific Prices Sheet ── */}
      <ServiceModelPricesSheet
        serviceId={modelPricesService?.id ?? null}
        serviceName={modelPricesService?.name ?? ""}
        defaultPrice={modelPricesService?.default_price ?? 0}
        open={modelPricesService !== null}
        onOpenChange={(open) => {
          if (!open) setModelPricesService(null);
        }}
      />

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog
        open={!!serviceToDelete}
        onOpenChange={(open) => {
          if (!open) setServiceToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {serviceToDelete?.name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
