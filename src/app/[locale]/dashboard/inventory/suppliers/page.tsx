"use client";

import { Building2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { ExportButton } from "@/components/export-button";
import { ListPageShell } from "@/components/list-page-shell";
import { ListToolbar } from "@/components/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useClientNow } from "@/hooks/use-client-now";
import { usePageHeader } from "@/hooks/use-page-header";
import type { ExportColumn } from "@/lib/export";
import { Link } from "@/lib/i18n/navigation";
import { useDeleteSupplier, useSuppliers } from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { Supplier } from "@/lib/types";
import { createColumns } from "./_columns";

export default function SuppliersPage() {
  const t = useTranslations("inventory");
  const now = useClientNow();
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const { data: rawSuppliers, isLoading } = useSuppliers(orgId);
  const suppliers = Array.isArray(rawSuppliers) ? rawSuppliers : [];
  const deleteSupplier = useDeleteSupplier(orgId);
  const { setDetailSupplierId } = usePageHeader();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return suppliers.filter((s) => s.is_active);
    const q = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.is_active &&
        (s.name.toLowerCase().includes(q) ||
          (s.contact_person ?? "").toLowerCase().includes(q) ||
          (s.phone ?? "").toLowerCase().includes(q)),
    );
  }, [suppliers, search]);

  const exportColumns: ExportColumn<Supplier>[] = [
    { key: "name", label: t("name") },
    { key: "contact_person", label: t("contactPerson") },
    { key: "phone", label: t("phone") },
    { key: "email", label: t("email") },
    { key: "address", label: t("address") },
  ];

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm(t("deleteSupplier"))) return;
      try {
        await deleteSupplier.mutateAsync(id);
        toast.success(t("supplierDeleted"));
      } catch {
        toast.error(t("failedToDelete"));
      }
    },
    [t, deleteSupplier],
  );

  const columns = useMemo(
    () =>
      createColumns({
        onEdit: (id) => setDetailSupplierId(id),
        onDelete: handleDelete,
      }),
    [handleDelete, setDetailSupplierId],
  );

  return (
    <ListPageShell
      title={t("suppliersTitle")}
      description={t("suppliersSubtitle")}
      loading={isLoading && suppliers.length === 0}
      headerAction={
        <Link href="/dashboard/inventory/suppliers/new">
          <Button size="default">
            <Plus className="size-5" /> {t("newSupplier")}
          </Button>
        </Link>
      }
    >
      <ListToolbar
        search={{
          placeholder: t("searchSuppliers"),
          value: search,
          onChange: setSearch,
        }}
        stats={
          <span>
            {filtered.length} {t("suppliers")}
          </span>
        }
        actions={
          <ExportButton
            data={filtered}
            columns={exportColumns}
            filename={`suppliers-${now.toISOString().split("T")[0]}.xlsx`}
            sheetName="Suppliers"
          />
        }
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Building2 />
                </EmptyMedia>
                <EmptyTitle>{t("noSuppliers")}</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <Link href="/dashboard/inventory/suppliers/new">
                  <Button>{t("addFirstSupplier")}</Button>
                </Link>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={filtered}
              getRowId={(row) => row.id}
              pageSize={20}
              renderMobileCard={(s) => (
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 shrink-0 text-muted-foreground/60" />
                    <span className="font-medium truncate">{s.name}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/50 pt-2 text-xs text-muted-foreground">
                    <span>{s.contact_person || "—"}</span>
                    <span>{s.phone || "—"}</span>
                    <span className="truncate">{s.email || "—"}</span>
                  </div>
                </div>
              )}
            />
          </CardContent>
        </Card>
      )}
    </ListPageShell>
  );
}
