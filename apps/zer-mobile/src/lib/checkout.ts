import { type CartItem, cartTotals } from "@/lib/cart";
import type { RpcClient } from "@/lib/client";

/**
 * Checkout — public buyer order submission.
 *
 * Orders go through the PUBLIC `submit_shop_order` RPC
 * (apps/zer migration 20260803100000): org resolved by store slug,
 * prices computed server-side, order created as status 'pending' for the
 * store staff to confirm. `process_shop_sale` (staff-gated) remains
 * available only as an internal path via `buildProcessShopSaleParams`.
 *
 * When the network is unavailable the caller may queue the order locally
 * (see src/lib/queue.ts) and submit it later.
 */

export type CheckoutPaymentMethod = "cash" | "card" | "qpay" | "bank_transfer";

/** Server-side payment instructions returned on a successful order. */
export interface PaymentInstructions {
  bank_name?: string | null;
  bank_account?: string | null;
  account_name?: string | null;
  qpay_qr_url?: string | null;
}

export interface ShopOrderItemInput {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  variantId?: string | null;
}

export interface ShopOrderInput {
  /** Store slug (e.g. "my-shop") — identifies the org. */
  slug: string;
  items: ShopOrderItemInput[];
  customerName: string;
  customerPhone?: string | null;
  /** Signed-in buyer's store_accounts.id; server re-validates against auth.uid(). */
  storeAccountId?: string | null;
  paymentMethod?: CheckoutPaymentMethod;
  currencyCode?: string;
  currencySymbol?: string;
  /** Server-validated coupon code; invalid codes raise from the RPC. */
  couponCode?: string | null;
  /** Delivery/pickup choice. When null the order is store pick-up in-store. */
  deliveryType?: "delivery" | "pickup" | null;
  /** Required (server- and client-side) when deliveryType === 'delivery'. */
  address?: string | null;
  addressNote?: string | null;
  email?: string | null;
  /** Gift card code, redeemed server-side against the org's gift cards. */
  giftCardCode?: string | null;
  /** Branch selected for pickup; validated against get_public_branches. */
  pickupBranchSlug?: string | null;
  /**
   * process_shop_sale routing. The public RPCs never expose these ids;
   * supply them only when your backend provides a buyer checkout channel.
   */
  orgId?: string | null;
  branchId?: string | null;
  /**
   * Client-generated idempotency key, stable per checkout session. The RPC
   * returns the first order created for a key, so a network-error retry tap
   * cannot double-submit (offline queue replays reuse the same key too).
   */
  idempotencyKey?: string | null;
}

export type ShopOrderResult =
  | {
      ok: true;
      saleId: string;
      reference: string;
      serverOrder: true;
      /** Server-computed totals/discounts surfaced on the success screen. */
      totalAmount?: number;
      deliveryFee?: number | null;
      discountAmount?: number | null;
      giftCardAmount?: number | null;
      paymentInstructions?: PaymentInstructions | null;
    }
  | {
      ok: false;
      code: "VALIDATION_FAILED" | "NETWORK_ERROR" | "RPC_FAILED";
      message: string;
    };

export interface ProcessShopSaleParams {
  p_org_id: string;
  p_branch_id: string;
  p_user_id: string;
  p_contact_id: string | null;
  p_total_amount: number;
  p_original_amount: number;
  p_paid_amount: number;
  p_payment_method: string;
  p_salesperson_id: string;
  p_items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    commission_amount: number;
    variant_id: string;
  }>;
  p_movements: Array<{
    product_id: string;
    quantity: number;
    unit_cost: number;
    variant_id: string;
  }>;
}

/**
 * Build the exact `process_shop_sale` parameter object the web server
 * action constructs. Exported so the field mapping is unit-testable.
 * `routing` carries the org/branch ids (staff-side values the public
 * catalog never exposes).
 */
export function buildProcessShopSaleParams(
  input: ShopOrderInput,
  routing: { orgId: string; branchId: string },
): ProcessShopSaleParams {
  const totalAmount =
    Math.round(
      input.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) * 100,
    ) / 100;
  const items = input.items.map((i) => ({
    product_id: i.productId,
    quantity: i.quantity,
    unit_price: i.unitPrice,
    total_price: Math.round(i.unitPrice * i.quantity * 100) / 100,
    commission_amount: Math.round(i.unitPrice * i.quantity * 0.1 * 100) / 100,
    variant_id: i.variantId ?? "",
  }));
  const movements = input.items.map((i) => ({
    product_id: i.productId,
    quantity: i.quantity,
    unit_cost: i.unitPrice,
    variant_id: i.variantId ?? "",
  }));
  const userId = input.storeAccountId ?? "";
  return {
    p_org_id: routing.orgId,
    p_branch_id: routing.branchId,
    p_user_id: userId,
    p_contact_id: null,
    p_total_amount: totalAmount,
    p_original_amount: totalAmount,
    p_paid_amount: totalAmount,
    p_payment_method: input.paymentMethod ?? "cash",
    p_salesperson_id: userId,
    p_items: items,
    p_movements: movements,
  };
}

export function validateCheckoutInput(input: ShopOrderInput): string | null {
  if (!input.items || input.items.length === 0) {
    return "Сагсанд бүтээгдэхүүн байхгүй байна.";
  }
  for (const item of input.items) {
    if (!item.productId || !item.name)
      return "Бүтээгдэхүүний мэдээлэл буруу байна.";
    if (item.quantity <= 0) return "Бүтээгдэхүүний тоо буруу байна.";
    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
      return "Бүтээгдэхүүний үнэ буруу байна.";
    }
  }
  const name = input.customerName?.trim();
  if (!name || name.length < 2) {
    return "Хэрэглэгчийн нэрээ оруулна уу.";
  }
  const phone = input.customerPhone?.trim();
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 12) {
      return "Утасны дугаар буруу байна (8–12 орон).";
    }
  }
  if (input.deliveryType === "delivery" && !input.address?.trim()) {
    return "Хүргэлтийн хаягаа оруулна уу.";
  }
  return null;
}

/**
 * Submit an order through the PUBLIC buyer checkout RPC `submit_shop_order`
 * (apps/zer migration 20260803100000): the backend resolves the org by the
 * store slug, prices items server-side from products.sale_price, links the
 * order to the signed-in store account, and creates it as status 'pending'.
 *
 * Result is a single-row TABLE: [{ order_id, total_amount, status }].
 *
 * Network failures return `NETWORK_ERROR` (caller may queue the order
 * locally); business rejections (short stock, unknown store, bad phone…)
 * surface the server's Mongolian message as `RPC_FAILED`.
 */
export async function submitShopOrder(
  client: RpcClient,
  input: ShopOrderInput,
): Promise<ShopOrderResult> {
  const validationError = validateCheckoutInput(input);
  if (validationError) {
    return { ok: false, code: "VALIDATION_FAILED", message: validationError };
  }

  const items = input.items.map((i) => ({
    product_id: i.productId,
    quantity: i.quantity,
    variant_id: i.variantId ?? "",
  }));

  let result: { data: unknown; error: { message: string } | null };
  try {
    result = await client.rpc("submit_shop_order", {
      p_org_slug: input.slug,
      p_items: items,
      p_payment_method: input.paymentMethod ?? "cash",
      p_currency_code: input.currencyCode ?? "MNT",
      p_contact_name: input.customerName,
      p_contact_phone: input.customerPhone ?? null,
      p_idempotency_key: input.idempotencyKey ?? null,
      p_delivery_type: input.deliveryType ?? null,
      p_address: input.address ?? null,
      p_address_note: input.addressNote ?? null,
      p_contact_email: input.email ?? null,
      p_coupon_code: input.couponCode ?? null,
      p_gift_card_code: input.giftCardCode ?? null,
      p_pickup_branch_slug: input.pickupBranchSlug ?? null,
    } as never);
  } catch (e) {
    // supabase-js throws on network-level failures.
    return {
      ok: false,
      code: "NETWORK_ERROR",
      message:
        e instanceof Error
          ? e.message
          : "Интернет холболтгүй байна. Захиалгаа төхөөрөмждөө хадгалах боломжтой.",
    };
  }

  const { data, error } = result;
  if (error) {
    const message = error.message ?? "Захиалга үүсгэхэд алдаа гарлаа.";
    const isNetwork =
      /fetch|network|socket|ECONN/i.test(message) ||
      message.includes("Failed to");
    return {
      ok: false,
      code: isNetwork ? "NETWORK_ERROR" : "RPC_FAILED",
      message: isNetwork
        ? "Интернет холболтгүй байна. Захиалгаа төхөөрөмждөө хадгалах боломжтой."
        : message,
    };
  }

  // TABLE return → array of rows.
  const rows = Array.isArray(data) ? data : data ? [data] : [];
  const row = rows[0] as
    | {
        order_id?: string;
        status?: string;
        total_amount?: number | null;
        delivery_fee?: number | null;
        discount_amount?: number | null;
        gift_card_amount?: number | null;
        payment_instructions?: PaymentInstructions | null;
      }
    | undefined;
  if (!row?.order_id) {
    const serverError = (data as { message?: string } | null)?.message;
    return {
      ok: false,
      code: "RPC_FAILED",
      message: serverError ?? "Захиалга үүсгэхэд алдаа гарлаа.",
    };
  }

  return {
    ok: true,
    saleId: row.order_id,
    reference: row.order_id,
    serverOrder: true,
    totalAmount:
      typeof row.total_amount === "number" ? row.total_amount : undefined,
    deliveryFee: row.delivery_fee ?? null,
    discountAmount: row.discount_amount ?? null,
    giftCardAmount: row.gift_card_amount ?? null,
    paymentInstructions: row.payment_instructions ?? null,
  };
}

/** Convenience: map cart items into the checkout input shape. */
export function cartItemsToOrderItems(items: CartItem[]): ShopOrderItemInput[] {
  return items.map((i) => ({
    productId: i.productId,
    name: i.name,
    unitPrice: i.unitPrice,
    quantity: i.quantity,
    variantId: null,
  }));
}

export { cartTotals };
