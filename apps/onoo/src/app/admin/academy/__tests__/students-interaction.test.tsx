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

const mockStudent = {
  id: "student-1",
  academy_id: "academy-1",
  canonical_name: "Бат",
  name_latin: "Bat",
  school_name: "1-р сургууль",
  emergency_contact_phone: "99112233",
  status: "active",
  date_of_birth: null,
  photo_url: null,
  grade_level: null,
  medical_notes: null,
  allergies: null,
  emergency_contact_name: null,
  notes: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockStudent2 = {
  id: "student-2",
  academy_id: "academy-1",
  canonical_name: "Дорж",
  name_latin: "Dorj",
  school_name: null,
  emergency_contact_phone: null,
  status: "inactive",
  date_of_birth: null,
  photo_url: null,
  grade_level: null,
  medical_notes: null,
  allergies: null,
  emergency_contact_name: null,
  notes: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

// ── Mutable query data ──
const query: {
  students: (typeof mockStudent)[];
  ref: { profile: { id: string }[] };
} = {
  students: [mockStudent, mockStudent2],
  ref: { profile: [{ id: "academy-1" }] },
};

// ── Mock TanStack Query ──
vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    if (queryKey.includes("students")) {
      return { data: query.students, isPending: false };
    }
    if (queryKey.includes("reference")) {
      return { data: query.ref, isPending: false };
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
    students: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
  },
  academyRefApi: {
    get: vi.fn(),
  },
  AcademyStudentRow: {},
}));

import AcademyStudentsPage from "../students/page";

// ── Tests ──

describe("AcademyStudentsPage — form interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    query.students = [mockStudent, mockStudent2];
    query.ref = { profile: [{ id: "academy-1" }] };
  });

  it("renders student data in table", () => {
    render(<AcademyStudentsPage />);
    expect(screen.getByText("Бат")).toBeInTheDocument();
    expect(screen.getByText("Дорж")).toBeInTheDocument();
    expect(screen.getByText("1-р сургууль")).toBeInTheDocument();
  });

  it("opens create dialog when Нэмэх is clicked", async () => {
    const user = userEvent.setup();
    render(<AcademyStudentsPage />);

    const addButton = screen.getByText("Нэмэх");
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("Шинэ сурагч нэмэх")).toBeInTheDocument();
    });
  });

  it("opens edit dialog when edit button clicked", async () => {
    const user = userEvent.setup();
    render(<AcademyStudentsPage />);

    const editButton = screen.getByRole("button", {
      name: `${mockStudent.canonical_name} засах`,
    });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByText("Сурагч засах")).toBeInTheDocument();
    });

    // Verify form pre-filled with data
    expect(
      screen.getByDisplayValue(mockStudent.canonical_name),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(mockStudent.name_latin),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(mockStudent.school_name),
    ).toBeInTheDocument();
  });

  it("shows ConfirmDialog when delete is clicked", async () => {
    const user = userEvent.setup();
    render(<AcademyStudentsPage />);

    const deleteButton = screen.getByRole("button", {
      name: `${mockStudent.canonical_name} устгах`,
    });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          `"${mockStudent.canonical_name}" сурагчийг устгах уу?`,
        ),
      ).toBeInTheDocument();
    });
  });

  it("shows validation error when submitting empty form", async () => {
    const user = userEvent.setup();
    render(<AcademyStudentsPage />);

    // Open dialog
    const addButton = screen.getByText("Нэмэх");
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("Шинэ сурагч нэмэх")).toBeInTheDocument();
    });

    // Submit with empty name
    const submitButton = screen.getByText("Хадгалах");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Нэр заавал байх ёстой")).toBeInTheDocument();
    });
  });
});
