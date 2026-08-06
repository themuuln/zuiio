import "server-only";
import { randomBytes } from "node:crypto";
import { getDb } from "@/lib/db";
import { loadPricingContext, quotePackage } from "@/lib/pricing/quote";
import { getProvider, getProviderByName } from "@/lib/provider";
import { runProvisioning } from "@/lib/provisioning";
import { checkPayment, createInvoice } from "@/lib/qpay";
import type { Json, OrderRow, OrderStatus } from "@/lib/supabase/types";
import { notifyNewSale } from "@/lib/telegram";

/**
 * Order lifecycle core. Payment settlement is idempotent and race-safe:
 * both the QPay callback and the status-polling route funnel into
 * settleOrderPayment, which (1) verifies with QPay — never trusting
 * callback data — and (2) transitions pending_payment → paid via a
 * conditional update so exactly one caller wins.
 */

// No 0/O/1/I — codes are read out loud over the phone.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateOrderCode(): string {
  const bytes = randomBytes(6);
  let code = "";
  for (const byte of bytes) {
    code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  }
  return `ZIM-${code}`;
}

export interface CreateOrderResult {
  orderCode: string;
}

export async function createOrderWithInvoice(params: {
  packageId: string;
  email: string;
  phone: string;
  locale: string;
}): Promise<CreateOrderResult> {
  const db = getDb();

  const pkg = await db.getPackageById(params.packageId);
  if (!pkg?.is_enabled || pkg.is_archived) {
    throw new Error("Package not available");
  }
  // Route to the provider that owns this package; fall back to default.
  let provider = getProviderByName(pkg.provider);
  if (!provider) {
    console.warn(
      `Provider "${pkg.provider}" not available for package ${pkg.id}, falling back to default`,
    );
    provider = getProvider();
  }

  const [ctx, ttlSettings] = await Promise.all([
    loadPricingContext(),
    db.getSettings(["order_ttl_minutes"]),
  ]);
  const quote = quotePackage(pkg, ctx);
  const ttlMinutes = Number(ttlSettings.get("order_ttl_minutes") ?? 30);

  const customer = await db.upsertCustomer(params.email, params.phone);
  const orderCode = generateOrderCode();

  const order = await db.createOrder({
    order_code: orderCode,
    customer_id: customer.id,
    email: params.email,
    phone: params.phone,
    locale: params.locale,
    total_mnt: quote.retailMnt,
    expires_at: new Date(Date.now() + ttlMinutes * 60_000).toISOString(),
    esim_provider: provider.name,
    item: {
      package_id: pkg.id,
      quantity: 1,
      package_name: pkg.name,
      cost_usd: Number(pkg.cost_usd),
      fx_rate: quote.fxRate,
      fx_rate_id: quote.fxRateId,
      markup_percent: quote.markupPercent,
      pricing_rule_id: quote.pricingRuleId,
      min_margin_applied: quote.minMarginApplied,
      unit_retail_mnt: quote.retailMnt,
      unit_cost_mnt: quote.costMnt,
    },
  });

  const invoice = await createInvoice({
    orderCode,
    amountMnt: quote.retailMnt,
    description: `zim eSIM ${pkg.name} — ${orderCode}`,
  });

  await db.createPayment({
    order_id: order.id,
    invoice_id: invoice.invoiceId,
    sender_invoice_no: orderCode,
    amount_mnt: quote.retailMnt,
    // Persist QR data so the pay page can render it on reload.
    raw: {
      qrImage: invoice.qrImage,
      qrText: invoice.qrText,
      shortUrl: invoice.shortUrl,
    },
  });

  return { orderCode };
}

export interface SettleResult {
  status: OrderStatus;
}

/** Idempotent payment settlement — see module docstring. */
export async function settleOrderPayment(
  orderCode: string,
): Promise<SettleResult> {
  const db = getDb();

  const order = await db.getOrderByCode(orderCode);
  if (!order) throw new Error(`Order not found: ${orderCode}`);

  // Already settled (or failed/refunded/…) — idempotent no-op.
  if (order.status !== "pending_payment") {
    return { status: order.status };
  }

  const payment = await db.getPaymentByOrderId(order.id);
  if (!payment?.invoice_id) return { status: order.status };

  // Expired and unpaid → expire.
  if (order.expires_at < new Date().toISOString()) {
    const check = await checkPayment(payment.invoice_id);
    if (!check.paid) {
      await db.transitionOrder(order.id, "pending_payment", "expired");
      await db.updatePayment(payment.id, { status: "expired" });
      return { status: "expired" };
    }
  }

  // Verify with QPay — the callback/poll never carries trusted state.
  const check = await checkPayment(payment.invoice_id);
  if (!check.paid) return { status: "pending_payment" };

  // Atomic transition: exactly one concurrent caller proceeds.
  const won = await db.transitionOrder(order.id, "pending_payment", "paid");
  if (!won) {
    const current = await db.getOrderByCode(orderCode);
    return { status: current?.status ?? "paid" };
  }

  await db.updatePayment(payment.id, {
    status: "paid",
    paid_at: new Date().toISOString(),
    raw: check.raw as Json,
  });

  await db.enqueueProvisioningJob(order.id);

  const detail = await db.getOrderDetail(orderCode);
  const item = detail?.items[0];
  if (item) {
    // Fire-and-forget admin alert.
    void notifyNewSale({
      orderCode,
      packageName: item.package_name,
      retailMnt: item.unit_retail_mnt,
      marginMnt: item.unit_retail_mnt - item.unit_cost_mnt,
    });
  }

  const status = await runProvisioning(orderCode);
  return { status };
}

/** Verified guest access for the lookup page. */
export async function findOrderByCodeAndPhone(
  orderCode: string,
  phone: string,
): Promise<OrderRow | null> {
  const db = getDb();
  const order = await db.getOrderByCode(orderCode.trim().toUpperCase());
  if (!order) return null;
  const normalize = (value: string) => value.replace(/\D/g, "");
  return normalize(order.phone) === normalize(phone) ? order : null;
}
