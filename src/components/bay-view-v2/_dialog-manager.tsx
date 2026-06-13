"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { bayViewKeys } from "@/lib/queries/keys";
import { useAnyDialogOpen, useBayViewStore } from "@/lib/stores/bay-view-store";
import { usePolling } from "@/hooks/use-polling";
import { useSelectedBranchId } from "@/lib/stores";

/**
 * Manages dialog state, polling pause/resume, and URL sync.
 * Extracted from bay-view-v2-client.tsx to reduce monolith size.
 */
export function DialogManager() {
  const queryClient = useQueryClient();
  const selectedBranchId = useSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? undefined : selectedBranchId;
  const anyDialogOpen = useAnyDialogOpen();

  const refetchBayView = async () => {
    await queryClient.invalidateQueries({
      queryKey: bayViewKeys.data(branchFilter),
    });
  };

  // ── Polling pause/resume based on dialog state ──
  const polling = usePolling(refetchBayView, 30_000);

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
