"use client";

import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { PageHeader } from "@/components/page-header";
import { RightSidebar } from "@/components/right-sidebar";
import BrandThemeProvider from "@/components/brand-theme-provider";
import { SubscriptionGuard } from "@/components/subscription-guard";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import {
  PageHeaderProvider,
  usePageHeader,
} from "@/hooks/use-page-header";
import {
  RightSidebarProvider,
} from "@/hooks/use-right-sidebar";

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

export default function DashboardLayout({ children }: { children: ReactNode }) {
  useRequireAuth();
  const { data: orgInfo } = useCurrentOrg();

  const wrapped = (
    <BrandThemeProvider>
      <PageHeaderProvider>
        <RightSidebarProvider>
          <SidebarProvider defaultOpen={false}>
            <AppSidebar />
            <SidebarInset>
              <DashboardHeader />
              <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-3 tablet:p-4 lg:p-6">
                  {children}
                </div>
                <RightSidebar />
              </div>
            </SidebarInset>
          </SidebarProvider>
        </RightSidebarProvider>
      </PageHeaderProvider>
    </BrandThemeProvider>
  );

  if (!orgInfo) return wrapped;

  return (
    <SubscriptionGuard
      orgId={orgInfo.orgId}
      orgName={orgInfo.orgName ?? "Organization"}
    >
      {wrapped}
    </SubscriptionGuard>
  );
}
