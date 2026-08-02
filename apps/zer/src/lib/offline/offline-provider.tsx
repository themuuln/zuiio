"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useOnlineStatus } from "@zuiio/hooks";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { createSale } from "@/app/(dashboard)/sales/new/actions";
import { createShopSale } from "@/app/(dashboard)/shop/actions";
import { useI18n } from "@/lib/i18n/provider";
import {
  getPendingOfflineCount,
  type OfflineAction,
  replayQueuedActions,
} from "@/lib/offline-sync";
import { productKeys, saleKeys } from "@/lib/query/keys";

const RECONNECT_STABILIZE_MS = 1500;

interface OfflineContextValue {
  isOnline: boolean;
  pendingCount: number;
  isReplaying: boolean;
  /** Manually trigger a replay of queued actions (e.g. from a sync button). */
  replay: () => Promise<void>;
  /** Re-read the pending count from IndexedDB (call after queueing). */
  refreshPendingCount: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

type ActionResult = { success: boolean; error?: string };

async function dispatchQueuedAction(
  op: OfflineAction,
  fields: Record<string, string>,
): Promise<ActionResult> {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  const result =
    op === "sale"
      ? await createSale(undefined, formData)
      : await createShopSale(undefined, formData);
  if (result && "error" in result && result.error) {
    return { success: false, error: result.error };
  }
  return { success: true };
}

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const isOnline = useOnlineStatus();

  const [pendingCount, setPendingCount] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  const replayingRef = useRef(false);
  const wasOfflineRef = useRef(false);

  const refreshPendingCount = useCallback(async () => {
    try {
      setPendingCount(await getPendingOfflineCount());
    } catch {
      setPendingCount(0);
    }
  }, []);

  const replay = useCallback(async () => {
    if (replayingRef.current) return;
    replayingRef.current = true;
    setIsReplaying(true);
    try {
      const { synced, failed } =
        await replayQueuedActions(dispatchQueuedAction);
      if (synced > 0) {
        queryClient.invalidateQueries({ queryKey: saleKeys.all() });
        queryClient.invalidateQueries({ queryKey: productKeys.all() });
        queryClient.invalidateQueries({ queryKey: ["shop_products"] });
        toast.success(t("offline.sync.success", { n: synced }));
      }
      if (failed > 0) {
        toast.error(t("offline.sync.failed", { n: failed }));
      }
    } finally {
      replayingRef.current = false;
      setIsReplaying(false);
      void refreshPendingCount();
    }
  }, [queryClient, refreshPendingCount, t]);

  // Refresh the badge on mount and after every replay.
  useEffect(() => {
    void refreshPendingCount();
  }, [refreshPendingCount]);

  // On reconnect, wait for the connection to stabilize before replaying.
  useEffect(() => {
    if (isOnline && wasOfflineRef.current) {
      wasOfflineRef.current = false;
      const timer = setTimeout(() => {
        void replay();
      }, RECONNECT_STABILIZE_MS);
      return () => clearTimeout(timer);
    }
    if (!isOnline) {
      wasOfflineRef.current = true;
    }
  }, [isOnline, replay]);

  const value = useMemo<OfflineContextValue>(
    () => ({
      isOnline,
      pendingCount,
      isReplaying,
      replay,
      refreshPendingCount,
    }),
    [isOnline, pendingCount, isReplaying, replay, refreshPendingCount],
  );

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
}

export function useOffline(): OfflineContextValue {
  const ctx = useContext(OfflineContext);
  if (!ctx) {
    throw new Error("useOffline must be used inside OfflineProvider");
  }
  return ctx;
}
