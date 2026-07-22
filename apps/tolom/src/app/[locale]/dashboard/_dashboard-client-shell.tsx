"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { PageHeader } from "@/components/page-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeaderProvider, usePageHeader } from "@/hooks/use-page-header";
import { AuthWrapper } from "./_auth-wrapper";
import { GlobalDialogs } from "./_global-dialogs";

function DashboardHeader() {
  const { state, setActiveTab } = usePageHeader();

  return (
    <PageHeader
      tabs={state.tabs.length > 0 ? state.tabs : undefined}
      activeTab={state.activeTab}
      onTabChange={setActiveTab}
      actions={state.actions}
    />
  );
}

export default function DashboardClientShell({
  children,
}: {
  children: ReactNode;
}) {
  const isMobile = useIsMobile();
  const sidebarDefaultOpen = useMemo(() => !isMobile, [isMobile]);

  return (
    <AuthWrapper>
      <PageHeaderProvider>
        <SidebarProvider
          defaultOpen={sidebarDefaultOpen}
          className="h-svh overflow-hidden"
        >
          <AppSidebar />
          <SidebarInset className="min-h-0 min-w-0 w-auto overflow-hidden">
            <GlobalDialogs />
            <DashboardHeader />
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </PageHeaderProvider>
    </AuthWrapper>
  );
}
