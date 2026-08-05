/**
 * Background Sync helper — registers a service-worker sync tag so queued
 * mutations are replayed by the service worker even when the tab is closed.
 *
 * The service worker (see `worker/index.ts` in consuming apps) listens for
 * `sync-mutations` events, reads the same `zuiio-mutation-queue` IndexedDB
 * that `mutation-queue.ts` uses, and replays pending mutations in FIFO order.
 *
 * Safe to call any time — degrades to a no-op when Background Sync is
 * unsupported or the service worker has not been registered yet (the app-side
 * reconnect replay in `MutationQueueProvider` remains the fallback).
 */

export const MUTATION_SYNC_TAG = "sync-mutations";

export const MUTATION_SYNCED_MESSAGE = "MUTATIONS_SYNCED" as const;

export interface MutationSyncMessage {
  type: typeof MUTATION_SYNCED_MESSAGE;
  completed: number;
  failed: number;
  /** Query keys replayed by the service worker, for cache invalidation. */
  queryKeys: unknown[][];
}

export interface BackgroundSyncStatus {
  /** Whether the browser supports Background Sync at all. */
  supported: boolean;
  /** Whether a sync event was successfully registered. */
  registered: boolean;
}

type SyncRegistration = ServiceWorkerRegistration & {
  sync: {
    register: (tag: string) => Promise<void>;
  };
};

function isSyncSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    typeof ServiceWorkerRegistration !== "undefined" &&
    "sync" in ServiceWorkerRegistration.prototype
  );
}

/**
 * Request a background sync for the pending mutation queue.
 *
 * Call after enqueueing a mutation while offline (and opportunistically on
 * mount when the queue is non-empty). The browser fires the registered sync
 * event when connectivity returns, even if the tab was closed in between.
 */
export async function requestMutationBackgroundSync(): Promise<BackgroundSyncStatus> {
  if (!isSyncSupported()) {
    return { supported: false, registered: false };
  }

  try {
    // getRegistration resolves immediately; `ready` never settles when no
    // service worker is registered (e.g. builds where next-pwa emits none),
    // which would leak a pending promise per offline enqueue.
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return { supported: true, registered: false };
    }
    await (registration as SyncRegistration).sync.register(MUTATION_SYNC_TAG);
    return { supported: true, registered: true };
  } catch {
    // No controlled service worker yet (first visit) or sync rejected —
    // the MutationQueueProvider's online-event replay covers this case.
    return { supported: true, registered: false };
  }
}

/**
 * Subscribe to service-worker replay results (`MUTATIONS_SYNCED` messages).
 *
 * Returns an unsubscribe function. Used by MutationQueueProvider to refresh
 * the queue UI and invalidate React Query caches after the service worker
 * replays mutations in the background.
 */
export function subscribeMutationSync(
  onSync: (message: MutationSyncMessage) => void,
): () => void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return () => {};
  }

  const onMessage = (event: MessageEvent) => {
    const data = event.data as MutationSyncMessage | undefined;
    if (!data || data.type !== MUTATION_SYNCED_MESSAGE) return;
    onSync(data);
  };

  navigator.serviceWorker.addEventListener("message", onMessage);
  return () =>
    navigator.serviceWorker.removeEventListener("message", onMessage);
}
