"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  MapPin,
  Plus,
  Warehouse as WarehouseIcon,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { capture } from "@zuiio/capture";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import {
  type WarehouseDetailData,
  WarehouseDetailDrawer,
} from "@/components/inventory/warehouse-detail-drawer";
import {
  type WarehouseEditData,
  WarehouseEditDrawer,
} from "@/components/inventory/warehouse-edit-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import { useOrgSettings } from "@/lib/org-settings-context";
import { createClient } from "@/lib/supabase/client";

const warehouseSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  location: z.string().optional(),
});

type WarehouseValues = z.infer<typeof warehouseSchema>;

type Warehouse = {
  id: string;
  name: string;
  location: string | null;
  is_default: boolean | null;
  created_at: string | null;
};

async function fetchWarehouses(): Promise<Warehouse[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("warehouses")
    .select("id,name,location,is_default,created_at")
    .order("name");
  if (error) capture(error, { context: "[warehouses] fetchWarehouses" });
  return data ?? [];
}

async function createWarehouseAction(
  values: WarehouseValues,
  organizationId: string | null,
) {
  if (!organizationId) throw new Error("Байгууллага олдсонгүй");
  const supabase = createClient();
  const { error } = await supabase.from("warehouses").insert({
    organization_id: organizationId,
    name: values.name,
    location: values.location || null,
  });
  if (error) throw new Error(error.message);
}

export default function WarehousesPage() {
  const queryClient = useQueryClient();
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: warehouses = [], isPending } = useQuery({
    queryKey: ["warehouses"],
    queryFn: fetchWarehouses,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WarehouseValues>({
    resolver: zodResolver(warehouseSchema),
  });

  const { organizationId } = useOrgSettings();
  const createMutation = useMutation({
    mutationFn: (data: WarehouseValues) =>
      createWarehouseAction(data, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      reset();
      setDialogOpen(false);
      toast.success("Агуулах амжилттай нэмэгдлээ.");
    },
    onError: (err) => {
      toast.error(err.message || "Агуулах нэмэхэд алдаа гарлаа.");
    },
  });

  const onSubmit = (data: WarehouseValues) => {
    createMutation.mutate(data);
  };

  function toDetailData(wh: Warehouse): WarehouseDetailData {
    return {
      id: wh.id,
      name: wh.name,
      location: wh.location,
      is_default: wh.is_default,
      created_at: wh.created_at,
    };
  }
  function toEditData(wh: Warehouse): WarehouseEditData {
    return {
      id: wh.id,
      name: wh.name,
      location: wh.location,
    };
  }

  if (warehouses.length === 0 && !isPending) {
    return (
      <PageShell
        title="Агуулахууд"
        description="Олон агуулахын бүртгэл, удирдлага"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger>
              <Button size="sm">
                <Plus data-icon="inline-start" />
                Шинэ агуулах
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Шинэ агуулах</DialogTitle>
                <DialogDescription>
                  Агуулахын нэр, байршлыг оруулна уу.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="name">Нэр</FieldLabel>
                  <Input
                    id="name"
                    placeholder="Үндсэн агуулах"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="location">
                    Байршил{" "}
                    <span className="text-xs text-muted-foreground">
                      (заавал биш)
                    </span>
                  </FieldLabel>
                  <Input
                    id="location"
                    placeholder="1-р давхар, А хэсэг"
                    {...register("location")}
                  />
                </Field>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Хадгалах..." : "Агуулах нэмэх"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      >
        <ErpEmptyState
          icon={<WarehouseIcon className="size-4" />}
          title="Агуулах бүртгэгдээгүй"
          description="Шинэ агуулах нэмж, барааны байршлыг тодорхойлох."
        />
      </PageShell>
    );
  }

  const columns: ColumnDef<Warehouse>[] = [
    {
      accessorKey: "name",
      header: "Нэр",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <WarehouseIcon className="size-4 text-muted-foreground" />
          {row.getValue("name")}
        </div>
      ),
    },
    {
      accessorKey: "location",
      header: "Байршил",
      cell: ({ row }) => {
        const location = row.getValue("location") as string | null;
        return location ? (
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="size-3.5" />
            {location}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "is_default",
      header: "Төлөв",
      cell: ({ row }) =>
        row.getValue("is_default") ? (
          <Badge variant="default">Үндсэн</Badge>
        ) : (
          <Badge variant="outline">Энгийн</Badge>
        ),
    },
    {
      accessorKey: "created_at",
      header: "Үүсгэсэн",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.getValue("created_at")
            ? formatDate(row.getValue("created_at") as string)
            : "-"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        // biome-ignore lint/a11y/noStaticElementInteractions: wrapper only for stopPropagation
        // biome-ignore lint/a11y/useKeyWithClickEvents: wrapper only for stopPropagation; actual interactive element is WarehouseEditDrawer trigger
        <div onClick={(e) => e.stopPropagation()}>
          <WarehouseEditDrawer warehouse={toEditData(row.original)} />
        </div>
      ),
    },
  ];

  return (
    <PageShell
      title="Агуулахууд"
      description="Олон агуулахын бүртгэл, удирдлага"
      actions={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button size="sm">
              <Plus data-icon="inline-start" />
              Шинэ агуулах
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Шинэ агуулах</DialogTitle>
              <DialogDescription>
                Агуулахын нэр, байршлыг оруулна уу.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Field>
                <FieldLabel htmlFor="name">Нэр</FieldLabel>
                <Input
                  id="name"
                  placeholder="Үндсэн агуулах"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="location">
                  Байршил{" "}
                  <span className="text-xs text-muted-foreground">
                    (заавал биш)
                  </span>
                </FieldLabel>
                <Input
                  id="location"
                  placeholder="1-р давхар, А хэсэг"
                  {...register("location")}
                />
              </Field>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Хадгалах..." : "Агуулах нэмэх"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <DataTable
        columns={columns}
        data={warehouses}
        loading={isPending}
        searchColumn="name"
        searchPlaceholder="Хайх..."
        totalLabel="агуулах"
        enableSorting
        enableColumnVisibility
        onRowClick={(wh) => setSelectedWarehouse(wh)}
      />
      <WarehouseDetailDrawer
        warehouse={
          selectedWarehouse
            ? toDetailData(selectedWarehouse)
            : ({} as WarehouseDetailData)
        }
        open={!!selectedWarehouse}
        onOpenChange={(open) => {
          if (!open) setSelectedWarehouse(null);
        }}
      />
    </PageShell>
  );
}
