"use client";

import { Package } from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { useOrgSettings } from "@/lib/org-settings-context";
import { createClient } from "@/lib/supabase/client";

type ValuationRow = {
  product_id: string;
  product_name: string;
  sku: string | null;
  total_quantity: number;
  total_cost: number;
  average_cost: number;
};

export function InventoryValuation() {
  const { organizationId } = useOrgSettings();

  const query = useQuery({
    queryKey: ["reports", "inventory-valuation", organizationId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_inventory_valuation", {
        p_organization_id: organizationId,
      });
      if (error) throw error;

      return (data ?? []) as ValuationRow[];
    },
    enabled: !!organizationId,
  });

  if (query.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const rows = query.data ?? [];
  const totalValue = rows.reduce((sum, r) => sum + Number(r.total_cost), 0);
  const totalItems = rows.reduce((sum, r) => sum + Number(r.total_quantity), 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="overflow-hidden rounded-3xl border-border/80 bg-card/90 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-sm">Нийт үнэлгээ</CardTitle>
            <div className="rounded-2xl bg-primary/10 p-2 text-primary">
              <Package />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-primary">
              {formatCurrency(totalValue)}
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden rounded-3xl border-border/80 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Нийт тоо ширхэг</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {totalItems.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden rounded-3xl border-border/80 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Дундаж өртөг</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {totalItems > 0 ? formatCurrency(totalValue / totalItems) : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail table */}
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">Бүтээгдэхүүн</th>
              <th className="px-3 py-2 text-left font-medium">SKU</th>
              <th className="px-3 py-2 text-right font-medium">Тоо</th>
              <th className="px-3 py-2 text-right font-medium">Нийт өртөг</th>
              <th className="px-3 py-2 text-right font-medium">Дундаж өртөг</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  Бараа материал байхгүй
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.product_id} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-medium">{row.product_name}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">
                    {row.sku ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {Number(row.total_quantity).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {formatCurrency(Number(row.total_cost))}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {formatCurrency(Number(row.average_cost))}
                  </td>
                </tr>
              ))
            )}
            {rows.length > 0 && (
              <tr className="border-t bg-muted/30 font-medium">
                <td colSpan={2} className="px-3 py-2">
                  Нийт
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {totalItems.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {formatCurrency(totalValue)}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {totalItems > 0
                    ? formatCurrency(totalValue / totalItems)
                    : "—"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
