import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface UiState {
  sidebarCollapsed: boolean;
  activeFilters: Record<string, string>;
}

interface UiActions {
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
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
        }),
      },
    ),
    { name: "UiStore" },
  ),
);

// ── Selector hooks (avoids unnecessary re-renders) ──────────────────
export const useSidebarCollapsed = () => useUiStore((s) => s.sidebarCollapsed);
export const useActiveFilters = () => useUiStore((s) => s.activeFilters);
export const useFilter = (key: string) =>
  useUiStore((s) => s.activeFilters[key]);
