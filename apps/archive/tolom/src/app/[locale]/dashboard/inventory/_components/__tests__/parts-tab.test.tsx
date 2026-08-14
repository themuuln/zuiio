import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { PartsTab } from "../parts-tab";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useLocale: () => "en",
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// ── Hook mocks ─────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  usePartsCatalog: vi.fn(),
  useInventoryBalances: vi.fn(),
  useStockThresholds: vi.fn(),
  useGlobalPartsCatalog: vi.fn(),
  useDeletePart: vi.fn(),
  useUpdatePart: vi.fn(),
  usePartCategories: vi.fn(),
  useCreatePartCategory: vi.fn(),
  useCreatePart: vi.fn(),
  useSaveThreshold: vi.fn(),
  useCurrentOrg: vi.fn(),
}));

vi.mock("@/hooks/use-client-now", () => ({
  useClientNow: () => new Date("2026-01-15T10:00:00.000Z"),
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: (...args: unknown[]) => mocks.useCurrentOrg(...args),
}));

vi.mock("@/lib/queries/use-inventory", () => ({
  usePartsCatalog: (...args: unknown[]) => mocks.usePartsCatalog(...args),
  useInventoryBalances: (...args: unknown[]) =>
    mocks.useInventoryBalances(...args),
  useStockThresholds: (...args: unknown[]) => mocks.useStockThresholds(...args),
  useGlobalPartsCatalog: (...args: unknown[]) =>
    mocks.useGlobalPartsCatalog(...args),
  useDeletePart: (...args: unknown[]) => mocks.useDeletePart(...args),
  useUpdatePart: (...args: unknown[]) => mocks.useUpdatePart(...args),
  usePartCategories: (...args: unknown[]) => mocks.usePartCategories(...args),
  useCreatePartCategory: (...args: unknown[]) =>
    mocks.useCreatePartCategory(...args),
}));

vi.mock("@/lib/queries/use-thresholds", () => ({
  useSaveThreshold: (...args: unknown[]) => mocks.useSaveThreshold(...args),
}));

vi.mock("@/lib/queries/use-wizard-data", () => ({
  useCreatePart: (...args: unknown[]) => mocks.useCreatePart(...args),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

vi.mock("@/components/inventory/part-photo-upload", () => ({
  default: () => <div data-testid="part-photo-upload-mock" />,
}));

// ── Fixtures ───────────────────────────────────────────────────────
const part1 = {
  id: "p1",
  name: "Oil Filter",
  name_mn: "Тосны шүүлтүүр",
  part_number: "OF-101",
  category: "Filters",
  unit: "pcs",
  default_price: 15000,
  purchase_price: 12000,
  is_active: true,
  global_part_id: "g1",
  popularity_score: 90,
};

const part2 = {
  id: "p2",
  name: "Brake Pad",
  name_mn: "Тормозны бул",
  part_number: "BP-22",
  category: "Brakes",
  unit: "set",
  default_price: null,
  purchase_price: null,
  is_active: true,
};

const global1 = {
  id: "g1",
  name: "Oil Filter",
  name_mn: "Тосны шүүлтүүр",
  part_number: "OF-101",
  category: "Filters",
  unit: "pcs",
  is_active: true,
};

const global2 = {
  id: "g2",
  name: "Air Filter",
  name_mn: "Агаар шүүлтүүр",
  part_number: "AF-1",
  category: "Filters",
  unit: "pcs",
  is_active: true,
};

function defaultHooks() {
  mocks.useCurrentOrg.mockReturnValue({
    data: { orgId: "org-1" },
    isLoading: false,
  });
  mocks.usePartsCatalog.mockReturnValue({
    data: [part1, part2],
    isPending: false,
    isError: false,
    error: null,
  });
  mocks.useInventoryBalances.mockReturnValue({
    data: [
      { part_id: "p1", quantity_on_hand: 3 },
      { part_id: "p2", quantity_on_hand: 0 },
    ],
  });
  mocks.useStockThresholds.mockReturnValue({
    data: [{ part_id: "p1", minimum_quantity: 5 }],
  });
  mocks.useGlobalPartsCatalog.mockReturnValue({
    data: [global1, global2],
    isPending: false,
    isError: false,
    error: null,
  });
  mocks.useDeletePart.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  });
  mocks.useSaveThreshold.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });
  mocks.useCreatePart.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({ id: "new-1" }),
    isPending: false,
  });
  mocks.useUpdatePart.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({ id: "p1" }),
    isPending: false,
  });
  mocks.usePartCategories.mockReturnValue({ data: [{ name: "Filters" }] });
  mocks.useCreatePartCategory.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({ name: "New" }),
  });
}

function renderTab(props: Record<string, unknown> = {}) {
  return render(
    <PartsTab
      orgId="org-1"
      branchFilter={null}
      search=""
      onSearchChange={vi.fn()}
      onNavigate={vi.fn()}
      {...props}
    />,
  );
}

function q(name: string): HTMLInputElement | null {
  return document.querySelector(`input[name="${name}"]`);
}

let fetchSpy: ReturnType<typeof vi.spyOn> | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  defaultHooks();
});

afterEach(() => {
  fetchSpy?.mockRestore();
  fetchSpy = undefined;
});

describe("PartsTab — inventory view", () => {
  it("renders the table skeleton while parts are loading", () => {
    mocks.usePartsCatalog.mockReturnValue({
      data: [],
      isPending: true,
      isError: false,
      error: null,
    });
    const { container } = renderTab();
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("noParts")).not.toBeInTheDocument();
  });

  it("shows an error alert when the parts query fails", () => {
    mocks.usePartsCatalog.mockReturnValue({
      data: [],
      isPending: false,
      isError: true,
      error: new Error("boom"),
    });
    renderTab();
    expect(screen.getByText("inventory.errorLoadingParts")).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  it("shows the empty state and opens the add drawer from it", async () => {
    mocks.usePartsCatalog.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    renderTab();
    expect(screen.getByText("noParts")).toBeInTheDocument();
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "addFirstPart" }));
    });
    await waitFor(() => {
      expect(screen.getByText("addPart")).toBeInTheDocument();
    });
  });

  it("renders part rows with balances, prices, popularity and stock status", () => {
    renderTab();
    // Desktop + mobile card views both render the row content
    expect(screen.getAllByRole("link", { name: "Oil Filter" }).length).toBe(2);
    expect(screen.getAllByText("Filters").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₮ 15,000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("3 pcs").length).toBeGreaterThan(0);
    expect(screen.getAllByText("lowStock").length).toBeGreaterThan(0);
    expect(screen.getAllByText("OF-101").length).toBeGreaterThan(0);
    // popularity badge
    expect(screen.getAllByText("90").length).toBeGreaterThan(0);
    // Brake Pad has 0 on hand → out of stock
    expect(screen.getAllByText("outOfStock").length).toBeGreaterThan(0);
    // p2 has no threshold → badge announces it
    expect(screen.getByText("partsNoThreshold")).toBeInTheDocument();
    expect(screen.getByText("2 parts")).toBeInTheDocument();
  });

  it("filters the list by the search prop", () => {
    const onSearchChange = vi.fn();
    const { rerender } = renderTab({ search: "brake", onSearchChange });
    expect(screen.getAllByRole("link", { name: "Brake Pad" }).length).toBe(2);
    expect(screen.queryByRole("link", { name: "Oil Filter" })).toBeNull();
    expect(screen.getByText("1 parts")).toBeInTheDocument();

    rerender(
      <PartsTab
        orgId="org-1"
        branchFilter={null}
        search="zzz"
        onSearchChange={onSearchChange}
        onNavigate={vi.fn()}
      />,
    );
    expect(screen.queryByRole("link", { name: "Brake Pad" })).toBeNull();
    expect(screen.getByText("0 parts")).toBeInTheDocument();
  });

  it("navigates to movements when the record-movement button is clicked", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    renderTab({ onNavigate });
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "recordMovement" }));
    });
    expect(onNavigate).toHaveBeenCalledWith("movements");
  });
});

describe("PartsTab — global catalog view", () => {
  it("switches tabs and renders global parts with local-copy status", async () => {
    const user = userEvent.setup();
    renderTab();
    await act(async () => {
      await user.click(screen.getByRole("tab", { name: "tabGlobalCatalog" }));
    });
    expect(screen.getAllByText("Air Filter").length).toBeGreaterThan(0);
    expect(screen.getAllByText("AF-1").length).toBeGreaterThan(0);
    // g1 exists in the local catalog → inInventory badge; g2 does not
    expect(screen.getAllByText("inInventory").length).toBeGreaterThan(0);
    expect(screen.getByText("2 parts in global catalog")).toBeInTheDocument();
  });

  it("shows the skeleton while the global catalog loads", async () => {
    mocks.useGlobalPartsCatalog.mockReturnValue({
      data: [],
      isPending: true,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    const { container } = renderTab();
    await act(async () => {
      await user.click(screen.getByRole("tab", { name: "tabGlobalCatalog" }));
    });
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
  });

  it("shows an error alert when the global catalog query fails", async () => {
    mocks.useGlobalPartsCatalog.mockReturnValue({
      data: [],
      isPending: false,
      isError: true,
      error: new Error("gboom"),
    });
    const user = userEvent.setup();
    renderTab();
    await act(async () => {
      await user.click(screen.getByRole("tab", { name: "tabGlobalCatalog" }));
    });
    expect(
      screen.getByText("inventory.errorLoadingGlobal"),
    ).toBeInTheDocument();
    expect(screen.getByText("gboom")).toBeInTheDocument();
  });

  it("forks a global part into the local catalog with the global id in the payload", async () => {
    mocks.useGlobalPartsCatalog.mockReturnValue({
      data: [global2],
      isPending: false,
      isError: false,
      error: null,
    });
    const mutateAsync = vi.fn().mockResolvedValue({ id: "new-1" });
    mocks.useCreatePart.mockReturnValue({ mutateAsync, isPending: false });
    const user = userEvent.setup();
    renderTab();
    await act(async () => {
      await user.click(screen.getByRole("tab", { name: "tabGlobalCatalog" }));
    });
    await act(async () => {
      await user.click(
        screen.getAllByRole("button", { name: "editLocalCopy" })[0],
      );
    });
    await waitFor(() => {
      expect(screen.getByText("edit: Air Filter")).toBeInTheDocument();
    });
    // The drawer header renders before the lazy-loaded PartForm mounts —
    // wait for the actual form so the footer submit button finds it.
    await waitFor(() => {
      expect(
        document.querySelector('form[id="add-part-drawer-form"]'),
      ).toBeInTheDocument();
    });
    // The form is prefilled from the global part's fields (forkingData)
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "save" }));
    });
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          global_part_id: "g2",
          name: "Air Filter",
          name_mn: "Агаар шүүлтүүр",
          part_number: "AF-1",
        }),
      );
    });
    expect(toast.success).toHaveBeenCalledWith("forkSuccess");
    await waitFor(() => {
      expect(screen.queryByText("edit: Air Filter")).not.toBeInTheDocument();
    });
  });
});

describe("PartsTab — part interactions", () => {
  it("submits the add-part form with the entered payload", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: "new-1" });
    mocks.useCreatePart.mockReturnValue({ mutateAsync, isPending: false });
    const user = userEvent.setup();
    renderTab();
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Add Part" }));
    });
    await waitFor(() => {
      expect(screen.getByText("addPart")).toBeInTheDocument();
    });
    // Wait for the lazy-loaded PartForm to mount before filling/submitting
    await waitFor(() => {
      expect(
        document.querySelector('form[id="add-part-drawer-form"]'),
      ).toBeInTheDocument();
    });
    await act(async () => {
      await user.type(
        screen.getByPlaceholderText("Тосны шүүлтүүр"),
        "Хөргөлтийн шингэн",
      );
      await user.type(
        screen.getByPlaceholderText("e.g. Oil Filter"),
        "Coolant",
      );
    });
    await act(async () => {
      await user.type(required(q("part_number"), "part_number"), "CL-5");
    });
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "create" }));
    });
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name_mn: "Хөргөлтийн шингэн",
          name: "Coolant",
          part_number: "CL-5",
          unit: "piece",
          global_part_id: undefined,
        }),
      );
    });
    expect(toast.success).toHaveBeenCalledWith("partCreated");
    await waitFor(() => {
      expect(screen.queryByText("addPart")).not.toBeInTheDocument();
    });
  });

  it("saves an inline stock threshold for a part", async () => {
    mocks.useStockThresholds.mockReturnValue({
      data: [{ part_id: "p1", minimum_quantity: 2 }],
    });
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    mocks.useSaveThreshold.mockReturnValue({ mutateAsync, isPending: false });
    const user = userEvent.setup();
    renderTab();
    await act(async () => {
      await user.click(screen.getAllByRole("button", { name: "2" })[0]);
    });
    const input = screen.getAllByDisplayValue("2")[0] as HTMLInputElement;
    await act(async () => {
      await user.clear(input);
      await user.type(input, "8");
      await user.keyboard("{Enter}");
    });
    await act(async () => {
      await user.click(screen.getAllByRole("button", { name: "Save" })[0]);
    });
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        partId: "p1",
        minimumQuantity: 8,
      });
    });
  });

  it("deletes a part after confirming the dialog", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    mocks.useDeletePart.mockReturnValue({ mutateAsync, isPending: false });
    const user = userEvent.setup();
    renderTab();
    await act(async () => {
      await user.click(screen.getAllByTitle("delete")[0]);
    });
    await waitFor(() => {
      expect(screen.getByText("deletePart")).toBeInTheDocument();
    });
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/deletePartConfirm/i)).toBeInTheDocument();
    await act(async () => {
      await user.click(within(dialog).getByRole("button", { name: "delete" }));
    });
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith("p1");
    });
    await waitFor(() => {
      expect(screen.queryByText("deletePart")).not.toBeInTheDocument();
    });
  });

  it("opens the view drawer with part details", async () => {
    const user = userEvent.setup();
    renderTab();
    await act(async () => {
      await user.click(screen.getAllByTitle("View")[0]);
    });
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Oil Filter")).toBeInTheDocument();
    expect(within(dialog).getByText("₮ 15,000")).toBeInTheDocument();
    expect(within(dialog).getByText("3 pcs")).toBeInTheDocument();
    expect(within(dialog).getByText("Filters")).toBeInTheDocument();
  });

  it("sets a default threshold for parts without one via the dialog", async () => {
    const fetchSpyLocal = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ json: async () => ({}) } as Response);
    fetchSpy = fetchSpyLocal;
    const user = userEvent.setup();
    renderTab();
    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: "setDefaultThreshold" }),
      );
    });
    await waitFor(() => {
      expect(
        screen.getByText("defaultThresholdDescription"),
      ).toBeInTheDocument();
    });
    const input = screen.getByDisplayValue("5") as HTMLInputElement;
    await act(async () => {
      await user.clear(input);
      await user.type(input, "8");
      await user.keyboard("{Enter}");
    });
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "confirm" }));
    });
    await waitFor(() => {
      expect(fetchSpyLocal).toHaveBeenCalledWith(
        "/api/organizations/org-1/inventory/thresholds",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"part_id":"p2"'),
        }),
      );
    });
    expect(fetchSpyLocal.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        body: expect.stringContaining('"minimum_quantity":8'),
      }),
    );
    expect(toast.success).toHaveBeenCalledWith("thresholdSet");
    await waitFor(() => {
      expect(
        screen.queryByText("defaultThresholdDescription"),
      ).not.toBeInTheDocument();
    });
  });
});

function required<T>(value: T | null | undefined, name: string): T {
  if (!value) throw new Error(`Expected ${name} input in DOM`);
  return value;
}
