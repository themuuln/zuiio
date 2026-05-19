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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ExportColumn } from "@/lib/export";
import { Link } from "@/lib/i18n/navigation";
import { useDeleteSupplier, useSuppliers } from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { Supplier } from "@/lib/types";

export default function SuppliersPage() {
  const t = useTranslations("inventory");
  const now = useClientNow();
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const { data: suppliers = [], isLoading } = useSuppliers(orgId);
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
              <Button size="lg" className="h-12">
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
            <div className="flex flex-col items-center gap-4 py-12">
              <Building2 className="size-10 text-muted-foreground/40" />
              <p className="text-muted-foreground">{t("noSuppliers")}</p>
              <Link href="/dashboard/inventory/suppliers/new">
                <Button>{t("addFirstSupplier")}</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t("name")}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t("contactPerson")}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t("phone")}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t("email")}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-center font-medium text-muted-foreground">
                    {t("actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {filtered.map((s) => (
                  <TableRow
                    key={s.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <TableCell className="px-4 py-3 font-medium">
                      <Link
                        href={`/dashboard/inventory/suppliers/${s.id}`}
                        className="hover:underline"
                      >
                        {s.name}
                      </Link>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {s.contact_person ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3">{s.phone ?? "—"}</TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {s.email ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/dashboard/inventory/suppliers/${s.id}`}>
                          <Button variant="ghost" size="sm">
                            {t("edit")}
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDelete(s.id)}
                        >
                          {t("delete")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
