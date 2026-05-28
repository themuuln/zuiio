"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

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
