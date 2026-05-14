"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/breadcrumb";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExportColumn } from "@/lib/export";
import { useCurrentOrg } from "@/lib/queries/use-organization";
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

  const filtered = services.filter(
    (s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.category ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: "Services" }]} />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Service Catalog</h1>
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
              filename={`services-${new Date().toISOString().split("T")[0]}.xlsx`}
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
                  setNewService({ ...newService, name: e.target.value })
                }
                className="h-11"
              />
              <Input
                placeholder="Category (e.g. Oil, Brakes)"
                value={newService.category}
                onChange={(e) =>
                  setNewService({ ...newService, category: e.target.value })
                }
                className="h-11"
              />
              <Input
                type="number"
                min="0"
                placeholder="Default Price (₮) *"
                value={newService.default_price}
                onChange={(e) =>
                  setNewService({
                    ...newService,
                    default_price: e.target.value,
                  })
                }
                className="h-11"
              />
              <Input
                placeholder="Description"
                value={newService.description}
                onChange={(e) =>
                  setNewService({ ...newService, description: e.target.value })
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
                <div key={n} className="flex items-center gap-4 px-4 py-4">
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
                  className="flex items-center gap-4 px-4 py-4 min-h-[64px]"
                >
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
                    onClick={() => handleDelete(s.id)}
                    aria-label="Delete service"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
