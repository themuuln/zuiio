import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { PinSettingsDialog } from "../pin-settings-dialog";

const tMock = vi.hoisted(() => ({
  t: (key: string) => key,
}));
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => tMock.t,
  };
});

vi.mock("@/components/ui/detail-drawer", () => ({
  DetailDrawer: Object.assign(
    ({ open, children }: { open: boolean; children: React.ReactNode }) =>
      open ? <div data-testid="detail-drawer">{children}</div> : null,
    {
      Header: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-header">{children}</div>
      ),
      Title: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-title">{children}</div>
      ),
      Description: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-description">{children}</div>
      ),
      Body: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-body">{children}</div>
      ),
      Footer: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-footer">{children}</div>
      ),
      FooterActions: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-footer-actions">{children}</div>
      ),
    },
  ),
}));

const updateBayViewPin = vi.fn();
vi.mock("@/lib/services/bay-view-service.actions", () => ({
  updateBayViewPin: (...args: unknown[]) => updateBayViewPin(...args),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

const onOpenChange = vi.fn();

function renderDialog(open = true) {
  return render(<PinSettingsDialog open={open} onOpenChange={onOpenChange} />);
}

describe("PinSettingsDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateBayViewPin.mockResolvedValue(undefined);
  });

  it("renders nothing when closed", () => {
    renderDialog(false);
    expect(screen.queryByTestId("detail-drawer")).not.toBeInTheDocument();
  });

  it("renders the form when open", () => {
    renderDialog();
    expect(screen.getByText("bayPinSettings")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("enterCurrentPin")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("enterDigits")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("repeatNewPin")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "updatePin" }),
    ).toBeInTheDocument();
  });

  it("shows validation errors and does not call the action on empty submit", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "updatePin" }));

    expect(screen.getByText("Current PIN is required")).toBeInTheDocument();
    expect(screen.getByText("New PIN is required")).toBeInTheDocument();
    expect(screen.getByText("Please confirm your new PIN")).toBeInTheDocument();
    expect(updateBayViewPin).not.toHaveBeenCalled();
  });

  it("rejects a non-numeric new PIN", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByPlaceholderText("enterCurrentPin"), "1234");
    await user.type(screen.getByPlaceholderText("enterDigits"), "abcd");
    await user.type(screen.getByPlaceholderText("repeatNewPin"), "abcd");
    await user.click(screen.getByRole("button", { name: "updatePin" }));

    expect(screen.getByText("PIN must be 4-6 digits")).toBeInTheDocument();
    expect(updateBayViewPin).not.toHaveBeenCalled();
  });

  it("rejects when the new PIN and confirmation do not match", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByPlaceholderText("enterCurrentPin"), "1234");
    await user.type(screen.getByPlaceholderText("enterDigits"), "5678");
    await user.type(screen.getByPlaceholderText("repeatNewPin"), "9999");
    await user.click(screen.getByRole("button", { name: "updatePin" }));

    expect(screen.getByText("PINs do not match")).toBeInTheDocument();
    expect(updateBayViewPin).not.toHaveBeenCalled();
  });

  it("submits the new PIN and renders the success state when all fields are valid", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByPlaceholderText("enterCurrentPin"), "1234");
    await user.type(screen.getByPlaceholderText("enterDigits"), "5678");
    await user.type(screen.getByPlaceholderText("repeatNewPin"), "5678");
    await user.click(screen.getByRole("button", { name: "updatePin" }));

    await waitFor(() => {
      expect(updateBayViewPin).toHaveBeenCalledWith("1234", "5678", "5678");
    });
    expect(screen.getByText("pinUpdated")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "done" })).toBeInTheDocument();
  });

  it("closes via the cancel button", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
