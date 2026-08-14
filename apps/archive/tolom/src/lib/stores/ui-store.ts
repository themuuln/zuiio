import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface UiState {
  sidebarCollapsed: boolean;
  selectedBranchId: string;
  lastOrgId: string | null;
  activeFilters: Record<string, string>;
}

interface UiActions {
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSelectedBranchId: (id: string) => void;
  setOrgId: (orgId: string) => void;
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;
}

type UiStore = UiState & UiActions;

export const useUiStore = create<UiStore>()(
  devtools(
    persist(
      immer((set) => ({
        // State
        sidebarCollapsed: false,
        selectedBranchId: "all",
        lastOrgId: null,
        activeFilters: {},

        // Actions
        toggleSidebar: () =>
          set((s) => {
            s.sidebarCollapsed = !s.sidebarCollapsed;
          }),
        setSidebarCollapsed: (collapsed) =>
          set((s) => {
            s.sidebarCollapsed = collapsed;
          }),
        setSelectedBranchId: (id) =>
          set((s) => {
            s.selectedBranchId = id;
          }),
        setOrgId: (orgId) =>
          set((s) => {
            // If the org changed, reset branch selection to "all"
            if (s.lastOrgId !== null && s.lastOrgId !== orgId) {
              s.selectedBranchId = "all";
            }
            s.lastOrgId = orgId;
          }),
        setFilter: (key, value) =>
          set((s) => {
            s.activeFilters[key] = value;
          }),
        clearFilters: () =>
          set((s) => {
            s.activeFilters = {};
          }),
      })),
      {
        name: "tolom-ui",
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          selectedBranchId: state.selectedBranchId,
          lastOrgId: state.lastOrgId,
        }),
      },
    ),
    { name: "UiStore" },
  ),
);

// ── Selector hooks (avoids unnecessary re-renders) ──────────────────
export const useSidebarCollapsed = () => useUiStore((s) => s.sidebarCollapsed);
export const useSelectedBranchId = () => useUiStore((s) => s.selectedBranchId);
export const useSetSelectedBranchId = () =>
  useUiStore((s) => s.setSelectedBranchId);
export const useActiveFilters = () => useUiStore((s) => s.activeFilters);
export const useFilter = (key: string) =>
  useUiStore((s) => s.activeFilters[key]);
export const useSetOrgId = () => useUiStore((s) => s.setOrgId);
