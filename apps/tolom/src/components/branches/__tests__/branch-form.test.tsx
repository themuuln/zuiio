import { screen, waitFor } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { BranchForm } from "../branch-form";

// ── Mock state ─────────────────────────────────────────────────────────
const hooks = vi.hoisted(() => ({
  createBranch: vi.fn(),
  orgId: "org-1" as string | null,
}));

vi.mock("next-intl", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), dismiss: vi.fn() },
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({
    data: hooks.orgId ? { orgId: hooks.orgId } : null,
    isPending: false,
  }),
}));

vi.mock("@/lib/queries/use-create-branch", () => ({
  useCreateBranch: () => ({
    mutateAsync: hooks.createBranch,
    isPending: false,
  }),
}));

// ── Helpers ────────────────────────────────────────────────────────────

async function fillRequiredFields(user: UserEvent) {
  await user.type(
    screen.getByPlaceholderText("settings.branchNamePlaceholder"),
    "UB Central",
  );
}

function submitButton(): HTMLButtonElement {
  return screen.getByRole("button", { name: "common.save" });
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("BranchForm", () => {
  beforeEach(() => {
    hooks.orgId = "org-1";
    hooks.createBranch.mockReset();
    hooks.createBranch.mockResolvedValue({ id: "b-1", name: "UB Central" });
  });

  it("renders all branch fields and a cancel button when onCancel is provided", () => {
    render(<BranchForm onCancel={vi.fn()} />);
    expect(
      screen.getByPlaceholderText("settings.branchNamePlaceholder"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("settings.branchAddressPlaceholder"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("settings.branchPhonePlaceholder"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("settings.branchEmailPlaceholder"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "common.cancel" }),
    ).toBeInTheDocument();
  });

  it("validates the required name on empty submit", async () => {
    const user = userEvent.setup();
    render(<BranchForm />);
    await user.click(submitButton());
    expect(
      await screen.findByText("Branch name is required"),
    ).toBeInTheDocument();
    expect(hooks.createBranch).not.toHaveBeenCalled();
  });

  it("submits the name/address/phone/email payload and calls onSuccess", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<BranchForm onSuccess={onSuccess} />);

    await fillRequiredFields(user);
    await user.type(
      screen.getByPlaceholderText("settings.branchAddressPlaceholder"),
      "Sukhbaatar district",
    );
    await user.type(
      screen.getByPlaceholderText("settings.branchPhonePlaceholder"),
      "+97699112233",
    );
    await user.type(
      screen.getByPlaceholderText("settings.branchEmailPlaceholder"),
      "ub@example.com",
    );

    await user.click(submitButton());

    await waitFor(() =>
      expect(hooks.createBranch).toHaveBeenCalledWith({
        name: "UB Central",
        address: "Sukhbaatar district",
        phone: "+97699112233",
        email: "ub@example.com",
      }),
    );
    expect(toast.success).toHaveBeenCalledWith("common.saved");
    expect(onSuccess).toHaveBeenCalledWith({ id: "b-1", name: "UB Central" });
  });

  it("shows a toast and reports the error when creation fails", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    hooks.createBranch.mockRejectedValue(new Error("Branch limit reached"));
    render(<BranchForm onSuccess={onSuccess} />);

    await fillRequiredFields(user);
    await user.click(submitButton());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Branch limit reached"),
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("calls onCancel from the cancel button", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<BranchForm onCancel={onCancel} />);
    await user.click(screen.getByRole("button", { name: "common.cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders without a form wrapper in disableFormWrapper mode", () => {
    const { container } = render(<BranchForm disableFormWrapper />);
    expect(container.querySelector("form")).not.toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("settings.branchNamePlaceholder"),
    ).toBeInTheDocument();
  });
});
