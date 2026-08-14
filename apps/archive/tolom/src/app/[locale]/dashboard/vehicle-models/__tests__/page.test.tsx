import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { vehicleModelKeys } from "@/lib/queries/keys";
import VehicleModelsPage from "../page";

// ── Mock state (hoisted so mock factories can reference it) ─────────
const mocks = vi.hoisted(() => ({
  useCurrentOrg: vi.fn(),
  deleteMutate: vi.fn(),
  useFuzzySearch: vi.fn(),
}));

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("@zuiio/hooks", () => ({
  useFuzzySearch: mocks.useFuzzySearch,
}));

vi.mock("@zuiio/query", () => ({
  useOrgMutation: () => ({
    mutate: mocks.deleteMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: mocks.useCurrentOrg,
}));

vi.mock("@/hooks/use-client-now", () => ({
  useClientNow: () => new Date("2026-08-10T00:00:00.000Z"),
}));

vi.mock("@/components/export-button", () => ({
  ExportButton: () => <div data-testid="export-button" />,
}));

vi.mock("@/components/list-toolbar", () => ({
  ListToolbar: ({
    search,
    stats,
    actions,
  }: {
    search: {
      placeholder: string;
      value: string;
      onChange: (value: string) => void;
    };
    stats: ReactNode;
    actions: ReactNode;
  }) => (
    <div data-testid="list-toolbar">
      <input
        aria-label="search-models"
        placeholder={search.placeholder}
        value={search.value}
        onChange={(event) => search.onChange(event.target.value)}
      />
      <div data-testid="toolbar-stats">{stats}</div>
      <div data-testid="toolbar-actions">{actions}</div>
    </div>
  ),
}));

vi.mock("../_vehicle-model-form-drawer", () => ({
  VehicleModelFormDrawer: ({
    mode,
    item,
    open,
  }: {
    mode: string;
    item: { id: string } | null;
    open: boolean;
  }) => (
    <div
      data-testid="model-form-drawer"
      data-mode={mode}
      data-item-id={item?.id ?? ""}
      data-open={String(open)}
    />
  ),
}));

vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
    open ? <div data-testid="alert-dialog">{children}</div> : null,
  AlertDialogContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogHeader: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogTitle: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogDescription: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogFooter: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogCancel: ({ children }: { children: ReactNode }) => (
    <button type="button">{children}</button>
  ),
  AlertDialogAction: ({
    children,
    onClick,
    disabled,
  }: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/collapsible", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  const CollapsibleContext = React.createContext<{
    open: boolean;
    toggle: () => void;
  }>({ open: false, toggle: () => {} });

  function MockCollapsible({
    open: controlledOpen,
    onOpenChange,
    children,
  }: {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: ReactNode;
  }) {
    const [open, setOpen] = React.useState(controlledOpen ?? false);
    React.useEffect(() => {
      setOpen(controlledOpen ?? false);
    }, [controlledOpen]);
    const toggle = () => {
      const next = !open;
      setOpen(next);
      onOpenChange?.(next);
    };
    return (
      <CollapsibleContext.Provider value={{ open, toggle }}>
        <div data-testid="collapsible">{children}</div>
      </CollapsibleContext.Provider>
    );
  }

  function MockCollapsibleTrigger({ children }: { children: ReactNode }) {
    const { toggle } = React.useContext(CollapsibleContext);
    return (
      <button type="button" onClick={toggle}>
        {children}
      </button>
    );
  }

  function MockCollapsibleContent({ children }: { children: ReactNode }) {
    const { open } = React.useContext(CollapsibleContext);
    return open ? <div>{children}</div> : null;
  }

  return {
    Collapsible: MockCollapsible,
    CollapsibleTrigger: MockCollapsibleTrigger,
    CollapsibleContent: MockCollapsibleContent,
  };
});

// ── Fixtures ────────────────────────────────────────────────────────

const models = [
  {
    id: "v1",
    make: "Toyota",
    model: "Prius",
    generation: "XW50",
    year_start: 2016,
    year_end: 2022,
    engine: "2.0L",
    body_type: "Sedan",
  },
  {
    id: "v2",
    make: "Toyota",
    model: "Prius",
    generation: null,
    year_start: 2010,
    year_end: null,
    engine: "1.8L",
    body_type: null,
  },
  {
    id: "v3",
    make: "Honda",
    model: "Fit",
    generation: "GK",
    year_start: 2015,
    year_end: 2019,
    engine: "1.3L",
    body_type: "Hatchback",
  },
];

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderPage() {
  return render(
    <QueryClientProvider client={queryClient}>
      <VehicleModelsPage />
    </QueryClientProvider>,
  );
}

function seedModels(data: unknown) {
  queryClient.setQueryData(vehicleModelKeys.list("org-1"), data);
}

async function expandToyota() {
  await userEvent.click(screen.getByText("Toyota"));
  await userEvent.click(screen.getByText("Prius"));
}

// ── Tests ───────────────────────────────────────────────────────────

describe("VehicleModelsPage", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    mocks.useCurrentOrg.mockReturnValue({
      data: { orgId: "org-1", orgName: "Org 1" },
      isPending: false,
      error: null,
    });
    // Mirror the real hook's memoization contract: identical (data, query)
    // inputs must return the SAME array reference. The page memoizes the
    // filtered tree and the auto-expand effect depends on it — an
    // unmemoized mock rebuilds the array on every render and re-introduces
    // the render loop even with the fixed source.
    mocks.useFuzzySearch.mockImplementation(
      (() => {
        let lastData: typeof models | null = null;
        let lastQuery = "";
        let lastResult: typeof models = [];
        return (data: typeof models, query: string) => {
          if (data === lastData && query === lastQuery) return lastResult;
          lastData = data;
          lastQuery = query;
          if (!query.trim()) {
            lastResult = data;
          } else {
            const q = query.toLowerCase();
            lastResult = data.filter((item) =>
              [
                item.make,
                item.model,
                item.generation,
                item.engine,
                item.body_type,
              ]
                .filter(Boolean)
                .some((value) => value?.toLowerCase().includes(q)),
            );
          }
          return lastResult;
        };
      })(),
    );
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    queryClient.clear();
  });

  it("shows skeletons while the org is loading", () => {
    mocks.useCurrentOrg.mockReturnValue({
      data: null,
      isPending: true,
      error: null,
    });
    renderPage();
    expect(
      document.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
  });

  it("shows the query error with a retry action", async () => {
    fetchMock.mockRejectedValue(new Error("models failed"));
    renderPage();

    expect(await screen.findByText("models failed")).toBeInTheDocument();
    fireEvent.click(screen.getByText("retry"));
    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(1));
  });

  it("shows the empty state and opens the add drawer", async () => {
    const user = userEvent.setup();
    seedModels([]);
    renderPage();

    expect(await screen.findByText("noModels")).toBeInTheDocument();
    await user.click(screen.getByText("addFirstModel"));
    expect(screen.getByTestId("model-form-drawer")).toHaveAttribute(
      "data-open",
      "true",
    );
    expect(screen.getByTestId("model-form-drawer")).toHaveAttribute(
      "data-mode",
      "add",
    );
  });

  it("renders the make/model tree and expands to variants", async () => {
    seedModels(models);
    renderPage();

    expect(await screen.findByText("Toyota")).toBeInTheDocument();
    expect(screen.getByText("Honda")).toBeInTheDocument();
    // collapsed: Prius group is not visible yet
    expect(screen.queryByText("Prius")).not.toBeInTheDocument();

    await userEvent.click(screen.getByText("Toyota"));
    expect(screen.getByText("Prius")).toBeInTheDocument();
    expect(screen.queryByText("XW50")).not.toBeInTheDocument();

    await userEvent.click(screen.getByText("Prius"));
    expect(screen.getByText("XW50")).toBeInTheDocument();
    expect(screen.getByText(/2016-2022/)).toBeInTheDocument();
    expect(screen.getByText(/2.0L/)).toBeInTheDocument();
  });

  it("auto-expands matching makes/models while searching without hanging", async () => {
    const user = userEvent.setup();
    seedModels(models);
    renderPage();
    await screen.findByText("Toyota");

    // Typing a query rebuilds the filtered tree; the auto-expand effect then
    // opens every matched make + model group. Regression: the tree used to
    // be rebuilt on every render, so the effect's deps ([search, tree])
    // changed forever while searching — the page hung. If the loop returns,
    // this test hangs and times out instead of completing.
    await user.type(screen.getByLabelText("search-models"), "honda");

    // Make group expanded → model row visible without clicking ("Fit"
    // appears both as the model row and as the un-highlighted tail of the
    // variant's "Honda Fit" line, hence getAllByText).
    await waitFor(() =>
      expect(screen.getAllByText("Fit").length).toBeGreaterThan(0),
    );
    // Model group expanded → variant visible without clicking
    await waitFor(() => expect(screen.getByText("GK")).toBeInTheDocument());
    // Non-matching make is filtered out
    expect(screen.queryByText("Prius")).not.toBeInTheDocument();
  });

  it("opens the edit drawer for a variant", async () => {
    const user = userEvent.setup();
    seedModels(models);
    renderPage();
    await screen.findByText("Toyota");
    await expandToyota();

    await user.click(screen.getAllByLabelText("editVariant")[0]);
    expect(screen.getByTestId("model-form-drawer")).toHaveAttribute(
      "data-mode",
      "edit",
    );
    expect(screen.getByTestId("model-form-drawer")).toHaveAttribute(
      "data-item-id",
      "v1",
    );
  });

  it("deletes a variant through the confirmation dialog", async () => {
    const user = userEvent.setup();
    seedModels(models);
    renderPage();
    await screen.findByText("Toyota");
    await expandToyota();

    await user.click(screen.getAllByLabelText("deleteVariant")[0]);
    expect(screen.getByTestId("alert-dialog")).toBeInTheDocument();
    // The dialog names the variant being deleted (also listed in the tree)
    expect(screen.getAllByText("Toyota Prius").length).toBeGreaterThan(0);
    expect(screen.getByText(/deleteConfirmationPrefix/)).toBeInTheDocument();

    await user.click(screen.getByText("deleteAction"));
    expect(mocks.deleteMutate).toHaveBeenCalledWith({ id: "v1" });
  });
});
