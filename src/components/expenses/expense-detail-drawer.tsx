"use client";

import { Drawer } from "@base-ui/react/drawer";
import { CalendarBlank, Coins, Note, Tag, X } from "@phosphor-icons/react";
import { formatCurrency, formatDate } from "@/lib/format";

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
    <Drawer.Root swipeDirection="right" open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop className="[--backdrop-opacity:0.1] z-40 [--bleed:3rem] dark:[--backdrop-opacity:0.4] fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:absolute" />
        <Drawer.Viewport className="[--viewport-padding:0px] z-50 supports-[-webkit-touch-callout:none]:[--viewport-padding:0.625rem] fixed inset-0 flex items-stretch justify-end p-(--viewport-padding)">
          <Drawer.Popup className="[--bleed:3rem] supports-[-webkit-touch-callout:none]:[--bleed:0px] h-full w-[calc(28rem+3rem)] max-w-[calc(100vw-3rem+3rem)] -mr-[3rem] border-l border-border bg-white p-6 pr-[calc(1.5rem+3rem)] text-foreground outline-none shadow-lg overflow-y-auto overscroll-contain touch-auto [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-ending-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-starting-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:mr-0 supports-[-webkit-touch-callout:none]:w-[28rem] supports-[-webkit-touch-callout:none]:max-w-[calc(100vw-3rem)] supports-[-webkit-touch-callout:none]:border supports-[-webkit-touch-callout:none]:pr-6 dark:bg-popover dark:text-popover-foreground dark:shadow-none">
            <Drawer.Content className="mx-auto w-full">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <Drawer.Title className="text-lg font-semibold tracking-tight">
                    Зарлагын дэлгэрэнгүй
                  </Drawer.Title>
                  <Drawer.Description className="text-sm text-muted-foreground">
                    {formatDate(expense.expense_date)} • {expense.category}
                  </Drawer.Description>
                </div>
                <Drawer.Close className="flex size-8 items-center justify-center rounded-none border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-foreground">
                  <X className="size-4" />
                </Drawer.Close>
              </div>

              <div className="space-y-6">
                {/* Amount card */}
                <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">Дүн</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {formatCurrency(expense.amount)}
                  </p>
                </div>

                {/* Info rows */}
                <div className="divide-y rounded-xl border border-border/80">
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
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
