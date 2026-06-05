"use client";

import { useEffect } from "react";
import { useBayViewContext } from "./bay-view-provider";
import { useAnyDialogOpen, useBayViewStore } from "@/lib/stores/bay-view-store";
import { usePolling } from "@/hooks/use-polling";

/**
 * Manages dialog state, polling pause/resume, and URL sync.
 * Extracted from bay-view-v2-client.tsx to reduce monolith size.
 */
export function DialogManager() {
  const { fetchData } = useBayViewContext();
  const anyDialogOpen = useAnyDialogOpen();

  // ── Polling pause/resume based on dialog state ──
  const polling = usePolling(() => fetchData(false), 30_000);

  useEffect(() => {
    if (anyDialogOpen) {
      polling.pause();
    } else {
      polling.resume();
    }
  }, [anyDialogOpen, polling.pause, polling.resume]);

  // This component renders nothing — it's a side-effect manager
  return null;
}
