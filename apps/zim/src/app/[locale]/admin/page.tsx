import { Card, CardContent } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import { formatMnt } from "@/lib/format";

export const dynamic = "force-dynamic";

async function periodStats(days: number) {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const items = await getDb().listOrderItemsSince(since);
  const revenue = items.reduce(
    (sum, i) => sum + i.unit_retail_mnt * i.quantity,
    0,
  );
  const cost = items.reduce((sum, i) => sum + i.unit_cost_mnt * i.quantity, 0);
  return { orders: items.length, revenue, cost, margin: revenue - cost };
}

export default async function AdminDashboardPage() {
  const db = getDb();
  const [today, week, month, allOrders] = await Promise.all([
    periodStats(1),
    periodStats(7),
    periodStats(30),
    db.listOrders({ limit: 500 }),
  ]);

  const byStatus = new Map<string, number>();
  for (const order of allOrders) {
    byStatus.set(order.status, (byStatus.get(order.status) ?? 0) + 1);
  }
  const failedCount =
    (byStatus.get("failed") ?? 0) + (byStatus.get("partially_failed") ?? 0);

  const periods = [
    { label: "Today", stats: today },
    { label: "7 days", stats: week },
    { label: "30 days", stats: month },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {periods.map(({ label, stats }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-bold">
                {formatMnt(stats.revenue)}
              </p>
              <p className="text-sm text-muted-foreground">
                {stats.orders} sales · margin{" "}
                <span className="font-medium text-foreground">
                  {formatMnt(stats.margin)}
                </span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {failedCount > 0 && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          ⚠️ {failedCount} failed order{failedCount > 1 ? "s" : ""} need
          attention (retry or refund from Orders)
        </p>
      )}

      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-medium">Orders by status</p>
          <div className="flex flex-wrap gap-2">
            {[...byStatus.entries()].map(([status, count]) => (
              <span
                key={status}
                className="rounded-full bg-muted px-3 py-1 text-sm"
              >
                {status}: <strong>{count}</strong>
              </span>
            ))}
            {byStatus.size === 0 && (
              <p className="text-sm text-muted-foreground">No orders yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
