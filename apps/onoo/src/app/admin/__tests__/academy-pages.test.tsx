/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mock next/navigation ──
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/admin/academy"),
}));

// ── Mock sonner ──
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ── Mock lucide-react icons ──
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const Icon = (props: Record<string, unknown>) => (
    <span data-testid="icon" {...props} />
  );
  const mocked: Record<string, unknown> = {};
  for (const key of Object.keys(actual)) {
    mocked[key] = Icon;
  }
  return mocked;
});

// ── Mock AdminPageLayout ──
vi.mock("@/components/admin/page-layout", () => ({
  AdminPageLayout: ({
    title,
    children,
    actions,
    loading,
    isEmpty,
    emptyTitle,
    emptyDescription,
    headerExtras,
  }: {
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    loading?: boolean;
    isEmpty?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
    headerExtras?: React.ReactNode;
  }) => (
    <div>
      <div data-testid="page-title">{title}</div>
      {headerExtras}
      {actions}
      {loading ? (
        <div data-testid="loading">Loading...</div>
      ) : isEmpty ? (
        <div data-testid="empty-state">
          <div>{emptyTitle}</div>
          <div>{emptyDescription}</div>
        </div>
      ) : (
        children
      )}
    </div>
  ),
}));

// ── Mock admin-layout-context ──
vi.mock("@/components/admin/admin-layout-context", () => ({
  AdminLayoutProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// ── Mock QR display components (AcademyPaymentsPage imports these) ──
vi.mock("@/app/shop/components/qr-display", () => ({
  QrDisplay: ({ totalMnt }: { totalMnt: number }) => (
    <div data-testid="qr-display">{totalMnt.toLocaleString()} ₮</div>
  ),
  PaymentSuccessView: () => <div data-testid="payment-success">Амжилттай</div>,
  PaymentErrorView: ({
    message,
    onRetry,
  }: {
    message: string;
    onRetry: () => void;
  }) => (
    <div data-testid="payment-error">
      <div>{message}</div>
      <button onClick={onRetry}>Дахин оролдох</button>
    </div>
  ),
}));

// ── Test data ──

const mockProfile = {
  id: "academy-1",
  organization_id: "org-1",
  name: "Тэст Академи",
  contact_phone: "99112233",
  contact_email: "info@test.mn",
  timezone: "Asia/Ulaanbaatar",
  settings: {},
};

const mockProgram = {
  id: "prog-1",
  academy_id: "academy-1",
  name: "Баскетбол суурь",
  description: "Анхан шат",
  age_group: "10-12",
  price_mnt: 100000,
  duration_weeks: 12,
  is_active: true,
};

const mockProgramInactive = {
  id: "prog-2",
  academy_id: "academy-1",
  name: "Мэргэжлийн",
  description: "Ахисан түвшин",
  age_group: "13-15",
  price_mnt: 200000,
  duration_weeks: 24,
  is_active: false,
};

const mockTrainer = {
  id: "trainer-1",
  academy_id: "academy-1",
  name: "Бат-Эрдэнэ",
  photo_url: null,
  specialties: ["Довтолгоо"],
  bio: "Өндөр туршлагатай",
  is_active: true,
};

const mockTrainer2 = {
  id: "trainer-2",
  academy_id: "academy-1",
  name: "Дэлгэр",
  photo_url: "https://example.com/photo.jpg",
  specialties: ["Хамгаалалт", "Довтолгоо"],
  bio: null,
  is_active: false,
};

const mockLocation = {
  id: "loc-1",
  academy_id: "academy-1",
  name: "Төв заал",
  address: "Чингисийн өргөн чөлөө",
  city: "Улаанбаатар",
  hours: "Да-Ба 09:00-18:00",
  is_active: true,
};

const mockLocation2 = {
  id: "loc-2",
  academy_id: "academy-1",
  name: "Баруун салбар",
  address: "Баруун 4 зам",
  city: "Улаанбаатар",
  hours: "Да-Ба 10:00-20:00",
  is_active: false,
};

// ── Mutable query data for per-test control ──
// The object reference never changes, so the vi.mock closure
// always sees the current values.
const query: {
  profile: (typeof mockProfile)[];
  programs: (typeof mockProgram)[];
  trainers: (typeof mockTrainer)[];
  locations: (typeof mockLocation)[];
} = {
  profile: [mockProfile],
  programs: [mockProgram, mockProgramInactive],
  trainers: [mockTrainer, mockTrainer2],
  locations: [mockLocation, mockLocation2],
};

// ── Mock TanStack Query ──
vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    if (queryKey.includes("profile")) {
      return { data: query.profile, isPending: false };
    }
    if (queryKey.includes("programs")) {
      return { data: query.programs, isPending: false };
    }
    if (queryKey.includes("trainers")) {
      return { data: query.trainers, isPending: false };
    }
    if (queryKey.includes("locations")) {
      return { data: query.locations, isPending: false };
    }
    return { data: [], isPending: false };
  },
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// ── Mock academy API ──
vi.mock("@/app/admin/_lib/api", () => ({
  academyApi: {
    profile: {
      get: vi.fn(),
      getById: vi.fn(),
      update: vi.fn(),
      seed: vi.fn(),
    },
    programs: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
    trainers: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
    locations: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
  },
  AcademyProfileRow: {},
  AcademyProgramRow: {},
  AcademyTrainerRow: {},
  AcademyLocationRow: {},
}));

import AcademyLocationsPage from "../academy/locations/page";
// ── Page imports (must be after mocks) ──
import AcademyProfilePage from "../academy/page";
import AcademyPaymentsPage from "../academy/payments/page";
import AcademyProgramsPage from "../academy/programs/page";
import AcademyTrainersPage from "../academy/trainers/page";

// ── Global beforeEach: reset query data for every test ──
beforeEach(() => {
  vi.clearAllMocks();
  query.profile = [mockProfile];
  query.programs = [mockProgram, mockProgramInactive];
  query.trainers = [mockTrainer, mockTrainer2];
  query.locations = [mockLocation, mockLocation2];
});

// ═══════════════════════════════════════════
// AcademyProfilePage
// ═══════════════════════════════════════════

describe("AcademyProfilePage", () => {
  it("renders page title", () => {
    render(<AcademyProfilePage />);
    expect(screen.getByText("Академийн профайл")).toBeInTheDocument();
  });

  it("renders all profile form labels", () => {
    render(<AcademyProfilePage />);
    expect(screen.getByText("Нэр")).toBeInTheDocument();
    expect(screen.getByText("Лого URL")).toBeInTheDocument();
    expect(screen.getByText("Утас")).toBeInTheDocument();
    expect(screen.getByText("Имэйл")).toBeInTheDocument();
    expect(screen.getByText("Цагийн бүс")).toBeInTheDocument();
    expect(screen.getByText("Тохиргоо (JSON)")).toBeInTheDocument();
  });

  it("renders form input fields by label association", () => {
    render(<AcademyProfilePage />);
    expect(screen.getByLabelText("Нэр")).toBeInTheDocument();
    expect(screen.getByLabelText("Утас")).toBeInTheDocument();
    expect(screen.getByLabelText("Имэйл")).toBeInTheDocument();
    expect(screen.getByLabelText("Лого URL")).toBeInTheDocument();
  });

  it("renders stats banner with card titles", () => {
    render(<AcademyProfilePage />);
    expect(screen.getByText("Хөтөлбөр")).toBeInTheDocument();
    expect(screen.getByText("Дасгалжуулагч")).toBeInTheDocument();
    expect(screen.getByText("Байршил")).toBeInTheDocument();
  });

  it("shows stats counts from related data", () => {
    render(<AcademyProfilePage />);
    expect(screen.getAllByText("2")).toHaveLength(3);
  });

  it("displays profile data in the form", () => {
    render(<AcademyProfilePage />);
    const nameInput = screen.getByLabelText("Нэр") as HTMLInputElement;
    expect(nameInput.value).toBe("Тэст Академи");
  });

  it("renders save button", () => {
    render(<AcademyProfilePage />);
    expect(
      screen.getByRole("button", { name: "Хадгалах" }),
    ).toBeInTheDocument();
  });

  it("renders timezone select with default placeholder", () => {
    render(<AcademyProfilePage />);
    expect(screen.getByText("Цагийн бүс")).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════
// AcademyProgramsPage
// ═══════════════════════════════════════════

describe("AcademyProgramsPage", () => {
  it("renders page title", () => {
    render(<AcademyProgramsPage />);
    expect(screen.getByText("Хөтөлбөр")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    render(<AcademyProgramsPage />);
    expect(screen.getByText("Нэр")).toBeInTheDocument();
    expect(screen.getByText("Тайлбар")).toBeInTheDocument();
    expect(screen.getByText("Насны ангилал")).toBeInTheDocument();
    expect(screen.getByText("Үнэ (₮)")).toBeInTheDocument();
    expect(screen.getByText("Төлөв")).toBeInTheDocument();
    expect(screen.getByText("Үйлдэл")).toBeInTheDocument();
  });

  it("renders program data rows", () => {
    render(<AcademyProgramsPage />);
    expect(screen.getByText("Баскетбол суурь")).toBeInTheDocument();
    expect(screen.getByText("Мэргэжлийн")).toBeInTheDocument();
    expect(screen.getByText("Анхан шат")).toBeInTheDocument();
    expect(screen.getByText("Ахисан түвшин")).toBeInTheDocument();
  });

  it("renders add button", () => {
    render(<AcademyProgramsPage />);
    expect(screen.getByText("Нэмэх")).toBeInTheDocument();
  });

  it("shows empty state when no programs exist", () => {
    query.programs = [];
    render(<AcademyProgramsPage />);
    expect(screen.getByText("Хөтөлбөр олдсонгүй")).toBeInTheDocument();
    expect(
      screen.getByText("Одоогоор хөтөлбөр бүртгэгдээгүй байна."),
    ).toBeInTheDocument();
  });

  it("renders edit and delete action buttons for each row", () => {
    render(<AcademyProgramsPage />);
    expect(
      screen.getByRole("button", { name: "Баскетбол суурь засах" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Баскетбол суурь устгах" }),
    ).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════
// AcademyTrainersPage
// ═══════════════════════════════════════════

describe("AcademyTrainersPage", () => {
  it("renders page title", () => {
    render(<AcademyTrainersPage />);
    expect(screen.getByText("Дасгалжуулагч")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    render(<AcademyTrainersPage />);
    expect(screen.getByText("Нэр")).toBeInTheDocument();
    expect(screen.getByText("Мэргэжил")).toBeInTheDocument();
    expect(screen.getByText("Төлөв")).toBeInTheDocument();
    expect(screen.getByText("Үйлдэл")).toBeInTheDocument();
  });

  it("renders trainer data rows", () => {
    render(<AcademyTrainersPage />);
    expect(screen.getByText("Бат-Эрдэнэ")).toBeInTheDocument();
    expect(screen.getByText("Дэлгэр")).toBeInTheDocument();
    // Довтолгоо appears in both trainers' specialties, use getAllByText
    expect(screen.getAllByText("Довтолгоо")).toHaveLength(2);
    expect(screen.getByText("Хамгаалалт")).toBeInTheDocument();
  });

  it("renders add button", () => {
    render(<AcademyTrainersPage />);
    expect(screen.getByText("Нэмэх")).toBeInTheDocument();
  });

  it("shows empty state when no trainers exist", () => {
    query.trainers = [];
    render(<AcademyTrainersPage />);
    expect(screen.getByText("Дасгалжуулагч олдсонгүй")).toBeInTheDocument();
    expect(
      screen.getByText("Одоогоор дасгалжуулагч бүртгэгдээгүй байна."),
    ).toBeInTheDocument();
  });

  it("renders edit and delete action buttons for each row", () => {
    render(<AcademyTrainersPage />);
    expect(
      screen.getByRole("button", { name: "Бат-Эрдэнэ засах" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Бат-Эрдэнэ устгах" }),
    ).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════
// AcademyLocationsPage
// ═══════════════════════════════════════════

describe("AcademyLocationsPage", () => {
  it("renders page title", () => {
    render(<AcademyLocationsPage />);
    expect(screen.getByText("Байршил")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    render(<AcademyLocationsPage />);
    expect(screen.getByText("Нэр")).toBeInTheDocument();
    expect(screen.getByText("Хаяг")).toBeInTheDocument();
    expect(screen.getByText("Хот")).toBeInTheDocument();
    expect(screen.getByText("Цагийн хуваарь")).toBeInTheDocument();
    expect(screen.getByText("Төлөв")).toBeInTheDocument();
    expect(screen.getByText("Үйлдэл")).toBeInTheDocument();
  });

  it("renders location data rows", () => {
    render(<AcademyLocationsPage />);
    expect(screen.getByText("Төв заал")).toBeInTheDocument();
    expect(screen.getByText("Баруун салбар")).toBeInTheDocument();
    expect(screen.getByText("Чингисийн өргөн чөлөө")).toBeInTheDocument();
    expect(screen.getByText("Да-Ба 09:00-18:00")).toBeInTheDocument();
  });

  it("renders add button", () => {
    render(<AcademyLocationsPage />);
    expect(screen.getByText("Нэмэх")).toBeInTheDocument();
  });

  it("shows empty state when no locations exist", () => {
    query.locations = [];
    render(<AcademyLocationsPage />);
    expect(screen.getByText("Байршил олдсонгүй")).toBeInTheDocument();
    expect(
      screen.getByText("Одоогоор байршил бүртгэгдээгүй байна."),
    ).toBeInTheDocument();
  });

  it("renders edit and delete action buttons for each row", () => {
    render(<AcademyLocationsPage />);
    expect(
      screen.getByRole("button", { name: "Төв заал засах" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Төв заал устгах" }),
    ).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════
// AcademyPaymentsPage
// ═══════════════════════════════════════════

describe("AcademyPaymentsPage", () => {
  it("renders page title", () => {
    render(<AcademyPaymentsPage />);
    expect(screen.getByText("Төлбөр")).toBeInTheDocument();
  });

  it("renders QPay payment card header", () => {
    render(<AcademyPaymentsPage />);
    expect(screen.getByText("QPay төлбөр")).toBeInTheDocument();
  });

  it("renders amount input field", () => {
    render(<AcademyPaymentsPage />);
    expect(screen.getByLabelText("Дүн (₮)")).toBeInTheDocument();
  });

  it("renders description textarea", () => {
    render(<AcademyPaymentsPage />);
    expect(screen.getByLabelText("Тайлбар (optional)")).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<AcademyPaymentsPage />);
    expect(
      screen.getByRole("button", { name: "QPay-р төлөх" }),
    ).toBeInTheDocument();
  });

  it("amount input is of type number", () => {
    render(<AcademyPaymentsPage />);
    const input = screen.getByLabelText("Дүн (₮)") as HTMLInputElement;
    expect(input.type).toBe("number");
  });

  it("renders without crashing and shows form by default", () => {
    render(<AcademyPaymentsPage />);
    // In form step, no qr/success/error components should be present
    expect(screen.queryByTestId("qr-display")).not.toBeInTheDocument();
    expect(screen.queryByTestId("payment-success")).not.toBeInTheDocument();
    expect(screen.queryByTestId("payment-error")).not.toBeInTheDocument();
  });
});
