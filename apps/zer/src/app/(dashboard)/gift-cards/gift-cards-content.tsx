"use client";

import { Gift } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import {
  GiftCardCreateDrawer,
  type GiftCardDetailData,
  GiftCardDetailDrawer,
} from "@/components/gift-cards";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { GiftCardRow } from "./page";

function toDetailData(d: GiftCardRow): GiftCardDetailData {
  return {
    id: d.id,
    code: d.code,
    initial_balance: d.initial_balance,
    current_balance: d.current_balance,
    currency_code: "MNT",
    recipient_name: d.recipient_name,
    recipient_email: null,
    sender_name: null,
    message: null,
    expires_at: d.expires_at,
    is_active: d.is_active,
    issued_at: d.issued_at,
    created_at: d.issued_at,
    transactions: [],
  };
}

export function GiftCardsContent({ giftCards }: { giftCards: GiftCardRow[] }) {
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(
    searchParams.get("create") === "true",
  );
  const [selectedCard, setSelectedCard] = useState<GiftCardRow | null>(null);
  const initialCreateRef = useRef(createOpen);

  useEffect(() => {
    if (initialCreateRef.current) {
      window.history.replaceState({}, "", "/gift-cards");
    }
  }, []);

  if (giftCards.length === 0) {
    return (
      <PageShell title="Бэлгийн карт" description="Бэлгийн картуудын жагсаалт">
        <ErpEmptyState
          icon={<Gift className="size-4" />}
          title="Бэлгийн карт байхгүй"
          description="Шинэ бэлгийн карт үүсгээрэй."
          action={
            <GiftCardCreateDrawer
              open={createOpen}
              onOpenChange={setCreateOpen}
            />
          }
        />
      </PageShell>
    );
  }

  const columns: ColumnDef<GiftCardRow>[] = [
    {
      accessorKey: "code",
      header: "Код",
    },
    {
      accessorKey: "current_balance",
      header: "Үлдэгдэл",
      cell: ({ row }) => {
        const balance = row.original.current_balance;
        return (
          <span
            className={cn(
              "font-medium tabular-nums",
              balance > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground",
            )}
          >
            {formatCurrency(balance)}
          </span>
        );
      },
    },
    {
      accessorKey: "initial_balance",
      header: "Анхны дүн",
      cell: ({ row }) => formatCurrency(row.original.initial_balance),
    },
    {
      id: "is_active",
      accessorFn: (row) => (row.is_active ? "Идэвхтэй" : "Идэвхгүй"),
      header: "Төлөв",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "Идэвхтэй" : "Идэвхгүй"}
        </Badge>
      ),
    },
    {
      accessorKey: "recipient_name",
      header: "Хүлээн авагч",
      cell: ({ row }) => row.original.recipient_name ?? "-",
    },
    {
      id: "expires_at",
      header: "Хугацаа",
      cell: ({ row }) => {
        const date = row.original.expires_at;
        if (!date)
          return <span className="text-muted-foreground">Тодорхойгүй</span>;
        return (
          <span
            className={cn(
              new Date(date) < new Date() ? "text-destructive" : undefined,
            )}
          >
            {formatDate(date)}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <PageShell
        title="Бэлгийн карт"
        description="Бэлгийн картуудын жагсаалт"
        actions={
          <GiftCardCreateDrawer
            open={createOpen}
            onOpenChange={setCreateOpen}
          />
        }
      >
        <DataTable
          columns={columns}
          data={giftCards}
          searchColumn="code"
          searchPlaceholder="Хайх..."
          pageSize={10}
          totalLabel="бэлгийн карт"
          enableSorting
          enableColumnVisibility
          onRowClick={(row) => setSelectedCard(row)}
        />
      </PageShell>
      <GiftCardDetailDrawer
        giftCard={selectedCard ? toDetailData(selectedCard) : null}
        open={!!selectedCard}
        onOpenChange={(open) => {
          if (!open) setSelectedCard(null);
        }}
      />
    </>
  );
}
