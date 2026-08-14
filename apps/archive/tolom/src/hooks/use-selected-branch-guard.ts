"use client";

import { useEffect } from "react";
import { useBranches } from "@/lib/queries/use-branches";
import { useSelectedBranchId, useSetSelectedBranchId } from "@/lib/stores";

/**
 * Resets selected branch to "all" when the currently selected branch
 * no longer exists (e.g. deleted by another admin).
 *
 * Must be called at the page level (dashboard, reports) when the org ID is available.
 * Keeps the guard logic in one place instead of duplicating useEffect in every page.
 */
export function useSelectedBranchGuard(orgId: string | undefined) {
  const selectedBranchId = useSelectedBranchId();
  const setSelectedBranchId = useSetSelectedBranchId();
  const { data: branches = [] } = useBranches(orgId);

  useEffect(() => {
    if (selectedBranchId === "all") return;

    const stillExists = branches.some(
      (branch) => branch.id === selectedBranchId,
    );
    if (!stillExists) {
      setSelectedBranchId("all");
    }
  }, [branches, selectedBranchId, setSelectedBranchId]);
}
