"use client";

import { Factory } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bomKeys } from "@/lib/query/keys";
import { actionsColumn, dateColumn, textColumn } from "@/lib/table-columns";
import type { BomListItem } from "./bom-actions";
import { listBoms } from "./bom-actions";
import { BomCreateDrawer } from "./bom-create-drawer";
import { type BomDetailData, BomDetailDrawer } from "./bom-detail-drawer";
import { type BomEditData, BomEditDrawer } from "./bom-edit-drawer";

const STATUS_LABELS: Record<string, string> = {
  draft: "Ноорог",
  active: "Идэвхтэй",
  retired: "Хуучирсан",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive"> =
  {
    draft: "secondary",
    active: "default",
    retired: "destructive",
  };

function toEditData(b: BomListItem): BomEditData {
  return {
    id: b.id,
    name: b.name,
  };
}

export function BomContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(
    searchParams.get("create") === "true",
  );
  const [selectedBom, setSelectedBom] = useState<BomListItem | null>(null);
  const [editBom, setEditBom] = useState<BomEditData | null>(null);
  const [_detailBom, _setDetailBom] = useState<BomDetailData | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const initialCreateRef = useRef(createOpen);

  useEffect(() => {
    if (initialCreateRef.current) {
      window.history.replaceState({}, "", "/bom");
    }
  }, []);

  const { data: boms = [], isPending } = useQuery({
    queryKey: bomKeys.all(),
    queryFn: async () => {
      const result = await listBoms();
      if ("data" in result) return result.data;
      throw new Error(result.error);
    },
  });

  const filteredBoms =
    statusFilter === "all"
      ? boms
      : boms.filter((b) => b.status === statusFilter);

  function handleRowClick(row: BomListItem) {
    setSelectedBom(row);
  }

  function handleEdit(b: BomListItem) {
    setEditBom(toEditData(b));
  }

  function handleView(b: BomListItem) {
    setSelectedBom(b);
  }

  function handleActivate(b: BomListItem) {
    setSelectedBom(b);
  }

  function handleDelete(b: BomListItem) {
    setSelectedBom(b);
  }

  if (isPending) {
    return (
      <PageShell
        title="Бүтээгдэхүүний бүрэлдэхүүн (BOM)"
        description="Үйлдвэрлэлийн бүтээгдэхүүний бүрэлдэхүүн жагсаалт"
      >
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list, never reorders
              key={i}
              className="h-12 w-full animate-pulse rounded bg-muted"
            />
          ))}
        </div>
      </PageShell>
    );
  }

  if (boms.length === 0) {
    return (
      <PageShell
        title="Бүтээгдэхүүний бүрэлдэхүүн (BOM)"
        description="Үйлдвэрлэлийн бүтээгдэхүүний бүрэлдэхүүн жагсаалт"
      >
        <ErpEmptyState
          icon={<Factory className="size-4" />}
          title="BOM байхгүй"
          description="Шинэ бүтээгдэхүүний бүрэлдэхүүн үүсгэнэ үү."
          action={
            <BomCreateDrawer open={createOpen} onOpenChange={setCreateOpen} />
          }
        />
      </PageShell>
    );
  }

  const columns: ColumnDef<BomListItem>[] = [
    textColumn("name", "Нэр"),
    textColumn("product_name", "Бүтээгдэхүүн"),
    {
      accessorKey: "version",
      header: "Хувилбар",
      cell: ({ row }) => `v${row.original.version}`,
    },
    {
      accessorKey: "status",
      header: "Төлөв",
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANTS[row.original.status] ?? "secondary"}>
          {STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    dateColumn("created_at", "Үүсгэсэн"),
    actionsColumn("Үйлдэл", (row) => (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleView(row)}
          aria-label={`${row.name} харах`}
        >
          Харах
        </Button>
        {row.status === "draft" && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(row)}
              aria-label={`${row.name} засах`}
            >
              Засах
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleActivate(row)}
              aria-label={`${row.name} идэвхжүүлэх`}
            >
              Идэвхжүүлэх
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row)}
              aria-label={`${row.name} устгах`}
            >
              Устгах
            </Button>
          </>
        )}
      </div>
    )),
  ];

  return (
    <>
      <PageShell
        title="Бүтээгдэхүүний бүрэлдэхүүн (BOM)"
        description="Үйлдвэрлэлийн бүтээгдэхүүний бүрэлдэхүүн жагсаалт"
        actions={
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]" aria-label="Төлөвөөр шүүх">
                <SelectValue placeholder="Бүх төлөв" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Бүх төлөв</SelectItem>
                <SelectItem value="draft">Ноорог</SelectItem>
                <SelectItem value="active">Идэвхтэй</SelectItem>
                <SelectItem value="retired">Хуучирсан</SelectItem>
              </SelectContent>
            </Select>
            <BomCreateDrawer open={createOpen} onOpenChange={setCreateOpen} />
          </div>
        }
      >
        <DataTable
          columns={columns}
          data={filteredBoms}
          searchColumn="name"
          searchPlaceholder="BOM хайх..."
          pageSize={10}
          totalLabel="BOM"
          enableSorting
          enableColumnVisibility
          onRowClick={handleRowClick}
        />
      </PageShell>

      {selectedBom && (
        <BomDetailDrawer
          bomId={selectedBom.id}
          open={!!selectedBom}
          onOpenChange={(open) => {
            if (!open) setSelectedBom(null);
          }}
          onEdit={(b) => {
            setSelectedBom(null);
            setEditBom(b);
          }}
          onRefresh={() =>
            queryClient.invalidateQueries({ queryKey: bomKeys.all() })
          }
        />
      )}

      {editBom && (
        <BomEditDrawer
          bom={editBom}
          open={!!editBom}
          onOpenChange={(open) => {
            if (!open) setEditBom(null);
          }}
        />
      )}

      <BomCreateDrawer open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
