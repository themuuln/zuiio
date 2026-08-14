"use client";

import dynamic from "next/dynamic";
import { usePageHeader } from "@/hooks/use-page-header";

// Lazy-load all drawer components — they only mount when their `open` prop is true
const NewCustomerDrawer = dynamic(
  () =>
    import("@/components/customers/new-customer-drawer").then(
      (m) => m.NewCustomerDrawer,
    ),
  { ssr: false },
);
const NewVehicleDrawer = dynamic(
  () =>
    import("@/components/vehicles/new-vehicle-drawer").then(
      (m) => m.NewVehicleDrawer,
    ),
  { ssr: false },
);
const NewExpenseDrawer = dynamic(
  () =>
    import("@/components/expenses/new-expense-drawer").then(
      (m) => m.NewExpenseDrawer,
    ),
  { ssr: false },
);
const NewWorkOrderDrawer = dynamic(
  () =>
    import("@/components/work-orders/new-work-order-drawer").then(
      (m) => m.NewWorkOrderDrawer,
    ),
  { ssr: false },
);
const SupplierDetailDrawer = dynamic(
  () =>
    import("@/components/inventory/supplier-detail-drawer").then(
      (m) => m.SupplierDetailDrawer,
    ),
  { ssr: false },
);
const ExpenseDetailDrawer = dynamic(
  () =>
    import("@/components/expenses/expense-detail-drawer").then(
      (m) => m.ExpenseDetailDrawer,
    ),
  { ssr: false },
);
const PurchaseOrderDetailDrawer = dynamic(
  () =>
    import("@/components/inventory/purchase-order-detail-drawer").then(
      (m) => m.PurchaseOrderDetailDrawer,
    ),
  { ssr: false },
);
const VehicleDetailDrawer = dynamic(
  () =>
    import("@/components/vehicles/vehicle-detail-drawer").then(
      (m) => m.VehicleDetailDrawer,
    ),
  { ssr: false },
);
const CustomerDetailDrawer = dynamic(
  () =>
    import("@/components/customers/customer-detail-drawer").then(
      (m) => m.CustomerDetailDrawer,
    ),
  { ssr: false },
);
const PartsCarDetailDrawer = dynamic(
  () =>
    import("@/components/inventory/parts-car-detail-drawer").then(
      (m) => m.PartsCarDetailDrawer,
    ),
  { ssr: false },
);

const NewSupplierDrawer = dynamic(
  () =>
    import("@/components/inventory/new-supplier-drawer").then(
      (m) => m.NewSupplierDrawer,
    ),
  { ssr: false },
);
const NewPurchaseOrderDrawer = dynamic(
  () =>
    import("@/components/inventory/new-purchase-order-drawer").then(
      (m) => m.NewPurchaseOrderDrawer,
    ),
  { ssr: false },
);
const AppointmentCreateDrawer = dynamic(
  () =>
    import("@/components/appointments/create-drawer").then(
      (m) => m.AppointmentCreateDrawer,
    ),
  { ssr: false },
);
const NewPartsCarDrawer = dynamic(
  () =>
    import("@/components/inventory/new-parts-car-drawer").then(
      (m) => m.NewPartsCarDrawer,
    ),
  { ssr: false },
);
const WorkOrderDetailDrawer = dynamic(
  () =>
    import("@/components/work-orders/work-order-detail-drawer").then(
      (m) => m.WorkOrderDetailDrawer,
    ),
  { ssr: false },
);

export function GlobalDialogs() {
  const {
    isNewCustomerDialogOpen,
    setNewCustomerDialogOpen,
    isNewVehicleDialogOpen,
    setNewVehicleDialogOpen,
    isNewExpenseSheetOpen,
    setNewExpenseSheetOpen,
    isNewWorkOrderSheetOpen,
    setNewWorkOrderSheetOpen,
    isNewSupplierSheetOpen,
    setNewSupplierSheetOpen,
    isNewPOSheetOpen,
    setNewPOSheetOpen,
    isNewAppointmentSheetOpen,
    setNewAppointmentSheetOpen,
    isNewPartsCarSheetOpen,
    setNewPartsCarSheetOpen,
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
    detailWorkOrderId,
    setDetailWorkOrderId,
  } = usePageHeader();

  return (
    <>
      <NewCustomerDrawer
        open={isNewCustomerDialogOpen}
        onOpenChange={setNewCustomerDialogOpen}
      />
      <NewVehicleDrawer
        open={isNewVehicleDialogOpen}
        onOpenChange={setNewVehicleDialogOpen}
      />
      <NewExpenseDrawer
        open={isNewExpenseSheetOpen}
        onOpenChange={setNewExpenseSheetOpen}
      />
      <NewWorkOrderDrawer
        open={isNewWorkOrderSheetOpen}
        onOpenChange={setNewWorkOrderSheetOpen}
      />
      <SupplierDetailDrawer
        open={detailSupplierId !== null}
        onOpenChange={(open) =>
          setDetailSupplierId(open ? detailSupplierId : null)
        }
        supplierId={detailSupplierId}
      />
      <ExpenseDetailDrawer
        open={detailExpenseId !== null}
        onOpenChange={(open) =>
          setDetailExpenseId(open ? detailExpenseId : null)
        }
        expenseId={detailExpenseId}
      />
      <PurchaseOrderDetailDrawer
        open={detailPOId !== null}
        onOpenChange={(open) => setDetailPOId(open ? detailPOId : null)}
        poId={detailPOId}
      />
      <VehicleDetailDrawer
        open={detailVehicleId !== null}
        onOpenChange={(open) =>
          setDetailVehicleId(open ? detailVehicleId : null)
        }
        vehicleId={detailVehicleId}
      />
      <CustomerDetailDrawer
        open={detailCustomerId !== null}
        onOpenChange={(open) =>
          setDetailCustomerId(open ? detailCustomerId : null)
        }
        customerId={detailCustomerId}
      />
      <PartsCarDetailDrawer
        open={detailPartsCarId !== null}
        onOpenChange={(open) =>
          setDetailPartsCarId(open ? detailPartsCarId : null)
        }
        carId={detailPartsCarId}
      />
      <NewSupplierDrawer
        open={isNewSupplierSheetOpen}
        onOpenChange={setNewSupplierSheetOpen}
      />
      <NewPurchaseOrderDrawer
        open={isNewPOSheetOpen}
        onOpenChange={setNewPOSheetOpen}
      />
      <AppointmentCreateDrawer
        open={isNewAppointmentSheetOpen}
        onOpenChange={setNewAppointmentSheetOpen}
        orgId=""
      />
      <NewPartsCarDrawer
        open={isNewPartsCarSheetOpen}
        onOpenChange={setNewPartsCarSheetOpen}
      />
      <WorkOrderDetailDrawer
        open={detailWorkOrderId !== null}
        onOpenChange={(open) =>
          setDetailWorkOrderId(open ? detailWorkOrderId : null)
        }
        workOrderId={detailWorkOrderId ?? ""}
      />
    </>
  );
}
