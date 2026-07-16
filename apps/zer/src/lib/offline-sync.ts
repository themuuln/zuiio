/**
 * Offline sync service — wires @zuiio/offline to POS operations
 */

import { capture } from "@zuiio/capture";

export interface QueuedSale {
  id: string;
  items: Array<{ product_id: string; quantity: number; unit_price: number }>;
  total_amount: number;
  payment_method: string;
  customer_id?: string;
  salesperson_id?: string;
  created_at: string;
}

let isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
let listeners: Array<(online: boolean) => void> = [];

export function getIsOnline(): boolean {
  return isOnline;
}

export function onOnlineStatusChange(
  callback: (online: boolean) => void,
): () => void {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    isOnline = true;
    for (const l of listeners) l(true);
  });
  window.addEventListener("offline", () => {
    isOnline = false;
    for (const l of listeners) l(false);
  });
}

const QUEUE_KEY = "zer-offline-sales";

export function getQueuedSales(): QueuedSale[] {
  try {
    const data = localStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function queueSale(sale: QueuedSale): void {
  const queue = getQueuedSales();
  queue.push(sale);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function removeSaleFromQueue(id: string): void {
  const queue = getQueuedSales().filter((s) => s.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getQueuedCount(): number {
  return getQueuedSales().length;
}

export async function syncQueuedSales(
  syncFn: (sale: QueuedSale) => Promise<boolean>,
): Promise<{ synced: number; failed: number }> {
  const queue = getQueuedSales();
  let synced = 0;
  let failed = 0;
  for (const sale of queue) {
    try {
      const success = await syncFn(sale);
      if (success) {
        removeSaleFromQueue(sale.id);
        synced++;
      } else {
        failed++;
      }
    } catch (error) {
      capture(error, { context: "offline-sync-sale", saleId: sale.id });
      failed++;
    }
  }
  return { synced, failed };
}
