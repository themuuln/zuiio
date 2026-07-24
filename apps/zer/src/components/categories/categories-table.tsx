"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import {
  createCategory,
  deleteCategory,
} from "@/app/(dashboard)/inventory/categories/actions";
import type { CategoryRow } from "@/app/(dashboard)/inventory/categories/page";
import {
  type CategoryDetailData,
  CategoryDetailDrawer,
} from "@/components/categories/category-detail-drawer";
import {
  type CategoryEditData,
  CategoryEditDrawer,
} from "@/components/categories/category-edit-drawer";
import { DataTable } from "@/components/ui/data-table";
import { TableActionsCell } from "@/components/ui/table-actions-cell";
import { useDeleteWithConfirm } from "@/hooks/use-delete-with-confirm";
import { categoryKeys } from "@/lib/query/keys";

const toDetailData = (c: CategoryRow): CategoryDetailData => ({
  id: c.id,
  name: c.name,
  product_count: c.product_count,
});

const toEditData = (c: CategoryRow): CategoryEditData => ({
  id: c.id,
  name: c.name,
});

const columns = (
  onEdit: (category: CategoryRow) => void,
  onDelete: (id: string, name: string) => void,
  deletePending: boolean,
): ColumnDef<CategoryRow>[] => [
  {
    accessorKey: "name",
    header: "Нэр",
    cell: ({ row }) => {
      const cat = row.original;
      return (
        <span className="flex items-center gap-2 font-medium">
          {cat.name}
          {cat.isPreset && (
            <span className="inline-flex items-center rounded-md bg-violet-50 px-1.5 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-700/10 dark:bg-violet-400/10 dark:text-violet-400 dark:ring-violet-400/30">
              Бүрдэл
            </span>
          )}
        </span>
      );
    },
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
    cell: ({ row }) => {
      const cat = row.original;
      return (
        <TableActionsCell
          onEdit={() => onEdit(cat)}
          onDelete={() => onDelete(cat.id, cat.name)}
          isDeletePending={deletePending}
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];

export function CategoriesTable({
  data,
  loading,
}: {
  data: CategoryRow[];
  loading?: boolean;
}) {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<CategoryRow | null>(
    null,
  );
  const [editCategory, setEditCategory] = useState<CategoryRow | null>(null);

  const { handleDelete, isPending: deletePending } = useDeleteWithConfirm({
    mutationFn: async (id: string) => {
      // Preset categories don't exist in DB — just remove from visible list
      if (id.startsWith("preset:")) {
        queryClient.setQueryData(
          categoryKeys.all(),
          (old: CategoryRow[] | undefined) =>
            old?.filter((c) => c.id !== id) ?? [],
        );
        return undefined;
      }
      const formData = new FormData();
      formData.set("id", id);
      const result = await deleteCategory(undefined, formData);
      if (result && "error" in result) throw new Error(result.error);
      return undefined;
    },
    queryKey: categoryKeys.all(),
    entityName: "Ангилал",
  });

  /** Create a preset category in the DB so it becomes a regular editable row */
  const handleEdit = async (category: CategoryRow) => {
    if (category.isPreset) {
      const formData = new FormData();
      formData.append("name", category.name);
      const result = await createCategory(undefined, formData);
      if (result && "error" in result) return;
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all() });
      const cached = queryClient.getQueryData<CategoryRow[]>(
        categoryKeys.all(),
      );
      const dbRow = cached?.find(
        (c) => c.name === category.name && !c.id.startsWith("preset:"),
      );
      if (dbRow) setEditCategory(dbRow);
    } else {
      setEditCategory(category);
    }
  };

  return (
    <>
      <DataTable
        columns={columns(handleEdit, handleDelete, deletePending)}
        data={data}
        searchColumn="name"
        searchPlaceholder="Ангиллаар хайх..."
        pageSize={10}
        totalLabel="ангилал"
        enableSorting
        enableColumnVisibility
        loading={loading}
        onRowClick={(row) => setSelectedCategory(row)}
      />
      <CategoryDetailDrawer
        category={
          selectedCategory
            ? toDetailData(selectedCategory)
            : ({} as CategoryDetailData)
        }
        open={!!selectedCategory}
        onOpenChange={(open) => {
          if (!open) setSelectedCategory(null);
        }}
        onEdit={() => selectedCategory && handleEdit(selectedCategory)}
        onDelete={() =>
          selectedCategory &&
          handleDelete(selectedCategory.id, selectedCategory.name)
        }
        isDeletePending={deletePending}
        nestedDrawerOpen={!!editCategory}
      />
      {editCategory && (
        <CategoryEditDrawer
          category={toEditData(editCategory)}
          open={!!editCategory}
          nested={!!selectedCategory}
          onOpenChange={(open) => {
            if (!open) setEditCategory(null);
          }}
        />
      )}
    </>
  );
}
