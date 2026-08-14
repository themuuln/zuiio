import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/server";
import { type OrderDetail, OrderDetailClient } from "./order-detail-client";

export const metadata: Metadata = {
  title: "Захиалгын дэлгэрэнгүй",
  robots: { index: false, follow: true },
};

/**
 * `get_public_order(p_slug, p_order_id)` returns the signed-in buyer's own
 * order as `{ order: OrderDetail }`. Ownership is enforced server-side
 * (auth.uid() = store_account_id) — anything else returns null.
 */
type GetPublicOrderResult = {
  order: OrderDetail;
};

export default async function StoreAccountOrderDetailPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>;
}) {
  const { slug, orderId } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <OrderDetailFetcher slug={slug} orderId={orderId} />
    </Suspense>
  );
}

async function OrderDetailFetcher({
  slug,
  orderId,
}: {
  slug: string;
  orderId: string;
}) {
  const supabase = await createClient();
  const result = (await supabase.rpc(
    "get_public_order" as never,
    { p_slug: slug, p_order_id: orderId } as never,
  )) as {
    data: GetPublicOrderResult | null;
    error: { message: string } | null;
  };

  if (result.error || !result.data?.order) {
    notFound();
  }

  return <OrderDetailClient slug={slug} order={result.data.order} />;
}
