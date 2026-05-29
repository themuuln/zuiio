import { describe, expect, it, beforeEach } from "vitest";
import { useUiStore } from "./ui-store";

describe("UiStore", () => {
  beforeEach(() => {
    useUiStore.setState({
      sidebarCollapsed: false,
      activeFilters: {},
    });
  });

  describe("sidebar", () => {
    it("toggles collapsed state", () => {
      expect(useUiStore.getState().sidebarCollapsed).toBe(false);
      useUiStore.getState().toggleSidebar();
      expect(useUiStore.getState().sidebarCollapsed).toBe(true);
      useUiStore.getState().toggleSidebar();
      expect(useUiStore.getState().sidebarCollapsed).toBe(false);
    });

    it("sets collapsed directly", () => {
      useUiStore.getState().setSidebarCollapsed(true);
      expect(useUiStore.getState().sidebarCollapsed).toBe(true);
    });
  });

  describe("filters", () => {
    it("sets a filter", () => {
      useUiStore.getState().setFilter("status", "active");
      expect(useUiStore.getState().activeFilters.status).toBe("active");
    });

    it("sets multiple filters", () => {
      useUiStore.getState().setFilter("status", "active");
      useUiStore.getState().setFilter("type", "oil-change");
      expect(useUiStore.getState().activeFilters).toEqual({
        status: "active",
        type: "oil-change",
      });
    });

    it("clears all filters", () => {
      useUiStore.getState().setFilter("status", "active");
      useUiStore.getState().clearFilters();
      expect(useUiStore.getState().activeFilters).toEqual({});
    });
  });
});
