import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import type * as NextIntl from "next-intl";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewMechanicDrawer } from "@/components/new-mechanic-drawer";
import { reportServerError } from "@/lib/sentry-report-server";
import { render } from "@/test/test-utils";

// Stable t() identity — NewMechanicDrawer's role-fetch effect depends on `t`.
const t = vi.hoisted(() => (key: string) => key);
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof NextIntl>("next-intl");
  return { ...actual, useTranslations: () => t };
});

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), dismiss: vi.fn() },
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({ data: { orgId: "org-1" } }),
}));

const mockFetch = vi.fn();
const ROLES = [{ id: "role-mechanic", name: "Mechanic" }];

function roleLoaded() {
  // The role select shows the loaded role name in its value slot
  return screen.findByText("Mechanic", {
    selector: '[data-slot="select-value"]',
  });
}

function renderDrawer(onOpenChange: (open: boolean) => void = vi.fn()) {
  return render(<NewMechanicDrawer open onOpenChange={onOpenChange} />);
}

describe("NewMechanicDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: ROLES }),
    });
    Object.assign(navigator, { clipboard: { writeText: vi.fn() } });
  });

  it("loads roles on open and shows validation errors on empty submit", async () => {
    renderDrawer();
    // Role fetch resolves and selects the default "Mechanic" role
    await roleLoaded();
    expect(mockFetch).toHaveBeenCalledWith("/api/organizations/org-1/roles");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "formTitle" }));
    });

    expect(screen.getByText("validation.fullNameRequired")).toBeInTheDocument();
    expect(
      screen.getByText("validation.identifierRequired"),
    ).toBeInTheDocument();
    expect(screen.getByText("validation.passwordRequired")).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalledWith(
      "/api/organizations/org-1/members",
      expect.anything(),
    );
  });

  it("creates the mechanic and shows the credentials view", async () => {
    const onOpenChange = vi.fn();
    renderDrawer(onOpenChange);
    await roleLoaded();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          email: "bold@garage.mn",
          identifier: "bold",
          password: "password123",
          fullName: "Bold",
        },
      }),
    });

    fireEvent.change(screen.getByPlaceholderText("fullNamePlaceholder"), {
      target: { value: "Bold" },
    });
    fireEvent.change(screen.getByPlaceholderText("identifierPlaceholder"), {
      target: { value: "bold" },
    });
    fireEvent.change(screen.getByPlaceholderText("passwordPlaceholder"), {
      target: { value: "password123" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "formTitle" }));
    });

    await waitFor(() => {
      expect(screen.getByText("credentialsTitle")).toBeInTheDocument();
    });
    expect(screen.getByText("bold")).toBeInTheDocument();
    expect(screen.getByText("password123")).toBeInTheDocument();
    expect(screen.getByText("Bold")).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("mechanicAdded");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/organizations/org-1/members",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"identifier":"bold"'),
      }),
    );
  });

  it("copies credentials to the clipboard from the success view", async () => {
    renderDrawer();
    await roleLoaded();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          email: "bold@garage.mn",
          identifier: "bold",
          password: "password123",
          fullName: "Bold",
        },
      }),
    });

    fireEvent.change(screen.getByPlaceholderText("fullNamePlaceholder"), {
      target: { value: "Bold" },
    });
    fireEvent.change(screen.getByPlaceholderText("identifierPlaceholder"), {
      target: { value: "bold" },
    });
    fireEvent.change(screen.getByPlaceholderText("passwordPlaceholder"), {
      target: { value: "password123" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "formTitle" }));
    });
    await screen.findByText("credentialsTitle");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "copyCredentials" }));
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining("bold"),
    );
    expect(toast.success).toHaveBeenCalledWith("credentialsCopied");
  });

  it("shows the API error message when creation fails", async () => {
    renderDrawer();
    await roleLoaded();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: "Duplicate identifier" } }),
    });

    fireEvent.change(screen.getByPlaceholderText("fullNamePlaceholder"), {
      target: { value: "Bold" },
    });
    fireEvent.change(screen.getByPlaceholderText("identifierPlaceholder"), {
      target: { value: "bold" },
    });
    fireEvent.change(screen.getByPlaceholderText("passwordPlaceholder"), {
      target: { value: "password123" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "formTitle" }));
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Duplicate identifier");
    });
    expect(reportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      expect.any(Error),
    );
  });

  it("toasts when the role fetch fails", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));
    renderDrawer();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("failedToLoadRoles");
    });
  });

  it("closes via the cancel button", async () => {
    const onOpenChange = vi.fn();
    renderDrawer(onOpenChange);
    await roleLoaded();

    fireEvent.click(screen.getByRole("button", { name: "cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
