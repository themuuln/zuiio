import { screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { GlobalDialogs } from "../_global-dialogs";

// Render dynamically-imported drawers from their (mocked) modules and pass
// through their props so tests can assert open/id wiring.
vi.mock("next/dynamic", () => ({
  default: (importFn: () => Promise<React.ComponentType>) => {
    const DynamicComponent = (props: Record<string, unknown>) => {
      const [Comp, setComp] = React.useState<React.ComponentType | null>(null);
      React.useEffect(() => {
        let mounted = true;
        importFn().then((mod) => {
          if (mounted) setComp(() => mod as React.ComponentType);
        });
        return () => {
          mounted = false;
        };
      }, []);
      return Comp ? React.createElement(Comp, props) : null;
    };
    return DynamicComponent;
  },
}));

const stubs = vi.hoisted(() => ({
  make: (name: string) => (props: Record<string, unknown>) => (
    <div data-testid={`drawer-${name}`} data-props={JSON.stringify(props)} />
  ),
}));

vi.mock("@/components/customers/new-customer-drawer", () => ({
  NewCustomerDrawer: stubs.make("new-customer"),
}));
vi.mock("@/components/vehicles/new-vehicle-drawer", () => ({
  NewVehicleDrawer: stubs.make("new-vehicle"),
}));
vi.mock("@/components/expenses/new-expense-drawer", () => ({
  NewExpenseDrawer: stubs.make("new-expense"),
}));
vi.mock("@/components/work-orders/new-work-order-drawer", () => ({
  NewWorkOrderDrawer: stubs.make("new-work-order"),
}));
vi.mock("@/components/inventory/supplier-detail-drawer", () => ({
  SupplierDetailDrawer: stubs.make("supplier-detail"),
}));
vi.mock("@/components/expenses/expense-detail-drawer", () => ({
  ExpenseDetailDrawer: stubs.make("expense-detail"),
}));
vi.mock("@/components/inventory/purchase-order-detail-drawer", () => ({
  PurchaseOrderDetailDrawer: stubs.make("po-detail"),
}));
vi.mock("@/components/vehicles/vehicle-detail-drawer", () => ({
  VehicleDetailDrawer: stubs.make("vehicle-detail"),
}));
vi.mock("@/components/customers/customer-detail-drawer", () => ({
  CustomerDetailDrawer: stubs.make("customer-detail"),
}));
vi.mock("@/components/inventory/parts-car-detail-drawer", () => ({
  PartsCarDetailDrawer: stubs.make("parts-car-detail"),
}));
vi.mock("@/components/inventory/new-supplier-drawer", () => ({
  NewSupplierDrawer: stubs.make("new-supplier"),
}));
vi.mock("@/components/inventory/new-purchase-order-drawer", () => ({
  NewPurchaseOrderDrawer: stubs.make("new-po"),
}));
vi.mock("@/components/appointments/create-drawer", () => ({
  AppointmentCreateDrawer: stubs.make("appointment-create"),
}));
vi.mock("@/components/inventory/new-parts-car-drawer", () => ({
  NewPartsCarDrawer: stubs.make("new-parts-car"),
}));
vi.mock("@/components/work-orders/work-order-detail-drawer", () => ({
  WorkOrderDetailDrawer: stubs.make("work-order-detail"),
}));

let headerState: Record<string, unknown>;

vi.mock("@/hooks/use-page-header", () => ({
  usePageHeader: () => headerState,
}));

function makeHeaderState(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    isNewCustomerDialogOpen: false,
    setNewCustomerDialogOpen: vi.fn(),
    isNewVehicleDialogOpen: false,
    setNewVehicleDialogOpen: vi.fn(),
    isNewExpenseSheetOpen: false,
    setNewExpenseSheetOpen: vi.fn(),
    isNewWorkOrderSheetOpen: false,
    setNewWorkOrderSheetOpen: vi.fn(),
    isNewSupplierSheetOpen: false,
    setNewSupplierSheetOpen: vi.fn(),
    isNewPOSheetOpen: false,
    setNewPOSheetOpen: vi.fn(),
    isNewAppointmentSheetOpen: false,
    setNewAppointmentSheetOpen: vi.fn(),
    isNewPartsCarSheetOpen: false,
    setNewPartsCarSheetOpen: vi.fn(),
    detailSupplierId: null,
    setDetailSupplierId: vi.fn(),
    detailExpenseId: null,
    setDetailExpenseId: vi.fn(),
    detailPOId: null,
    setDetailPOId: vi.fn(),
    detailVehicleId: null,
    setDetailVehicleId: vi.fn(),
    detailCustomerId: null,
    setDetailCustomerId: vi.fn(),
    detailPartsCarId: null,
    setDetailPartsCarId: vi.fn(),
    detailWorkOrderId: null,
    setDetailWorkOrderId: vi.fn(),
    ...overrides,
  };
}

async function drawerProps(testId: string): Promise<Record<string, unknown>> {
  const el = await screen.findByTestId(testId);
  return JSON.parse(el.getAttribute("data-props") ?? "{}") as Record<
    string,
    unknown
  >;
}

describe("GlobalDialogs", () => {
  beforeEach(() => {
    headerState = makeHeaderState();
  });

  it("renders all drawers closed by default", async () => {
    render(<GlobalDialogs />);

    for (const id of [
      "drawer-new-customer",
      "drawer-new-vehicle",
      "drawer-new-expense",
      "drawer-new-work-order",
      "drawer-supplier-detail",
      "drawer-expense-detail",
      "drawer-po-detail",
      "drawer-vehicle-detail",
      "drawer-customer-detail",
      "drawer-parts-car-detail",
      "drawer-new-supplier",
      "drawer-new-po",
      "drawer-appointment-create",
      "drawer-new-parts-car",
      "drawer-work-order-detail",
    ]) {
      expect((await drawerProps(id)).open).toBe(false);
    }
  });

  it("opens the new-customer drawer when the header flag is set", async () => {
    headerState = makeHeaderState({ isNewCustomerDialogOpen: true });

    render(<GlobalDialogs />);

    expect((await drawerProps("drawer-new-customer")).open).toBe(true);
    expect((await drawerProps("drawer-new-vehicle")).open).toBe(false);
  });

  it("passes detail ids to the matching detail drawers", async () => {
    headerState = makeHeaderState({
      detailSupplierId: "sup-1",
      detailExpenseId: "exp-1",
      detailPOId: "po-1",
      detailVehicleId: "veh-1",
      detailCustomerId: "cust-1",
      detailPartsCarId: "car-1",
      detailWorkOrderId: "wo-1",
    });

    render(<GlobalDialogs />);

    expect(await drawerProps("drawer-supplier-detail")).toEqual(
      expect.objectContaining({ open: true, supplierId: "sup-1" }),
    );
    expect(await drawerProps("drawer-expense-detail")).toEqual(
      expect.objectContaining({ open: true, expenseId: "exp-1" }),
    );
    expect(await drawerProps("drawer-po-detail")).toEqual(
      expect.objectContaining({ open: true, poId: "po-1" }),
    );
    expect(await drawerProps("drawer-vehicle-detail")).toEqual(
      expect.objectContaining({ open: true, vehicleId: "veh-1" }),
    );
    expect(await drawerProps("drawer-customer-detail")).toEqual(
      expect.objectContaining({ open: true, customerId: "cust-1" }),
    );
    expect(await drawerProps("drawer-parts-car-detail")).toEqual(
      expect.objectContaining({ open: true, carId: "car-1" }),
    );
    expect(await drawerProps("drawer-work-order-detail")).toEqual(
      expect.objectContaining({ open: true, workOrderId: "wo-1" }),
    );
  });
});
