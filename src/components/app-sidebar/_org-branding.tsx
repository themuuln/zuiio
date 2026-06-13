"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Check, CirclePlus, Store } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { QuickCreateBranchSheet } from "@/components/branches/quick-create-branch-sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUserRole } from "@/hooks/use-current-user-role";
import { orgKeys } from "@/lib/queries/keys";
import { useBranches } from "@/lib/queries/use-branches";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useSelectedBranchId, useSetSelectedBranchId } from "@/lib/stores";
import type { Organization } from "@/lib/types";

/**
 * Org branding header + branch selector.
 * Clicking the org name/logo opens a dropdown to pick a branch.
 * Mechanics see only the branding (no branch switching).
 * Admins/managers get the full branch switcher.
 */
export function OrgBranding() {
  const t = useTranslations();
  const { data: orgInfo } = useCurrentOrg();
  const { isMechanic, isAdmin, isManager } = useCurrentUserRole();
  const { data: org } = useQuery({
    queryKey: orgKeys.detail(orgInfo?.orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgInfo?.orgId}`);
      const json = await res.json();
      return json.data as Organization;
    },
    enabled: !!orgInfo?.orgId,
    staleTime: 60_000,
  });

  const selectedBranchId = useSelectedBranchId();
  const setSelectedBranchId = useSetSelectedBranchId();
  const { data: branches = [] } = useBranches(orgInfo?.orgId);
  const [addBranchOpen, setAddBranchOpen] = useState(false);
  // Stable id prevents hydration mismatch — the SidebarContent conditional
  // (Skeleton vs nav) shifts React useId() counter between server/client,
  // making Base UI auto-generated id differ.
  const triggerId = useId();

  const logoUrl = org?.logo_url;
  const name = org?.name ?? "TOLOM";
  const canSwitchBranches = isAdmin || isManager;
  const selectedBranch = branches.find((b) => b.id === selectedBranchId);
  const activeBranchName = selectedBranch?.name ?? t("dashboard.allBranches");
  const allSelected = selectedBranchId === "all";

  const trigger = (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary/95 text-sidebar-primary-foreground shadow-sm ring-1 ring-sidebar-primary/20">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={name}
          width={22}
          height={22}
          className="size-5.5 rounded-xl object-contain"
        />
      ) : (
        <span className="text-sm font-bold tracking-tight">T</span>
      )}
    </div>
  );

  const label = (
    <div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:group-hover:grid">
      <span className="truncate text-sm font-semibold" suppressHydrationWarning>
        {name}
      </span>
      <span
        className="truncate text-[10px] text-sidebar-foreground/50"
        suppressHydrationWarning
      >
        {canSwitchBranches ? activeBranchName : "\u00a0"}
      </span>
    </div>
  );

  // Always render the same HTML structure (DropdownMenu button) regardless of
  // role. During SSR, role data is unavailable so isMechanic/isAdmin are false;
  // the previous conditional returned a <div> on server but a <button> on client,
  // causing a hydration mismatch. Now role data only controls whether the
  // dropdown content is shown — the button shell is always identical.
  const canShowDropdown = canSwitchBranches && !isMechanic;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          id={triggerId}
          render={
            <button
              type="button"
              suppressHydrationWarning
              className="flex items-center gap-3 rounded-xl px-2 h-9 transition-colors hover:bg-sidebar-accent/50 cursor-pointer group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-start group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:self-start group-data-[collapsible=icon]:group-hover:w-full group-data-[collapsible=icon]:group-hover:h-9 group-data-[collapsible=icon]:group-hover:pl-0 group-data-[collapsible=icon]:group-hover:pr-2 group-data-[collapsible=icon]:group-hover:bg-transparent group-data-[collapsible=icon]:group-hover:hover:bg-sidebar-accent/50"
            >
              {trigger}
              {label}
            </button>
          }
        />
        {canShowDropdown && (
          <DropdownMenuContent
            className="w-56 rounded-lg"
            align="start"
            sideOffset={4}
          >
            {/* Only show "All Branches" when there's more than one branch */}
            {branches.length > 1 && (
              <>
                <DropdownMenuItem
                  onClick={() => setSelectedBranchId("all")}
                  className="gap-2 p-2"
                >
                  <div className="flex size-5 items-center justify-center rounded-md bg-sidebar-primary/10 text-sidebar-primary shrink-0">
                    <Building2 className="size-3" />
                  </div>
                  <span className="flex-1 text-xs font-medium">
                    {t("dashboard.allBranches")}
                  </span>
                  {allSelected && (
                    <Check className="size-3.5 shrink-0 text-primary" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Branch list */}
            {branches.map((branch) => (
              <DropdownMenuItem
                key={branch.id}
                onClick={() => setSelectedBranchId(branch.id)}
                className="gap-2 p-2"
              >
                <div className="flex size-5 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground shrink-0">
                  <Store className="size-3" />
                </div>
                <div className="grid min-w-0 flex-1">
                  <span className="truncate text-xs font-medium">
                    {branch.name}
                  </span>
                  {branch.is_main && (
                    <span className="truncate text-[10px] text-sidebar-foreground/40">
                      Main
                    </span>
                  )}
                </div>
                {branch.id === selectedBranchId && (
                  <Check className="size-3.5 shrink-0 text-primary" />
                )}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            {/* Add Branch */}
            <DropdownMenuItem
              onClick={() => setAddBranchOpen(true)}
              className="gap-2 p-2 text-muted-foreground"
            >
              <CirclePlus className="size-4 shrink-0" />
              <span className="text-xs">{t("common.addBranch")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        )}
      </DropdownMenu>

      <QuickCreateBranchSheet
        open={addBranchOpen}
        onOpenChange={setAddBranchOpen}
      />
    </>
  );
}
