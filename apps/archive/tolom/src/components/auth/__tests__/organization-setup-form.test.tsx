import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { OrganizationSetupForm } from "../organization-setup-form";

// ── Mocks ──────────────────────────────────────────────────────────────
const hooks = vi.hoisted(() => ({
  createOrganization: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: hooks.push }),
}));

vi.mock("next-intl", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/app/[locale]/auth/setup-organization/actions", () => ({
  createOrganization: hooks.createOrganization,
}));

// ── Fixtures ───────────────────────────────────────────────────────────

const COPY = {
  title: "Set up your workshop",
  subtitle: "Create your organization",
  businessTypeTitle: "Business type",
  businessTypeSubtitle: "Pick the closest fit",
  orgNameLabel: "Organization name",
  orgNamePlaceholder: "e.g. UB Auto Service",
  continueButton: "Continue",
  backButton: "Back",
  createOrgButton: "Create organization",
  partSuggestionsLabel: "Part suggestions",
  partSuggestionsDesc: "Suggest parts from your catalog",
  inviteSectionTitle: "Invites",
  inviteSectionDesc: "Organizations that invited you",
  acceptInvite: "Accept",
};

function renderForm(
  overrides: {
    pendingInvites?: Array<{
      token: string;
      organization_name: string;
      inviter_name: string | null;
    }>;
  } = {},
) {
  return render(
    <OrganizationSetupForm
      pendingInvites={overrides.pendingInvites ?? []}
      copy={COPY}
    />,
  );
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("OrganizationSetupForm", () => {
  beforeEach(() => {
    hooks.createOrganization.mockReset();
    hooks.createOrganization.mockResolvedValue({});
    hooks.push.mockClear();
  });

  it("renders the title and all business type options on step 1", () => {
    renderForm();
    expect(screen.getByText(COPY.title)).toBeInTheDocument();
    // 6 business type buttons + continue
    const typeButtons = screen
      .getAllByRole("button")
      .filter((b) => b.tagName === "BUTTON");
    expect(typeButtons.length).toBe(7);
    expect(
      screen.getByRole("button", { name: COPY.continueButton }),
    ).toBeDisabled();
  });

  it("requires selecting a business type before continuing", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: COPY.continueButton }));
    expect(
      screen.queryByPlaceholderText(COPY.orgNamePlaceholder),
    ).not.toBeInTheDocument();
  });

  it("advances to step 2 with the chosen type and submits the org form", async () => {
    const user = userEvent.setup();
    renderForm();

    // Select the first business type (general_repair)
    const typeButtons = screen
      .getAllByRole("button")
      .filter((b) => b.tagName === "BUTTON");
    await user.click(typeButtons[0]);

    await user.click(screen.getByRole("button", { name: COPY.continueButton }));

    const nameInput = screen.getByPlaceholderText(COPY.orgNamePlaceholder);
    expect(nameInput).toBeInTheDocument();
    expect(
      document.querySelector<HTMLInputElement>('input[name="businessType"]')
        ?.value,
    ).toBe("general_repair");
    expect(
      document.querySelector<HTMLInputElement>(
        'input[name="enablePartSuggestions"]',
      )?.value,
    ).toBe("on");

    await user.type(nameInput, "UB Auto");
    const form = nameInput.closest("form");
    if (!form) throw new Error("form not found");

    await act(async () => {
      fireEvent.submit(form);
    });

    await waitFor(() =>
      expect(hooks.createOrganization).toHaveBeenCalledTimes(1),
    );
    const [, formData] = hooks.createOrganization.mock.calls[0] as [
      unknown,
      FormData,
    ];
    expect(formData.get("organizationName")).toBe("UB Auto");
    expect(formData.get("businessType")).toBe("general_repair");
    expect(formData.get("enablePartSuggestions")).toBe("on");
  });

  it("submits enablePartSuggestions=off after unchecking the toggle", async () => {
    const user = userEvent.setup();
    renderForm();

    const typeButtons = screen
      .getAllByRole("button")
      .filter((b) => b.tagName === "BUTTON");
    await user.click(typeButtons[0]);
    await user.click(screen.getByRole("button", { name: COPY.continueButton }));

    const toggle = document.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    if (!toggle) throw new Error("toggle not found");
    fireEvent.click(toggle);

    const form = toggle.closest("form");
    if (!form) throw new Error("form not found");
    await act(async () => {
      fireEvent.submit(form);
    });

    await waitFor(() =>
      expect(hooks.createOrganization).toHaveBeenCalledTimes(1),
    );
    const [, formData] = hooks.createOrganization.mock.calls[0] as [
      unknown,
      FormData,
    ];
    expect(formData.get("enablePartSuggestions")).toBe("off");
  });

  it("shows server field errors after submission", async () => {
    const user = userEvent.setup();
    hooks.createOrganization.mockResolvedValue({
      fieldErrors: { organizationName: "Name too short" },
    });
    renderForm();

    const typeButtons = screen
      .getAllByRole("button")
      .filter((b) => b.tagName === "BUTTON");
    await user.click(typeButtons[0]);
    await user.click(screen.getByRole("button", { name: COPY.continueButton }));

    const nameInput = screen.getByPlaceholderText(COPY.orgNamePlaceholder);
    const form = nameInput.closest("form");
    if (!form) throw new Error("form not found");
    await act(async () => {
      fireEvent.submit(form);
    });

    expect(await screen.findByText("Name too short")).toBeInTheDocument();
  });

  it("shows a toast for a form-level server error", async () => {
    const user = userEvent.setup();
    hooks.createOrganization.mockResolvedValue({
      formError: "Failed to create organization",
    });
    renderForm();

    const typeButtons = screen
      .getAllByRole("button")
      .filter((b) => b.tagName === "BUTTON");
    await user.click(typeButtons[0]);
    await user.click(screen.getByRole("button", { name: COPY.continueButton }));

    const nameInput = screen.getByPlaceholderText(COPY.orgNamePlaceholder);
    const form = nameInput.closest("form");
    if (!form) throw new Error("form not found");
    await act(async () => {
      fireEvent.submit(form);
    });

    expect(
      await screen.findByText("Failed to create organization"),
    ).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("Failed to create organization", {
      duration: 5000,
    });
  });

  it("renders pending invites and navigates to the invite page", async () => {
    const user = userEvent.setup();
    renderForm({
      pendingInvites: [
        {
          token: "tok-1",
          organization_name: "Acme Garage",
          inviter_name: "Bold",
        },
      ],
    });

    expect(screen.getByText(COPY.inviteSectionTitle)).toBeInTheDocument();
    expect(screen.getByText("Acme Garage")).toBeInTheDocument();
    expect(screen.getByText(/Invited by Bold/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: COPY.acceptInvite }));
    expect(hooks.push).toHaveBeenCalledWith("/invite/tok-1");
  });
});
