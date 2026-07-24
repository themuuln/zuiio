"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

export interface PageTab {
  value: string;
  label: string;
}

// ─── Drawer / Detail ID Registry ──────────────────────────────

const DRAWER_NAMES = [
  "newCustomer",
  "newVehicle",
  "newExpense",
  "newWorkOrder",
  "newSupplier",
  "newPO",
  "newAppointment",
  "newPartsCar",
] as const;

const DETAIL_NAMES = [
  "supplier",
  "expense",
  "po",
  "vehicle",
  "customer",
  "partsCar",
  "workOrder",
] as const;

type DrawerName = (typeof DRAWER_NAMES)[number];
type DetailName = (typeof DETAIL_NAMES)[number];

const INITIAL_DRAWERS = Object.fromEntries(
  DRAWER_NAMES.map((name) => [name, false]),
) as Record<DrawerName, boolean>;

const INITIAL_DETAILS = Object.fromEntries(
  DETAIL_NAMES.map((name) => [name, null]),
) as Record<DetailName, string | null>;

// ─── Context ──────────────────────────────────────────────────

interface PageHeaderContextValue {
  state: PageHeaderState;
  setTabs: (tabs: PageTab[]) => void;
  setActiveTab: (tab: string) => void;
  setActions: (actions: ReactNode) => void;
  // Drawer controls
  openDrawer: (name: DrawerName) => void;
  closeDrawer: (name: DrawerName) => void;
  toggleDrawer: (name: DrawerName) => void;
  // Detail ID controls
  setDetailId: (name: DetailName, id: string | null) => void;
  clearDetailId: (name: DetailName) => void;
  // Legacy getters (for backward compat — new code should use openDrawer/closeDrawer)
  isNewCustomerDialogOpen: boolean;
  setNewCustomerDialogOpen: (open: boolean) => void;
  isNewVehicleDialogOpen: boolean;
  setNewVehicleDialogOpen: (open: boolean) => void;
  isNewExpenseSheetOpen: boolean;
  setNewExpenseSheetOpen: (open: boolean) => void;
  isNewWorkOrderSheetOpen: boolean;
  setNewWorkOrderSheetOpen: (open: boolean) => void;
  isNewSupplierSheetOpen: boolean;
  setNewSupplierSheetOpen: (open: boolean) => void;
  isNewPOSheetOpen: boolean;
  setNewPOSheetOpen: (open: boolean) => void;
  isNewAppointmentSheetOpen: boolean;
  setNewAppointmentSheetOpen: (open: boolean) => void;
  isNewPartsCarSheetOpen: boolean;
  setNewPartsCarSheetOpen: (open: boolean) => void;
  detailSupplierId: string | null;
  setDetailSupplierId: (id: string | null) => void;
  detailExpenseId: string | null;
  setDetailExpenseId: (id: string | null) => void;
  detailPOId: string | null;
  setDetailPOId: (id: string | null) => void;
  detailVehicleId: string | null;
  setDetailVehicleId: (id: string | null) => void;
  detailCustomerId: string | null;
  setDetailCustomerId: (id: string | null) => void;
  detailPartsCarId: string | null;
  setDetailPartsCarId: (id: string | null) => void;
  detailWorkOrderId: string | null;
  setDetailWorkOrderId: (id: string | null) => void;
}

interface PageHeaderState {
  tabs: PageTab[];
  activeTab: string;
  actions: ReactNode;
  drawers: Record<DrawerName, boolean>;
  detailIds: Record<DetailName, string | null>;
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<PageTab[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [actions, setActions] = useState<ReactNode>(null);
  const [drawers, setDrawers] =
    useState<Record<DrawerName, boolean>>(INITIAL_DRAWERS);
  const [detailIds, setDetailIds] =
    useState<Record<DetailName, string | null>>(INITIAL_DETAILS);

  const openDrawer = (name: DrawerName) =>
    setDrawers((prev) => ({ ...prev, [name]: true }));
  const closeDrawer = (name: DrawerName) =>
    setDrawers((prev) => ({ ...prev, [name]: false }));
  const toggleDrawer = (name: DrawerName) =>
    setDrawers((prev) => ({ ...prev, [name]: !prev[name] }));

  const setDetailId = (name: DetailName, id: string | null) =>
    setDetailIds((prev) => ({ ...prev, [name]: id }));
  const clearDetailId = (name: DetailName) =>
    setDetailIds((prev) => ({ ...prev, [name]: null }));

  // Legacy wrapper: convert per-feature setter to generic one
  const makeDrawerSetter = (name: DrawerName) => (open: boolean) =>
    open ? openDrawer(name) : closeDrawer(name);

  const makeDetailSetter = (name: DetailName) => (id: string | null) =>
    setDetailId(name, id);

  return (
    <PageHeaderContext.Provider
      value={{
        state: { tabs, activeTab, actions, drawers, detailIds },
        setTabs: (newTabs) => {
          setTabs(newTabs);
          setActiveTab(newTabs[0]?.value ?? "");
        },
        setActiveTab,
        setActions,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        setDetailId,
        clearDetailId,
        // Legacy getters/setters
        isNewCustomerDialogOpen: drawers.newCustomer,
        setNewCustomerDialogOpen: makeDrawerSetter("newCustomer"),
        isNewVehicleDialogOpen: drawers.newVehicle,
        setNewVehicleDialogOpen: makeDrawerSetter("newVehicle"),
        isNewExpenseSheetOpen: drawers.newExpense,
        setNewExpenseSheetOpen: makeDrawerSetter("newExpense"),
        isNewWorkOrderSheetOpen: drawers.newWorkOrder,
        setNewWorkOrderSheetOpen: makeDrawerSetter("newWorkOrder"),
        isNewSupplierSheetOpen: drawers.newSupplier,
        setNewSupplierSheetOpen: makeDrawerSetter("newSupplier"),
        isNewPOSheetOpen: drawers.newPO,
        setNewPOSheetOpen: makeDrawerSetter("newPO"),
        isNewAppointmentSheetOpen: drawers.newAppointment,
        setNewAppointmentSheetOpen: makeDrawerSetter("newAppointment"),
        isNewPartsCarSheetOpen: drawers.newPartsCar,
        setNewPartsCarSheetOpen: makeDrawerSetter("newPartsCar"),
        detailSupplierId: detailIds.supplier,
        setDetailSupplierId: makeDetailSetter("supplier"),
        detailExpenseId: detailIds.expense,
        setDetailExpenseId: makeDetailSetter("expense"),
        detailPOId: detailIds.po,
        setDetailPOId: makeDetailSetter("po"),
        detailVehicleId: detailIds.vehicle,
        setDetailVehicleId: makeDetailSetter("vehicle"),
        detailCustomerId: detailIds.customer,
        setDetailCustomerId: makeDetailSetter("customer"),
        detailPartsCarId: detailIds.partsCar,
        setDetailPartsCarId: makeDetailSetter("partsCar"),
        detailWorkOrderId: detailIds.workOrder,
        setDetailWorkOrderId: makeDetailSetter("workOrder"),
      }}
    >
      {children}
    </PageHeaderContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────

export function usePageHeader() {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) {
    throw new Error("usePageHeader must be used within a PageHeaderProvider");
  }
  return ctx;
}
