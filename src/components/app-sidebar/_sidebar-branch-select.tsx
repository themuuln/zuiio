"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { BranchSelect } from "@/components/branch-select";
import { QuickCreateBranchSheet } from "@/components/branches/quick-create-branch-sheet";
import { useCurrentUserRole } from "@/hooks/use-current-user-role";
import { useBranches } from "@/lib/queries/use-branches";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useSelectedBranchId, useSetSelectedBranchId } from "@/lib/stores";

/**
 * Branch selector for the sidebar header.
 * - Reads/writes the Zustand store (global state, persisted across reloads).
 * - Only visible to admin/manager roles (mechanics see no branch filter).
 * - Hides entirely when sidebar is collapsed (consistent with nav label pattern).
 * - Includes "Add Branch" option that opens the quick-create dialog.
 */
export function SidebarBranchSelect() {
  const t = useTranslations();
  const { data: orgInfo } = useCurrentOrg();
  const orgId = orgInfo?.orgId;
  const { isAdmin, isManager } = useCurrentUserRole();
  const selectedBranchId = useSelectedBranchId();
  const setSelectedBranchId = useSetSelectedBranchId();
  const { data: branches = [] } = useBranches(orgId);
  const [addBranchOpen, setAddBranchOpen] = useState(false);

  // Only show for admin/manager roles
  if (!isAdmin && !isManager) return null;

  return (
    <>
      <div className="px-2 group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:group-hover:block">
        <BranchSelect
          value={selectedBranchId}
          onChange={setSelectedBranchId}
          branches={branches}
          placeholder={t("dashboard.branch")}
          allLabel={t("dashboard.allBranches")}
          className="w-full"
          onAddBranch={() => setAddBranchOpen(true)}
        />
      </div>

      {/* Quick-create branch dialog */}
      <QuickCreateBranchSheet
        open={addBranchOpen}
        onOpenChange={setAddBranchOpen}
      />
    </>
  );
}
