"use client";

import { NotePencil, Trash } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteCategory } from "@/app/(dashboard)/inventory/categories/actions";
import type { CategoryRow } from "@/app/(dashboard)/inventory/categories/page";
import {
  type CategoryEditData,
  CategoryEditDrawer,
} from "@/components/categories/category-edit-drawer";
import { Button, buttonVariants } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { categoryKeys } from "@/lib/query/keys";

function toEditData(category: CategoryRow): CategoryEditData {
  return {
    id: category.id,
    name: category.name,
  };
}

function ActionsCell({ row }: { row: { original: CategoryRow } }) {
  const category = row.original;
  const router = useRouter();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await deleteCategory(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: categoryKeys.all() });
    },
    onSuccess: () => {
      router.refresh();
      toast.success("Ангилал амжилттай устгагдлаа.");
    },
    onError: (err) => {
      toast.error(err.message || "Ангилал устгахад алдаа гарлаа.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all() });
    },
  });

  const handleDelete = () => {
    if (deleteMutation.isPending) return;
    const confirmed = window.confirm(
      `"${category.name}" ангиллыг устгахдаа итгэлтэй байна уу?`,
    );
    if (!confirmed) return;
    const formData = new FormData();
    formData.set("id", category.id);
    deleteMutation.mutate(formData);
  };

  return (
    <div className="flex items-center gap-1">
      <CategoryEditDrawer category={toEditData(category)}>
        <Button variant="ghost" size="icon-xs">
          <NotePencil className="size-3.5" />
        </Button>
      </CategoryEditDrawer>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleteMutation.isPending}
        className={buttonVariants({ variant: "ghost", size: "icon-xs" })}
        title="Устгах"
      >
        <Trash className="size-3.5" />
      </button>
    </div>
  );
}

const defaultColumns: ColumnDef<CategoryRow>[] = [
  {
    accessorKey: "name",
    header: "Нэр",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "product_count",
    header: "Бүтээгдэхүүний тоо",
    cell: ({ row }) => {
      const count = row.getValue("product_count") as number;
      return <span>{count}</span>;
    },
  },
  {
    id: "actions",
    header: "",
    cell: ActionsCell,
    enableSorting: false,
    enableHiding: false,
  },
];

export function CategoriesTable({ data }: { data: CategoryRow[] }) {
  return (
    <DataTable
      columns={defaultColumns}
      data={data}
      searchColumn="name"
      searchPlaceholder="Ангиллаар хайх..."
      pageSize={10}
      totalLabel="ангилал"
    />
  );
}
