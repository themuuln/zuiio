import { screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { DrawerContentPanel } from "../_drawer-content-panel";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
    useLocale: () => "en",
  };
});

// Render dynamically-imported sections synchronously from their mocked modules.
// The real importers resolve to the component itself (`.then((m) => m.X)`).
vi.mock("next/dynamic", () => ({
  default: (importFn: () => Promise<React.ComponentType>) => {
    const DynamicComponent = (props: Record<string, unknown>) => {
      const [Comp, setComp] = React.useState<React.ComponentType | null>(null);
      React.useEffect(() => {
        let mounted = true;
        importFn().then((resolved) => {
          if (!mounted) return;
          const component =
            typeof resolved === "function"
              ? resolved
              : Object.values(resolved)[0];
          // Updater form: the resolved value may itself be a function
          setComp(() => component);
        });
        return () => {
          mounted = false;
        };
      }, []);
      if (!Comp) return null;
      return <Comp {...props} />;
    };
    return DynamicComponent;
  },
}));

vi.mock("@/components/bay-view-v2/_services-section", () => ({
  ServicesSection: ({ services }: { services: unknown[] }) => (
    <div data-testid="services-section">services:{services.length}</div>
  ),
}));

vi.mock("@/components/bay-view-v2/_parts-section", () => ({
  PartsSection: ({ parts }: { parts: unknown[] }) => (
    <div data-testid="parts-section">parts:{parts.length}</div>
  ),
}));

vi.mock("@/components/bay-view-v2/_notes-section", () => ({
  NotesSection: ({ complaint }: { complaint: string | null }) => (
    <div data-testid="notes-section">notes:{complaint ?? "none"}</div>
  ),
}));

vi.mock("@/components/bay-view-v2/_drawer-sidebar", () => ({
  DrawerSidebar: ({
    wo,
    onShowCustomerPicker,
  }: {
    wo: { customer: { first_name: string } | null };
    onShowCustomerPicker: () => void;
  }) => (
    <div data-testid="drawer-sidebar">
      customer:{wo.customer?.first_name ?? "none"}
      <button type="button" onClick={onShowCustomerPicker}>
        pick
      </button>
    </div>
  ),
}));

const wo = {
  id: "wo-1",
  status: "New",
  complaint: "Noise",
  diagnosis: null,
  notes: null,
  services: [{ id: "s-1" }],
  parts: [],
  customer: { first_name: "Дорж", last_name: "Бат", phone: null },
} as never;

const baseProps = {
  wo,
  orgId: "org-1",
  workOrderId: "wo-1",
  catalog: [],
  partsCatalog: [],
  onAddServiceOpenChange: vi.fn(),
  onEditServicePriceSave: vi.fn(),
  onEditServiceQtySave: vi.fn(),
  onAddPartOpenChange: vi.fn(),
  onEditPartPriceSave: vi.fn(),
  onEditPartQtySave: vi.fn(),
  onNotesUpdated: vi.fn(),
  mechanics: [],
  helpers: [],
  onAssignMechanic: vi.fn(),
  onHelpersChange: vi.fn(),
  onShowCustomerPicker: vi.fn(),
};

describe("DrawerContentPanel", () => {
  it("renders the services, parts and notes sections", async () => {
    render(<DrawerContentPanel {...baseProps} />);
    await waitFor(() =>
      expect(screen.getByTestId("services-section")).toBeTruthy(),
    );
    expect(screen.getByTestId("services-section").textContent).toBe(
      "services:1",
    );
    expect(screen.getByTestId("parts-section").textContent).toBe("parts:0");
    expect(screen.getByTestId("notes-section").textContent).toBe("notes:Noise");
  });

  it("renders the sidebar with the customer in fullscreen mode", async () => {
    render(<DrawerContentPanel {...baseProps} isFullScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("drawer-sidebar")).toBeTruthy(),
    );
    expect(screen.getByTestId("drawer-sidebar").textContent).toContain(
      "customer:Дорж",
    );
  });

  it("renders the sidebar below content in compact mode", async () => {
    render(<DrawerContentPanel {...baseProps} />);
    await waitFor(() =>
      expect(screen.getByTestId("drawer-sidebar")).toBeTruthy(),
    );
    expect(screen.getByTestId("drawer-sidebar").textContent).toContain(
      "customer:Дорж",
    );
  });
});
