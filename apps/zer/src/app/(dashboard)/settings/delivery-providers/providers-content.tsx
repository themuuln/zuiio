"use client";

import { PencilSimple, Plus, Trash, Truck } from "@phosphor-icons/react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { actionsColumn, textColumn } from "@/lib/table-columns";
import {
  createProvider,
  deleteProvider,
  type ProviderRow,
  updateProvider,
} from "./actions";

// ---------------------------------------------------------------------------
// Provider type options
// ---------------------------------------------------------------------------

const PROVIDER_TYPES = [
  { value: "internal", label: "Дотоод курьер" },
  { value: "lopom", label: "Lopom (Lalamove)" },
] as const;

function getProviderTypeBadge(type: string) {
  switch (type) {
    case "internal":
      return <Badge variant="secondary">Дотоод</Badge>;
    case "lopom":
      return <Badge>Lopom</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

// ---------------------------------------------------------------------------
// Provider form (create + edit)
// ---------------------------------------------------------------------------

function ProviderForm({
  action,
  state,
  pending,
  provider,
  formId,
}: {
  action: (payload: FormData) => void;
  state: { error?: string } | undefined;
  pending: boolean;
  provider?: ProviderRow | null;
  formId: string;
}) {
  return (
    <form id={formId} action={action} className="space-y-6">
      {state?.error && <ErrorBanner error={state.error} />}

      {provider && <input type="hidden" name="id" value={provider.id} />}
      {provider && (
        <input
          type="hidden"
          name="is_active"
          value={provider.is_active ? "true" : "false"}
        />
      )}

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={`${formId}-name`}>Нэр</FieldLabel>
          <Input
            id={`${formId}-name`}
            name="name"
            defaultValue={provider?.name ?? ""}
            required
            placeholder="Жишээ: Хот курьер"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${formId}-provider_type`}>Төрөл</FieldLabel>
          <Select
            name="provider_type"
            defaultValue={provider?.provider_type ?? "internal"}
          >
            <SelectTrigger id={`${formId}-provider_type`}>
              <SelectValue placeholder="Төрөл сонгох" />
            </SelectTrigger>
            <SelectContent>
              {PROVIDER_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={`${formId}-api_key`}>API түлхүүр</FieldLabel>
          <Input
            id={`${formId}-api_key`}
            name="api_key"
            type="password"
            defaultValue={provider?.api_key ?? ""}
            placeholder="API түлхүүр"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${formId}-api_secret`}>
            API нууц үг
          </FieldLabel>
          <Input
            id={`${formId}-api_secret`}
            name="api_secret"
            type="password"
            defaultValue={provider?.api_secret ?? ""}
            placeholder="API нууц үг"
          />
        </Field>
      </FieldGroup>

      <DrawerFooter>
        <DrawerSubmit isPending={pending} form={formId} />
      </DrawerFooter>
    </form>
  );
}

// ---------------------------------------------------------------------------
// ProvidersContent
// ---------------------------------------------------------------------------

export function ProvidersContent({
  providers,
}: {
  providers: ProviderRow[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderRow | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<ProviderRow | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [createState, createAction, createPending] = useActionState(
    createProvider,
    undefined,
  );
  const [editState, editAction, editPending] = useActionState(
    updateProvider,
    undefined,
  );

  // Close create drawer on success
  useEffect(() => {
    if (createState && "success" in createState) {
      setCreateOpen(false);
      toast.success("Провайдер нэмэгдсэн");
    }
  }, [createState]);

  // Close edit drawer on success
  useEffect(() => {
    if (editState && "success" in editState) {
      setEditingProvider(null);
      toast.success("Провайдер засагдсан");
    }
  }, [editState]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeletePending(true);
    const result = await deleteProvider(deleteTarget.id);
    setDeletePending(false);
    setDeleteTarget(null);
    if ("error" in result) {
      toast.error(result.error ?? "Алдаа гарлаа");
    } else {
      toast.success("Провайдер устгагдсан");
    }
  }

  const columns: ColumnDef<ProviderRow>[] = [
    textColumn("name", "Нэр"),
    {
      accessorKey: "provider_type",
      header: "Төрөл",
      cell: ({ row }) => getProviderTypeBadge(row.original.provider_type),
    },
    {
      accessorKey: "is_active",
      header: "Төлөв",
      cell: ({ row }) =>
        row.original.is_active ? (
          <Badge className="bg-emerald-600 text-white">Идэвхтэй</Badge>
        ) : (
          <Badge variant="secondary">Идэвхгүй</Badge>
        ),
    },
    actionsColumn<ProviderRow>("Үйлдэл", (row) => (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setEditingProvider(row)}
        >
          <PencilSimple className="size-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger>
            <Button variant="ghost" size="icon">
              <Trash className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Провайдер устгах</AlertDialogTitle>
              <AlertDialogDescription>
                Та "{row.name}" хүргэлтийн провайдерыг устгахдаа итгэлтэй
                байна уу? Энэ үйлдлийг буцаах боломжгүй.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Цуцлах</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  setDeleteTarget(row);
                }}
              >
                Устгах
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )),
  ];

  return (
    <PageShell
      title="Хүргэлтийн провайдерууд"
      description="Гадаад хүргэлтийн үйлчилгээний тохиргоо"
      actions={
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Провайдер нэмэх
        </Button>
      }
    >
      {providers.length > 0 ? (
        <DataTable columns={columns} data={providers} searchColumn="name" />
      ) : (
        <ErpEmptyState
          icon={<Truck className="size-6" />}
          title="Хүргэлтийн провайдер байхгүй"
          description="Хүргэлтийн провайдер нэмэхдээ 'Провайдер нэмэх' товчийг дарна уу."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Провайдер нэмэх
            </Button>
          }
        />
      )}

      {/* Create drawer */}
      <SlideInDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Шинэ хүргэлтийн провайдер"
        description="Хүргэлтийн шинэ провайдер нэмэх"
      >
        <ProviderForm
          action={createAction}
          state={createState}
          pending={createPending}
          formId="create-provider-form"
        />
      </SlideInDrawer>

      {/* Edit drawer */}
      <SlideInDrawer
        open={!!editingProvider}
        onOpenChange={(open) => {
          if (!open) setEditingProvider(null);
        }}
        title="Хүргэлтийн провайдер засах"
        description={editingProvider?.name ?? ""}
      >
        {editingProvider && (
          <ProviderForm
            action={editAction}
            state={editState}
            pending={editPending}
            provider={editingProvider}
            formId="edit-provider-form"
          />
        )}
      </SlideInDrawer>

      {/* Delete confirm dialog */}
      {deleteTarget && (
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Провайдер устгах</AlertDialogTitle>
              <AlertDialogDescription>
                Та "{deleteTarget.name}" хүргэлтийн провайдерыг устгахдаа
                итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Цуцлах</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={deletePending}
              >
                {deletePending ? "Устгаж байна..." : "Устгах"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </PageShell>
  );
}
