"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { AiChatDrawer } from "@/components/ai/ai-chat-drawer";
import { AppSidebar } from "@/components/app-sidebar";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeaderProvider, usePageHeader } from "@/hooks/use-page-header";
import { useBranches } from "@/lib/queries/use-branches";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useSelectedBranchId } from "@/lib/stores";
import { AuthWrapper } from "./_auth-wrapper";
import { GlobalDialogs } from "./_global-dialogs";

function BranchIndicator() {
  const { data: orgInfo } = useCurrentOrg();
  const { data: branches = [] } = useBranches(orgInfo?.orgId);
  const selectedBranchId = useSelectedBranchId();

  if (selectedBranchId === "all" || !branches.length) return null;

  const branch = branches.find((b) => b.id === selectedBranchId);
  if (!branch) return null;

  return (
    <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs shrink-0">
      <span className="size-1.5 rounded-full bg-primary" />
      {branch.name}
    </Badge>
  );
}
function DashboardHeader() {
  const { state, setActiveTab } = usePageHeader();

  return (
    <div className="flex w-full items-center gap-3">
      <div className="flex-1 min-w-0">
        <PageHeader
          tabs={state.tabs.length > 0 ? state.tabs : undefined}
          activeTab={state.activeTab}
          onTabChange={setActiveTab}
          actions={state.actions}
        />
      </div>
      <BranchIndicator />
    </div>
  );
}

export default function DashboardClientShell({
  children,
}: {
  children: ReactNode;
}) {
  const isMobile = useIsMobile();
  const sidebarDefaultOpen = useMemo(() => !isMobile, [isMobile]);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  return (
    <AuthWrapper>
      <PageHeaderProvider>
        <SidebarProvider defaultOpen={sidebarDefaultOpen}>
          <GlobalDialogs />
          <AiChatDrawer
            open={aiChatOpen}
            onOpenChange={setAiChatOpen}
            showFloatingButton
          />
          <div className="flex flex-1 min-h-0">
            <AppSidebar />
            <SidebarInset className="min-h-0 min-w-0 w-auto overflow-hidden">
              <DashboardHeader />
              <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </PageHeaderProvider>
    </AuthWrapper>
  );
}
