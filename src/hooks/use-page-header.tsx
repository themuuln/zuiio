"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

export interface PageTab {
  value: string;
  label: string;
}

interface PageHeaderState {
  tabs: PageTab[];
  activeTab: string;
  actions: ReactNode;
}

interface PageHeaderContextValue {
  state: PageHeaderState;
  setTabs: (tabs: PageTab[]) => void;
  setActiveTab: (tab: string) => void;
  setActions: (actions: ReactNode) => void;
  isNewCustomerDialogOpen: boolean;
  setNewCustomerDialogOpen: (open: boolean) => void;
  isNewVehicleDialogOpen: boolean;
  setNewVehicleDialogOpen: (open: boolean) => void;
  isNewExpenseSheetOpen: boolean;
  setNewExpenseSheetOpen: (open: boolean) => void;
  isNewWorkOrderSheetOpen: boolean;
  setNewWorkOrderSheetOpen: (open: boolean) => void;
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
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PageHeaderState>({
    tabs: [],
    activeTab: "",
    actions: null,
  });
  const [isNewCustomerDialogOpen, setNewCustomerDialogOpen] = useState(false);
  const [isNewVehicleDialogOpen, setNewVehicleDialogOpen] = useState(false);
  const [isNewExpenseSheetOpen, setNewExpenseSheetOpen] = useState(false);
  const [isNewWorkOrderSheetOpen, setNewWorkOrderSheetOpen] = useState(false);
  const [detailSupplierId, setDetailSupplierId] = useState<string | null>(null);
  const [detailExpenseId, setDetailExpenseId] = useState<string | null>(null);
  const [detailPOId, setDetailPOId] = useState<string | null>(null);
  const [detailVehicleId, setDetailVehicleId] = useState<string | null>(null);
  const [detailCustomerId, setDetailCustomerId] = useState<string | null>(null);
  const [detailPartsCarId, setDetailPartsCarId] = useState<string | null>(null);

  const setTabs = (tabs: PageTab[]) =>
    setState((prev) => ({ ...prev, tabs, activeTab: tabs[0]?.value ?? "" }));
  const setActiveTab = (tab: string) =>
    setState((prev) => ({ ...prev, activeTab: tab }));
  const setActions = (actions: ReactNode) =>
    setState((prev) => ({ ...prev, actions }));

  return (
    <PageHeaderContext.Provider
      value={{
        state,
        setTabs,
        setActiveTab,
        setActions,
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
      }}
    >
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader() {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) {
    throw new Error("usePageHeader must be used within a PageHeaderProvider");
  }
  return ctx;
}
