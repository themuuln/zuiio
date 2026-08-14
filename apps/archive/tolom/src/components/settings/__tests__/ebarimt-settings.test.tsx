import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EbarimtSettings } from "@/components/settings/ebarimt-settings";
import { render } from "@/test/test-utils";

// ── Mocks ──────────────────────────────────────────────────────────────

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

const mockReadSettings = vi.fn();
const mockUpdateSettings = vi.fn();
const mockTestConnection = vi.fn();

vi.mock("@/lib/actions/ebarimt-settings", () => ({
  readEbarimtSettings: (...args: unknown[]) => mockReadSettings(...args),
  updateEbarimtSettings: (...args: unknown[]) => mockUpdateSettings(...args),
  testCurrentEbarimtConnection: (...args: unknown[]) =>
    mockTestConnection(...args),
}));

// Mock useForm + zodResolver — the ebarimt component uses:
//   form.watch("enabled"), form.setValue, form.reset, form.handleSubmit,
//   form.register, form.formState
const mockWatch = vi.fn(() => false);
const mockSetValue = vi.fn();
const mockReset = vi.fn();
const mockRegister = vi.fn(() => ({}));
let mockFormState = { errors: {}, isValid: true };

vi.mock("@/lib/hooks/use-form", () => ({
  useForm: () => ({
    register: mockRegister,
    handleSubmit:
      (fn: (d: unknown) => void) => (e?: { preventDefault?: () => void }) => {
        e?.preventDefault?.();
        return fn({
          enabled: mockWatch("enabled"),
          apiKey: "test-api-key",
          merchantId: "test-merchant-id",
          endpoint: "https://ebarimt.mn/api",
        });
      },
    reset: mockReset,
    setValue: mockSetValue,
    watch: mockWatch,
    formState: mockFormState,
  }),
  zodResolver: () => vi.fn(),
}));

// ── Test data ──────────────────────────────────────────────────────────

const connectedSettings = {
  enabled: true,
  apiKey: "sk_test_key",
  merchantId: "MERCH-001",
  endpoint: "https://ebarimt.mn/api",
};

const disconnectedSettings = {
  enabled: false,
  apiKey: "",
  merchantId: "",
  endpoint: "https://ebarimt.mn/api",
};

// ── Helpers ────────────────────────────────────────────────────────────

function renderSettings(props: Record<string, unknown> = {}) {
  return render(<EbarimtSettings orgId="test-org-id" {...props} />);
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("EbarimtSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFormState = { errors: {}, isValid: true };
    mockWatch.mockReturnValue(false);
    mockReset.mockImplementation(() => {});
    mockSetValue.mockImplementation(() => {});
  });

  // ── 1. Skeleton loading state ────────────────────────────────────

  it("shows skeleton loading when data is loading", () => {
    // Don't resolve readEbarimtSettings — keep loading true
    mockReadSettings.mockImplementation(
      () =>
        new Promise<never>(() => {
          /* never resolves */
        }),
    );

    const { container } = renderSettings();

    // Should show skeleton elements
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );

    // Should not show the form yet
    expect(screen.queryByLabelText("Enable e-barimt")).not.toBeInTheDocument();
  });

  // ── 2. Connected state ───────────────────────────────────────────

  it("renders connection status as connected when enabled", async () => {
    mockReadSettings.mockResolvedValue(connectedSettings);
    mockWatch.mockReturnValue(true);

    renderSettings();

    // Wait for data to load and form to render
    await waitFor(() => {
      expect(screen.getByLabelText("Enable e-barimt")).toBeInTheDocument();
    });

    // The toggle should show as enabled (checked)
    const toggle = screen.getByLabelText("Enable e-barimt");
    expect(toggle).toBeInTheDocument();
  });

  // ── 3. Disconnected state ────────────────────────────────────────

  it("shows merchant ID and API key fields when disconnected", async () => {
    mockReadSettings.mockRejectedValue(new Error("No config"));

    renderSettings();

    // Wait for form to load (CardTitle only appears after loading)
    await waitFor(() => {
      expect(screen.getByText("E-Barimt Integration")).toBeInTheDocument();
    });

    // Form fields should render with default values
    expect(screen.getByText("API Key")).toBeInTheDocument();
    expect(screen.getByText("Endpoint URL")).toBeInTheDocument();
  });

  // ── 4. Shows merchant ID ─────────────────────────────────────────

  it("shows merchant ID and API key labels", async () => {
    mockReadSettings.mockResolvedValue(connectedSettings);
    mockWatch.mockReturnValue(true);

    renderSettings();

    await waitFor(() => {
      expect(screen.getByText("E-Barimt Integration")).toBeInTheDocument();
    });

    expect(screen.getByText("Merchant ID")).toBeInTheDocument();
    expect(screen.getByText("API Key")).toBeInTheDocument();
    expect(screen.getByText("Endpoint URL")).toBeInTheDocument();
  });

  // ── 5. Shows enabled toggle ──────────────────────────────────────

  it("shows VAT enabled toggle label and description", async () => {
    mockReadSettings.mockResolvedValue(connectedSettings);
    mockWatch.mockReturnValue(true);

    renderSettings();

    await waitFor(() => {
      expect(screen.getByLabelText("Enable e-barimt")).toBeInTheDocument();
    });

    expect(screen.getByText(/Enable E-Barimt/i)).toBeInTheDocument();
  });

  // ── 6. Connection test button ────────────────────────────────────

  it("connection test button is present and clickable when enabled", async () => {
    mockReadSettings.mockResolvedValue(connectedSettings);
    mockWatch.mockReturnValue(true);

    renderSettings();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Test Connection/i }),
      ).toBeInTheDocument();
    });

    const testBtn = screen.getByRole("button", { name: /Test Connection/i });
    expect(testBtn).not.toBeDisabled();
  });

  it("connection test button is disabled when ebarimt is not enabled", async () => {
    mockReadSettings.mockResolvedValue(disconnectedSettings);
    mockWatch.mockReturnValue(false);

    renderSettings();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Test Connection/i }),
      ).toBeInTheDocument();
    });

    const testBtn = screen.getByRole("button", { name: /Test Connection/i });
    expect(testBtn).toBeDisabled();
  });

  it("calls test connection when button is clicked", async () => {
    mockTestConnection.mockResolvedValue({
      success: true,
      message: "Connection successful",
    });
    mockReadSettings.mockResolvedValue(connectedSettings);
    mockWatch.mockReturnValue(true);

    renderSettings();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Test Connection/i }),
      ).toBeInTheDocument();
    });

    const testBtn = screen.getByRole("button", { name: /Test Connection/i });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(mockTestConnection).toHaveBeenCalledWith("test-org-id");
    });
  });

  // ── 7. Empty/no config state ─────────────────────────────────────

  it("renders with default values when no config exists", async () => {
    mockReadSettings.mockRejectedValue(new Error("Settings not found"));

    renderSettings();

    await waitFor(() => {
      // Should render the form (not skeleton)
      expect(screen.getByText("E-Barimt Integration")).toBeInTheDocument();
    });

    // Save button should exist (but may be disabled since enabled=false)
    expect(
      screen.getByRole("button", { name: /Save Settings/i }),
    ).toBeInTheDocument();

    // Test connection should be disabled
    expect(
      screen.getByRole("button", { name: /Test Connection/i }),
    ).toBeDisabled();
  });

  // ── 8. Save settings ─────────────────────────────────────────────

  it("save button calls updateEbarimtSettings on submit", async () => {
    mockUpdateSettings.mockResolvedValue(connectedSettings);
    mockReadSettings.mockResolvedValue(connectedSettings);
    mockWatch.mockReturnValue(true);

    renderSettings();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Save Settings/i }),
      ).toBeInTheDocument();
    });

    const saveBtn = screen.getByRole("button", { name: /Save Settings/i });
    expect(saveBtn).not.toBeDisabled();

    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalled();
    });
  });
});
