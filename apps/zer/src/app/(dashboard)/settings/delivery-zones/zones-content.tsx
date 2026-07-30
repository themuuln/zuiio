"use client";

import { MapPinArea, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DrawerFooter, DrawerSubmit } from "@/components/ui/drawer-footer";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import { actionsColumn, textColumn } from "@/lib/table-columns";
import { createZone, deleteZone, updateZone, type ZoneRow } from "./actions";

// ---------------------------------------------------------------------------
// Zone form state (used for both create and edit)
// ---------------------------------------------------------------------------

function ZoneForm({
  action,
  state,
  pending,
  zone,
  formId,
}: {
  action: (payload: FormData) => void;
  state: { error?: string } | undefined;
  pending: boolean;
  zone?: ZoneRow | null;
  formId: string;
}) {
  return (
    <form id={formId} action={action} className="space-y-6">
      {state?.error && <ErrorBanner error={state.error} />}

      {zone && <input type="hidden" name="id" value={zone.id} />}
      {zone && (
        <input
          type="hidden"
          name="is_active"
          value={zone.is_active ? "true" : "false"}
        />
      )}

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={`${formId}-name`}>Нэр</FieldLabel>
          <Input
            id={`${formId}-name`}
            name="name"
            defaultValue={zone?.name ?? ""}
            required
            placeholder="Төв"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${formId}-description`}>Тайлбар</FieldLabel>
          <Textarea
            id={`${formId}-description`}
            name="description"
            defaultValue={zone?.description ?? ""}
            placeholder="Хот, төвийн бүс"
          />
        </Field>
      </FieldGroup>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={`${formId}-base_fee`}>Санхүүжилт (₮)</FieldLabel>
          <Input
            id={`${formId}-base_fee`}
            name="base_fee"
            type="number"
            step="0.01"
            min="0"
            defaultValue={zone?.base_fee ?? 0}
            placeholder="5000"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${formId}-free_delivery_threshold`}>
            Үнэгүй хүргэлтийн босго (₮)
          </FieldLabel>
          <Input
            id={`${formId}-free_delivery_threshold`}
            name="free_delivery_threshold"
            type="number"
            step="0.01"
            min="0"
            defaultValue={zone?.free_delivery_threshold ?? ""}
            placeholder="50000"
          />
        </Field>
      </FieldGroup>

      <Field>
        <FieldLabel htmlFor={`${formId}-estimated`}>
          Хүргэлтийн хугацаа (минут)
        </FieldLabel>
        <Input
          id={`${formId}-estimated`}
          name="estimated_delivery_minutes"
          type="number"
          min="0"
          defaultValue={zone?.estimated_delivery_minutes ?? 60}
          placeholder="60"
        />
      </Field>

      {zone && (
        <Field>
          <FieldLabel>Идэвхтэй</FieldLabel>
          <Switch
            defaultChecked={zone.is_active}
            onCheckedChange={(checked) => {
              const hidden = document.querySelector<HTMLInputElement>(
                `input[name="is_active"][form="${formId}"]`,
              );
              if (hidden) hidden.value = checked ? "true" : "false";
            }}
          />
        </Field>
      )}

      <DrawerFooter>
        <DrawerSubmit isPending={pending} form={formId} />
      </DrawerFooter>
    </form>
  );
}

// ---------------------------------------------------------------------------
// ZonesContent
// ---------------------------------------------------------------------------

export function ZonesContent({ zones }: { zones: ZoneRow[] }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ZoneRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ZoneRow | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [createState, createAction, createPending] = useActionState(
    createZone,
    undefined,
  );
  const [editState, editAction, editPending] = useActionState(
    updateZone,
    undefined,
  );

  // Close create drawer on success
  useEffect(() => {
    if (createState && "success" in createState) {
      setCreateOpen(false);
      toast.success("Хүргэлтийн бүс үүсгэгдсэн");
    }
  }, [createState]);

  // Close edit drawer on success
  useEffect(() => {
    if (editState && "success" in editState) {
      setEditingZone(null);
      toast.success("Хүргэлтийн бүс засагдсан");
    }
  }, [editState]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeletePending(true);
    const result = await deleteZone(deleteTarget.id);
    setDeletePending(false);
    setDeleteTarget(null);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Хүргэлтийн бүс устгагдсан");
    }
  }

  const columns: ColumnDef<ZoneRow>[] = [
    textColumn("name", "Нэр"),
    {
      accessorFn: (row) => formatCurrency(row.base_fee),
      id: "base_fee",
      header: "Санхүүжилт",
      cell: ({ row }) => formatCurrency(row.original.base_fee),
    },
    {
      accessorFn: (row) =>
        row.free_delivery_threshold != null
          ? formatCurrency(row.free_delivery_threshold)
          : "-",
      id: "free_delivery_threshold",
      header: "Үнэгүй хүргэлт",
      cell: ({ row }) =>
        row.original.free_delivery_threshold != null
          ? formatCurrency(row.original.free_delivery_threshold)
          : "-",
    },
    {
      accessorFn: (row) =>
        row.estimated_delivery_minutes != null
          ? `${row.estimated_delivery_minutes} мин`
          : "-",
      id: "estimated_delivery_minutes",
      header: "Хүргэлтийн хугацаа",
      cell: ({ row }) =>
        row.original.estimated_delivery_minutes != null
          ? `${row.original.estimated_delivery_minutes} мин`
          : "-",
    },
    {
      accessorFn: (row) => (row.is_active ? "Тийм" : "Үгүй"),
      id: "is_active",
      header: "Идэвхтэй",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "Тийм" : "Үгүй"}
        </Badge>
      ),
    },
    actionsColumn("", (row) => (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setEditingZone(row)}
          title="Засах"
        >
          <PencilSimple className="size-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              title="Устгах"
            >
              <Trash className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Бүс устгах</AlertDialogTitle>
              <AlertDialogDescription>
                Та "{row.name}" хүргэлтийн бүсийг устгахдаа итгэлтэй байна уу?
                Энэ үйлдлийг буцаах боломжгүй.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Цуцлах</AlertDialogCancel>
              <AlertDialogAction onClick={() => setDeleteTarget(row)}>
                Устгах
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )),
  ];

  if (zones.length === 0) {
    return (
      <PageShell
        title="Хүргэлтийн бүсүүд"
        description="Хүргэлтийн үнийн бүсүүдийн тохиргоо"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 size-4" />
            Бүс нэмэх
          </Button>
        }
      >
        <ErpEmptyState
          icon={<MapPinArea className="size-4" />}
          title="Хүргэлтийн бүс байхгүй"
          description="Шинэ бүс үүсгэж, хүргэлтийн үнийг тохируулна уу."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1 size-4" />
              Бүс нэмэх
            </Button>
          }
        />
      </PageShell>
    );
  }

  return (
    <>
      <PageShell
        title="Хүргэлтийн бүсүүд"
        description="Хүргэлтийн үнийн бүсүүдийн тохиргоо"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 size-4" />
            Бүс нэмэх
          </Button>
        }
      >
        <DataTable columns={columns} data={zones} />
      </PageShell>

      {/* Create drawer */}
      <SlideInDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Шинэ хүргэлтийн бүс"
        description="Хүргэлтийн үнийн шинэ бүс үүсгэх"
      >
        <ZoneForm
          action={createAction}
          state={createState}
          pending={createPending}
          formId="create-zone-form"
        />
      </SlideInDrawer>

      {/* Edit drawer */}
      <SlideInDrawer
        open={editingZone !== null}
        onOpenChange={(open) => {
          if (!open) setEditingZone(null);
        }}
        title="Хүргэлтийн бүс засах"
        description={editingZone?.name ?? ""}
      >
        {editingZone && (
          <ZoneForm
            action={editAction}
            state={editState}
            pending={editPending}
            zone={editingZone}
            formId="edit-zone-form"
          />
        )}
      </SlideInDrawer>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Бүс устгах</AlertDialogTitle>
            <AlertDialogDescription>
              Та "{deleteTarget?.name}" хүргэлтийн бүсийг устгахдаа итгэлтэй
              байна уу? Энэ үйлдлийг буцаах боломжгүй.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Цуцлах</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deletePending}>
              {deletePending ? "Устгаж байна..." : "Устгах"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
