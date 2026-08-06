import { type KvStorage, storageSetJson } from "@/lib/storage";

/**
 * Local pending-order queue (offline fallback).
 *
 * Orders normally go through the public `submit_shop_order` RPC (see
 * src/lib/checkout.ts). When the device is offline, the checkout screen
 * offers to queue the order here with status "pending_sync"; it shows up
 * in the buyer's order history alongside server orders labeled as
 * device-local until it can be submitted.
 */

export interface PendingOrder {
  id: string;
  reference: string;
  slug: string;
  storeName: string;
  totalAmount: number;
  itemCount: number;
  customerName: string;
  customerPhone: string | null;
  createdAt: string;
}

const QUEUE_KEY = "zer-mobile:pending-orders";

export function makeLocalReference(): string {
  return `ORD-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function addPendingOrder(
  storage: KvStorage,
  order: PendingOrder,
): Promise<void> {
  const existing = await listPendingOrders(storage);
  await storageSetJson(storage, QUEUE_KEY, [...existing, order]);
}

export async function listPendingOrders(
  storage: KvStorage,
): Promise<PendingOrder[]> {
  const raw = await storage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as PendingOrder[];
  } catch {
    return [];
  }
}

export async function clearPendingOrders(storage: KvStorage): Promise<void> {
  await storage.removeItem(QUEUE_KEY);
}
