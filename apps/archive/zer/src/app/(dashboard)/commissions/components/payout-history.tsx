"use client";

import type { PayoutRecord } from "../actions";

export function PayoutHistoryList({
  payouts,
  isLoading,
}: {
  payouts: PayoutRecord[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        Уншиж байна...
      </div>
    );
  }

  if (payouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card/50 py-10 text-center">
        <p className="text-sm text-muted-foreground">Төлөлтийн түүх байхгүй.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Огноо
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Ажилтан
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Дүн
              </th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                Комиссын тоо
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Төлсөн
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Тэмдэглэл
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {payouts.map((payout) => (
              <tr
                key={payout.id}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  {new Date(payout.paid_at).toLocaleDateString("mn-MN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 font-medium">
                  {payout.profile_name ?? "Ажилтан"}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-green-600">
                  {payout.total_amount.toLocaleString()}₮
                </td>
                <td className="px-4 py-3 text-center">{payout.item_count}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {payout.paid_by_name ?? "Тодорхойгүй"}
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                  {payout.notes ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
