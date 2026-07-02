"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

export interface PageTab {
  value: string;
  label: string;
}

// ─── Sheet / Detail ID Registry ───────────────────────────────

const SHEET_NAMES = [
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

type SheetName = (typeof SHEET_NAMES)[number];
type DetailName = (typeof DETAIL_NAMES)[number];

const INITIAL_SHEETS = Object.fromEntries(
  SHEET_NAMES.map((name) => [name, false]),
) as Record<SheetName, boolean>;

const INITIAL_DETAILS = Object.fromEntries(
  DETAIL_NAMES.map((name) => [name, null]),
) as Record<DetailName, string | null>;

// ─── Context ──────────────────────────────────────────────────

interface PageHeaderContextValue {
  state: PageHeaderState;
  setTabs: (tabs: PageTab[]) => void;
  setActiveTab: (tab: string) => void;
  setActions: (actions: ReactNode) => void;
  // Sheet controls
  openSheet: (name: SheetName) => void;
  closeSheet: (name: SheetName) => void;
  toggleSheet: (name: SheetName) => void;
  // Detail ID controls
  setDetailId: (name: DetailName, id: string | null) => void;
  clearDetailId: (name: DetailName) => void;
  // Legacy getters (for backward compat — new code should use openSheet/closeSheet)
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
  sheets: Record<SheetName, boolean>;
  detailIds: Record<DetailName, string | null>;
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<PageTab[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [actions, setActions] = useState<ReactNode>(null);
  const [sheets, setSheets] =
    useState<Record<SheetName, boolean>>(INITIAL_SHEETS);
  const [detailIds, setDetailIds] =
    useState<Record<DetailName, string | null>>(INITIAL_DETAILS);

  const openSheet = (name: SheetName) =>
    setSheets((prev) => ({ ...prev, [name]: true }));
  const closeSheet = (name: SheetName) =>
    setSheets((prev) => ({ ...prev, [name]: false }));
  const toggleSheet = (name: SheetName) =>
    setSheets((prev) => ({ ...prev, [name]: !prev[name] }));

  const setDetailId = (name: DetailName, id: string | null) =>
    setDetailIds((prev) => ({ ...prev, [name]: id }));
  const clearDetailId = (name: DetailName) =>
    setDetailIds((prev) => ({ ...prev, [name]: null }));

  // Legacy wrapper: convert per-feature setter to generic one
  const makeSheetSetter = (name: SheetName) => (open: boolean) =>
    open ? openSheet(name) : closeSheet(name);

  const makeDetailSetter = (name: DetailName) => (id: string | null) =>
    setDetailId(name, id);

  return (
    <PageHeaderContext.Provider
      value={{
        state: { tabs, activeTab, actions, sheets, detailIds },
        setTabs: (newTabs) => {
          setTabs(newTabs);
          setActiveTab(newTabs[0]?.value ?? "");
        },
        setActiveTab,
        setActions,
        openSheet,
        closeSheet,
        toggleSheet,
        setDetailId,
        clearDetailId,
        // Legacy getters/setters
        isNewCustomerDialogOpen: sheets.newCustomer,
        setNewCustomerDialogOpen: makeSheetSetter("newCustomer"),
        isNewVehicleDialogOpen: sheets.newVehicle,
        setNewVehicleDialogOpen: makeSheetSetter("newVehicle"),
        isNewExpenseSheetOpen: sheets.newExpense,
        setNewExpenseSheetOpen: makeSheetSetter("newExpense"),
        isNewWorkOrderSheetOpen: sheets.newWorkOrder,
        setNewWorkOrderSheetOpen: makeSheetSetter("newWorkOrder"),
        isNewSupplierSheetOpen: sheets.newSupplier,
        setNewSupplierSheetOpen: makeSheetSetter("newSupplier"),
        isNewPOSheetOpen: sheets.newPO,
        setNewPOSheetOpen: makeSheetSetter("newPO"),
        isNewAppointmentSheetOpen: sheets.newAppointment,
        setNewAppointmentSheetOpen: makeSheetSetter("newAppointment"),
        isNewPartsCarSheetOpen: sheets.newPartsCar,
        setNewPartsCarSheetOpen: makeSheetSetter("newPartsCar"),
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
