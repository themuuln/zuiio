"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import BrandThemeProvider from "@/components/brand-theme-provider";
import { PageHeader } from "@/components/page-header";
import { RightSidebar } from "@/components/right-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { PageHeaderProvider, usePageHeader } from "@/hooks/use-page-header";
import {
  RightSidebarProvider,
  useRightSidebar,
} from "@/hooks/use-right-sidebar";
import { usePathname } from "@/lib/i18n/navigation";
import { AuthWrapper } from "./_auth-wrapper";
import { GlobalDialogs } from "./_global-dialogs";

function DashboardHeader() {
  const { state, setActiveTab } = usePageHeader();
  const sidebar = useRightSidebar();
  const pathname = usePathname();
  const isBayView = pathname.includes("/bay-view");

  useEffect(() => {
    sidebar.setHasSidebar(isBayView);
  }, [isBayView, sidebar.setHasSidebar]);

  return (
    <PageHeader
      tabs={state.tabs.length > 0 ? state.tabs : undefined}
      activeTab={state.activeTab}
      onTabChange={setActiveTab}
      actions={state.actions}
    />
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isBayView = pathname.includes("/bay-view");

  return (
    <AuthWrapper>
      <BrandThemeProvider>
        <PageHeaderProvider>
          <RightSidebarProvider>
            <SidebarProvider defaultOpen={false}>
              <AppSidebar />
              <SidebarInset className="min-h-0 min-w-0 w-auto">
                <DashboardHeader />
                <GlobalDialogs />
                <div className="relative min-h-0 flex-1 overflow-hidden">
                  <div className="min-h-0 min-w-0 h-full overflow-y-auto overflow-x-hidden px-4 pb-6 pt-4 md:px-6">
                    {children}
                  </div>
                </div>
                {isBayView && FEATURE_FLAGS.rightSidebar && <RightSidebar />}
              </SidebarInset>
            </SidebarProvider>
          </RightSidebarProvider>
        </PageHeaderProvider>
      </BrandThemeProvider>
    </AuthWrapper>
  );
}
