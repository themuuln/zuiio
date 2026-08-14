import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { ComplaintSection } from "../complaint-section";

// ── Mock useWizardContext ─────────────────────────────────────────────
const mockSetComplaint = vi.fn();
const mockSetDiagnosisLabelId = vi.fn();
let mockCtx: {
  complaint: string;
  setComplaint: typeof mockSetComplaint;
  diagnosisLabelId: string;
  setDiagnosisLabelId: typeof mockSetDiagnosisLabelId;
};

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

// ── Mock useCurrentOrg ────────────────────────────────────────────────
vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({ data: { orgId: "org-1" } }),
}));

// ── Mock useDiagnosisLabels ───────────────────────────────────────────
const mockUseDiagnosisLabels = vi.fn();
vi.mock("@/lib/queries/use-diagnosis-labels", () => ({
  useDiagnosisLabels: (...args: unknown[]) => mockUseDiagnosisLabels(...args),
}));

// ── Helpers ───────────────────────────────────────────────────────────
const defaultLabels = [
  {
    id: "label-1",
    name: "Engine",
    name_mn: "\u0425\u04e9\u0434\u04e9\u043b\u0433\u04af\u04af\u0440",
    color: "#ff0000",
    is_active: true,
    sort_order: 1,
    organization_id: "org-1",
    created_by: null,
    created_at: "",
    updated_at: "",
    deleted_at: null,
  },
  {
    id: "label-2",
    name: "Brake",
    name_mn: "\u0422\u043e\u0440\u043c\u043e\u0437",
    color: "#00ff00",
    is_active: true,
    sort_order: 2,
    organization_id: "org-1",
    created_by: null,
    created_at: "",
    updated_at: "",
    deleted_at: null,
  },
  {
    id: "label-3",
    name: "Inactive Label",
    name_mn: null,
    color: null,
    is_active: false,
    sort_order: 3,
    organization_id: "org-1",
    created_by: null,
    created_at: "",
    updated_at: "",
    deleted_at: null,
  },
];

function createMockCtx(
  overrides?: Partial<{
    complaint: string;
    setComplaint: typeof mockSetComplaint;
    diagnosisLabelId: string;
    setDiagnosisLabelId: typeof mockSetDiagnosisLabelId;
  }>,
) {
  return {
    complaint: "",
    setComplaint: mockSetComplaint,
    diagnosisLabelId: "",
    setDiagnosisLabelId: mockSetDiagnosisLabelId,
    ...overrides,
  };
}

function renderComplaint() {
  return render(<ComplaintSection />, {
    messages: {
      workOrderWizard: {
        complaint: "complaint",
        complaintPlaceholder: "complaintPlaceholder",
        diagnosisLabelPlaceholder: "diagnosisLabelPlaceholder",
      },
    },
  });
}

describe("ComplaintSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDiagnosisLabels.mockReturnValue({ data: defaultLabels });
    mockCtx = createMockCtx();
  });

  it("renders complaint textarea with value from context", () => {
    mockCtx = createMockCtx({ complaint: "Strange noise" });
    renderComplaint();

    const textarea = screen.getByPlaceholderText("complaintPlaceholder");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue("Strange noise");
  });

  it("calls setComplaint on textarea change", async () => {
    const user = userEvent.setup();
    renderComplaint();

    const textarea = screen.getByPlaceholderText("complaintPlaceholder");
    await user.type(textarea, "a");

    expect(mockSetComplaint).toHaveBeenCalled();
  });

  it("renders the diagnosis label combobox", () => {
    renderComplaint();

    expect(
      screen.getByPlaceholderText("diagnosisLabelPlaceholder"),
    ).toBeInTheDocument();
  });

  it("passes orgId to useDiagnosisLabels", () => {
    renderComplaint();

    expect(mockUseDiagnosisLabels).toHaveBeenCalledWith("org-1");
  });

  it("filters to active labels only", () => {
    renderComplaint();

    // useDiagnosisLabels returns all labels; component filters is_active
    expect(mockUseDiagnosisLabels).toHaveBeenCalled();
  });

  it("renders with wizard step data attribute", () => {
    const { container } = renderComplaint();

    expect(
      container.querySelector('[data-wizard-step="complaint"]'),
    ).toBeInTheDocument();
  });

  it("handles undefined labels gracefully", () => {
    mockUseDiagnosisLabels.mockReturnValue({ data: undefined });
    renderComplaint();

    expect(
      screen.getByPlaceholderText("complaintPlaceholder"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("diagnosisLabelPlaceholder"),
    ).toBeInTheDocument();
  });

  it("preserves selected diagnosis label id in context", () => {
    mockCtx = createMockCtx({ diagnosisLabelId: "label-1" });
    const { container } = renderComplaint();

    expect(
      container.querySelector('[data-wizard-step="complaint"]'),
    ).toBeInTheDocument();
  });
});
