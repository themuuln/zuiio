"use client";

import { ChatCircleText, Star, StarHalf } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useTransition } from "react";
import { toast } from "sonner";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { formatDate } from "@/lib/format";
import { actionsColumn } from "@/lib/table-columns";
import { deleteReview, moderateReview, type ReviewStatus } from "./actions";
import type { ReviewRow } from "./page";

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "Хүлээгдэж буй",
  approved: "Батлагдсан",
  rejected: "Татгалзсан",
};

const STATUS_VARIANTS: Record<
  ReviewStatus,
  "secondary" | "default" | "outline"
> = {
  pending: "secondary",
  approved: "default",
  rejected: "outline",
};

const STAR_IDS = [0, 1, 2, 3, 4];

function RatingStars({ rating }: { rating: number }) {
  return (
    <span
      role="img"
      className="inline-flex items-center gap-0.5 text-amber-500"
      aria-label={`${rating} од`}
    >
      {STAR_IDS.map((id) => {
        const filled = id + 1 <= Math.round(rating);
        return filled ? (
          <Star key={id} weight="fill" className="size-3.5" />
        ) : (
          <StarHalf key={id} className="size-3.5 opacity-40" />
        );
      })}
    </span>
  );
}

export function ReviewsContent({ reviews }: { reviews: ReviewRow[] }) {
  const [isPending, startTransition] = useTransition();

  const runModeration = (id: string, status: ReviewStatus) => {
    startTransition(async () => {
      const result = await moderateReview(id, status);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Сэтгэгдлийн төлөв шинэчлэгдсэн.");
    });
  };

  const runDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteReview(id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Сэтгэгдэл устгагдсан.");
    });
  };

  if (reviews.length === 0) {
    return (
      <PageShell
        title="Сэтгэгдэл"
        description="Бүтээгдэхүүний сэтгэгдлийг батлах, удирдах"
      >
        <ErpEmptyState
          icon={<ChatCircleText className="size-4" />}
          title="Сэтгэгдэл байхгүй"
          description="Харилцагчдаас ирсэн сэтгэгдэл энд харагдана."
        />
      </PageShell>
    );
  }

  const columns: ColumnDef<ReviewRow>[] = [
    {
      accessorKey: "customer_name",
      header: "Харилцагч",
    },
    {
      accessorKey: "product_name",
      header: "Бүтээгдэхүүн",
    },
    {
      accessorKey: "rating",
      header: "Үнэлгээ",
      cell: ({ row }) => <RatingStars rating={row.original.rating} />,
    },
    {
      accessorKey: "comment",
      header: "Сэтгэгдэл",
      cell: ({ row }) => (
        <span className="line-clamp-2 max-w-xs text-muted-foreground text-sm">
          {row.original.comment}
        </span>
      ),
    },
    {
      accessorFn: (row) => STATUS_LABELS[row.status],
      id: "status",
      header: "Төлөв",
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANTS[row.original.status]}>
          {STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      id: "created_at",
      header: "Илгээсэн",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    actionsColumn("", (row) => (
      <div className="flex items-center gap-1">
        {row.status === "pending" && (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={(e) => {
                e.stopPropagation();
                runModeration(row.id, "approved");
              }}
            >
              Батлах
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={(e) => {
                e.stopPropagation();
                runModeration(row.id, "rejected");
              }}
            >
              Татгалзах
            </Button>
          </>
        )}
        {row.status === "rejected" && (
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={(e) => {
              e.stopPropagation();
              runModeration(row.id, "approved");
            }}
          >
            Батлах
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          disabled={isPending}
          onClick={(e) => {
            e.stopPropagation();
            runDelete(row.id);
          }}
        >
          Устгах
        </Button>
      </div>
    )),
  ];

  return (
    <PageShell
      title="Сэтгэгдэл"
      description="Бүтээгдэхүүний сэтгэгдлийг батлах, удирдах"
    >
      <DataTable
        columns={columns}
        data={reviews}
        searchColumn="customer_name"
        searchPlaceholder="Хайх..."
        pageSize={10}
        totalLabel="сэтгэгдэл"
        enableSorting
        enableColumnVisibility
      />
    </PageShell>
  );
}
