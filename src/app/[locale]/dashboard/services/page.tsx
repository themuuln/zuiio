"use client";

import { Pencil, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useClientNow } from "@/hooks/use-client-now";
import { toast } from "sonner";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExportColumn } from "@/lib/export";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { StatusSummary } from "@/components/sidebar-tabs/status-summary";
import { RecentList } from "@/components/sidebar-tabs/recent-list";
import { serviceKeys } from "@/lib/queries/keys";
import { useServiceLastUsedPrices } from "@/lib/queries/use-price-memory";
import { useQuery } from "@tanstack/react-query";
import { formatMNT } from "@/lib/utils";

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  default_price: number;
  category: string | null;
}

export default function ServicesPage() {
  const t = useTranslations();
  const now = useClientNow();
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;

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

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    default_price: "",
    category: "",
  });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    default_price: "",
    category: "",
  });
  const [editSaving, setEditSaving] = useState(false);

  const lastUsedPrices = useServiceLastUsedPrices(orgId ?? undefined);

  const exportColumns: ExportColumn<ServiceItem>[] = useMemo(
    () => [
      { key: "name", label: "Name" },
      { key: "category", label: "Category" },
      { key: "default_price", label: "Price", format: "currency" },
    ],
    [],
  );

  const handleAdd = async () => {
    if (!orgId || !newService.name.trim()) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/organizations/${orgId}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newService.name,
          description: newService.description || null,
          default_price: parseFloat(newService.default_price) || 0,
          category: newService.category || null,
        }),
      });
      const d = await r.json();
      if (d.data) {
        toast.success("Service created");
        refetch();
        setShowAdd(false);
        setNewService({
          name: "",
          description: "",
          default_price: "",
          category: "",
        });
      } else {
        toast.error(d.error?.message ?? "Failed to create service");
      }
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Failed to create service");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!orgId) return;
    try {
      const r = await fetch(`/api/organizations/${orgId}/services/${id}`, {
        method: "DELETE",
      });
      const d = await r.json();
      if (d.error) {
        toast.error(d.error.message);
        return;
      }
      refetch();
      toast.success("Service deleted");
    } catch {
      toast.error("Failed to delete service");
    }
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

  const handleUpdate = async () => {
    if (!orgId || !editingId || !editForm.name.trim()) return;
    setEditSaving(true);
    try {
      const r = await fetch(
        `/api/organizations/${orgId}/services/${editingId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editForm.name,
            description: editForm.description || null,
            default_price: parseFloat(editForm.default_price) || 0,
            category: editForm.category || null,
          }),
        },
      );
      const d = await r.json();
      if (d.data) {
        toast.success("Service updated");
        refetch();
        handleCancelEdit();
      } else {
        toast.error(d.error?.message ?? "Failed to update service");
      }
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Failed to update service");
    } finally {
      setEditSaving(false);
    }
  };

  const filtered = services.filter(
    (s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.category ?? "").toLowerCase().includes(search.toLowerCase()),
  );

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

    sidebar.setOpen(true);
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
      sidebar.setOpen(false);
    };
  }, [services]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Service Catalog</h1>
        <p className="text-muted-foreground">Manage your service prices</p>
      </div>

      <ListToolbar
        search={{
          placeholder: "Search services...",
          value: search,
          onChange: setSearch,
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
              size="lg"
              className="h-12"
              onClick={() => setShowAdd(!showAdd)}
            >
              <Plus className="size-5" /> {showAdd ? "Cancel" : "Add Service"}
            </Button>
          </div>
        }
      />

      {showAdd && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Service Name *"
                value={newService.name}
                onChange={(e) =>
                  setNewService(prev => ({ ...prev, name: e.target.value }))
                }
                className="h-11"
              />
              <Input
                placeholder="Category (e.g. Oil, Brakes)"
                value={newService.category}
                onChange={(e) =>
                  setNewService(prev => ({ ...prev, category: e.target.value }))
                }
                className="h-11"
              />
              <Input
                type="number"
                min="0"
                placeholder="Default Price (₮) *"
                value={newService.default_price}
                onChange={(e) =>
                  setNewService(prev => ({ ...prev, default_price: e.target.value }))
                }
                className="h-11"
              />
              <Input
                placeholder="Description"
                value={newService.description}
                onChange={(e) =>
                  setNewService(prev => ({ ...prev, description: e.target.value }))
                }
                className="h-11"
              />
            </div>
            <Button
              onClick={handleAdd}
              disabled={
                saving || !newService.name.trim() || !newService.default_price
              }
              size="lg"
            >
              {saving ? t("services.saving") : t("services.saveService")}
            </Button>
          </CardContent>
        </Card>
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
              <p className="text-destructive">{error}</p>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <p className="text-muted-foreground">
                {t("services.noServices")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-4 p-4 ${editingId === s.id ? "flex-col items-stretch" : "min-h-[64px]"}`}
                >
                  {editingId === s.id ? (
                    <div className="flex-1 grid gap-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          placeholder="Service Name *"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm(prev => ({ ...prev, name: e.target.value }))
                          }
                          className="h-11"
                        />
                        <Input
                          placeholder="Category (e.g. Oil, Brakes)"
                          value={editForm.category}
                          onChange={(e) =>
                            setEditForm(prev => ({ ...prev, category: e.target.value }))
                          }
                          className="h-11"
                        />
                        <Input
                          type="number"
                          min="0"
                          placeholder="Default Price (₮) *"
                          value={editForm.default_price}
                          onChange={(e) =>
                            setEditForm(prev => ({ ...prev, default_price: e.target.value }))
                          }
                          className="h-11"
                        />
                        <Input
                          placeholder="Description"
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm(prev => ({ ...prev, description: e.target.value }))
                          }
                          className="h-11"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleUpdate}
                          disabled={editSaving || !editForm.name.trim()}
                          size="lg"
                        >
                          {editSaving ? t("services.saving") : "Save"}
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{s.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {s.category ?? t("services.uncategorized")}
                        </p>
                      </div>
                      <span className="font-medium text-lg tabular-nums shrink-0">
                        {formatMNT(Number(s.default_price))}
                      </span>
                      {lastUsedPrices.data?.[s.id] && (
                        <span className="hidden text-xs text-amber-600 tabular-nums md:inline">
                          {t("services.lastUsedPrice")}:{" "}
                          {formatMNT(lastUsedPrices.data[s.id].unit_price)}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStartEdit(s)}
                        aria-label="Edit service"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
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
    </div>
  );
}
