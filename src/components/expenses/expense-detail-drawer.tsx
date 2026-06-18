"use client";

import { DrawerLayout } from "@/components/ui/drawer-layout";
import {CalendarBlank, Coins, Note, Tag} from "@phosphor-icons/react";
import { formatCurrency, formatDate } from "@/lib/format";
import { DrawerHeader } from "@/components/ui/drawer-header";
import { InfoRow } from "@/components/ui/info-row";

export type ExpenseDetailData = {
  id: string;
  expense_date: string;
  category: string;
  amount: number;
  description: string | null;
  payment_method: string | null;
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Бэлэн",
  card: "Карт",
  bank_transfer: "Данс",
  invoice: "Нэхэмжлэл",
};

export function ExpenseDetailDrawer({
  expense,
  open,
  onOpenChange,
}: {
  expense: ExpenseDetailData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <DrawerLayout
      open={open}
      onOpenChange={onOpenChange}
    >
              <DrawerHeader title="Зарлагын дэлгэрэнгүй" description={<>{formatDate(expense.expense_date)} • {expense.category}</>} />


              <div className="flex-1 overflow-y-auto min-h-0 space-y-6">
                {/* Amount card */}
                <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">Дүн</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {formatCurrency(expense.amount)}
                  </p>
                </div>

                {/* Info rows */}
                <div className="divide-y rounded-xl border border-border/80 px-4">
                  <InfoRow
                    icon={<CalendarBlank className="size-4" />}
                    label="Огноо"
                    value={formatDate(expense.expense_date)}
                  />
                  <InfoRow
                    icon={<Tag className="size-4" />}
                    label="Ангилал"
                    value={expense.category}
                  />
                  <InfoRow
                    icon={<Coins className="size-4" />}
                    label="Төлбөрийн арга"
                    value={
                      PAYMENT_LABELS[expense.payment_method ?? ""] ??
                      expense.payment_method ??
                      "-"
                    }
                  />
                  {expense.description && (
                    <InfoRow
                      icon={<Note className="size-4" />}
                      label="Тайлбар"
                      value={expense.description}
                    />
                  )}
                </div>
              </div>
    </DrawerLayout>
  );
}
