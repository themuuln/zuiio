import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import { formatMnt } from "@/lib/format";
import { orderAccessToken } from "@/lib/token";
import { OrderActions } from "./_actions-panel";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderCode: string }>;
}) {
  const { orderCode } = await params;
  const db = getDb();
  const detail = await db.getOrderDetail(orderCode);
  if (!detail) notFound();
  const { order, items, esims, payment } = detail;
  const job = await db.getJobByOrderId(order.id);
  const item = items[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-mono text-xl font-bold">{order.order_code}</h1>
        <OrderActions orderCode={order.order_code} status={order.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-1.5 p-4 text-sm">
            <p className="font-medium">Order</p>
            <p>
              Status: <strong>{order.status}</strong>
            </p>
            <p>
              Contact: {order.email} · {order.phone}
            </p>
            <p>Locale: {order.locale}</p>
            <p>Created: {order.created_at}</p>
            <p>Expires: {order.expires_at}</p>
            <p>
              Delivery page:{" "}
              <a
                className="text-primary hover:underline"
                href={`/${order.locale}/orders/${order.order_code}?t=${orderAccessToken(order.order_code)}`}
                target="_blank"
                rel="noreferrer"
              >
                open ↗
              </a>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1.5 p-4 text-sm">
            <p className="font-medium">Pricing snapshot</p>
            {item ? (
              <>
                <p>
                  {item.package_name} × {item.quantity}
                </p>
                <p>
                  Cost: ${Number(item.cost_usd).toFixed(2)} × FX{" "}
                  {Number(item.fx_rate).toFixed(2)} ={" "}
                  {formatMnt(item.unit_cost_mnt)}
                </p>
                <p>
                  Markup: {Number(item.markup_percent).toFixed(1)}%
                  {item.min_margin_applied ? " (min-margin floor applied)" : ""}
                </p>
                <p>
                  Retail: <strong>{formatMnt(item.unit_retail_mnt)}</strong>
                </p>
                <p>
                  Margin: {formatMnt(item.unit_retail_mnt - item.unit_cost_mnt)}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">No items</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1.5 p-4 text-sm">
            <p className="font-medium">Payment</p>
            {payment ? (
              <>
                <p>
                  Status: <strong>{payment.status}</strong>
                </p>
                <p>Invoice: {payment.invoice_id}</p>
                <p>Amount: {formatMnt(payment.amount_mnt)}</p>
                <p>Paid at: {payment.paid_at ?? "—"}</p>
              </>
            ) : (
              <p className="text-muted-foreground">No payment</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1.5 p-4 text-sm">
            <p className="font-medium">Provisioning job</p>
            {job ? (
              <>
                <p>
                  Status: <strong>{job.status}</strong>
                </p>
                <p>
                  Attempts: {job.attempts}/{job.max_attempts}
                </p>
                <p>Next retry: {job.next_retry_at}</p>
                {job.last_error && (
                  <p className="text-destructive">Error: {job.last_error}</p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">No job</p>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="mt-2 font-medium">eSIMs</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {esims.map((esim) => (
          <Card key={esim.id}>
            <CardContent className="flex flex-col gap-1.5 p-4 text-sm">
              <p>
                Status: <strong>{esim.status}</strong>
              </p>
              <p>ICCID: {esim.iccid ?? "—"}</p>
              <p className="break-all">LPA: {esim.lpa_string ?? "—"}</p>
              <p>Provider id: {esim.provider_esim_id ?? "—"}</p>
              <p>Provider order: {esim.provider_order_id ?? "—"}</p>
              <p>Delivered: {esim.delivered_at ?? "—"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
