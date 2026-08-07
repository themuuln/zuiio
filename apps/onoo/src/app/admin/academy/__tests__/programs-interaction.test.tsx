/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Shared Mocks ──

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/admin/academy"),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

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
    <div>
      <div data-testid="page-title">{title}</div>
      <div data-testid="actions">{actions}</div>
      {loading ? (
        <div data-testid="loading">Loading...</div>
      ) : isEmpty ? (
        <div data-testid="empty-state">
          <div>{emptyTitle}</div>
          <div>{emptyDescription}</div>
        </div>
      ) : (
        <div data-testid="content">{children}</div>
      )}
    </div>
  ),
}));

vi.mock("@/components/admin/admin-layout-context", () => ({
  AdminLayoutProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// ── Test data ──

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

// ── Mutable query data ──
const query: { programs: (typeof mockProgram)[] } = {
  programs: [mockProgram, mockProgramInactive],
};

// ── Mock TanStack Query ──
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: query.programs, isPending: false }),
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
    programs: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
  },
  AcademyProgramRow: {},
}));

import AcademyProgramsPage from "../programs/page";

// ── Tests ──

describe("AcademyProgramsPage — form interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    query.programs = [mockProgram, mockProgramInactive];
  });

  it("opens create dialog when Нэмэх is clicked", async () => {
    const user = userEvent.setup();
    render(<AcademyProgramsPage />);

    const addButton = screen.getByText("Нэмэх");
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("Шинэ хөтөлбөр нэмэх")).toBeInTheDocument();
    });
  });

  it("opens edit dialog with pre-filled data when edit button clicked", async () => {
    const user = userEvent.setup();
    render(<AcademyProgramsPage />);

    const editButton = screen.getByRole("button", {
      name: `${mockProgram.name} засах`,
    });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByText("Хөтөлбөр засах")).toBeInTheDocument();
    });

    // Verify form fields are pre-filled
    const nameInput = screen.getByDisplayValue(mockProgram.name);
    expect(nameInput).toBeInTheDocument();
  });

  it("shows ConfirmDialog when delete button is clicked", async () => {
    const user = userEvent.setup();
    render(<AcademyProgramsPage />);

    const deleteButton = screen.getByRole("button", {
      name: `${mockProgram.name} устгах`,
    });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(
        screen.getByText(`"${mockProgram.name}" хөтөлбөрийг устгах уу?`),
      ).toBeInTheDocument();
    });
  });

  it("shows form fields in the create dialog", async () => {
    const user = userEvent.setup();
    render(<AcademyProgramsPage />);

    const addButton = screen.getByText("Нэмэх");
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("Шинэ хөтөлбөр нэмэх")).toBeInTheDocument();
    });

    // Verify form controls are present (use getAllByText for labels that may duplicate with table headers)
    expect(screen.getAllByText("Нэр").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Тайлбар").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Насны ангилал").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.getAllByText("Үнэ (₮)").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Төлөв").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Цуцлах")).toBeInTheDocument();
  });

  it("closes dialog when Цуцлах is clicked", async () => {
    const user = userEvent.setup();
    render(<AcademyProgramsPage />);

    const addButton = screen.getByText("Нэмэх");
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("Шинэ хөтөлбөр нэмэх")).toBeInTheDocument();
    });

    const cancelButton = screen.getByText("Цуцлах");
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText("Шинэ хөтөлбөр нэмэх")).not.toBeInTheDocument();
    });
  });
});
