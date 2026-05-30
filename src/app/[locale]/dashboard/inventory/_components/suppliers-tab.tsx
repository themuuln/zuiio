"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { useClientNow } from "@/hooks/use-client-now";
import type { ExportColumn } from "@/lib/export";
import {
  useCreateSupplier,
  useDeleteSupplier,
  useSuppliers,
  useUpdateSupplier,
} from "@/lib/queries/use-inventory";
import type { Supplier } from "@/lib/types";
import { Modal } from "./modal";
import { TableSkeleton } from "./table-skeleton";
import { Typography } from "@/components/ui/typography";

interface SuppliersTabProps {
  orgId: string;
  search: string;
  onSearchChange: (value: string) => void;
}

export function SuppliersTab({
  orgId,
  search,
  onSearchChange,
}: SuppliersTabProps) {
  const t = useTranslations("inventory");
  const now = useClientNow();
  const { data: suppliers = [], isLoading } = useSuppliers(orgId);
  const createSupplier = useCreateSupplier(orgId);
  const updateSupplier = useUpdateSupplier(orgId);
  const deleteSupplier = useDeleteSupplier(orgId);

  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const filteredSuppliers = useMemo(() => {
    if (!search) return suppliers.filter((s) => s.is_active);
    const q = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.is_active &&
        (s.name.toLowerCase().includes(q) ||
          (s.contact_person ?? "").toLowerCase().includes(q) ||
          (s.phone ?? "").toLowerCase().includes(q) ||
          (s.email ?? "").toLowerCase().includes(q)),
    );
  }, [suppliers, search]);

  const supplierExportColumns: ExportColumn<Supplier>[] = [
    { key: "name", label: "Name" },
    { key: "contact_person", label: "Contact" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
  ];

  const columns: ColumnDef<Supplier>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "contact_person",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Contact" />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.contact_person ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "phone",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Phone" />
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Email" />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.email ?? "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div
            className="flex items-center justify-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                setEditingSupplier(row.original);
                setShowAddSupplier(true);
              }}
              title="Edit"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => handleDeleteSupplier(row.original.id)}
              className="text-destructive/70 hover:text-destructive"
              title="Delete"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  function handleSaveSupplier(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name") as string,
      contact_person: (form.get("contact_person") as string) || undefined,
      phone: (form.get("phone") as string) || undefined,
      email: (form.get("email") as string) || undefined,
      address: (form.get("address") as string) || undefined,
      tax_id: (form.get("tax_id") as string) || undefined,
      notes: (form.get("notes") as string) || undefined,
    };

    if (editingSupplier) {
      updateSupplier.mutate(
        { id: editingSupplier.id, body },
        {
          onSuccess: () => {
            toast.success("Supplier updated");
            setShowAddSupplier(false);
            setEditingSupplier(null);
          },
          onError: (err: Error) => toast.error(err.message),
        },
      );
    } else {
      createSupplier.mutate(body, {
        onSuccess: () => {
          toast.success("Supplier created");
          setShowAddSupplier(false);
        },
        onError: (err: Error) => toast.error(err.message),
      });
    }
  }

  function handleDeleteSupplier(id: string) {
    if (!confirm("Delete this supplier?")) return;
    deleteSupplier.mutate(id, {
      onSuccess: () => toast.success("Supplier deleted"),
      onError: (err: Error) => toast.error(err.message),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ListToolbar
        search={{
          placeholder: t("searchSuppliers"),
          value: search,
          onChange: onSearchChange,
        }}
        stats={<span>{filteredSuppliers.length} suppliers</span>}
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              data={suppliers.filter((s) => s.is_active)}
              columns={supplierExportColumns}
              filename={`inventory-suppliers-${now.toISOString().split("T")[0]}.xlsx`}
              sheetName="Suppliers"
            />
            <Button
              size="default"
              onClick={() => {
                setShowAddSupplier(true);
                setEditingSupplier(null);
              }}
            >
              <Plus className="size-4" />
              {t("addSupplier")}
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <TableSkeleton />
      ) : suppliers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <Building2 className="size-10 text-muted-foreground/40" />
            <Typography.Muted className="text-muted-foreground">
              {t("noSuppliers")}
            </Typography.Muted>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddSupplier(true);
                setEditingSupplier(null);
              }}
            >
              {t("addFirstSupplier")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <DataTable
              columns={columns}
              data={filteredSuppliers}
              getRowId={(row) => row.id}
              pageSize={20}
              renderMobileCard={(s) => (
                <div className="flex flex-col gap-2 text-sm">
                  <span className="font-medium">{s.name}</span>
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

      {/* Add/Edit Supplier Modal */}
      {showAddSupplier && (
        <Modal
          title={editingSupplier ? "Edit Supplier" : t("addSupplier")}
          onClose={() => {
            setShowAddSupplier(false);
            setEditingSupplier(null);
          }}
        >
          <form onSubmit={handleSaveSupplier} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="inv-supplier-name"
                className="text-sm font-medium"
              >
                Name *
              </label>
              <Input
                id="inv-supplier-name"
                name="name"
                required
                defaultValue={editingSupplier?.name ?? ""}
                placeholder="ABC Auto Parts"
                className="h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="inv-supplier-contact"
                  className="text-sm font-medium"
                >
                  Contact Person
                </label>
                <Input
                  id="inv-supplier-contact"
                  name="contact_person"
                  defaultValue={editingSupplier?.contact_person ?? ""}
                  className="h-11"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="inv-supplier-phone"
                  className="text-sm font-medium"
                >
                  Phone
                </label>
                <Input
                  id="inv-supplier-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  defaultValue={editingSupplier?.phone ?? ""}
                  placeholder="99112233"
                  className="h-11"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="inv-supplier-email"
                className="text-sm font-medium"
              >
                Email
              </label>
              <Input
                id="inv-supplier-email"
                name="email"
                type="email"
                defaultValue={editingSupplier?.email ?? ""}
                className="h-11"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="inv-supplier-address"
                className="text-sm font-medium"
              >
                Address
              </label>
              <Input
                id="inv-supplier-address"
                name="address"
                defaultValue={editingSupplier?.address ?? ""}
                className="h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="inv-supplier-tax-id"
                  className="text-sm font-medium"
                >
                  Tax ID
                </label>
                <Input
                  id="inv-supplier-tax-id"
                  name="tax_id"
                  defaultValue={editingSupplier?.tax_id ?? ""}
                  className="h-11"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="inv-supplier-notes"
                  className="text-sm font-medium"
                >
                  Notes
                </label>
                <Input
                  id="inv-supplier-notes"
                  name="notes"
                  defaultValue={editingSupplier?.notes ?? ""}
                  className="h-11"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddSupplier(false);
                  setEditingSupplier(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createSupplier.isPending || updateSupplier.isPending}
              >
                {editingSupplier ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
