"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
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
  hasSidebar: boolean;
}

interface RightSidebarContextValue {
  state: RightSidebarState;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  setActiveTab: (tab: string) => void;
  setHasSidebar: (has: boolean) => void;
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
    hasSidebar: true,
  });

  const setOpen = useCallback(
    (open: boolean) =>
      setState((prev) =>
        prev.isOpen === open ? prev : { ...prev, isOpen: open },
      ),
    [],
  );

  const toggle = useCallback(
    () => setState((prev) => ({ ...prev, isOpen: !prev.isOpen })),
    [],
  );

  const setHasSidebar = useCallback(
    (has: boolean) =>
      setState((prev) =>
        prev.hasSidebar === has ? prev : { ...prev, hasSidebar: has },
      ),
    [],
  );

  const setActiveTab = useCallback(
    (tab: string) =>
      setState((prev) =>
        prev.activeTab === tab ? prev : { ...prev, activeTab: tab },
      ),
    [],
  );

  const registerTab = useCallback(
    (value: string, label: string, content: ReactNode, icon?: ReactNode) =>
      setState((prev) => {
        const existing = prev.tabs.find((t) => t.value === value);
        // Bail out early if tab already registered — prevents cascading
        // re-renders when a context consumer re-fires from a state change.
        if (existing) return prev;
        return {
          ...prev,
          tabs: [...prev.tabs, { value, label, icon }],
          activeTab: prev.activeTab || value,
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
      setHasSidebar,
      registerTab,
      unregisterTab,
    }),
    [
      state,
      setOpen,
      toggle,
      setActiveTab,
      setHasSidebar,
      registerTab,
      unregisterTab,
    ],
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
