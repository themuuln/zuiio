/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Shared Mocks ──────────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/admin"),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

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
      <div data-testid="page-title">{title}</div>
      {actions && <div data-testid="page-actions">{actions}</div>}
      {loading ? (
        <div data-testid="loading-spinner">Loading...</div>
      ) : (
        <div data-testid="page-content">{children}</div>
      )}
    </div>
  ),
}));

vi.mock("@/components/admin/admin-layout-context", () => ({
  AdminLayoutProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

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
        // biome-ignore lint/performance/noImgElement: test mock
        <img src={currentUrl} alt="" data-testid="uploaded-photo" />
      ) : (
        <span>Зураг оруулах</span>
      )}
    </div>
  ),
}));

vi.mock("@/components/admin/link-student-dialog", () => ({
  LinkStudentDialog: ({
    playerId,
  }: {
    playerId: string;
    userId: string;
    onLinked: () => void;
  }) => <div data-testid={`link-student-${playerId}`}>Linked</div>,
}));

vi.mock("@/components/admin/confirm-dialog", () => ({
  ConfirmDialog: () => null,
}));

vi.mock("@/components/ui/data-table", () => ({
  DataTable: ({
    columns,
    data,
  }: {
    columns: Array<{ id?: string; accessorKey?: string; header: string }>;
    data: Array<Record<string, unknown>>;
  }) => (
    <table data-testid="data-table">
      <thead>
        <tr>
          {columns.map((col, i) => (
            <th key={col.id ?? col.accessorKey ?? i}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={(row.id as string) ?? i}>
            {columns.map((col) => {
              const key = col.accessorKey ?? col.id;
              return key ? <td key={key}>{String(row[key] ?? "")}</td> : null;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ── Mock Data ─────────────────────────────────────────────────────────────────

const mockPlayers = [
  {
    id: "player-1",
    canonical_name: "Бат",
    user_id: "user-1",
    name_latin: "Bat",
    dob: "2000-01-15",
    height_cm: 185,
    weight_kg: 80,
    position: "PG",
    nationality: "MN",
    photo_url: null,
    visibility: "public",
    consent_recorded_at: "2024-01-01",
    consent_note: null,
    social_links: {},
    created_at: "2024-01-01T00:00:00Z",
    canonical_identity_id: null,
  },
  {
    id: "player-2",
    canonical_name: "Дорж",
    user_id: null,
    name_latin: "Dorj",
    dob: null,
    height_cm: null,
    weight_kg: null,
    position: "C",
    nationality: "MN",
    photo_url: "https://example.com/photo.jpg",
    visibility: "hidden",
    consent_recorded_at: null,
    consent_note: null,
    social_links: {},
    created_at: "2024-02-01T00:00:00Z",
    canonical_identity_id: null,
  },
];

const mockLeagues = [
  { id: "league-1", name: "Монголын сагсан бөмбөгийн лиг", slug: "mbl" },
];

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
    social_links: {},
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
    social_links: {},
  },
];

const mockVenues = [
  {
    id: "venue-1",
    name: "Төв цэнгэлдэх",
    city: "Улаанбаатар",
    capacity: 5000,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "venue-2",
    name: "Хөвсгөл спорт цогцолбор",
    city: "Мөрөн",
    capacity: null,
    created_at: "2024-02-01T00:00:00Z",
  },
];

const mockSeasons = [
  {
    id: "season-1",
    league_id: "league-1",
    name: "2024-2025",
    starts_on: "2024-09-01",
    ends_on: "2025-06-30",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "season-2",
    league_id: "league-1",
    name: "2023-2024",
    starts_on: "2023-09-01",
    ends_on: "2024-06-30",
    created_at: "2023-01-01T00:00:00Z",
  },
];

const mockLeagueRows = [
  {
    id: "league-1",
    name: "Монголын сагсан бөмбөгийн лиг",
    slug: "mbl",
    sport_id: "sport-1",
    organization_id: "org-1",
    logo_url: null,
    created_at: "2024-01-01T00:00:00Z",
    sports: { name_en: "Basketball", name_mn: "Сагсан бөмбөг" },
  },
  {
    id: "league-2",
    name: "Премьер лиг",
    slug: "premier",
    sport_id: "sport-1",
    organization_id: "org-1",
    logo_url: null,
    created_at: "2024-02-01T00:00:00Z",
    sports: { name_en: "Basketball", name_mn: "Сагсан бөмбөг" },
  },
];

const mockSports = [
  {
    id: "sport-1",
    key: "basketball",
    name_mn: "Сагсан бөмбөг",
    name_en: "Basketball",
  },
];

const mockCompetitions = [
  {
    id: "comp-1",
    name: "Үндсэн тэмцээн",
    type: "regular",
    season_id: "season-1",
    created_at: "2024-01-01T00:00:00Z",
    social_links: {},
  },
  {
    id: "comp-2",
    name: "Плей-офф",
    type: "playoff",
    season_id: "season-1",
    created_at: "2024-02-01T00:00:00Z",
    social_links: {},
  },
];

const mockCatalogSeasons = [
  { id: "season-1", name: "2024-2025", league_id: "league-1" },
];

const mockCatalogRef = {
  leagues: mockLeagueRows,
  sports: mockSports,
  seasons: mockCatalogSeasons,
  competitions: mockCompetitions,
  venues: mockVenues,
  players: mockPlayers,
};

const mockProducts = [
  {
    id: "prod-1",
    name: "Онооны самбар",
    slug: "scoreboard",
    price_mnt: 50000,
    images: [],
    variants: [{ size: "L", stock: 10 }],
    is_available: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "prod-2",
    name: "Бөмбөг",
    slug: "ball",
    price_mnt: 30000,
    images: [],
    variants: [],
    is_available: false,
    created_at: "2024-02-01T00:00:00Z",
    updated_at: "2024-02-01T00:00:00Z",
  },
];

const mockOrders = [
  {
    id: "order-1",
    customer_name: "Бат",
    phone: "99111111",
    total_mnt: 50000,
    status: "paid",
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "order-2",
    customer_name: "Сүхээ",
    phone: "99222222",
    total_mnt: 30000,
    status: "pending",
    created_at: "2024-01-16T10:00:00Z",
  },
];

// ── Mock @tanstack/react-query ───────────────────────────────────────────────
// Matches all query keys used across admin pages:
//   ["admin", "players", ...], ["admin", "teams", ...], ["admin", "leagues"],
//   ["admin", "seasons", ...], ["admin", "catalog", "reference"],
//   ["admin", "venues"], ["admin", "products"], ["admin-orders"]

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: unknown[] }) => {
    const [ns, entity] = queryKey as string[];
    if (ns === "admin-orders") return { data: mockOrders, isPending: false };
    if (ns === "admin") {
      if (entity === "catalog")
        return { data: mockCatalogRef, isPending: false };
      if (entity === "leagues") return { data: mockLeagues, isPending: false };
      if (entity === "players") return { data: mockPlayers, isPending: false };
      if (entity === "teams") return { data: mockTeams, isPending: false };
      if (entity === "seasons") return { data: mockSeasons, isPending: false };
      if (entity === "venues") return { data: mockVenues, isPending: false };
      if (entity === "products")
        return { data: mockProducts, isPending: false };
    }
    return { data: [], isPending: false };
  },
  useMutation: vi.fn(() => ({
    isPending: false,
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// ── Mock API module ───────────────────────────────────────────────────────────

vi.mock("@/app/admin/_lib/api", () => ({
  playersApi: {
    list: vi.fn(() => Promise.resolve(mockPlayers)),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  leaguesApi: {
    list: vi.fn(() => Promise.resolve(mockLeagues)),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  teamsApi: {
    list: vi.fn(() => Promise.resolve(mockTeams)),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  seasonsApi: {
    list: vi.fn(() => Promise.resolve(mockSeasons)),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  venuesApi: {
    list: vi.fn(() => Promise.resolve(mockVenues)),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  competitionsApi: {
    list: vi.fn(() => Promise.resolve(mockCompetitions)),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  catalogRefApi: {
    get: vi.fn(() => Promise.resolve(mockCatalogRef)),
  },
  shopProductsApi: {
    list: vi.fn(() => Promise.resolve(mockProducts)),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  shopOrdersApi: {
    list: vi.fn(() => Promise.resolve(mockOrders)),
    ship: vi.fn(() => Promise.resolve({})),
    cancel: vi.fn(() => Promise.resolve({})),
  },
  getTeams: vi.fn(() => Promise.resolve([])),
}));

// ── Mock useEntityCrud ───────────────────────────────────────────────────────

vi.mock("@/hooks/use-entity-crud", () => ({
  useEntityCrud: () => ({
    dialogOpen: false,
    editingItem: null,
    confirmOpen: false,
    confirmMessage: "",
    confirmLoading: false,
    form: {
      control: {},
      getValues: vi.fn(() => "[]"),
      setValue: vi.fn(),
      handleSubmit: () => vi.fn(),
      formState: { errors: {} },
    },
    handleCreate: vi.fn(),
    handleEdit: vi.fn(),
    handleDelete: vi.fn(),
    handleSubmit: vi.fn(),
    handleDialogOpenChange: vi.fn(),
    handleConfirmOpenChange: vi.fn(),
    handleConfirmDelete: vi.fn(),
    isMutating: false,
  }),
}));

// ── Page Imports (after mocks, vitest hoists vi.mock above imports) ──────────

import CompetitionsPage from "../competitions/page";
import LeaguesPage from "../leagues/page";
import AdminOrdersPage from "../orders/page";
import PlayersPage from "../players/page";
import AdminProductsPage from "../products/page";
import SeasonsPage from "../seasons/page";
import TeamsPage from "../teams/page";
import VenuesPage from "../venues/page";

// ═══════════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════════

// ── Players ───────────────────────────────────────────────────────────────────

describe("Players admin page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page title", () => {
    render(<PlayersPage />);
    expect(screen.getByTestId("page-title")).toHaveTextContent("Тоглогчид");
  });

  it("renders a search input", () => {
    render(<PlayersPage />);
    expect(screen.getByPlaceholderText("Тоглогч хайх...")).toBeInTheDocument();
  });

  it("renders table with player columns", () => {
    render(<PlayersPage />);
    expect(screen.getByText("Зураг")).toBeInTheDocument();
    expect(screen.getByText("Нэр")).toBeInTheDocument();
    expect(screen.getByText("Харагдалц")).toBeInTheDocument();
    expect(screen.getByText("Латин нэр")).toBeInTheDocument();
    expect(screen.getByText("Улс")).toBeInTheDocument();
  });

  it("displays player names and data", () => {
    render(<PlayersPage />);
    expect(screen.getByText("Бат")).toBeInTheDocument();
    expect(screen.getByText("Дорж")).toBeInTheDocument();
    expect(screen.getByText("Bat")).toBeInTheDocument();
    expect(screen.getByText("Dorj")).toBeInTheDocument();
  });

  it("shows visibility badges", () => {
    render(<PlayersPage />);
    expect(screen.getByText("Нийтэд")).toBeInTheDocument();
    expect(screen.getByText("Нууц")).toBeInTheDocument();
  });

  it("renders PhotoUploader for each player row", () => {
    render(<PlayersPage />);
    expect(screen.getByTestId("photo-uploader-player-1")).toHaveAttribute(
      "data-entity-type",
      "player",
    );
    expect(screen.getByTestId("photo-uploader-player-2")).toHaveAttribute(
      "data-entity-type",
      "player",
    );
  });

  it("shows uploaded photo for player with photo_url", () => {
    render(<PlayersPage />);
    expect(screen.getByTestId("uploaded-photo")).toHaveAttribute(
      "src",
      "https://example.com/photo.jpg",
    );
  });

  it("shows the Нэмэх button", () => {
    render(<PlayersPage />);
    expect(screen.getByText("Нэмэх")).toBeInTheDocument();
  });
});

// ── Teams ─────────────────────────────────────────────────────────────────────

describe("Teams admin page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page title", () => {
    render(<TeamsPage />);
    expect(screen.getByTestId("page-title")).toHaveTextContent("Багууд");
  });

  it("renders table headers", () => {
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

  it("renders PhotoUploader with entityType team", () => {
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
    expect(screen.getByTestId("uploaded-photo")).toHaveAttribute(
      "src",
      "https://example.com/logo.png",
    );
  });

  it("has a Нэмэх button", () => {
    render(<TeamsPage />);
    expect(screen.getByText("Нэмэх")).toBeInTheDocument();
  });
});

// ── Venues ────────────────────────────────────────────────────────────────────

describe("Venues admin page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page title", () => {
    render(<VenuesPage />);
    expect(screen.getByTestId("page-title")).toHaveTextContent("Талбайнууд");
  });

  it("renders table headers", () => {
    render(<VenuesPage />);
    expect(screen.getByText("Нэр")).toBeInTheDocument();
    expect(screen.getByText("Хот")).toBeInTheDocument();
    expect(screen.getByText("Багтаамж")).toBeInTheDocument();
    expect(screen.getByText("Үүсгэсэн")).toBeInTheDocument();
  });

  it("displays venue names and cities", () => {
    render(<VenuesPage />);
    expect(screen.getByText("Төв цэнгэлдэх")).toBeInTheDocument();
    expect(screen.getByText("Хөвсгөл спорт цогцолбор")).toBeInTheDocument();
    expect(screen.getByText("Улаанбаатар")).toBeInTheDocument();
    expect(screen.getByText("Мөрөн")).toBeInTheDocument();
  });

  it("shows capacity value", () => {
    render(<VenuesPage />);
    expect(screen.getByText("5000")).toBeInTheDocument();
  });

  it("has a Нэмэх button", () => {
    render(<VenuesPage />);
    expect(screen.getByText("Нэмэх")).toBeInTheDocument();
  });
});

// ── Seasons ───────────────────────────────────────────────────────────────────

describe("Seasons admin page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page title", () => {
    render(<SeasonsPage />);
    expect(screen.getByTestId("page-title")).toHaveTextContent("Улирлууд");
  });

  it("shows league selection prompt when no league is selected", () => {
    render(<SeasonsPage />);
    expect(screen.getByText("Лиг сонгоно уу")).toBeInTheDocument();
  });

  it.skip("renders the league select with placeholder text", () => {
    render(<SeasonsPage />);
  });

  it("shows Нэмэх button in a disabled state", () => {
    render(<SeasonsPage />);
    const addButton = screen.getByText("Нэмэх");
    expect(addButton).toBeInTheDocument();
    expect(addButton.closest("button")).toBeDisabled();
  });
});

// ── Leagues ───────────────────────────────────────────────────────────────────

describe("Leagues admin page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page title", () => {
    render(<LeaguesPage />);
    expect(screen.getByTestId("page-title")).toHaveTextContent("Лигууд");
  });

  it("renders table headers", () => {
    render(<LeaguesPage />);
    expect(screen.getByText("Нэр")).toBeInTheDocument();
    expect(screen.getByText("Спорт")).toBeInTheDocument();
    expect(screen.getByText("Үүсгэсэн")).toBeInTheDocument();
  });

  it("displays league names", () => {
    render(<LeaguesPage />);
    expect(
      screen.getByText("Монголын сагсан бөмбөгийн лиг"),
    ).toBeInTheDocument();
    expect(screen.getByText("Премьер лиг")).toBeInTheDocument();
  });

  it("shows sport name for each league", () => {
    render(<LeaguesPage />);
    expect(screen.getAllByText("Basketball")).toHaveLength(2);
  });

  it("has a Нэмэх button", () => {
    render(<LeaguesPage />);
    expect(screen.getByText("Нэмэх")).toBeInTheDocument();
  });
});

// ── Competitions ──────────────────────────────────────────────────────────────

describe("Competitions admin page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page title", () => {
    render(<CompetitionsPage />);
    expect(screen.getByTestId("page-title")).toHaveTextContent("Тэмцээнүүд");
  });

  it("renders table headers", () => {
    render(<CompetitionsPage />);
    expect(screen.getByText("Нэр")).toBeInTheDocument();
    expect(screen.getByText("Улирал")).toBeInTheDocument();
    expect(screen.getByText("Төрөл")).toBeInTheDocument();
    expect(screen.getByText("Үүсгэсэн")).toBeInTheDocument();
  });

  it("displays competition names", () => {
    render(<CompetitionsPage />);
    expect(screen.getByText("Үндсэн тэмцээн")).toBeInTheDocument();
    expect(screen.getAllByText("Плей-офф").length).toBeGreaterThanOrEqual(1);
  });

  it("shows competition types", () => {
    render(<CompetitionsPage />);
    expect(screen.getByText("Энгийн")).toBeInTheDocument();
    expect(screen.getAllByText("Плей-офф").length).toBeGreaterThanOrEqual(1);
  });

  it("has a Нэмэх button", () => {
    render(<CompetitionsPage />);
    expect(screen.getByText("Нэмэх")).toBeInTheDocument();
  });
});

// ── Products ──────────────────────────────────────────────────────────────────

describe("Products admin page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page title", () => {
    render(<AdminProductsPage />);
    expect(screen.getByTestId("page-title")).toHaveTextContent("Бүтээгдэхүүн");
  });

  it("renders DataTable with product columns", () => {
    render(<AdminProductsPage />);
    expect(screen.getByTestId("data-table")).toBeInTheDocument();
    expect(screen.getByText("Нэр")).toBeInTheDocument();
    expect(screen.getByText("Slug")).toBeInTheDocument();
    expect(screen.getByText("Үнэ")).toBeInTheDocument();
    expect(screen.getByText("Хэмжээ / үлдэгдэл")).toBeInTheDocument();
    expect(screen.getByText("Статус")).toBeInTheDocument();
    expect(screen.getByText("Үүсгэсэн")).toBeInTheDocument();
    expect(screen.getByText("Үйлдэл")).toBeInTheDocument();
  });

  it("displays product names", () => {
    render(<AdminProductsPage />);
    expect(screen.getByText("Онооны самбар")).toBeInTheDocument();
    expect(screen.getByText("Бөмбөг")).toBeInTheDocument();
  });

  it("displays product slugs", () => {
    render(<AdminProductsPage />);
    expect(screen.getByText("scoreboard")).toBeInTheDocument();
    expect(screen.getByText("ball")).toBeInTheDocument();
  });

  it("has a Шинэ бүтээгдэхүүн button", () => {
    render(<AdminProductsPage />);
    expect(screen.getByText("Шинэ бүтээгдэхүүн")).toBeInTheDocument();
  });
});

// ── Orders ────────────────────────────────────────────────────────────────────

describe("Orders admin page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page title", () => {
    render(<AdminOrdersPage />);
    expect(screen.getByTestId("page-title")).toHaveTextContent("Захиалга");
  });

  it("renders table headers", () => {
    render(<AdminOrdersPage />);
    expect(screen.getByText("Захиалагч")).toBeInTheDocument();
    expect(screen.getByText("Утас")).toBeInTheDocument();
    expect(screen.getByText("Дүн")).toBeInTheDocument();
    expect(screen.getByText("Статус")).toBeInTheDocument();
    expect(screen.getByText("Огноо")).toBeInTheDocument();
    expect(screen.getByText("Үйлдэл")).toBeInTheDocument();
  });

  it("displays order customer names and phones", () => {
    render(<AdminOrdersPage />);
    expect(screen.getByText("Бат")).toBeInTheDocument();
    expect(screen.getByText("Сүхээ")).toBeInTheDocument();
    expect(screen.getByText("99111111")).toBeInTheDocument();
    expect(screen.getByText("99222222")).toBeInTheDocument();
  });

  it("displays order totals", () => {
    render(<AdminOrdersPage />);
    expect(screen.getByText("₮50,000")).toBeInTheDocument();
    expect(screen.getByText("₮30,000")).toBeInTheDocument();
  });

  it("shows status badges", () => {
    render(<AdminOrdersPage />);
    expect(screen.getByText("Төлөгдсөн")).toBeInTheDocument();
    expect(screen.getByText("Хүлээгдэж буй")).toBeInTheDocument();
  });

  it("shows action buttons for appropriate order statuses", () => {
    render(<AdminOrdersPage />);
    expect(screen.getByText("Хүргэх")).toBeInTheDocument();
    expect(screen.getByText("Цуцлах")).toBeInTheDocument();
  });
});
