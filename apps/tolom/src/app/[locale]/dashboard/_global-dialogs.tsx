"use client";

import dynamic from "next/dynamic";
import { usePageHeader } from "@/hooks/use-page-header";

// Lazy-load all sheet components — they only mount when their `open` prop is true
const NewCustomerSheet = dynamic(
  () =>
    import("@/components/customers/new-customer-drawer").then(
      (m) => m.NewCustomerSheet,
    ),
  { ssr: false },
);
const NewVehicleSheet = dynamic(
  () =>
    import("@/components/vehicles/new-vehicle-drawer").then(
      (m) => m.NewVehicleSheet,
    ),
  { ssr: false },
);
const NewExpenseSheet = dynamic(
  () =>
    import("@/components/expenses/new-expense-drawer").then(
      (m) => m.NewExpenseSheet,
    ),
  { ssr: false },
);
const NewWorkOrderSheet = dynamic(
  () =>
    import("@/components/work-orders/new-work-order-drawer").then(
      (m) => m.NewWorkOrderSheet,
    ),
  { ssr: false },
);
const SupplierDetailSheet = dynamic(
  () =>
    import("@/components/inventory/supplier-detail-drawer").then(
      (m) => m.SupplierDetailSheet,
    ),
  { ssr: false },
);
const ExpenseDetailSheet = dynamic(
  () =>
    import("@/components/expenses/expense-detail-drawer").then(
      (m) => m.ExpenseDetailSheet,
    ),
  { ssr: false },
);
const PurchaseOrderDetailSheet = dynamic(
  () =>
    import("@/components/inventory/purchase-order-detail-drawer").then(
      (m) => m.PurchaseOrderDetailSheet,
    ),
  { ssr: false },
);
const VehicleDetailSheet = dynamic(
  () =>
    import("@/components/vehicles/vehicle-detail-drawer").then(
      (m) => m.VehicleDetailSheet,
    ),
  { ssr: false },
);
const CustomerDetailSheet = dynamic(
  () =>
    import("@/components/customers/customer-detail-drawer").then(
      (m) => m.CustomerDetailSheet,
    ),
  { ssr: false },
);
const PartsCarDetailSheet = dynamic(
  () =>
    import("@/components/inventory/parts-car-detail-drawer").then(
      (m) => m.PartsCarDetailSheet,
    ),
  { ssr: false },
);

const NewSupplierSheet = dynamic(
  () =>
    import("@/components/inventory/new-supplier-drawer").then(
      (m) => m.NewSupplierSheet,
    ),
  { ssr: false },
);
const NewPurchaseOrderSheet = dynamic(
  () =>
    import("@/components/inventory/new-purchase-order-drawer").then(
      (m) => m.NewPurchaseOrderSheet,
    ),
  { ssr: false },
);
const AppointmentCreateSheet = dynamic(
  () =>
    import("@/components/appointments/create-drawer").then(
      (m) => m.AppointmentCreateSheet,
    ),
  { ssr: false },
);
const NewPartsCarSheet = dynamic(
  () =>
    import("@/components/inventory/new-parts-car-drawer").then(
      (m) => m.NewPartsCarSheet,
    ),
  { ssr: false },
);
const WorkOrderDetailSheet = dynamic(
  () =>
    import("@/components/work-orders/work-order-detail-drawer").then(
      (m) => m.WorkOrderDetailSheet,
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
      <NewSupplierSheet
        open={isNewSupplierSheetOpen}
        onOpenChange={setNewSupplierSheetOpen}
      />
      <NewPurchaseOrderSheet
        open={isNewPOSheetOpen}
        onOpenChange={setNewPOSheetOpen}
      />
      <AppointmentCreateSheet
        open={isNewAppointmentSheetOpen}
        onOpenChange={setNewAppointmentSheetOpen}
        orgId=""
      />
      <NewPartsCarSheet
        open={isNewPartsCarSheetOpen}
        onOpenChange={setNewPartsCarSheetOpen}
      />
      <WorkOrderDetailSheet
        open={detailWorkOrderId !== null}
        onOpenChange={(open) =>
          setDetailWorkOrderId(open ? detailWorkOrderId : null)
        }
        workOrderId={detailWorkOrderId ?? ""}
      />
    </>
  );
}
