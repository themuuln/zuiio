"use client";

import {
  CalendarBlank,
  CreditCard,
  Envelope,
  User,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { InfoRow } from "@/components/ui/info-row";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  issuance: "Олгосон",
  topup: "Дүүргэлт",
  redemption: "Ашигласан",
  expiry: "Дууссан",
  adjustment: "Тохируулга",
};

const TRANSACTION_TYPE_COLORS: Record<string, string> = {
  issuance: "text-green-600",
  topup: "text-blue-600",
  redemption: "text-red-600",
  expiry: "text-muted-foreground",
  adjustment: "text-amber-600",
};

export interface GiftCardTransactionData {
  id: string;
  transaction_type:
    | "issuance"
    | "topup"
    | "redemption"
    | "expiry"
    | "adjustment";
  amount: number;
  balance_before: number;
  balance_after: number;
  reference_type: string | null;
  note: string | null;
  created_at: string;
}

export interface GiftCardDetailData {
  id: string;
  code: string;
  initial_balance: number;
  current_balance: number;
  currency_code: string;
  recipient_name: string | null;
  recipient_email: string | null;
  sender_name: string | null;
  message: string | null;
  expires_at: string | null;
  is_active: boolean;
  issued_at: string;
  created_at: string;
  transactions: GiftCardTransactionData[];
}

export function GiftCardDetailDrawer({
  giftCard,
  open,
  onOpenChange,
}: {
  giftCard: GiftCardDetailData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!giftCard) return null;

  const isExpired =
    giftCard.expires_at && new Date(giftCard.expires_at) < new Date();

  return (
    <DrawerLayout
      open={open}
      onOpenChange={onOpenChange}
      title={giftCard.code}
      description="Бэлгийн картын дэлгэрэнгүй мэдээлэл"
    >
      <div className="space-y-6">
        {/* Status badges */}
        <div className="flex items-center gap-2">
          <Badge variant={giftCard.is_active ? "default" : "secondary"}>
            {giftCard.is_active ? "Идэвхтэй" : "Идэвхгүй"}
          </Badge>
          {isExpired && (
            <Badge
              variant="outline"
              className="text-destructive border-destructive/50"
            >
              Хугацаа дууссан
            </Badge>
          )}
        </div>

        {/* Balance card */}
        <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
          <p className="text-xs text-muted-foreground">Үлдэгдэл</p>
          <p
            className={cn(
              "mt-1 text-2xl font-semibold",
              giftCard.current_balance > 0 ? "text-green-600" : "text-red-600",
            )}
          >
            {formatCurrency(giftCard.current_balance)}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Анхны: {formatCurrency(giftCard.initial_balance)} &middot;{" "}
            {giftCard.currency_code}
          </p>
        </div>

        {/* Info rows */}
        <div className="divide-y rounded-xl border border-border/80">
          <InfoRow
            icon={<CreditCard className="size-4" />}
            label="Код"
            value={
              <span className="font-mono font-medium">{giftCard.code}</span>
            }
          />
          <InfoRow
            icon={<User className="size-4" />}
            label="Хүлээн авагч"
            value={giftCard.recipient_name ?? "-"}
          />
          {giftCard.recipient_email && (
            <InfoRow
              icon={<Envelope className="size-4" />}
              label="И-мэйл"
              value={giftCard.recipient_email}
            />
          )}
          {giftCard.sender_name && (
            <InfoRow
              icon={<User className="size-4" />}
              label="Илгээгч"
              value={giftCard.sender_name}
            />
          )}
          {giftCard.message && (
            <div className="px-4 py-3 text-sm">
              <span className="mb-1 block text-muted-foreground">Мэдээлэл</span>
              <span className="font-medium">{giftCard.message}</span>
            </div>
          )}
          <InfoRow
            icon={<CalendarBlank className="size-4" />}
            label="Олгосон огноо"
            value={formatDate(giftCard.issued_at ?? giftCard.created_at)}
          />
          <InfoRow
            icon={<CalendarBlank className="size-4" />}
            label="Дуусах огноо"
            value={
              giftCard.expires_at
                ? formatDate(giftCard.expires_at)
                : "Тодорхойгүй"
            }
          />
        </div>

        {/* Transactions */}
        {giftCard.transactions.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-medium text-muted-foreground">
              Гүйлгээний түүх
            </h4>
            <div className="divide-y rounded-xl border border-border/80">
              {giftCard.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      {TRANSACTION_TYPE_LABELS[tx.transaction_type] ??
                        tx.transaction_type}
                    </span>
                    {tx.note && (
                      <span className="text-xs text-muted-foreground">
                        {tx.note}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(tx.created_at)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        TRANSACTION_TYPE_COLORS[tx.transaction_type],
                      )}
                    >
                      {tx.transaction_type === "redemption" ? "-" : "+"}
                      {formatCurrency(tx.amount)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(tx.balance_before)} →{" "}
                      {formatCurrency(tx.balance_after)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {giftCard.transactions.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            Гүйлгээ байхгүй байна.
          </p>
        )}
      </div>
    </DrawerLayout>
  );
}
