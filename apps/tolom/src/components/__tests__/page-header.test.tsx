import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PageHeader } from "@/components/page-header";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock hooks
vi.mock("@/hooks/use-navigation", () => ({
  useNavigation: () => ({
    push: vi.fn(),
    searchItems: [],
    breadcrumbs: [],
  }),
}));

vi.mock("@/hooks/use-page-header", () => ({
  usePageHeader: () => ({
    setNewWorkOrderSheetOpen: mockSetNewWorkOrderSheetOpen,
    setNewCustomerDialogOpen: vi.fn(),
    setNewVehicleDialogOpen: vi.fn(),
    setNewExpenseSheetOpen: vi.fn(),
    setNewSupplierSheetOpen: vi.fn(),
    setNewPOSheetOpen: vi.fn(),
    setNewAppointmentSheetOpen: vi.fn(),
    setNewPartsCarSheetOpen: vi.fn(),
  }),
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({ data: { orgId: "org-1" } }),
}));

// Global search: return a customer hit once the query is 2+ characters.
const mockSetNewWorkOrderSheetOpen = vi.fn();
vi.mock("@/lib/queries/use-global-search", () => ({
  useGlobalSearch: (_orgId: string | undefined, query: string) => ({
    data:
      query.trim().length >= 2
        ? {
            customers: [{ id: "c1", name: "Bat Delger", phone: "99112233" }],
            vehicles: [],
            workOrders: [],
            parts: [],
          }
        : undefined,
  }),
}));

// Mock i18n navigation
vi.mock("@/lib/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/dashboard",
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock @/lib/utils
vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

// Mock sidebar (SidebarTrigger requires SidebarProvider context)
vi.mock("@/components/ui/sidebar", () => ({
  SidebarTrigger: ({ ...props }: React.ComponentProps<"button">) => (
    <button data-slot="sidebar-trigger" {...props} />
  ),
}));

describe("PageHeader", () => {
  beforeEach(() => {
    mockSetNewWorkOrderSheetOpen.mockClear();
  });

  it("renders without crashing", () => {
    const { container } = render(<PageHeader />);
    expect(container.textContent).toBeDefined();
  });

  it("opens the search dialog and shows global search results after typing", () => {
    render(<PageHeader />);

    // Open the ⌘K dialog via the search button
    fireEvent.click(screen.getByLabelText("common.search"));

    // Type a query ≥ 2 chars — data groups replace quick-create
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "bat" },
    });

    expect(screen.getByText("globalSearch.customers")).toBeInTheDocument();
    expect(screen.getByText("Bat Delger")).toBeInTheDocument();
    expect(screen.getByText("99112233")).toBeInTheDocument();
    // Quick create is hidden while searching
    expect(screen.queryByText("common.quickCreate")).not.toBeInTheDocument();
  });

  it("opens the shortcut help overlay when ? is pressed", () => {
    render(<PageHeader />);

    fireEvent.keyDown(window, { key: "?" });

    expect(screen.getByText("shortcuts.title")).toBeInTheDocument();
    expect(screen.getByText("shortcuts.newWorkOrder")).toBeInTheDocument();
  });

  it("opens the new work order drawer when N is pressed outside an input", () => {
    render(<PageHeader />);

    fireEvent.keyDown(window, { key: "n" });

    expect(mockSetNewWorkOrderSheetOpen).toHaveBeenCalledWith(true);
  });

  it("does not fire the N shortcut while typing in an input", () => {
    render(<PageHeader />);

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    fireEvent.keyDown(window, { key: "n" });
    input.remove();

    expect(mockSetNewWorkOrderSheetOpen).not.toHaveBeenCalled();
  });
});
