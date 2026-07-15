import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { getDb } from "@/lib/db";
import { formatMnt } from "@/lib/format";
import type { OrderStatus } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const STATUSES: OrderStatus[] = [
  "pending_payment",
  "paid",
  "provisioning",
  "delivered",
  "failed",
  "expired",
  "refunded",
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = STATUSES.includes(status as OrderStatus)
    ? (status as OrderStatus)
    : undefined;
  const orders = await getDb().listOrders({ status: filter, limit: 200 });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Orders</h1>

      <div className="flex flex-wrap gap-1">
        <Link
          href="/admin/orders"
          className={`rounded-full px-3 py-1 text-sm ${!filter ? "bg-primary text-primary-foreground" : "bg-muted"}`}
        >
          all
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`rounded-full px-3 py-1 text-sm ${filter === s ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <Link
                  href={`/admin/orders/${order.order_code}`}
                  className="font-mono font-medium hover:underline"
                >
                  {order.order_code}
                </Link>
              </TableCell>
              <TableCell>{order.status}</TableCell>
              <TableCell className="text-muted-foreground">
                {order.email} · {order.phone}
              </TableCell>
              <TableCell className="text-right">
                {formatMnt(order.total_mnt)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {order.created_at.slice(0, 16).replace("T", " ")}
              </TableCell>
            </TableRow>
          ))}
          {orders.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                No orders
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
