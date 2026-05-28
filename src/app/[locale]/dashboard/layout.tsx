"use client";

import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import BrandThemeProvider from "@/components/brand-theme-provider";
import { NewCustomerSheet } from "@/components/customers/new-customer-sheet";
import { NewVehicleSheet } from "@/components/vehicles/new-vehicle-sheet";
import { NewExpenseSheet } from "@/components/expenses/new-expense-sheet";
import { NewWorkOrderSheet } from "@/components/work-orders/new-work-order-sheet";
import { SupplierDetailSheet } from "@/components/inventory/supplier-detail-sheet";
import { ExpenseDetailSheet } from "@/components/expenses/expense-detail-sheet";
import { PurchaseOrderDetailSheet } from "@/components/inventory/purchase-order-detail-sheet";
import { VehicleDetailSheet } from "@/components/vehicles/vehicle-detail-sheet";
import { CustomerDetailSheet } from "@/components/customers/customer-detail-sheet";
import { PartsCarDetailSheet } from "@/components/inventory/parts-car-detail-sheet";
import { PageHeader } from "@/components/page-header";
import { RightSidebar } from "@/components/right-sidebar";
import { SubscriptionGuard } from "@/components/subscription-guard";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PageHeaderProvider, usePageHeader } from "@/hooks/use-page-header";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  RightSidebarProvider,
  useRightSidebar,
} from "@/hooks/use-right-sidebar";
import { useEffect } from "react";
import { usePathname } from "@/lib/i18n/navigation";
import { useCurrentOrg } from "@/lib/queries/use-organization";

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
    detailSupplierId,
    setDetailSupplierId,
    detailExpenseId,
    setDetailExpenseId,
    detailPOId,
    setDetailPOId,
    detailVehicleId,
    setDetailVehicleId,
    detailCustomerId,
    setDetailCustomerId,
    detailPartsCarId,
    setDetailPartsCarId,
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
      <SupplierDetailSheet
        open={detailSupplierId !== null}
        onOpenChange={(open) =>
          setDetailSupplierId(open ? detailSupplierId : null)
        }
        supplierId={detailSupplierId}
      />
      <ExpenseDetailSheet
        open={detailExpenseId !== null}
        onOpenChange={(open) =>
          setDetailExpenseId(open ? detailExpenseId : null)
        }
        expenseId={detailExpenseId}
      />
      <PurchaseOrderDetailSheet
        open={detailPOId !== null}
        onOpenChange={(open) => setDetailPOId(open ? detailPOId : null)}
        poId={detailPOId}
      />
      <VehicleDetailSheet
        open={detailVehicleId !== null}
        onOpenChange={(open) =>
          setDetailVehicleId(open ? detailVehicleId : null)
        }
        vehicleId={detailVehicleId}
      />
      <CustomerDetailSheet
        open={detailCustomerId !== null}
        onOpenChange={(open) =>
          setDetailCustomerId(open ? detailCustomerId : null)
        }
        customerId={detailCustomerId}
      />
      <PartsCarDetailSheet
        open={detailPartsCarId !== null}
        onOpenChange={(open) =>
          setDetailPartsCarId(open ? detailPartsCarId : null)
        }
        carId={detailPartsCarId}
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
