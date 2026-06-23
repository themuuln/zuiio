"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { deleteCategory } from "@/app/(dashboard)/inventory/categories/actions";
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
import { categoryKeys } from "@/lib/query/keys";
import { useDeleteWithConfirm } from "@/hooks/use-delete-with-confirm";

function toDetailData(category: CategoryRow): CategoryDetailData {
  return {
    id: category.id,
    name: category.name,
    product_count: category.product_count,
  };
}

function toEditData(category: CategoryRow): CategoryEditData {
  return {
    id: category.id,
    name: category.name,
  };
}

const columns = (
  onEdit: (category: CategoryRow) => void,
  onDelete: (id: string, name: string) => void,
  deletePending: boolean,
): ColumnDef<CategoryRow>[] => [
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

export function CategoriesTable({ data }: { data: CategoryRow[] }) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryRow | null>(
    null,
  );
  const [editCategory, setEditCategory] = useState<CategoryRow | null>(null);

  const { handleDelete, isPending: deletePending } = useDeleteWithConfirm({
    mutationFn: async (id: string) => {
      const formData = new FormData();
      formData.set("id", id);
      const result = await deleteCategory(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    queryKey: categoryKeys.all(),
    entityName: "Ангилал",
  });

  return (
    <>
      <DataTable
        columns={columns(setEditCategory, handleDelete, deletePending)}
        data={data}
        searchColumn="name"
        searchPlaceholder="Ангиллаар хайх..."
        pageSize={10}
        totalLabel="ангилал"
        enableSorting
        enableColumnVisibility
        onRowClick={(row) => setSelectedCategory(row)}
      />
      {selectedCategory && (
        <CategoryDetailDrawer
          category={toDetailData(selectedCategory)}
          open={!!selectedCategory}
          onOpenChange={(open) => {
            if (!open) setSelectedCategory(null);
          }}
          onEdit={() => setEditCategory(selectedCategory)}
          onDelete={() =>
            handleDelete(selectedCategory.id, selectedCategory.name)
          }
          isDeletePending={deletePending}
        />
      )}
      {editCategory && (
        <CategoryEditDrawer
          category={toEditData(editCategory)}
          open={!!editCategory}
          onOpenChange={(open) => {
            if (!open) setEditCategory(null);
          }}
        />
      )}
    </>
  );
}
