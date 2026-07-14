"use client";

import {
  ArrowLeft,
  ArrowRight,
  ArrowsClockwise,
  Plus,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { withDbCapture } from "@zuiio/capture";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { DataTable } from "@/components/ui/data-table";
import { PageShell } from "@/components/erp/page-shell";
import {
  type MovementDetailData,
  MovementDetailDrawer,
} from "@/components/inventory/movement-detail-drawer";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { useBranchContext } from "@/lib/branch-context";
import { withBranchFilter } from "@/lib/branches";
import { formatCurrency, formatDate } from "@/lib/format";
import { useOrgSettings } from "@/lib/org-settings-context";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const VALID_TYPES: Record<string, true> = {
  in: true,
  out: true,
  adjustment: true,
};

const MOVEMENT_LABELS: Record<string, string> = {
  in: "Орлого",
  out: "Зарлага",
  adjustment: "Тохируулга",
};

const TYPE_FILTERS: { label: string; value: string | null }[] = [
  { label: "Бүгд", value: null },
  { label: "Орлого", value: "in" },
  { label: "Зарлага", value: "out" },
  { label: "Тохируулга", value: "adjustment" },
];

export type MovementRow = {
  id: string;
  type: string;
  quantity: number;
  unit_cost: number | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
  product_name: string;
  product_unit: string | null;
  product_sku: string | null;
};

interface QueryResult {
  movements: MovementRow[];
  totalCount: number;
  totalPages: number;
};

const columns: ColumnDef<MovementRow>[] = [
  {
    accessorFn: (row) => row.created_at,
    id: "created_at",
    header: "Огноо",
    cell: ({ row }) => formatDate(row.original.created_at),
  },
  {
    accessorFn: (row) => row.product_name,
    id: "product_name",
    header: "Бүтээгдэхүүн",
    cell: ({ row }) => (
      <span className="text-xs font-medium sm:text-sm">{row.original.product_name}</span>
    ),
  },
  {
    accessorFn: (row) => row.type,
    id: "type",
    header: "Төрөл",
    cell: ({ row }) => (
      <Badge variant={row.original.type === "out" ? "destructive" : "secondary"}>
        {MOVEMENT_LABELS[row.original.type] ?? row.original.type}
      </Badge>
    ),
  },
  {
    accessorFn: (row) => row.quantity,
    id: "quantity",
    header: "Тоо хэмжээ",
    cell: ({ row }) => `${row.original.quantity} ${row.original.product_unit ?? "ширхэг"}`,
  },
  {
    accessorFn: (row) => row.unit_cost ?? 0,
    id: "unit_cost",
    header: "Өртөг",
    cell: ({ row }) => formatCurrency(Number(row.original.unit_cost ?? 0)),
  },
  {
    accessorFn: (row) => row.reference ?? row.notes ?? "",
    id: "reference",
    header: "Лавлагаа",
    cell: ({ row }) =>
      row.original.reference ??
      row.original.notes ?? <span className="text-muted-foreground">-</span>,
  },
];

export function MovementsContent() {
  const searchParams = useSearchParams();
  const urlBranch = searchParams.get("branch") ?? undefined;
  const pageStr = searchParams.get("page");
  const typeFilter = searchParams.get("type");

  const currentPage = Math.max(1, Number(pageStr) || 1);
  const resolvedType =
    typeFilter && VALID_TYPES[typeFilter] ? typeFilter : null;

  const [selectedMovement, setSelectedMovement] = useState<MovementRow | null>(
    null,
  );

  const { organizationId } = useOrgSettings();
  const { selectedBranchId, isBranchScoped } = useBranchContext();

  const query = useQuery({
    queryKey: [
      "stock_movements",
      organizationId,
      urlBranch ?? null,
      currentPage,
      resolvedType,
    ],
    queryFn: async (): Promise<QueryResult> => {
      const supabase = createClient();
      const offset = (currentPage - 1) * PAGE_SIZE;

      let q = supabase
        .from("stock_movements")
        .select(
          "id, type, quantity, unit_cost, reference, notes, created_at, products(name, unit, sku)",
          { count: "exact" },
        )
        .eq("organization_id", organizationId);

      if (resolvedType) {
        q = q.eq("type", resolvedType);
      }

      q = q.order("created_at", { ascending: false });

      const { data: movements, count } = await withDbCapture(
        "page:movements",
        withBranchFilter(q, selectedBranchId, isBranchScoped, urlBranch).range(
          offset,
          offset + PAGE_SIZE - 1,
        ),
      );

      const totalCount = count ?? 0;
      const totalPages = totalCount ? Math.ceil(totalCount / PAGE_SIZE) : 0;

      const tableData: MovementRow[] =
        (movements ?? []).map((m) => ({
          id: m.id,
          type: m.type,
          quantity: m.quantity,
          unit_cost: m.unit_cost,
          reference: m.reference,
          notes: m.notes,
          created_at: m.created_at ?? new Date().toISOString(),
          product_name:
            (
              m.products as {
                name: string;
                unit: string | null;
                sku: string | null;
              } | null
            )?.name ?? "Устсан бүтээгдэхүүн",
          product_unit:
            (
              m.products as {
                name: string;
                unit: string | null;
                sku: string | null;
              } | null
            )?.unit ?? null,
          product_sku:
            (
              m.products as {
                name: string;
                unit: string | null;
                sku: string | null;
              } | null
            )?.sku ?? null,
        })) ?? [];

      return { movements: tableData, totalCount, totalPages };
    },
    enabled: !!organizationId,
  });

  const data = query.data ?? { movements: [], totalCount: 0, totalPages: 0 };
  const isPending = query.isPending || query.isFetching;

  function toDetailData(m: MovementRow): MovementDetailData {
    return {
      id: m.id,
      type: m.type,
      quantity: m.quantity,
      unit_cost: m.unit_cost,
      reference: m.reference,
      notes: m.notes,
      created_at: m.created_at,
      product_name: m.product_name,
      product_unit: m.product_unit,
      product_sku: m.product_sku,
    };
  }

  function buildHref(
    overrides: Record<string, string | null | undefined>,
  ): string {
    const sp = new URLSearchParams();
    const branchVal =
      overrides.branch !== undefined ? overrides.branch : urlBranch;
    if (branchVal) sp.set("branch", branchVal);
    if (overrides.type) sp.set("type", overrides.type);
    if (overrides.page && overrides.page !== "1")
      sp.set("page", overrides.page);
    const qs = sp.toString();
    return `/inventory/movements${qs ? `?${qs}` : ""}`;
  }

  function getPageNumbers(): { id: string; value: number | "ellipsis" }[] {
    if (data.totalPages <= 7) {
      return Array.from({ length: data.totalPages }, (_, i) => ({
        id: `page-${i + 1}`,
        value: i + 1,
      }));
    }
    const pages: { id: string; value: number | "ellipsis" }[] = [
      { id: "page-1", value: 1 },
    ];
    if (currentPage > 3)
      pages.push({ id: "ellipsis-start", value: "ellipsis" });
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(data.totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++)
      pages.push({ id: `page-${i}`, value: i });
    if (currentPage < data.totalPages - 2)
      pages.push({ id: "ellipsis-end", value: "ellipsis" });
    pages.push({ id: `page-${data.totalPages}`, value: data.totalPages });
    return pages;
  }

  return (
    <PageShell
      title="Барааны хөдөлгөөн"
      description="Орлого, зарлага, үлдэгдлийн тохируулгын бүртгэл."
      actions={
        <Button asChild size="sm">
          <Link href="/inventory/movements/new">
            <Plus data-icon="inline-start" />
            Шинэ хөдөлгөөн
          </Link>
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {/* ── Type filter tabs ── */}
        <div className="flex flex-wrap items-center gap-2">
          {TYPE_FILTERS.map((f) => (
            <Link
              key={f.value ?? "all"}
              href={buildHref({ type: f.value, page: null })}
              className={cn(
                buttonVariants({
                  variant: resolvedType === f.value ? "default" : "outline",
                  size: "sm",
                }),
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {/* ── Empty state ── */}
        {!isPending && data.movements.length === 0 && (
          <ErpEmptyState
            icon={<ArrowsClockwise className="size-4" />}
            title="Хөдөлгөөн бүртгэгдээгүй байна"
            description="Шинэ худалдан авалт, борлуулалт эсвэл тооллогын дараах тохируулга энд харагдана."
          />
        )}

        {/* ── Table ── */}
        <DataTable
          columns={columns}
          data={data.movements}
          loading={isPending}
          searchColumn="product_name"
          searchPlaceholder="Бүтээгдэхүүнээр хайх..."
          totalLabel="хөдөлгөөн"
          pageSize={PAGE_SIZE}
          enableSorting
          enableColumnVisibility
          manualPagination
          currentPage={currentPage}
          totalPages={data.totalPages}
          totalCount={data.totalCount}
          onRowClick={(m) => setSelectedMovement(m)}
        />

        {/* ── Pagination ── */}
        {!isPending && data.totalPages > 1 && (
          <div className="flex items-center justify-end gap-3">

            <div className="flex items-center gap-1">
              {currentPage > 1 && (
                <Link
                  href={buildHref({
                    page: String(currentPage - 1),
                    type: resolvedType,
                  })}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "xs" }),
                    "gap-1",
                  )}
                >
                  <ArrowLeft className="size-3.5" />
                  <span className="hidden sm:inline">Өмнөх</span>
                </Link>
              )}

              <div className="hidden items-center gap-1 sm:flex">
                {getPageNumbers().map((p) =>
                  p.value === "ellipsis" ? (
                    <span
                      key={p.id}
                      className="flex size-7 items-center justify-center text-xs text-muted-foreground"
                    >
                      ...
                    </span>
                  ) : (
                    <Link
                      key={p.id}
                      href={buildHref({
                        page: String(p.value),
                        type: resolvedType,
                      })}
                      className={cn(
                        buttonVariants({
                          variant:
                            p.value === currentPage ? "default" : "outline",
                          size: "xs",
                        }),
                        "min-w-7",
                      )}
                    >
                      {p.value}
                    </Link>
                  ),
                )}
              </div>

              <span className="text-xs text-muted-foreground sm:hidden">
                {currentPage}/{data.totalPages}
              </span>

              {currentPage < data.totalPages && (
                <Link
                  href={buildHref({
                    page: String(currentPage + 1),
                    type: resolvedType,
                  })}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "xs" }),
                    "gap-1",
                  )}
                >
                  <span className="hidden sm:inline">Дараах</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── Detail drawer ── */}
        <MovementDetailDrawer
          movement={
            selectedMovement
              ? toDetailData(selectedMovement)
              : ({} as MovementDetailData)
          }
          open={!!selectedMovement}
          onOpenChange={(open) => {
            if (!open) setSelectedMovement(null);
          }}
        />
      </div>
    </PageShell>
  );
}
