"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CarFront, Check, Pencil, Plus, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { ServiceForm } from "@/components/services/service-form";
import { ServiceModelPricesSheet } from "@/components/services/service-model-prices-sheet";
import { RecentList } from "@/components/sidebar-tabs/recent-list";
import { StatusSummary } from "@/components/sidebar-tabs/status-summary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useClientNow } from "@/hooks/use-client-now";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import type { ExportColumn } from "@/lib/export";
import { useFuzzySearch } from "@/lib/hooks/use-fuzzy-search";
import { serviceKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useServiceLastUsedPrices } from "@/lib/queries/use-price-memory";
import { useServiceModelPriceCounts } from "@/lib/queries/use-service-vehicle-models";
import { formatMNT } from "@/lib/utils";
import { HighlightText } from "@/lib/utils/search-utils";

interface ServiceItem {
  id: string;
  name: string;
  name_mn: string | null;
  description: string | null;
  default_price: number;
  category: string | null;
}

export default function ServicesPage() {
  const locale = useLocale();
  const t = useTranslations();
  const now = useClientNow();
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;

  const { data: modelPriceCounts = {} } = useServiceModelPriceCounts(orgId);

  const {
    data: services = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: serviceKeys.list(orgId ?? ""),
    queryFn: async () => {
      const r = await fetch(`/api/organizations/${orgId}/services`);
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      return (d.data ?? []) as ServiceItem[];
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });

  const error = queryError ? queryError.message : null;

  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modelPricesService, setModelPricesService] =
    useState<ServiceItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    default_price: "",
    category: "",
  });

  const lastUsedPrices = useServiceLastUsedPrices(orgId ?? undefined);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const s of services) {
      if (s.category) cats.add(s.category);
    }
    return Array.from(cats).sort();
  }, [services]);

  const exportColumns: ExportColumn<ServiceItem>[] = useMemo(
    () => [
      { key: "name", label: "Name" },
      { key: "category", label: "Category" },
      { key: "default_price", label: "Price", format: "currency" },
    ],
    [],
  );

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
      const previous = queryClient.getQueryData<ServiceItem[]>(
        serviceKeys.list(orgId ?? ""),
      );
      queryClient.setQueryData<ServiceItem[]>(
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

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      formData,
    }: {
      id: string;
      formData: typeof editForm;
    }) => {
      const r = await fetch(`/api/organizations/${orgId}/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          default_price: parseFloat(formData.default_price) || 0,
          category: formData.category || null,
        }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      return d.data as ServiceItem;
    },
    onMutate: async ({ id, formData }) => {
      await queryClient.cancelQueries({
        queryKey: serviceKeys.list(orgId ?? ""),
      });
      const previous = queryClient.getQueryData<ServiceItem[]>(
        serviceKeys.list(orgId ?? ""),
      );
      queryClient.setQueryData<ServiceItem[]>(
        serviceKeys.list(orgId ?? ""),
        (old) =>
          (old ?? []).map((s) =>
            s.id === id
              ? {
                  ...s,
                  name: formData.name,
                  description: formData.description || null,
                  default_price: parseFloat(formData.default_price) || 0,
                  category: formData.category || null,
                }
              : s,
          ),
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
      toast.error("Failed to update service");
    },
    onSuccess: () => {
      toast.success("Service updated");
      setEditingId(null);
      setEditForm({
        name: "",
        description: "",
        default_price: "",
        category: "",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: serviceKeys.list(orgId ?? ""),
      });
    },
  });

  const handleDelete = (id: string) => {
    if (!orgId) return;
    deleteMutation.mutate(id);
  };

  const handleStartEdit = (service: ServiceItem) => {
    setEditingId(service.id);
    setEditForm({
      name: service.name,
      description: service.description ?? "",
      default_price: String(service.default_price),
      category: service.category ?? "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({
      name: "",
      description: "",
      default_price: "",
      category: "",
    });
  };

  const handleUpdate = () => {
    if (!orgId || !editingId || !editForm.name.trim()) return;
    updateMutation.mutate({ id: editingId, formData: editForm });
  };

  const categoryFiltered = useMemo(() => {
    if (!selectedCategory) return services;
    return services.filter((s) => s.category === selectedCategory);
  }, [services, selectedCategory]);

  const filtered = useFuzzySearch(categoryFiltered, search, {
    keys: [
      { name: "name", weight: 0.7 },
      { name: "category", weight: 0.2 },
      { name: "description", weight: 0.1 },
    ],
    threshold: 0.35,
    minQueryLength: 1,
  });

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

      <ListToolbar
        search={{
          placeholder: "Search services...",
          value: search,
          onChange: setSearch,
          resultLabel: filtered.length
            ? `${filtered.length} result${filtered.length === 1 ? "" : "s"}`
            : undefined,
          emptyLabel: search ? `No matches for "${search}"` : undefined,
        }}
        stats={
          <span>
            {filtered.length} / {services.length} service
            {services.length !== 1 ? "s" : ""}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              data={filtered}
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

      <Card>
        <CardContent className="p-0">
          {orgQuery.isLoading || loading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <Typography.Text className="text-destructive">
                {error}
              </Typography.Text>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          ) : filtered.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Pencil />
                </EmptyMedia>
                <EmptyTitle>{t("services.noServices")}</EmptyTitle>
                <EmptyDescription>{t("services.noServices")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-4 p-4 min-h-[64px]"
                >
                  <div className="flex-1 min-w-0">
                    {editingId === s.id ? (
                      <div className="flex flex-col gap-1">
                        <Input
                          placeholder="Service Name *"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="h-8 text-sm font-medium"
                        />
                        <Input
                          placeholder="Category (e.g. Oil, Brakes)"
                          value={editForm.category}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              category: e.target.value,
                            }))
                          }
                          className="h-8 text-sm text-muted-foreground"
                        />
                      </div>
                    ) : (
                      <>
                        <Typography.Text className="font-medium truncate">
                          <HighlightText
                            text={
                              locale === "mn" && s.name_mn ? s.name_mn : s.name
                            }
                            query={search}
                          />
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
                        <Typography.Muted className="text-sm text-muted-foreground">
                          {s.category ? (
                            <HighlightText text={s.category} query={search} />
                          ) : (
                            t("services.uncategorized")
                          )}
                        </Typography.Muted>
                      </>
                    )}
                  </div>

                  {editingId === s.id ? (
                    <Input
                      type="number"
                      min="0"
                      placeholder="Price"
                      value={editForm.default_price}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          default_price: e.target.value,
                        }))
                      }
                      className="h-8 w-24 text-right font-medium tabular-nums shrink-0"
                    />
                  ) : (
                    <span className="font-medium text-lg tabular-nums shrink-0">
                      {formatMNT(Number(s.default_price))}
                    </span>
                  )}

                  {editingId === s.id ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon-xs"
                        onClick={handleUpdate}
                        disabled={
                          updateMutation.isPending || !editForm.name.trim()
                        }
                        aria-label="Save"
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-xs"
                        onClick={handleCancelEdit}
                        aria-label="Cancel"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      {lastUsedPrices.data?.[s.id] && (
                        <span className="hidden text-xs text-amber-600 tabular-nums md:inline">
                          {t("services.lastUsedPrice")}:{" "}
                          {formatMNT(lastUsedPrices.data[s.id].unit_price)}
                        </span>
                      )}
                      <MinimalModelCountBadge
                        count={modelPriceCounts[s.id] ?? 0}
                        onClick={() => setModelPricesService(s)}
                      />
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleStartEdit(s)}
                        aria-label="Edit service"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDelete(s.id)}
                        aria-label="Delete service"
                      >
                        <X className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model-Specific Prices Sheet */}
      <ServiceModelPricesSheet
        serviceId={modelPricesService?.id ?? null}
        serviceName={modelPricesService?.name ?? ""}
        defaultPrice={modelPricesService?.default_price ?? 0}
        open={modelPricesService !== null}
        onOpenChange={(open) => {
          if (!open) setModelPricesService(null);
        }}
      />
    </div>
  );
}

/**
 * Inline badge that shows the count of vehicle models with custom prices.
 * Receives pre-computed count from batch hook to avoid N+1 API calls.
 */
function MinimalModelCountBadge({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={onClick}
      aria-label="Model prices"
      title="Model-Specific Prices"
      className="relative"
    >
      <CarFront className="size-4" />
      <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-medium text-primary-foreground leading-none">
        {count}
      </span>
    </Button>
  );
}
