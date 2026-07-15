"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { getProvider } from "@/lib/provider";
import { runProvisioning } from "@/lib/provisioning";

export async function retryProvisioningAction(
  orderCode: string,
): Promise<void> {
  await assertAdmin();
  const db = getDb();
  const order = await db.getOrderByCode(orderCode);
  if (!order) throw new Error("Order not found");

  await db.requeueJob(order.id);
  await runProvisioning(orderCode);
  revalidatePath("/", "layout");
}

/**
 * Marks the order refunded in our records. The QPay refund itself is
 * performed manually in the merchant portal (v1); provider.cancel is
 * attempted when the adapter supports it.
 */
export async function markRefundedAction(orderCode: string): Promise<void> {
  await assertAdmin();
  const db = getDb();
  const detail = await db.getOrderDetail(orderCode);
  if (!detail) throw new Error("Order not found");

  const provider = getProvider();
  if (provider.cancel) {
    for (const esim of detail.esims) {
      if (esim.provider_esim_id) {
        try {
          await provider.cancel(esim.provider_esim_id);
        } catch (error) {
          console.error("provider.cancel failed", error);
        }
      }
    }
  }

  await db.transitionOrder(
    detail.order.id,
    ["paid", "provisioning", "delivered", "failed", "partially_failed"],
    "refunded",
  );
  for (const esim of detail.esims) {
    await db.updateEsim(esim.id, { status: "refunded" });
  }
  if (detail.payment) {
    await db.updatePayment(detail.payment.id, { status: "refunded" });
  }
  revalidatePath("/", "layout");
}

/** Pulls fresh provider-side status for an esim. */
export async function refreshEsimStatusAction(esimId: string): Promise<void> {
  await assertAdmin();
  const db = getDb();
  const esim = await db.getEsimById(esimId);
  if (!esim?.provider_esim_id) return;

  const status = await getProvider().getEsimStatus(esim.provider_esim_id);
  await db.updateEsim(esim.id, {
    provider_status_raw: status.raw ?? { status: status.status },
    ...(status.status === "activated"
      ? { status: "activated", activated_at: new Date().toISOString() }
      : {}),
  });
  revalidatePath("/", "layout");
}
