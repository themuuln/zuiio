"use client";

import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import BrandThemeProvider from "@/components/brand-theme-provider";
import { NewCustomerDialog } from "@/components/new-customer-dialog";
import { NewVehicleDialog } from "@/components/new-vehicle-dialog";
import { PageHeader } from "@/components/page-header";
import { RightSidebar } from "@/components/right-sidebar";
import { SubscriptionGuard } from "@/components/subscription-guard";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PageHeaderProvider, usePageHeader } from "@/hooks/use-page-header";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { RightSidebarProvider } from "@/hooks/use-right-sidebar";
import { useCurrentOrg } from "@/lib/queries/use-organization";

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

function GlobalDialogs() {
  const {
    isNewCustomerDialogOpen,
    setNewCustomerDialogOpen,
    isNewVehicleDialogOpen,
    setNewVehicleDialogOpen,
  } = usePageHeader();

  return (
    <>
      <NewCustomerDialog
        open={isNewCustomerDialogOpen}
        onOpenChange={setNewCustomerDialogOpen}
      />
      <NewVehicleDialog
        open={isNewVehicleDialogOpen}
        onOpenChange={setNewVehicleDialogOpen}
      />
    </>
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
            <SidebarInset className="min-h-0">
              <DashboardHeader />
              <GlobalDialogs />
              <div className="flex min-h-0 flex-1 overflow-hidden">
                <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-6 pt-4 md:px-6 relative">
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
