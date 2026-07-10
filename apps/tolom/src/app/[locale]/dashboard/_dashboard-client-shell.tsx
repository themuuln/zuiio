"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import BrandThemeProvider from "@/components/brand-theme-provider";
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
      <BrandThemeProvider>
        <PageHeaderProvider>
          <SidebarProvider defaultOpen={sidebarDefaultOpen}>
            <AppSidebar />
            <SidebarInset className="min-h-0 min-w-0 w-auto">
              <GlobalDialogs />
              <div className="relative min-h-0 flex-1 overflow-hidden">
                <div className="min-h-0 min-w-0 h-full flex flex-col overflow-y-auto overflow-x-hidden">
                  <DashboardHeader />
                  <div className="min-h-0 flex-1 px-4 pb-6 pt-4 md:px-6">
                    {children}
                  </div>
                </div>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </PageHeaderProvider>
      </BrandThemeProvider>
    </AuthWrapper>
  );
}
