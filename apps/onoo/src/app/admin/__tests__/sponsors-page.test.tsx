/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/admin/sponsors"),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

// Mock lucide-react icons
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const Icon = ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  );
  const mocked: Record<string, unknown> = {};
  for (const key of Object.keys(actual)) {
    mocked[key] = Icon;
  }
  return mocked;
});

// Mock sonner
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock AdminPageLayout
vi.mock("@/components/admin/page-layout", () => ({
  AdminPageLayout: ({
    title,
    children,
    actions,
    loading,
  }: {
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    loading?: boolean;
  }) => (
    <div>
      <div>{title}</div>
      {loading ? <div data-testid="loading-skeleton" /> : null}
      {actions}
      {children}
    </div>
  ),
}));

// Mock ConfirmDialog
vi.mock("@/components/admin/confirm-dialog", () => ({
  ConfirmDialog: ({
    open,
    onConfirm,
    title,
    description,
    confirmText,
    loading,
  }: {
    open: boolean;
    onConfirm: () => void;
    title?: string;
    description?: string;
    confirmText?: string;
    loading?: boolean;
  }) =>
    open ? (
      <div data-testid="confirm-dialog">
        <div>{title}</div>
        <div>{description}</div>
        <button
          type="button"
          data-testid="confirm-delete-btn"
          onClick={onConfirm}
          disabled={loading}
        >
          {confirmText ?? "Устгах"}
        </button>
      </div>
    ) : null,
}));

// Mock TanStack Query
const mockSponsors = [
  {
    id: "sponsor-1",
    name: "Бодонс Академи",
    logo_url: null,
    link_url: "https://example.com/bodons",
    active: true,
    created_at: "2026-07-22T00:00:00Z",
    updated_at: "2026-07-22T00:00:00Z",
    sponsor_placements: [
      {
        id: "placement-1",
        sponsor_id: "sponsor-1",
        competition_id: "comp-1",
        slot: "standings",
        starts_on: "2026-01-01",
        ends_on: "2026-12-31",
        created_at: "2026-07-22T00:00:00Z",
      },
    ],
  },
  {
    id: "sponsor-2",
    name: "Монголбаскет",
    logo_url: "https://example.com/logo.png",
    link_url: null,
    active: false,
    created_at: "2026-07-22T00:00:00Z",
    updated_at: "2026-07-22T00:00:00Z",
    sponsor_placements: [],
  },
];

const mockCompetitions = [
  { id: "comp-1", name: "МБЛ 2026", type: "regular", season_id: "season-1" },
];

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === "admin" && queryKey[1] === "competitions") {
      return { data: mockCompetitions, isPending: false };
    }
    if (queryKey[0] === "admin" && queryKey[1] === "sponsors") {
      return { data: mockSponsors, isPending: false };
    }
    return { data: [], isPending: false };
  },
  useMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock fetch for the page component
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

import SponsorsPage from "../sponsors/page";

describe("Sponsors admin page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page title", () => {
    render(<SponsorsPage />);
    expect(screen.getByText("Ивээн тэтгэгчид")).toBeInTheDocument();
  });

  it("renders the create button", () => {
    render(<SponsorsPage />);
    expect(screen.getByText("Нэмэх")).toBeInTheDocument();
  });

  it("displays sponsor names in the table", () => {
    render(<SponsorsPage />);
    expect(screen.getByText("Бодонс Академи")).toBeInTheDocument();
    expect(screen.getByText("Монголбаскет")).toBeInTheDocument();
  });

  it("shows active badge for active sponsors", () => {
    render(<SponsorsPage />);
    expect(screen.getByText("Идэвхтэй")).toBeInTheDocument();
  });

  it("shows inactive badge for inactive sponsors", () => {
    render(<SponsorsPage />);
    expect(screen.getByText("Идэвхгүй")).toBeInTheDocument();
  });

  it("renders action buttons for each sponsor", () => {
    render(<SponsorsPage />);
    const editButtons = screen.getAllByRole("button", { name: /засах/ });
    expect(editButtons).toHaveLength(2);
  });

  it("shows placement count for sponsors", () => {
    render(<SponsorsPage />);
    const placementButtons = screen.getAllByRole("button", {
      name: /байршил/,
    });
    expect(placementButtons).toHaveLength(2);
  });

  it("shows link url when present", () => {
    render(<SponsorsPage />);
    const link = screen.getByText("https://example.com/bodons");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://example.com/bodons");
  });
});
