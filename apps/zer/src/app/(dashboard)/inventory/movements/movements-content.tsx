"use client";

import { ArrowLeft, ArrowRight, ArrowsClockwise } from "@phosphor-icons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  type MovementDetailData,
  MovementDetailDrawer,
} from "@/components/inventory/movement-detail-drawer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

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

export function MovementsContent({
  movements,
  currentPage,
  totalPages,
  totalCount,
  currentType,
}: {
  movements: MovementRow[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  currentType: string | null;
}) {
  const searchParams = useSearchParams();
  const branch = searchParams.get("branch");
  const [selectedMovement, setSelectedMovement] = useState<MovementRow | null>(
    null,
  );

  function buildHref(
    overrides: Record<string, string | null | undefined>,
  ): string {
    const sp = new URLSearchParams();
    const branchVal =
      overrides.branch !== undefined ? overrides.branch : branch;
    if (branchVal) sp.set("branch", branchVal);
    if (overrides.type) sp.set("type", overrides.type);
    if (overrides.page && overrides.page !== "1")
      sp.set("page", overrides.page);
    const qs = sp.toString();
    return `/inventory/movements${qs ? `?${qs}` : ""}`;
  }

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

  function getPageNumbers(): { id: string; value: number | "ellipsis" }[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => ({
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
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++)
      pages.push({ id: `page-${i}`, value: i });
    if (currentPage < totalPages - 2)
      pages.push({ id: "ellipsis-end", value: "ellipsis" });
    pages.push({ id: `page-${totalPages}`, value: totalPages });
    return pages;
  }

  if (movements.length === 0 && currentPage === 1) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {TYPE_FILTERS.map((f) => (
            <Link
              key={f.value ?? "all"}
              href={buildHref({ type: f.value, page: null })}
              className={cn(
                buttonVariants({
                  variant: currentType === f.value ? "default" : "outline",
                  size: "sm",
                }),
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ArrowsClockwise className="size-4" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">
              Хөдөлгөөн бүртгэгдээгүй байна
            </h3>
            <p className="text-sm text-muted-foreground">
              Шинэ худалдан авалт, борлуулалт эсвэл тооллогын дараах тохируулга
              энд харагдана.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Type filter tabs ── */}
      <div className="flex flex-wrap items-center gap-2">
        {TYPE_FILTERS.map((f) => (
          <Link
            key={f.value ?? "all"}
            href={buildHref({ type: f.value, page: null })}
            className={cn(
              buttonVariants({
                variant: currentType === f.value ? "default" : "outline",
                size: "sm",
              }),
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="relative overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/50">
            <TableRow>
              <TableHead>Огноо</TableHead>
              <TableHead>Бүтээгдэхүүн</TableHead>
              <TableHead>Төрөл</TableHead>
              <TableHead>Тоо хэмжээ</TableHead>
              <TableHead>Өртөг</TableHead>
              <TableHead>Лавлагаа</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((m) => (
              <TableRow
                key={m.id}
                className="cursor-pointer border-b border-border/30 transition-colors even:bg-muted/15 hover:bg-muted/50"
                onClick={() => setSelectedMovement(m)}
              >
                <TableCell className="px-3 py-2.5 text-xs sm:py-3 sm:text-sm">
                  {formatDate(m.created_at)}
                </TableCell>
                <TableCell className="px-3 py-2.5 text-xs font-medium sm:py-3 sm:text-sm">
                  {m.product_name}
                </TableCell>
                <TableCell className="px-3 py-2.5 sm:py-3">
                  <Badge
                    variant={m.type === "out" ? "destructive" : "secondary"}
                  >
                    {MOVEMENT_LABELS[m.type] ?? m.type}
                  </Badge>
                </TableCell>
                <TableCell className="px-3 py-2.5 text-xs sm:py-3 sm:text-sm">
                  {m.quantity} {m.product_unit ?? "ширхэг"}
                </TableCell>
                <TableCell className="px-3 py-2.5 text-xs sm:py-3 sm:text-sm">
                  {formatCurrency(Number(m.unit_cost ?? 0))}
                </TableCell>
                <TableCell className="px-3 py-2.5 text-xs text-muted-foreground sm:py-3 sm:text-sm">
                  {m.reference ?? m.notes ?? (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground sm:text-sm">
          Нийт {totalCount} хөдөлгөөн
        </span>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {currentPage > 1 && (
              <Link
                href={buildHref({
                  page: String(currentPage - 1),
                  type: currentType,
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
                      type: currentType,
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
              {currentPage}/{totalPages}
            </span>

            {currentPage < totalPages && (
              <Link
                href={buildHref({
                  page: String(currentPage + 1),
                  type: currentType,
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
        )}
      </div>

      {/* ── Detail drawer ── */}
      {selectedMovement && (
        <MovementDetailDrawer
          movement={toDetailData(selectedMovement)}
          open={!!selectedMovement}
          onOpenChange={(open) => {
            if (!open) setSelectedMovement(null);
          }}
        />
      )}
    </div>
  );
}
