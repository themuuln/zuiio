import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { MechanicRegistrationDialog } from "../mechanic-registration-dialog";

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

const onRegistered = vi.fn();
const onOpenChange = vi.fn();

function renderDialog(open = true) {
  return render(
    <MechanicRegistrationDialog
      open={open}
      onOpenChange={onOpenChange}
      onRegistered={onRegistered}
    />,
  );
}

describe("MechanicRegistrationDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when closed", () => {
    renderDialog(false);
    expect(screen.queryByTestId("detail-drawer")).not.toBeInTheDocument();
  });

  it("renders the form fields when open", () => {
    renderDialog();
    expect(screen.getByTestId("detail-drawer")).toBeInTheDocument();
    expect(
      screen.getAllByText("registerMechanicBtn").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByPlaceholderText("namePlaceholder")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("emailPlaceholder")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("phonePlaceholder")).toBeInTheDocument();
  });

  it("shows validation errors and does not register on empty submit", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(
      screen.getByRole("button", { name: "registerMechanicBtn" }),
    );

    expect(
      screen.getByText("Name must be at least 2 characters"),
    ).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
    expect(onRegistered).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("rejects an invalid phone number", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(
      screen.getByPlaceholderText("namePlaceholder"),
      "Bat Erdene",
    );
    await user.type(
      screen.getByPlaceholderText("emailPlaceholder"),
      "bat@example.com",
    );
    await user.type(screen.getByPlaceholderText("phonePlaceholder"), "123");
    await user.click(
      screen.getByRole("button", { name: "registerMechanicBtn" }),
    );

    expect(
      screen.getByText("Enter a valid Mongolian phone number (8 digits)"),
    ).toBeInTheDocument();
    expect(onRegistered).not.toHaveBeenCalled();
  });

  it("calls onRegistered with normalized phone and closes on valid submit", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(
      screen.getByPlaceholderText("namePlaceholder"),
      "Bat Erdene",
    );
    await user.type(
      screen.getByPlaceholderText("emailPlaceholder"),
      "bat@example.com",
    );
    await user.type(
      screen.getByPlaceholderText("phonePlaceholder"),
      "99112233",
    );
    await user.click(
      screen.getByRole("button", { name: "registerMechanicBtn" }),
    );

    expect(onRegistered).toHaveBeenCalledTimes(1);
    expect(onRegistered).toHaveBeenCalledWith(
      "bat@example.com",
      "Bat Erdene",
      expect.stringMatching(/99112233/),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onRegistered without a phone when it is left empty", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(
      screen.getByPlaceholderText("namePlaceholder"),
      "Bat Erdene",
    );
    await user.type(
      screen.getByPlaceholderText("emailPlaceholder"),
      "bat@example.com",
    );
    await user.click(
      screen.getByRole("button", { name: "registerMechanicBtn" }),
    );

    expect(onRegistered).toHaveBeenCalledWith(
      "bat@example.com",
      "Bat Erdene",
      undefined,
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
