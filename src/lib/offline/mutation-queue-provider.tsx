"use client";

import { useQueryClient } from "@tanstack/react-query";
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
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
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
  /** All mutations (for the queue indicator) */
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
      await refreshMutations();
      return id;
    },
    [refreshMutations],
  );

  // Replay queue when coming back online
  useEffect(() => {
    if (!isOnline || replayingRef.current) return;

    const replay = async () => {
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
    };

    // Small delay to let the connection stabilize
    const timer = setTimeout(replay, 1000);
    return () => clearTimeout(timer);
  }, [isOnline, queryClient, refreshMutations]);

  // Cleanup stale mutations on mount
  useEffect(() => {
    cleanupStaleMutations().then(refreshMutations);
  }, [refreshMutations]);

  return (
    <MutationQueueContext.Provider
      value={{ enqueue, mutations, pendingCount, isReplaying }}
    >
      {children}
    </MutationQueueContext.Provider>
  );
}
