/**
 * Offline sync service — wires @zuiio/offline (IndexedDB mutation queue)
 * to POS operations.
 */

import { capture } from "@zuiio/capture";
import {
  enqueueMutation,
  getMutationsByStatus,
  getPendingCount,
  removeMutation,
} from "@zuiio/offline";

export interface QueuedSale {
  id: string;
  items: Array<{ product_id: string; quantity: number; unit_price: number }>;
  total_amount: number;
  payment_method: string;
  customer_id?: string;
  salesperson_id?: string;
  created_at: string;
}

export type OfflineAction = "sale" | "shop_sale";

export type ReplayDispatch = (
  op: OfflineAction,
  fields: Record<string, string>,
) => Promise<{ success: boolean; error?: string }>;

// ─── Online status ────────────────────────────────────────────

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

// ─── Queue operations ─────────────────────────────────────────

/**
 * Queue an offline mutation for later replay. Returns the mutation ID.
 *
 * `op` doubles as the replay endpoint ("sale" | "shop_sale"); the replay
 * layer maps it back to the matching server action. `queryKeys` are the
 * React Query keys invalidated once the action is replayed successfully.
 */
export async function queueOfflineAction(
  op: OfflineAction,
  fields: Record<string, string>,
  queryKeys: string[][],
): Promise<string> {
  return enqueueMutation({
    endpoint: op,
    method: "POST",
    body: fields,
    queryKeysToInvalidate: queryKeys,
    idempotencyKey: crypto.randomUUID(),
  });
}

/** Number of actions waiting to be replayed. */
export async function getPendingOfflineCount(): Promise<number> {
  return getPendingCount();
}

/**
 * Replay all pending actions in FIFO order.
 *
 * Each action is passed to `dispatch`; on success it is removed from the
 * queue, on failure it is left pending for the next reconnect. `onProgress`
 * is called after each action with (done, total).
 */
export async function replayQueuedActions(
  dispatch: ReplayDispatch,
  onProgress?: (done: number, total: number) => void,
): Promise<{ synced: number; failed: number }> {
  const pending = await getMutationsByStatus("pending");
  let synced = 0;
  let failed = 0;

  for (const mutation of pending) {
    const fields = (mutation.body ?? {}) as Record<string, string>;
    try {
      const result = await dispatch(mutation.endpoint as OfflineAction, fields);
      if (result.success) {
        await removeMutation(mutation.id);
        synced++;
      } else {
        capture(new Error(result.error ?? "Replay failed"), {
          context: "offline-replay",
          mutationId: mutation.id,
        });
        failed++;
      }
    } catch (error) {
      capture(error, { context: "offline-replay", mutationId: mutation.id });
      failed++;
    }
    onProgress?.(synced + failed, pending.length);
  }

  return { synced, failed };
}
