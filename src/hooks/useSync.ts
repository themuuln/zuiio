import { useEffect, useState, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { Database } from "@nozbe/watermelondb";
import { SyncEngine, SyncStatus } from "@/database/sync/SyncEngine";
import { useAuth } from "@/lib/auth";

// Singleton — one SyncEngine per database instance
let sharedEngine: SyncEngine | null = null;

export function useSync(database: Database) {
  const { user } = useAuth();
  if (!sharedEngine) sharedEngine = new SyncEngine(database);
  const engine = sharedEngine;

  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncAt: null,
    pendingChanges: 0,
    error: null,
  });

  // Subscribe to engine status updates
  useEffect(() => {
    return engine.subscribe(setStatus);
  }, [engine]);

  // Auto-sync when the app comes to foreground (only while authenticated)
  useEffect(() => {
    if (!user) return;

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        engine.sync();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppState);

    // Trigger an initial sync when the user first mounts
    engine.sync();

    return () => {
      subscription.remove();
    };
  }, [user, engine]);

  // Reset sync state on logout
  useEffect(() => {
    if (!user) {
      engine.reset();
    }
  }, [user, engine]);

  /** Manually trigger a full sync. */
  const triggerSync = useCallback(() => {
    engine.sync();
  }, [engine]);

  return {
    ...status,
    triggerSync,
  };
}
