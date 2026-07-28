"use client";

import {
  Building2,
  Check,
  ChevronsUpDown,
  CirclePlus,
  Store,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { QuickCreateBranchDrawer } from "@/components/branches/quick-create-branch-drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useCurrentUserRole } from "@/hooks/use-current-user-role";
import { useBranches } from "@/lib/queries/use-branches";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useSelectedBranchId, useSetSelectedBranchId } from "@/lib/stores";

export function TeamSwitcher() {
  const t = useTranslations();
  const { isMobile } = useSidebar();
  const { data: orgInfo } = useCurrentOrg();
  const { isMechanic, hasPermission } = useCurrentUserRole();

  const selectedBranchId = useSelectedBranchId();
  const setSelectedBranchId = useSetSelectedBranchId();
  const { data: branches = [] } = useBranches(orgInfo?.orgId);
  const [addBranchOpen, setAddBranchOpen] = useState(false);

  const name = orgInfo?.orgName ?? "TOLOM";
  const canSwitchBranches = hasPermission("branches", "read");
  const canShowDropdown =
    canSwitchBranches && !isMechanic && branches.length > 1;
  const selectedBranch = branches.find((b) => b.id === selectedBranchId);
  const activeBranchName = selectedBranch?.name ?? t("dashboard.allBranches");
  const allSelected = selectedBranchId === "all";

  const buttonContent = (
    <>
      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <Building2 className="size-4" />
      </div>
      <div className="grid flex-1 text-left text-sm leading-tight transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">
        <span className="truncate font-medium">{name}</span>
        <span className="truncate text-xs">{activeBranchName}</span>
      </div>
      {canShowDropdown && (
        <ChevronsUpDown className="ml-auto size-4 transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0" />
      )}
    </>
  );

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          {canShowDropdown ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                  />
                }
              >
                {buttonContent}
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                align="start"
                side={isMobile ? "bottom" : "right"}
                sideOffset={4}
              >
                <DropdownMenuItem onClick={() => setSelectedBranchId("all")}>
                  <Store className="size-4" />
                  <span>{t("dashboard.allBranches")}</span>
                  {allSelected && <Check className="ml-auto size-4" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {branches.map((branch) => (
                  <DropdownMenuItem
                    key={branch.id}
                    onClick={() => setSelectedBranchId(branch.id)}
                  >
                    <Store className="size-4" />
                    <span>{branch.name}</span>
                    {selectedBranchId === branch.id && (
                      <Check className="ml-auto size-4" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setAddBranchOpen(true)}>
                  <CirclePlus className="size-4" />
                  <span>{t("common.addBranch")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <SidebarMenuButton size="lg">{buttonContent}</SidebarMenuButton>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
      <QuickCreateBranchDrawer
        open={addBranchOpen}
        onOpenChange={setAddBranchOpen}
      />
    </>
  );
}
