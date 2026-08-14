import { fireEvent, screen } from "@testing-library/react";
import type * as NextIntl from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MechanicSwitcher } from "@/components/mechanic-switcher";
import { render } from "@/test/test-utils";

const t = vi.hoisted(() => (key: string) => key);
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof NextIntl>("next-intl");
  return { ...actual, useTranslations: () => t };
});

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({ data: { orgId: "org-1" } }),
}));

vi.mock("@/lib/queries/use-profile", () => ({
  useProfile: () => ({ data: { id: "m-1", fullName: "Бат" } }),
}));

vi.mock("@/components/ui/sidebar", () => ({
  useSidebar: () => ({ isMobile: false }),
  SidebarMenuButton: ({ children }: { children?: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children?: React.ReactNode }) => (
    <>{children}</>
  ),
  DropdownMenuContent: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuTrigger: ({
    children,
    render,
  }: {
    children?: React.ReactNode;
    render?: React.ReactNode;
  }) => (
    <>
      {render}
      {children}
    </>
  ),
  DropdownMenuSeparator: () => <hr />,
}));

const addDrawerState = vi.hoisted(() => ({
  open: false,
  onOpenChange: null as null | ((open: boolean) => void),
}));
vi.mock("@/components/new-mechanic-drawer", () => ({
  NewMechanicDrawer: ({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => {
    addDrawerState.open = open;
    addDrawerState.onOpenChange = onOpenChange;
    return open ? <div data-testid="new-mechanic-drawer" /> : null;
  },
}));

const mockFetch = vi.fn();
const MECHANICS = [
  { id: "m-1", full_name: "Бат" },
  { id: "m-2", full_name: "Нара" },
];

describe("MechanicSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: MECHANICS }),
    });
    localStorage.clear();
  });

  it("shows the active mechanic name and count after loading", async () => {
    render(<MechanicSwitcher />);
    expect(await screen.findByText("2 mechanics")).toBeInTheDocument();
    // Trigger + menu item both show the active mechanic
    expect(screen.getAllByText("Бат").length).toBeGreaterThan(0);
  });

  it("switches the active mechanic and persists it to localStorage", async () => {
    render(<MechanicSwitcher />);
    await screen.findByText("2 mechanics");

    fireEvent.click(screen.getByRole("button", { name: /Нара/ }));

    expect(localStorage.getItem("tolom_active_mechanic")).toBe("m-2");
    // Menu item + trigger both show the newly active mechanic
    expect(screen.getAllByText("Нара")).toHaveLength(2);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows the invite flow when there are no mechanics", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
    render(<MechanicSwitcher />);

    expect(await screen.findByText("No mechanics found")).toBeInTheDocument();
    // Empty roster → the trigger subtitle reads "No mechanics"
    expect(await screen.findByText("No mechanics")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Invite mechanic" }));
    expect(addDrawerState.open).toBe(true);
  });
});
