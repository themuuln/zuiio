/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mock next/navigation ─────────────────────────────────────────────────────

const mockPush = vi.hoisted(() => vi.fn());
const mockReplace = vi.hoisted(() => vi.fn());
const mockBack = vi.hoisted(() => vi.fn());
const mockUseSearchParams = vi.hoisted(() =>
  vi.fn(() => new URLSearchParams()),
);

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/academy/enroll"),
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  })),
  useSearchParams: () => mockUseSearchParams(),
}));

// ── Mock next/link ────────────────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

// ── Mock lucide-react ─────────────────────────────────────────────────────────

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

// ── Mock @/components/ui ──────────────────────────────────────────────────────

vi.mock("@/components/ui", () => ({
  Button: ({
    children,
    disabled,
    type,
    className,
    ...props
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    type?: string;
    className?: string;
    [key: string]: unknown;
  }) => (
    <button
      type={type ?? "button"}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="card-title">{children}</h2>
  ),
  Input: ({
    id,
    value,
    onChange,
    placeholder,
    type,
    ...props
  }: {
    id?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    type?: string;
    [key: string]: unknown;
  }) => (
    <input
      id={id}
      data-testid={`input-${id ?? "unknown"}`}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      type={type ?? "text"}
      readOnly={props.readOnly as boolean}
      {...props}
    />
  ),
}));

// ── Mock data-client ──────────────────────────────────────────────────────────

const mockSubmitRegistration = vi.hoisted(() => vi.fn());

vi.mock("../../lib/data-client", () => ({
  submitRegistration: mockSubmitRegistration,
}));

// ── Page Import ───────────────────────────────────────────────────────────────

import AcademyEnrollPage from "../enroll/page";

// ═══════════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe("AcademyEnrollPage — initial render", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("renders the enrollment form with all fields", () => {
    render(<AcademyEnrollPage />);

    // Title and button both contain "Бүртгүүлэх"
    const submitElements = screen.getAllByText("Бүртгүүлэх");
    expect(submitElements.length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText("Доорх маягтыг бөглөөд бүртгүүлнэ үү."),
    ).toBeInTheDocument();
    expect(screen.getByText("Холбогдох мэдээлэл")).toBeInTheDocument();

    // Check form fields
    expect(screen.getByText("Сурагчийн нэр")).toBeInTheDocument();
    expect(screen.getByText("Төрсөн огноо")).toBeInTheDocument();
    expect(screen.getByText("Эцэг/эхийн нэр")).toBeInTheDocument();
    expect(screen.getByText("Тэмдэглэл")).toBeInTheDocument();

    // Check submit button exists
    expect(
      screen.getByRole("button", { name: /бүртгүүлэх/i }),
    ).toBeInTheDocument();
  });

  it("renders program info when search params are provided", () => {
    const params = new URLSearchParams();
    params.set("program", "prog-1");
    params.set("name", "Сагсан бөмбөгийн суурь");
    mockUseSearchParams.mockReturnValue(params);

    render(<AcademyEnrollPage />);

    expect(screen.getByText("Сонгосон хөтөлбөр")).toBeInTheDocument();
    expect(screen.getByText("Сагсан бөмбөгийн суурь")).toBeInTheDocument();
  });

  it("renders without program info when no search params", () => {
    render(<AcademyEnrollPage />);

    expect(screen.queryByText("Сонгосон хөтөлбөр")).not.toBeInTheDocument();
  });

  it("renders back link", () => {
    render(<AcademyEnrollPage />);

    const backLink = screen.getByText("Буцах");
    expect(backLink.closest("a")).toHaveAttribute("href", "/academy");
  });
});

describe("AcademyEnrollPage — form validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("shows validation error when student name is empty on submit", async () => {
    const user = userEvent.setup();
    render(<AcademyEnrollPage />);
    const submitButton = screen.getByRole("button", { name: /бүртгүүлэх/i });
    await user.click(submitButton);

    expect(
      screen.getByText("Сурагчийн нэр хэт богино байна"),
    ).toBeInTheDocument();
    expect(mockSubmitRegistration).not.toHaveBeenCalled();
  });

  it("shows validation error when student name is too short", async () => {
    const user = userEvent.setup();
    render(<AcademyEnrollPage />);

    const nameInput = screen.getByTestId("input-studentName");
    await user.type(nameInput, "A");
    const submitButton = screen.getByRole("button", { name: /бүртгүүлэх/i });
    await user.click(submitButton);

    expect(
      screen.getByText("Сурагчийн нэр хэт богино байна"),
    ).toBeInTheDocument();
    expect(mockSubmitRegistration).not.toHaveBeenCalled();
  });

  it("shows validation error when program is not selected", async () => {
    const user = userEvent.setup();
    render(<AcademyEnrollPage />);

    const nameInput = screen.getByTestId("input-studentName");
    await user.type(nameInput, "Баяртуул Болд");

    const submitButton = screen.getByRole("button", { name: /бүртгүүлэх/i });
    await user.click(submitButton);
    expect(
      await screen.findByText("Хөтөлбөрөө сонгоно уу"),
    ).toBeInTheDocument();
  });

  it("renders hidden program ID input", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams({ program: "prog-1", name: "Суурь" }),
    );
    render(<AcademyEnrollPage />);

    const hiddenInput = document.querySelector<HTMLInputElement>(
      'input[name="programId"]',
    );
    expect(hiddenInput).toBeInTheDocument();
    expect(hiddenInput?.value).toBe("prog-1");
  });

  it("shows submitting state with spinner when form is submitting", async () => {
    const { promise } = Promise.withResolvers<void>();
    mockSubmitRegistration.mockReturnValue(promise);
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams({ program: "prog-1", name: "Суурь" }),
    );

    const user = userEvent.setup();
    render(<AcademyEnrollPage />);

    // Type a valid name first to pass name validation
    await user.type(screen.getByTestId("input-studentName"), "Тест Тест");
    await user.click(screen.getByRole("button", { name: /бүртгүүлэх/i }));

    expect(await screen.findByText("Илгээж байна...")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /илгээж байна/i }),
    ).toBeDisabled();
  });
});

describe("AcademyEnrollPage — successful submission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams({ program: "prog-1", name: "Суурь" }),
    );
    mockSubmitRegistration.mockResolvedValue({
      intent_id: "intent-abc123",
      status: "pending",
      message: "Таны бүртгэлийг хүлээн авлаа.",
    });
  });

  it("shows success state after form submission", async () => {
    const user = userEvent.setup();
    render(<AcademyEnrollPage />);

    const nameInput = screen.getByTestId("input-studentName");
    await user.type(nameInput, "Баяртуул Болд");

    const submitButton = screen.getByRole("button", { name: /бүртгүүлэх/i });
    await user.click(submitButton);

    // Wait for promise resolution (success state appears directly)
    expect(await screen.findByText("Бүртгэл амжилттай")).toBeInTheDocument();
    expect(
      screen.getByText("Таны бүртгэлийг хүлээн авлаа."),
    ).toBeInTheDocument();
    expect(screen.getByText("ID: intent-abc123")).toBeInTheDocument();

    // Check navigation buttons in success state
    expect(screen.getByText("Буцах")).toBeInTheDocument();
    expect(screen.getByText("Нүүр хуудас")).toBeInTheDocument();
  });

  it("calls submitRegistration with correct data", async () => {
    const user = userEvent.setup();
    render(<AcademyEnrollPage />);

    const nameInput = screen.getByTestId("input-studentName");
    await user.type(nameInput, "Баяртуул Болд");

    await user.click(screen.getByRole("button", { name: /бүртгүүлэх/i }));

    expect(mockSubmitRegistration).toHaveBeenCalledWith({
      programId: "prog-1",
      studentName: "Баяртуул Болд",
      dateOfBirth: undefined,
      guardianName: undefined,
      guardianPhone: undefined,
      notes: undefined,
    });
  });

  it("clears validation errors when field is updated after error", async () => {
    const user = userEvent.setup();
    render(<AcademyEnrollPage />);

    // Submit without name to trigger validation error
    const submitButton = screen.getByRole("button", { name: /бүртгүүлэх/i });
    await user.click(submitButton);

    expect(
      screen.getByText("Сурагчийн нэр хэт богино байна"),
    ).toBeInTheDocument();

    // Now type a valid name
    const nameInput = screen.getByTestId("input-studentName");
    await user.type(nameInput, "Баяртуул Болд");

    // The error should be cleared when the field is updated
    expect(
      screen.queryByText("Сурагчийн нэр хэт богино байна"),
    ).not.toBeInTheDocument();
  });
});

describe("AcademyEnrollPage — submission error", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams({ program: "prog-1", name: "Суурь" }),
    );
    mockSubmitRegistration.mockRejectedValue(
      new Error("Серверийн алдаа гарлаа"),
    );
  });

  it("displays error message when submission fails", async () => {
    const user = userEvent.setup();
    render(<AcademyEnrollPage />);

    const nameInput = screen.getByTestId("input-studentName");
    await user.type(nameInput, "Баяртуул Болд");

    await user.click(screen.getByRole("button", { name: /бүртгүүлэх/i }));

    expect(
      await screen.findByText("Серверийн алдаа гарлаа"),
    ).toBeInTheDocument();

    // Form should remain editable for retry
    expect(
      screen.getByRole("button", { name: /бүртгүүлэх/i }),
    ).toBeInTheDocument();
  });

  it("re-enables submit button after error", async () => {
    const user = userEvent.setup();
    render(<AcademyEnrollPage />);

    await user.type(screen.getByTestId("input-studentName"), "Тест");
    await user.click(screen.getByRole("button", { name: /бүртгүүлэх/i }));

    // Wait for error to appear
    expect(
      await screen.findByText("Серверийн алдаа гарлаа"),
    ).toBeInTheDocument();

    // Button should be enabled again
    expect(screen.getByRole("button", { name: /бүртгүүлэх/i })).toBeEnabled();
  });
});
