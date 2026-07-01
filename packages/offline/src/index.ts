// ─── Mutation queue engine (IndexedDB-backed) ─────────────────
export {
  enqueueMutation,
  replayPendingMutations,
  removeMutation,
  getAllMutations,
  getMutationsByStatus,
  getPendingCount,
  cleanupStaleMutations,
  type QueuedMutation,
  type ReplayResult,
} from "./mutation-queue";

// ─── React context provider ───────────────────────────────────
export {
  MutationQueueProvider,
  useMutationQueue,
} from "./mutation-queue-provider";

// ─── Offline-aware mutation hook ──────────────────────────────
export {
  useOfflineMutation,
  isQueuedResponse,
  handleOfflineSuccess,
  type OfflineMutationOptions,
} from "./use-offline-mutation";

// ─── High-order wrapper for existing mutations ────────────────
export {
  withOfflineQueue,
  type OfflineQueueConfig,
} from "./with-offline-queue";

// ─── React Query IndexedDB persister ──────────────────────────
export { indexedDbPersister } from "./indexed-db-persister";
