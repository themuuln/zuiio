"use client";

import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import BrandThemeProvider from "@/components/brand-theme-provider";
import { NewCustomerSheet } from "@/components/customers/new-customer-sheet";
import { NewVehicleSheet } from "@/components/vehicles/new-vehicle-sheet";
import { NewExpenseSheet } from "@/components/expenses/new-expense-sheet";
import { NewWorkOrderSheet } from "@/components/work-orders/new-work-order-sheet";
import { PageHeader } from "@/components/page-header";
import { RightSidebar } from "@/components/right-sidebar";
import { SubscriptionGuard } from "@/components/subscription-guard";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PageHeaderProvider, usePageHeader } from "@/hooks/use-page-header";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { RightSidebarProvider } from "@/hooks/use-right-sidebar";
import { usePathname } from "@/lib/i18n/navigation";
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
    isNewExpenseSheetOpen,
    setNewExpenseSheetOpen,
    isNewWorkOrderSheetOpen,
    setNewWorkOrderSheetOpen,
  } = usePageHeader();

  return (
    <>
      <NewCustomerSheet
        open={isNewCustomerDialogOpen}
        onOpenChange={setNewCustomerDialogOpen}
      />
      <NewVehicleSheet
        open={isNewVehicleDialogOpen}
        onOpenChange={setNewVehicleDialogOpen}
      />
      <NewExpenseSheet
        open={isNewExpenseSheetOpen}
        onOpenChange={setNewExpenseSheetOpen}
      />
      <NewWorkOrderSheet
        open={isNewWorkOrderSheetOpen}
        onOpenChange={setNewWorkOrderSheetOpen}
      />
    </>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  useRequireAuth();
  const { data: orgInfo } = useCurrentOrg();
  const pathname = usePathname();
  const isBayView = pathname.includes("/bay-view");

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
                {isBayView && <RightSidebar />}
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
