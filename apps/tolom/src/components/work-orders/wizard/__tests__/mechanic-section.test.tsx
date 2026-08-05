import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { MechanicSection } from "../mechanic-section";

// ── Mock useWizardContext ─────────────────────────────────────────────
const mockSetSelectedMechanic = vi.fn();
const mockSetDescription = vi.fn();
let mockCtx: Record<string, unknown>;

vi.mock("../wizard-context", () => ({
  useWizardContext: () => mockCtx,
}));

// ── Mock next-intl ────────────────────────────────────────────────────
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

// ── Mock MechanicSelect ───────────────────────────────────────────────
vi.mock("@/components/mechanic-select", () => ({
  MechanicSelect: vi.fn(
    ({
      value,
      onChange,
      mechanics,
      showJobCount,
      size,
    }: {
      value: string;
      onChange: (id: string) => void;
      mechanics: { id: string; full_name?: string | null }[];
      showJobCount?: boolean;
      size?: string;
    }) => (
      <div data-testid="mechanic-select-mock">
        <span data-testid="mechanic-select-value">{value}</span>
        <span data-testid="mechanic-select-mechanics-count">
          {mechanics.length}
        </span>
        <span data-testid="mechanic-select-show-job-count">
          {String(showJobCount)}
        </span>
        <span data-testid="mechanic-select-size">{size}</span>
        <button
          type="button"
          data-testid="mechanic-select-change"
          onClick={() => onChange("mech-2")}
        >
          change
        </button>
      </div>
    ),
  ),
}));

// ── Helpers ───────────────────────────────────────────────────────────
const mockMechanics = [
  { id: "mech-1", full_name: "Alice Smith" },
  { id: "mech-2", full_name: "Bob Jones" },
];

function createMockCtx(overrides?: Record<string, unknown>) {
  return {
    selectedMechanic: "",
    setSelectedMechanic: mockSetSelectedMechanic,
    mechanics: mockMechanics,
    description: "",
    setDescription: mockSetDescription,
    ...overrides,
  };
}

function renderMechanic() {
  return render(<MechanicSection />, {
    messages: {
      workOrderWizard: {
        mechanic: "mechanic",
        notes: "notes",
        descriptionOrNotes: "descriptionOrNotes",
      },
    },
  });
}

describe("MechanicSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = createMockCtx();
  });

  it("renders mechanic select with context values", () => {
    mockCtx = createMockCtx({
      selectedMechanic: "mech-1",
      mechanics: mockMechanics,
    });
    renderMechanic();

    expect(screen.getByTestId("mechanic-select-mock")).toBeInTheDocument();
    expect(screen.getByTestId("mechanic-select-value")).toHaveTextContent(
      "mech-1",
    );
    expect(
      screen.getByTestId("mechanic-select-mechanics-count"),
    ).toHaveTextContent("2");
  });

  it("passes showJobCount and size to MechanicSelect", () => {
    renderMechanic();

    expect(
      screen.getByTestId("mechanic-select-show-job-count"),
    ).toHaveTextContent("true");
    expect(screen.getByTestId("mechanic-select-size")).toHaveTextContent(
      "default",
    );
  });

  it("calls setSelectedMechanic when mechanic select changes", async () => {
    const user = userEvent.setup();
    renderMechanic();

    await user.click(screen.getByTestId("mechanic-select-change"));

    expect(mockSetSelectedMechanic).toHaveBeenCalledWith("mech-2");
  });

  it("renders description input with value from context", () => {
    mockCtx = createMockCtx({ description: "Check engine light" });
    renderMechanic();

    const input = screen.getByPlaceholderText("descriptionOrNotes");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("Check engine light");
  });

  it("calls setDescription on input change", async () => {
    const user = userEvent.setup();
    renderMechanic();

    const input = screen.getByPlaceholderText("descriptionOrNotes");
    await user.type(input, "x");

    expect(mockSetDescription).toHaveBeenCalled();
  });

  it("renders with empty description by default", () => {
    renderMechanic();

    const input = screen.getByPlaceholderText("descriptionOrNotes");
    expect(input).toHaveValue("");
  });

  it("renders notes card with correct title", () => {
    renderMechanic();

    expect(screen.getByText("notes")).toBeInTheDocument();
  });

  it("renders mechanic card with correct title", () => {
    renderMechanic();

    expect(screen.getByText("mechanic")).toBeInTheDocument();
  });

  it("renders mechanic and notes in a grid layout", () => {
    const { container } = renderMechanic();

    // The wrapping div has data-wizard-step="mechanic"
    expect(
      container.querySelector('[data-wizard-step="mechanic"]'),
    ).toBeInTheDocument();
  });
});
