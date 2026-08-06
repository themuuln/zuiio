"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useOnlineStatus } from "@zuiio/hooks";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  type MutationSyncMessage,
  requestMutationBackgroundSync,
  subscribeMutationSync,
} from "./background-sync";
import {
  cleanupStaleMutations,
  enqueueMutation,
  getAllMutations,
  getPendingCount,
  type QueuedMutation,
  replayPendingMutations,
} from "./mutation-queue";

// ─── Context ──────────────────────────────────────────────────

interface MutationQueueContextValue {
  /** Enqueue a mutation for later replay */
  enqueue: (
    mutation: Omit<
      QueuedMutation,
      "id" | "createdAt" | "status" | "retries" | "maxRetries"
    >,
  ) => Promise<string>;
  /** All mutations (for the queue indicator UI) */
  mutations: QueuedMutation[];
  /** Number of pending mutations */
  pendingCount: number;
  /** Whether the queue is currently replaying */
  isReplaying: boolean;
}

const MutationQueueContext = createContext<MutationQueueContextValue | null>(
  null,
);

export function useMutationQueue() {
  const ctx = useContext(MutationQueueContext);
  if (!ctx) {
    throw new Error(
      "useMutationQueue must be used within MutationQueueProvider",
    );
  }
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────

export function MutationQueueProvider({ children }: { children: ReactNode }) {
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const [mutations, setMutations] = useState<QueuedMutation[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  const replayingRef = useRef(false);

  // Refresh mutation list from IndexedDB
  const refreshMutations = useCallback(async () => {
    const all = await getAllMutations();
    setMutations(all);
    const pending = await getPendingCount();
    setPendingCount(pending);
  }, []);

  // Enqueue a mutation
  const enqueue = useCallback(
    async (
      mutation: Omit<
        QueuedMutation,
        "id" | "createdAt" | "status" | "retries" | "maxRetries"
      >,
    ) => {
      const id = await enqueueMutation(mutation);
      // Request a background sync so the service worker can replay this
      // mutation even if the tab closes before connectivity returns.
      if (!isOnline) void requestMutationBackgroundSync();
      await refreshMutations();
      return id;
    },
    [isOnline, refreshMutations],
  );

  // Replay the pending queue. Guarded so only one replay runs at a time.
  const replayQueue = useCallback(async () => {
    if (replayingRef.current) return;
    const pending = await getPendingCount();
    if (pending === 0) return;

    replayingRef.current = true;
    setIsReplaying(true);

    try {
      const result = await replayPendingMutations((queryKeys) => {
        for (const key of queryKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      });

      if (result.completed > 0) {
        toast.success(
          `${result.completed} change${result.completed > 1 ? "s" : ""} synced`,
        );
      }
      if (result.failed > 0) {
        toast.error(
          `${result.failed} change${result.failed > 1 ? "s" : ""} failed to sync`,
        );
      }
    } finally {
      setIsReplaying(false);
      replayingRef.current = false;
      await refreshMutations();
    }
  }, [queryClient, refreshMutations]);

  // Replay queue when coming back online (also covers initial mount).
  useEffect(() => {
    if (!isOnline) return;
    // Small delay to let the connection stabilize.
    const timer = setTimeout(() => void replayQueue(), 1000);
    return () => clearTimeout(timer);
  }, [isOnline, replayQueue]);

  // Replay when the tab becomes active again — covers returning to the app
  // with a pending queue (focus, back-forward, backgrounded tab), without
  // relying on a service worker.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isOnlineRef = { current: isOnline };
    const onActive = () => {
      if (isOnlineRef.current) void replayQueue();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") onActive();
    };

    window.addEventListener("focus", onActive);
    window.addEventListener("pageshow", onActive);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", onActive);
      window.removeEventListener("pageshow", onActive);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isOnline, replayQueue]);

  // Cleanup stale mutations on mount
  useEffect(() => {
    cleanupStaleMutations().then(async () => {
      await refreshMutations();
      // If the queue has leftovers (e.g. from a previous offline session),
      // arm the background sync in case this tab closes before they replay.
      const pending = await getPendingCount();
      if (pending > 0) void requestMutationBackgroundSync();
    });
  }, [refreshMutations]);

  // Listen for service-worker background sync results. The SW only replays
  // when no tab is open, but a tab that was backgrounded may still receive
  // the message, or a newly opened tab may see the synced state on mount.
  useEffect(
    () =>
      subscribeMutationSync((message: MutationSyncMessage) => {
        for (const key of message.queryKeys ?? []) {
          queryClient.invalidateQueries({ queryKey: key });
        }
        if (message.completed > 0) {
          toast.success(
            `${message.completed} change${message.completed > 1 ? "s" : ""} synced`,
          );
        }
        if (message.failed > 0) {
          toast.error(
            `${message.failed} change${message.failed > 1 ? "s" : ""} failed to sync`,
          );
        }
        void refreshMutations();
      }),
    [queryClient, refreshMutations],
  );

  return (
    <MutationQueueContext.Provider
      value={{ enqueue, mutations, pendingCount, isReplaying }}
    >
      {children}
    </MutationQueueContext.Provider>
  );
}
