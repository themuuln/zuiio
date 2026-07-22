/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/admin/teams"),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

// Mock lucide-react icons (replace all with a simple span)
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

// Mock AdminPageLayout
vi.mock("@/components/admin/page-layout", () => ({
  AdminPageLayout: ({
    title,
    children,
    actions,
  }: {
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
  }) => (
    <div>
      <div>{title}</div>
      {actions}
      {children}
    </div>
  ),
}));

// Mock admin-layout-context
vi.mock("@/components/admin/admin-layout-context", () => ({
  AdminLayoutProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock PhotoUploader
vi.mock("@/components/admin/photo-uploader", () => ({
  PhotoUploader: ({
    entityId,
    entityType,
    currentUrl,
  }: {
    entityId: string;
    entityType: string;
    currentUrl?: string | null;
  }) => (
    <div
      data-testid={`photo-uploader-${entityId}`}
      data-entity-type={entityType}
    >
      {currentUrl ? (
        <img src={currentUrl} alt="" data-testid="uploaded-logo" />
      ) : (
        <span>Зураг оруулах</span>
      )}
    </div>
  ),
}));

// Mock data
const mockTeams = [
  {
    id: "team-1",
    league_id: "league-1",
    name: "Хасууд",
    short_code: "ХАС",
    slug: "khasuud",
    primary_color: "#e63946",
    logo_url: null,
    leagues: { name: "Монголын сагсан бөмбөгийн лиг" },
  },
  {
    id: "team-2",
    league_id: "league-1",
    name: "Арслангууд",
    short_code: "АРС",
    slug: "arslanuud",
    primary_color: "#1d3557",
    logo_url: "https://example.com/logo.png",
    leagues: { name: "Монголын сагсан бөмбөгийн лиг" },
  },
];

const mockLeagues = [
  { id: "league-1", name: "Монголын сагсан бөмбөгийн лиг", slug: "mbl" },
];

// Mock TanStack Query
vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === "admin" && queryKey[1] === "leagues") {
      return { data: mockLeagues, isPending: false };
    }
    return { data: mockTeams, isPending: false };
  },
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock API
vi.mock("@/app/admin/_lib/api", () => ({
  teamsApi: {
    list: vi.fn(() => Promise.resolve(mockTeams)),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  leaguesApi: {
    list: vi.fn(() => Promise.resolve(mockLeagues)),
  },
}));

// Mock useEntityCrud
vi.mock("@/hooks/use-entity-crud", () => ({
  useEntityCrud: () => ({
    dialogOpen: false,
    editingItem: null,
    form: {
      control: {},
      handleSubmit: () => vi.fn(),
      formState: { errors: {} },
    },
    handleCreate: vi.fn(),
    handleEdit: vi.fn(),
    handleDelete: vi.fn(),
    handleSubmit: vi.fn(),
    handleDialogOpenChange: vi.fn(),
    isMutating: false,
  }),
}));

import TeamsPage from "../teams/page";

describe("Teams admin page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders table headers including Лого column", () => {
    render(<TeamsPage />);
    expect(screen.getByText("Нэр")).toBeInTheDocument();
    expect(screen.getByText("Товчлол")).toBeInTheDocument();
    expect(screen.getByText("Өнгө")).toBeInTheDocument();
    expect(screen.getByText("Лого")).toBeInTheDocument();
  });

  it("displays team names and short codes", () => {
    render(<TeamsPage />);
    expect(screen.getByText("Хасууд")).toBeInTheDocument();
    expect(screen.getByText("Арслангууд")).toBeInTheDocument();
    expect(screen.getByText("ХАС")).toBeInTheDocument();
    expect(screen.getByText("АРС")).toBeInTheDocument();
  });

  it("renders PhotoUploader with entityType team for each row", () => {
    render(<TeamsPage />);
    expect(screen.getByTestId("photo-uploader-team-1")).toHaveAttribute(
      "data-entity-type",
      "team",
    );
    expect(screen.getByTestId("photo-uploader-team-2")).toHaveAttribute(
      "data-entity-type",
      "team",
    );
  });

  it("shows upload placeholder for team without logo", () => {
    render(<TeamsPage />);
    expect(screen.getByTestId("photo-uploader-team-1")).toHaveTextContent(
      "Зураг оруулах",
    );
  });

  it("shows preview image for team with existing logo", () => {
    render(<TeamsPage />);
    expect(screen.getByTestId("uploaded-logo")).toHaveAttribute(
      "src",
      "https://example.com/logo.png",
    );
  });

  it("has a Нэмэх button and action buttons", () => {
    render(<TeamsPage />);
    expect(screen.getByText("Нэмэх")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /засах/ })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /устгах/ })).toHaveLength(2);
  });
});
