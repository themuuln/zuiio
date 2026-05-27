"use client";

import { Building2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useClientNow } from "@/hooks/use-client-now";
import { toast } from "sonner";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteSupplier"))) return;
    try {
      await deleteSupplier.mutateAsync(id);
      toast.success(t("supplierDeleted"));
    } catch {
      toast.error(t("failedToDelete"));
    }
  };

  const columns = useMemo(
    () => createColumns({ onDelete: handleDelete }),
    [handleDelete],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("suppliersTitle")}
        </h1>
        <p className="text-muted-foreground">{t("suppliersSubtitle")}</p>
      </div>

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
          <div className="flex items-center gap-2">
            <ExportButton
              data={filtered}
              columns={exportColumns}
              filename={`suppliers-${now.toISOString().split("T")[0]}.xlsx`}
              sheetName="Suppliers"
            />
            <Link href="/dashboard/inventory/suppliers/new">
              <Button size="default">
                <Plus className="size-5" /> {t("newSupplier")}
              </Button>
            </Link>
          </div>
        }
      />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
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
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              getRowId={(row) => row.id}
              pageSize={20}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
