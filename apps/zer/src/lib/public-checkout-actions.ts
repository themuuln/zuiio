"use server";

import { capture } from "@zuiio/capture";
import { sendOrderConfirmationEmail } from "@/lib/order-email";
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
  paymentMethod?: "cash" | "card" | "qpay" | "bank_transfer";
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
 * buyers stay linked via auth.uid() → store_account_id) and then fires the
 * buyer confirmation email (best-effort; a mail failure never fails the
 * order).
 *
 * The web/mobile storefront checkouts call `submit_shop_order` directly
 * from clients today; routing through this action is what activates the R9
 * confirmation email without exposing SMTP to the browser.
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
    });
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

  // Best-effort buyer confirmation email (R9). Runs AFTER the order is
  // created; wrapped inside sendOrderConfirmationEmail so a mail failure
  // can never roll back or fail the order. Recipient: the email the buyer
  // typed at checkout, else the signed-in store account's auth email.
  const email =
    input.contactEmail?.trim() || (await currentUserEmail(supabase));
  if (email) {
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("slug", input.slug)
      .maybeSingle();
    void sendOrderConfirmationEmail(supabase, {
      to: email,
      orgName: org?.name ?? input.slug,
      orderId: row.order_id,
      totalAmount: Number(row.total_amount ?? 0),
      paymentMethod: input.paymentMethod ?? "cash",
      deliveryType: input.deliveryType ?? "pickup",
      deliveryAddress: input.address ?? null,
    });
  }

  return {
    ok: true,
    orderId: row.order_id,
    totalAmount: Number(row.total_amount ?? 0),
    status: row.status ?? "pending",
    deliveryFee: row.delivery_fee ?? null,
    discountAmount: row.discount_amount ?? null,
    giftCardAmount: row.gift_card_amount ?? null,
    paymentInstructions: row.payment_instructions ?? null,
  };
}

async function currentUserEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.email ?? null;
  } catch {
    return null;
  }
}
