"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface SidebarTab {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface RightSidebarState {
  isOpen: boolean;
  activeTab: string;
  tabs: SidebarTab[];
  content: Record<string, ReactNode>;
}

interface RightSidebarContextValue {
  state: RightSidebarState;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  setActiveTab: (tab: string) => void;
  registerTab: (
    value: string,
    label: string,
    content: ReactNode,
    icon?: ReactNode,
  ) => void;
  unregisterTab: (value: string) => void;
}

const RightSidebarContext = createContext<RightSidebarContextValue | null>(
  null,
);

export function RightSidebarProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RightSidebarState>({
    isOpen: false,
    activeTab: "",
    tabs: [],
    content: {},
  });

  const setOpen = useCallback(
    (open: boolean) => setState((prev) => ({ ...prev, isOpen: open })),
    [],
  );

  const toggle = useCallback(
    () => setState((prev) => ({ ...prev, isOpen: !prev.isOpen })),
    [],
  );

  const setActiveTab = useCallback(
    (tab: string) => setState((prev) => ({ ...prev, activeTab: tab })),
    [],
  );

  const registerTab = useCallback(
    (value: string, label: string, content: ReactNode, icon?: ReactNode) =>
      setState((prev) => {
        const exists = prev.tabs.some((t) => t.value === value);
        const tabs = exists
          ? prev.tabs.map((t) =>
              t.value === value ? { ...t, icon: icon ?? t.icon } : t,
            )
          : [...prev.tabs, { value, label, icon }];
        const activeTab = prev.activeTab || value;
        return {
          ...prev,
          tabs,
          activeTab,
          content: { ...prev.content, [value]: content },
        };
      }),
    [],
  );

  const unregisterTab = useCallback(
    (value: string) =>
      setState((prev) => {
        const tabs = prev.tabs.filter((t) => t.value !== value);
        const { [value]: _, ...content } = prev.content;
        const activeTab =
          prev.activeTab === value ? (tabs[0]?.value ?? "") : prev.activeTab;
        return {
          ...prev,
          tabs,
          content,
          activeTab,
          isOpen: tabs.length > 0 ? prev.isOpen : false,
        };
      }),
    [],
  );

  const ctxValue = useMemo(
    () => ({
      state,
      setOpen,
      toggle,
      setActiveTab,
      registerTab,
      unregisterTab,
    }),
    [state, setOpen, toggle, setActiveTab, registerTab, unregisterTab],
  );

  return (
    <RightSidebarContext.Provider value={ctxValue}>
      {children}
    </RightSidebarContext.Provider>
  );
}

export function useRightSidebar() {
  const ctx = useContext(RightSidebarContext);
  if (!ctx) {
    throw new Error(
      "useRightSidebar must be used within a RightSidebarProvider",
    );
  }
  return ctx;
}
