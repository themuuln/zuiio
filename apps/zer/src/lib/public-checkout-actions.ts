"use server";

import { capture } from "@zuiio/capture";
import { createClient } from "@/lib/supabase/server";

export type StoreOrderItemInput = {
  product_id: string;
  quantity: number;
  variant_id?: string | null;
};

export type SubmitStoreOrderInput = {
  /** Store slug (organization public slug). */
  slug: string;
  items: StoreOrderItemInput[];
  paymentMethod?: "cash" | "card" | "qpay" | "bank_transfer" | "bnpl";
  currencyCode?: string;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  deliveryType?: "delivery" | "pickup" | null;
  address?: string | null;
  addressNote?: string | null;
  couponCode?: string | null;
  giftCardCode?: string | null;
  pickupBranchSlug?: string | null;
  branchSlug?: string | null;
  idempotencyKey?: string | null;
  /** Loyalty points to redeem against this order (0/none = no redemption). */
  redeemPoints?: number;
};

export type SubmitStoreOrderResult =
  | {
      ok: true;
      orderId: string;
      totalAmount: number;
      status: string;
      deliveryFee: number | null;
      discountAmount: number | null;
      giftCardAmount: number | null;
      pointsDiscount: number | null;
      pointsRedeemed: number | null;
      pointsEarned: number | null;
      paymentInstructions: {
        bank_name?: string | null;
        bank_account?: string | null;
        account_name?: string | null;
        qpay_qr_url?: string | null;
      } | null;
    }
  | { ok: false; message: string };

/**
 * Checkout seam that runs on the server: submits the order through the
 * public `submit_shop_order` RPC with the caller's session (so signed-in
 * buyers stay linked via auth.uid() → store_account_id).
 *
 * The buyer confirmation email is NOT sent here — it fires from the
 * sales AFTER INSERT trigger (trg_sale_notify_online_order) → pg_net →
 * /api/notify/order-confirmation, which is the single path for every
 * client (web server action, mobile RPC, chat order) and dedupes via
 * order_notifications.
 */
export async function submitStoreOrder(
  input: SubmitStoreOrderInput,
): Promise<SubmitStoreOrderResult> {
  const supabase = await createClient();

  let result: { data: unknown; error: { message: string } | null };
  try {
    result = await supabase.rpc("submit_shop_order", {
      p_org_slug: input.slug,
      p_items: input.items,
      p_payment_method: input.paymentMethod ?? "cash",
      p_currency_code: input.currencyCode ?? "MNT",
      p_contact_name: input.contactName ?? undefined,
      p_contact_phone: input.contactPhone ?? undefined,
      p_branch_slug: input.branchSlug ?? undefined,
      p_idempotency_key: input.idempotencyKey ?? undefined,
      p_delivery_type: input.deliveryType ?? undefined,
      p_address: input.address ?? undefined,
      p_address_note: input.addressNote ?? undefined,
      p_contact_email: input.contactEmail ?? undefined,
      p_coupon_code: input.couponCode ?? undefined,
      p_gift_card_code: input.giftCardCode ?? undefined,
      p_pickup_branch_slug: input.pickupBranchSlug ?? undefined,
      p_redeem_points: input.redeemPoints ?? undefined,
    } as never);
  } catch (err) {
    capture(err, { context: "submitStoreOrder: rpc" });
    return {
      ok: false,
      message:
        err instanceof Error ? err.message : "Захиалга үүсгэхэд алдаа гарлаа.",
    };
  }

  if (result.error) {
    capture(result.error, { context: "submitStoreOrder: rpc error" });
    return { ok: false, message: result.error.message };
  }

  const rows = Array.isArray(result.data)
    ? result.data
    : result.data
      ? [result.data]
      : [];
  const row = (rows[0] ?? {}) as {
    order_id?: string;
    total_amount?: number;
    status?: string;
    delivery_fee?: number | null;
    discount_amount?: number | null;
    gift_card_amount?: number | null;
    points_discount?: number | null;
    points_redeemed?: number | null;
    points_earned?: number | null;
    payment_instructions?: {
      bank_name?: string | null;
      bank_account?: string | null;
      account_name?: string | null;
      qpay_qr_url?: string | null;
    } | null;
  };
  if (!row.order_id) {
    return { ok: false, message: "Захиалга үүсгэхэд алдаа гарлаа." };
  }

  return {
    ok: true,
    orderId: row.order_id,
    totalAmount: Number(row.total_amount ?? 0),
    status: row.status ?? "pending",
    deliveryFee: row.delivery_fee ?? null,
    discountAmount: row.discount_amount ?? null,
    giftCardAmount: row.gift_card_amount ?? null,
    pointsDiscount: row.points_discount ?? null,
    pointsRedeemed: row.points_redeemed ?? null,
    pointsEarned: row.points_earned ?? null,
    paymentInstructions: row.payment_instructions ?? null,
  };
}
