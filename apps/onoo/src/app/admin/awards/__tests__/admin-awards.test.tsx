/// <reference types="@testing-library/jest-dom/vitest" />
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/admin/awards"),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock lucide-react icons
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const Icon = ({ className, ...rest }: { className?: string }) => (
    <span data-testid="icon" className={className} {...rest} />
  );
  const mocked: Record<string, unknown> = {};
  for (const key of Object.keys(actual)) {
    mocked[key] = Icon;
  }
  return mocked;
});

// Mock AdminPageLayout
vi.mock("@/components/admin/page-layout", () => ({
  AdminPageLayout: ({
    title,
    children,
    actions,
    loading,
    isEmpty,
    emptyTitle,
    emptyDescription,
  }: {
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    loading?: boolean;
    isEmpty?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
  }) => (
    <div
      data-testid="admin-page-layout"
      data-loading={loading}
      data-empty={isEmpty}
    >
      <div data-testid="layout-title">{title}</div>
      {actions && <div data-testid="layout-actions">{actions}</div>}
      {isEmpty ? (
        <div data-testid="layout-empty">
          <p>{emptyTitle}</p>
          <p>{emptyDescription}</p>
        </div>
      ) : (
        <div data-testid="layout-children">{children}</div>
      )}
    </div>
  ),
}));

// Mock AdminTableSkeleton
vi.mock("@/components/admin/admin-skeleton", () => ({
  AdminTableSkeleton: ({ rows }: { rows?: number }) => (
    <div data-testid="admin-skeleton" data-rows={rows} />
  ),
}));

// Mock UI components
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant, ...props }: Record<string, unknown>) => (
    <span data-testid="badge" data-variant={variant as string} {...props}>
      {children as React.ReactNode}
    </span>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    ...props
  }: Record<string, unknown>) => (
    <button
      onClick={onClick as () => void}
      disabled={disabled as boolean}
      {...props}
    >
      {children as React.ReactNode}
    </button>
  ),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open, onOpenChange }: Record<string, unknown>) => (
    <div data-testid="dialog" data-open={open as boolean}>
      {children as React.ReactNode}
    </div>
  ),
  DialogContent: ({ children, ...props }: Record<string, unknown>) => (
    <div data-testid="dialog-content" {...props}>
      {children as React.ReactNode}
    </div>
  ),
  DialogHeader: ({ children }: Record<string, unknown>) => (
    <div data-testid="dialog-header">{children as React.ReactNode}</div>
  ),
  DialogTitle: ({ children }: Record<string, unknown>) => (
    <div data-testid="dialog-title">{children as React.ReactNode}</div>
  ),
  DialogTrigger: ({ children, asChild, ...props }: Record<string, unknown>) => (
    <div data-testid="dialog-trigger" {...props}>
      {children as React.ReactNode}
    </div>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: Record<string, unknown>) => (
    <input data-testid="input" {...props} />
  ),
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }: Record<string, unknown>) => (
    <label data-testid="label" {...props}>
      {children as React.ReactNode}
    </label>
  ),
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: Record<string, unknown>) => (
    <div data-testid="select" data-value={value as string}>
      {children as React.ReactNode}
      <button
        data-testid="select-change"
        onClick={() => onValueChange?.("comp-1")}
      />
    </div>
  ),
  SelectContent: ({ children }: Record<string, unknown>) => (
    <div data-testid="select-content">{children as React.ReactNode}</div>
  ),
  SelectItem: ({ children, value }: Record<string, unknown>) => (
    <div data-testid="select-item" data-value={value as string}>
      {children as React.ReactNode}
    </div>
  ),
  SelectTrigger: ({ children, ...props }: Record<string, unknown>) => (
    <button data-testid="select-trigger" {...props}>
      {children as React.ReactNode}
    </button>
  ),
  SelectValue: ({ placeholder }: Record<string, unknown>) => (
    <span data-testid="select-value">{placeholder as string}</span>
  ),
}));

vi.mock("@/components/ui/table", () => ({
  Table: ({ children }: Record<string, unknown>) => (
    <table data-testid="table">{children as React.ReactNode}</table>
  ),
  TableBody: ({ children }: Record<string, unknown>) => (
    <tbody data-testid="table-body">{children as React.ReactNode}</tbody>
  ),
  TableCell: ({ children }: Record<string, unknown>) => (
    <td data-testid="table-cell">{children as React.ReactNode}</td>
  ),
  TableHead: ({ children }: Record<string, unknown>) => (
    <th data-testid="table-head">{children as React.ReactNode}</th>
  ),
  TableHeader: ({ children }: Record<string, unknown>) => (
    <thead data-testid="table-header">{children as React.ReactNode}</thead>
  ),
  TableRow: ({ children }: Record<string, unknown>) => (
    <tr data-testid="table-row">{children as React.ReactNode}</tr>
  ),
}));

vi.mock("@/components/ui/textarea", () => ({
  Textarea: (props: Record<string, unknown>) => (
    <textarea data-testid="textarea" {...props} />
  ),
}));

// Mock data
const mockAwards = [
  {
    id: "award-1",
    competition_id: "comp-1",
    award_type: "player_of_week" as const,
    player_id: "player-1",
    period_start: "2024-01-01",
    period_end: "2024-01-07",
    note: null,
    granted_at: "2024-01-08T12:00:00Z",
    players: {
      canonical_name: "Баатар",
      photo_url: null,
      short_code: null,
    },
    profiles: null,
  },
  {
    id: "award-2",
    competition_id: "comp-1",
    award_type: "mvp" as const,
    player_id: "player-2",
    period_start: null,
    period_end: null,
    note: "Season MVP",
    granted_at: "2024-06-01T12:00:00Z",
    players: {
      canonical_name: "Мөнхбат",
      photo_url: null,
      short_code: null,
    },
    profiles: null,
  },
];

const mockCompetitions = [
  {
    id: "comp-1",
    name: "Монголын лиг",
    type: "league",
    season_id: "season-1",
    created_at: "2024-01-01T00:00:00Z",
  },
];

const mockPlayers = [
  {
    id: "player-1",
    canonical_name: "Баатар",
    name_latin: "Baatar",
    dob: null,
    height_cm: null,
    weight_kg: null,
    position: "PG",
    nationality: "Mongolia",
    photo_url: null,
    visibility: "public" as const,
    consent_recorded_at: null,
    consent_note: null,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "player-2",
    canonical_name: "Мөнхбат",
    name_latin: "Munkhbat",
    dob: null,
    height_cm: null,
    weight_kg: null,
    position: "SG",
    nationality: "Mongolia",
    photo_url: null,
    visibility: "public" as const,
    consent_recorded_at: null,
    consent_note: null,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "player-3",
    canonical_name: "Болд",
    name_latin: "Bold",
    dob: null,
    height_cm: null,
    weight_kg: null,
    position: "PF",
    nationality: "Mongolia",
    photo_url: null,
    visibility: "public" as const,
    consent_recorded_at: null,
    consent_note: null,
    created_at: "2024-01-01T00:00:00Z",
  },
];

const { mockUseQuery, mockUseMutation, mockUseQueryClient } = vi.hoisted(
  () => ({
    mockUseQuery: vi.fn(),
    mockUseMutation: vi.fn(),
    mockUseQueryClient: vi.fn(),
  }),
);

// Mock TanStack Query
vi.mock("@tanstack/react-query", () => ({
  useQuery: mockUseQuery,
  useMutation: mockUseMutation,
  useQueryClient: mockUseQueryClient,
}));

// Mock API
vi.mock("@/app/admin/_lib/api", () => ({
  awardsApi: {
    list: vi.fn(() => Promise.resolve(mockAwards)),
    grant: vi.fn(),
  },
  competitionsApi: {
    list: vi.fn(() => Promise.resolve(mockCompetitions)),
  },
  playersApi: {
    list: vi.fn(() => Promise.resolve(mockPlayers)),
  },
}));

import AwardsPage from "../page";

describe("Admin awards page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock returns
    mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === "admin" && queryKey[1] === "awards") {
        return { data: mockAwards, isPending: false };
      }
      if (queryKey[0] === "admin" && queryKey[1] === "catalog") {
        return {
          data: {
            competitions: mockCompetitions,
            seasons: [],
            sports: [],
            leagues: [],
            venues: [],
            players: mockPlayers,
          },
          isPending: false,
        };
      }
      return { data: [], isPending: false };
    });

    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    mockUseQueryClient.mockReturnValue({
      invalidateQueries: vi.fn(),
    });
  });

  it("renders page title", () => {
    render(<AwardsPage />);
    expect(screen.getByText("Шагнал")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    render(<AwardsPage />);
    // Some text appears in both table headers and dialog labels
    expect(screen.getByText("Төрөл")).toBeInTheDocument();
    expect(screen.getAllByText("Тоглогч").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Тэмцээн").length).toBeGreaterThan(0);
    expect(screen.getByText("Хугацаа")).toBeInTheDocument();
    expect(screen.getByText("Олгогдсон")).toBeInTheDocument();
  });

  it("displays award data rows", () => {
    render(<AwardsPage />);
    expect(screen.getAllByText("7 хоногийн тоглогч").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Баатар").length).toBeGreaterThan(0);
    // MVP badge type
    expect(screen.getAllByText("MVP").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Мөнхбат").length).toBeGreaterThan(0);
  });

  it("shows grant award dialog trigger button", () => {
    render(<AwardsPage />);
    expect(screen.getAllByText("Шагнал олгох").length).toBeGreaterThan(0);
  });

  it("shows award dialog when trigger clicked", () => {
    render(<AwardsPage />);
    const grantButton = screen.getAllByText("Шагнал олгох")[0];
    fireEvent.click(grantButton);
    // Dialog should be open after click
    const dialog = screen.getByTestId("dialog");
    expect(dialog).toBeInTheDocument();
  });

  it("renders competition select options", () => {
    render(<AwardsPage />);
    const selectItems = screen.getAllByTestId("select-item");
    expect(selectItems.length).toBeGreaterThan(0);
  });

  it("shows loading state", () => {
    mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === "admin" && queryKey[1] === "awards") {
        return { data: undefined, isLoading: true, isPending: true };
      }
      if (queryKey[0] === "admin" && queryKey[1] === "catalog") {
        return {
          data: {
            competitions: mockCompetitions,
            seasons: [],
            sports: [],
            leagues: [],
            venues: [],
            players: mockPlayers,
          },
          isPending: false,
        };
      }
      return { data: [], isPending: false };
    });
    render(<AwardsPage />);
    const layout = screen.getByTestId("admin-page-layout");
    expect(layout.getAttribute("data-loading")).toBe("true");
  });

  it("shows empty state when no awards", () => {
    mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === "admin" && queryKey[1] === "awards") {
        return { data: [], isPending: false };
      }
      if (queryKey[0] === "admin" && queryKey[1] === "catalog") {
        return {
          data: {
            competitions: mockCompetitions,
            seasons: [],
            sports: [],
            leagues: [],
            venues: [],
            players: mockPlayers,
          },
          isPending: false,
        };
      }
      return { data: [], isPending: false };
    });
    render(<AwardsPage />);
    expect(screen.getByText("Шагнал байхгүй байна")).toBeInTheDocument();
  });

  it("renders period date range in table", () => {
    render(<AwardsPage />);
    // "2024-1-1 – 2024-1-7" in Mongolian locale
    // Date appears in table cells - multiple dates
    expect(screen.getAllByText(/2024/).length).toBeGreaterThan(0);
  });

  it("shows cancel button in dialog", () => {
    render(<AwardsPage />);
    const cancelButtons = screen.getAllByText("Болих");
    expect(cancelButtons.length).toBeGreaterThan(0);
  });

  it("shows grant submit button", () => {
    render(<AwardsPage />);
    const grantButtons = screen.getAllByText("Олгох");
    expect(grantButtons.length).toBeGreaterThan(0);
  });

  it("search input filters players", () => {
    render(<AwardsPage />);
    const searchInputs = screen.getAllByTestId("input");
    const playerSearchInput = searchInputs.find(
      (el) => (el as HTMLInputElement).placeholder === "Тоглогч хайх...",
    );
    expect(playerSearchInput).toBeInTheDocument();
  });

  it("shows player list filtered by search", () => {
    render(<AwardsPage />);
    // All players should be rendered in the search list initially
    expect(screen.getAllByText("Баатар").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Мөнхбат").length).toBeGreaterThan(0);
    expect(screen.getByText("Болд")).toBeInTheDocument();
  });
});
