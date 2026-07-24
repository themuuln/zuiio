import "server-only";
import { getDb } from "@/lib/db";
import { sendDeliveryEmail } from "@/lib/email";
import { getProvider } from "@/lib/provider";
import type { ProvisionedEsim } from "@/lib/provider/types";
import { notifyProvisioningFailed } from "@/lib/telegram";

/**
 * Order provisioning state machine. All esim/order status writes for
 * provisioning flow through here (and the webhook applier below).
 */

async function applyDeliveredEsims(
  orderId: string,
  provisioned: ProvisionedEsim[],
): Promise<void> {
  const db = getDb();
  const esims = await db.listEsimsByOrder(orderId);
  const now = new Date().toISOString();

  for (let i = 0; i < esims.length; i++) {
    const data = provisioned[i];
    if (!data) continue;
    await db.updateEsim(esims[i].id, {
      provider_esim_id: data.providerEsimId,
      iccid: data.iccid,
      smdp_address: data.smdpAddress,
      activation_code: data.activationCode,
      lpa_string: data.lpaString,
      qr_payload: data.lpaString,
      status: "delivered",
      delivered_at: now,
      provider_status_raw: data.raw ?? null,
    });
  }
}

async function finishDelivery(orderCode: string): Promise<void> {
  const db = getDb();
  const detail = await db.getOrderDetail(orderCode);
  if (!detail) return;
  await sendDeliveryEmail(
    detail.order,
    await db.listEsimsByOrder(detail.order.id),
    detail.items[0]?.package_name ?? "eSIM",
  );
}

/**
 * Runs provisioning for a paid order. Returns the resulting order
 * status. Safe to re-run: the provider receives order_code as its
 * idempotency key, and the mock derives esims deterministically.
 */
export async function runProvisioning(
  orderCode: string,
): Promise<"delivered" | "provisioning" | "failed"> {
  const db = getDb();
  const provider = getProvider();

  const detail = await db.getOrderDetail(orderCode);
  if (!detail) throw new Error(`Order not found: ${orderCode}`);
  const { order, items } = detail;
  const item = items[0];
  if (!item) throw new Error(`Order has no items: ${orderCode}`);

  if (order.status === "delivered") return "delivered";
  await db.transitionOrder(order.id, ["paid", "failed"], "provisioning");

  const pkg = await db.getPackageById(item.package_id);
  if (!pkg) throw new Error(`Package not found for order ${orderCode}`);

  const job = await db.getJobByOrderId(order.id);

  const result = await provider.provision({
    providerPackageId: pkg.provider_package_id,
    orderRef: order.order_code,
    quantity: item.quantity,
    customerEmail: order.email,
  });

  if (result.kind === "delivered") {
    await applyDeliveredEsims(order.id, result.esims);
    await db.transitionOrder(order.id, "provisioning", "delivered");
    if (job) await db.updateJob(job.id, { status: "succeeded" });
    await finishDelivery(order.order_code);
    return "delivered";
  }

  if (result.kind === "pending") {
    const esims = await db.listEsimsByOrder(order.id);
    for (const esim of esims) {
      await db.updateEsim(esim.id, {
        provider_order_id: result.providerOrderId,
        status: "provisioning",
      });
    }
    // Dev convenience: the mock's async mode completes itself shortly
    // via our own webhook endpoint.
    if (provider.name === "mock") {
      scheduleMockWebhook(
        order.order_code,
        result.providerOrderId,
        item.quantity,
      );
    }
    return "provisioning";
  }

  // failed
  const attempts = (job?.attempts ?? 0) + 1;
  const maxAttempts = job?.max_attempts ?? 5;
  const permanent = !result.retryable || attempts >= maxAttempts;

  if (job) {
    await db.updateJob(job.id, {
      attempts,
      last_error: result.error,
      status: permanent ? "failed_permanent" : "queued",
      next_retry_at: new Date(
        Date.now() + 2 ** attempts * 60_000,
      ).toISOString(),
    });
  }

  if (permanent) {
    await db.transitionOrder(order.id, "provisioning", "failed");
    const esims = await db.listEsimsByOrder(order.id);
    for (const esim of esims) {
      await db.updateEsim(esim.id, { status: "failed" });
    }
  }

  await notifyProvisioningFailed({
    orderCode: order.order_code,
    attempts,
    maxAttempts,
    error: result.error,
    permanent,
  });

  return permanent ? "failed" : "provisioning";
}

/** Applies a normalized provider webhook (already idempotency-checked). */
export async function applyProviderWebhook(event: {
  type: "esim.delivered" | "esim.failed" | "esim.status_changed";
  providerOrderId?: string;
  esims?: ProvisionedEsim[];
}): Promise<void> {
  if (!event.providerOrderId) return;
  const db = getDb();

  const esims = await db.findEsimsByProviderOrderId(event.providerOrderId);
  if (esims.length === 0) return;
  const orderId = esims[0].order_id;

  if (event.type === "esim.delivered" && event.esims) {
    await applyDeliveredEsims(orderId, event.esims);
    const moved = await db.transitionOrder(
      orderId,
      ["provisioning", "paid"],
      "delivered",
    );
    const job = await db.getJobByOrderId(orderId);
    if (job) await db.updateJob(job.id, { status: "succeeded" });
    if (moved) {
      const order = await db.getOrderById(orderId);
      if (order) await finishDelivery(order.order_code);
    }
    return;
  }

  if (event.type === "esim.failed") {
    await db.transitionOrder(orderId, ["provisioning", "paid"], "failed");
    for (const esim of esims) {
      await db.updateEsim(esim.id, { status: "failed" });
    }
    const job = await db.getJobByOrderId(orderId);
    if (job) await db.updateJob(job.id, { status: "failed_permanent" });
  }
}

/** Retry worker body — invoked by /api/cron/retry-provisioning. */
export async function retryDueProvisioningJobs(): Promise<number> {
  const db = getDb();
  const jobs = await db.claimDueJobs(new Date().toISOString(), 10);
  let processed = 0;

  for (const job of jobs) {
    const order = await db.getOrderById(job.order_id);
    if (!order) continue;
    // Put the claim back into provisioning's hands
    await db.updateJob(job.id, { status: "queued" });
    await runProvisioning(order.order_code);
    processed++;
  }
  return processed;
}

function scheduleMockWebhook(
  orderCode: string,
  providerOrderId: string,
  quantity: number,
): void {
  if (process.env.NODE_ENV === "production") return;
  const url = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/provider/webhook`;

  setTimeout(async () => {
    try {
      const { MockProvider } = await import("@/lib/provider/mock");
      const esims = new MockProvider().esimsForOrder(orderCode, quantity);
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret":
            process.env.PROVIDER_WEBHOOK_SECRET || "zim-dev-webhook-secret",
          "x-provider": "mock",
        },
        body: JSON.stringify({
          event_id: `mock-evt-${providerOrderId}`,
          type: "esim.delivered",
          provider_order_id: providerOrderId,
          esims,
        }),
      });
    } catch (error) {
      console.error("mock webhook simulation failed", error);
    }
  }, 3000);
}
