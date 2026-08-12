// ─── Mutation queue engine (IndexedDB-backed) ─────────────────

// ─── Background sync (service-worker replay) ──────────────────
export {
  type BackgroundSyncStatus,
  MUTATION_SYNC_TAG,
  MUTATION_SYNCED_MESSAGE,
  type MutationSyncMessage,
  requestMutationBackgroundSync,
  subscribeMutationSync,
} from "./background-sync";
// ─── React Query IndexedDB persister ──────────────────────────
export { indexedDbPersister } from "./indexed-db-persister";
export {
  cleanupStaleMutations,
  enqueueMutation,
  getAllMutations,
  getMutationsByStatus,
  getPendingCount,
  IN_FLIGHT_STALE_MS,
  type QueuedMutation,
  type ReplayResult,
  removeMutation,
  replayPendingMutations,
  requeueStaleInFlight,
  shouldRetryStatus,
} from "./mutation-queue";
// ─── React context provider ───────────────────────────────────
export {
  MutationQueueProvider,
  useMutationQueue,
} from "./mutation-queue-provider";
// ─── Offline-aware mutation hook ──────────────────────────────
export {
  handleOfflineSuccess,
  isQueuedResponse,
  type OfflineMutationOptions,
  useOfflineMutation,
} from "./use-offline-mutation";
// ─── High-order wrapper for existing mutations ────────────────
export {
  type OfflineQueueConfig,
  withOfflineQueue,
} from "./with-offline-queue";
