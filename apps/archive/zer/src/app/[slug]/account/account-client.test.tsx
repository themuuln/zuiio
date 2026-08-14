import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => {
  const accountState: StoreSessionState = {
    status: "account",
    account: {
      id: "user-1",
      email: "buyer@example.com",
      display_name: "Жон",
      phone: "99112233",
    },
  };
  let current: StoreSessionState = { status: "signedOut" };
  const reload = vi.fn(async (next?: StoreSessionState) => {
    if (next) {
      current = next;
      return;
    }
    // Simulates re-querying the session after a successful sign-in.
    current = accountState;
  });
  return {
    getState: () => current,
    setState: (next: StoreSessionState) => {
      current = next;
    },
    reload,
    accountState,
  };
});

vi.mock("./use-store-session", () => ({
  useStoreSession: () => ({
    state: hoisted.getState(),
    reload: hoisted.reload,
  }),
}));

const mockSignIn = vi.hoisted(() => vi.fn());
const mockSignUp = vi.hoisted(() => vi.fn());
const mockSignOut = vi.hoisted(() => vi.fn());
const mockCapture = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignIn,
      signUp: mockSignUp,
      signOut: mockSignOut,
    },
  }),
}));

vi.mock("@zuiio/capture", () => ({
  capture: mockCapture,
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess },
}));

import { StorefrontBaseProvider } from "@/components/storefront/storefront-base-provider";
import { I18nProvider } from "@/lib/i18n";
import { AccountClient } from "./account-client";
import type { StoreSessionState } from "./use-store-session";

function renderAccount() {
  return render(
    <StorefrontBaseProvider basePath="/storefront-e2e-test">
      <I18nProvider>
        <AccountClient slug="storefront-e2e-test" />
      </I18nProvider>
    </StorefrontBaseProvider>,
  );
}

async function submitLogin(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Имэйл хаяг"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText("Нууц үг"), {
    target: { value: password },
  });
  // Dispatch submit on the form directly: jsdom enforces native HTML5
  // constraint validation on button clicks (type=email/required), which
  // would block the invalid-value cases this test drives.
  const form = screen.getByLabelText("Имэйл хаяг").closest("form");
  expect(form).not.toBeNull();
  if (form) fireEvent.submit(form);
}

describe("AccountClient", () => {
  beforeEach(() => {
    hoisted.setState({ status: "signedOut" });
    hoisted.reload.mockClear();
    mockSignIn.mockReset();
    mockSignUp.mockReset();
    mockSignOut.mockReset();
    mockCapture.mockClear();
    mockToastSuccess.mockClear();
  });

  it("shows the sign-in prompt with login and register tabs when signed out", () => {
    renderAccount();
    expect(
      screen.getByRole("heading", { name: "Хэрэглэгч" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Нэвтрэх" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Бүртгүүлэх" })).toBeInTheDocument();
    expect(screen.getByLabelText("Имэйл хаяг")).toBeInTheDocument();
    expect(screen.getByLabelText("Нууц үг")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Дэлгүүр рүү буцах" }),
    ).toHaveAttribute("href", "/storefront-e2e-test");
  });

  it("validates email and password format before calling the API", async () => {
    renderAccount();
    await submitLogin("not-an-email", "123");
    expect(
      await screen.findByText("Зөв имэйл хаяг оруулна уу."),
    ).toBeInTheDocument();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("signs in with valid credentials and shows the profile", async () => {
    mockSignIn.mockResolvedValue({ error: null });
    renderAccount();
    await submitLogin("buyer@example.com", "password123");

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: "buyer@example.com",
        password: "password123",
      });
    });
    // reload() re-queries the session → the hook flips to account state
    expect(hoisted.reload).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText("Сайн уу, Жон!")).toBeInTheDocument();
    });
    expect(screen.getByText("buyer@example.com")).toBeInTheDocument();
    expect(screen.getByText("99112233")).toBeInTheDocument();
    // Button asChild renders an anchor exposed with role="button"
    expect(
      screen.getByRole("button", { name: "Захиалгын түүх" }),
    ).toHaveAttribute("href", "/storefront-e2e-test/account/orders");
  });

  it("shows the invalid-credentials error on failed sign-in", async () => {
    mockSignIn.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });
    renderAccount();
    await submitLogin("buyer@example.com", "wrongpass");

    expect(
      await screen.findByText("Имэйл эсвэл нууц үг буруу байна."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Сайн уу, Жон!")).not.toBeInTheDocument();
  });

  it("renders the profile and signs out on demand", async () => {
    hoisted.setState(hoisted.accountState);
    mockSignOut.mockResolvedValue({ error: null });
    renderAccount();

    expect(screen.getByText("Сайн уу, Жон!")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Гарах" }));
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
    expect(hoisted.reload).toHaveBeenCalled();
  });

  it("registers a buyer from the register tab and reports success", async () => {
    mockSignUp.mockResolvedValue({
      data: { session: { user: { id: "new-1" } } },
      error: null,
    });
    renderAccount();

    fireEvent.click(screen.getByRole("tab", { name: "Бүртгүүлэх" }));
    fireEvent.change(screen.getByLabelText("Нэр"), {
      target: { value: "Баяр" },
    });
    fireEvent.change(screen.getByLabelText("Имэйл хаяг"), {
      target: { value: "new-buyer@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Утасны дугаар"), {
      target: { value: "99887766" },
    });
    fireEvent.change(screen.getByLabelText("Нууц үг"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Бүртгүүлэх" }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "new-buyer@example.com",
        password: "password123",
        options: {
          data: {
            store_account: true,
            display_name: "Баяр",
            phone: "99887766",
          },
          emailRedirectTo:
            "http://localhost:3000/auth/callback?next=/storefront-e2e-test/account",
        },
      });
    });
    // The registration session is live — reload() flips to the profile view
    // (display name comes from the mocked session state, not the form)
    expect(await screen.findByText("Сайн уу, Жон!")).toBeInTheDocument();
    expect(screen.queryByRole("tab")).toBeNull(); // form tabs are gone
    expect(hoisted.reload).toHaveBeenCalled();
  });
});
