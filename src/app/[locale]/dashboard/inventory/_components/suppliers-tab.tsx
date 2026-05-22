"use client";

import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClientNow } from "@/hooks/use-client-now";
import type { ExportColumn } from "@/lib/export";
import type { Supplier } from "@/lib/types";
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "@/lib/queries/use-inventory";
import { Modal } from "./modal";
import { TableSkeleton } from "./table-skeleton";

interface SuppliersTabProps {
  orgId: string;
  search: string;
  onSearchChange: (value: string) => void;
}

export function SuppliersTab({ orgId, search, onSearchChange }: SuppliersTabProps) {
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
              size="lg"
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
            <p className="text-muted-foreground">{t("noSuppliers")}</p>
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
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Name
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Contact
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Phone
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Email
                  </TableHead>
                  <TableHead className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((s) => (
                  <TableRow
                    key={s.id}
                    className="border-b border-border transition-colors hover:bg-muted/30"
                  >
                    <TableCell className="px-4 py-3 font-medium">
                      {s.name}
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
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSupplier(s);
                            setShowAddSupplier(true);
                          }}
                          className="p-1 text-muted-foreground hover:text-foreground"
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSupplier(s.id)}
                          className="p-1 text-destructive/70 hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
          <form onSubmit={handleSaveSupplier} className="space-y-4">
            <div className="space-y-2">
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
              <div className="space-y-2">
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
              <div className="space-y-2">
                <label
                  htmlFor="inv-supplier-phone"
                  className="text-sm font-medium"
                >
                  Phone
                </label>
                <Input
                  id="inv-supplier-phone"
                  name="phone"
                  defaultValue={editingSupplier?.phone ?? ""}
                  className="h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
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
            <div className="space-y-2">
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
              <div className="space-y-2">
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
              <div className="space-y-2">
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
              <Button type="submit">
                {editingSupplier ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
