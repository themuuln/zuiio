/// <reference types="@testing-library/jest-dom/vitest" />
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.hoisted ensures mock functions exist before vi.mock factories run (hoisted)
const mockSignInWithPassword = vi.hoisted(() => vi.fn());
const mockPush = vi.hoisted(() => vi.fn());
const mockRefresh = vi.hoisted(() => vi.fn());

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}));

import { toast } from "sonner";
import LoginPage from "../page";

const mockToast = vi.mocked(toast);
const SUBMIT_BUTTON = () => screen.getByRole("button", { name: "Нэвтрэх" });

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = "test";
  });

  it("renders login form with email, password fields and submit button", () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText("Имэйл")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Нууц үг")).toBeInTheDocument();
    expect(SUBMIT_BUTTON()).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Нэвтрэх" }),
    ).toBeInTheDocument();
  });

  describe("getMongolianError", () => {
    it('maps "Invalid login credentials" to Mongolian', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        error: { message: "Invalid login credentials" },
      });

      render(<LoginPage />);
      fireEvent.change(screen.getByPlaceholderText("Имэйл"), {
        target: { value: "test@test.mn" },
      });
      fireEvent.change(screen.getByPlaceholderText("Нууц үг"), {
        target: { value: "wrong" },
      });
      fireEvent.click(SUBMIT_BUTTON());

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          "Имэйл эсвэл нууц үг буруу байна",
        );
      });
    });

    it('maps "Email not confirmed" to Mongolian', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        error: { message: "Email not confirmed" },
      });

      render(<LoginPage />);
      fireEvent.change(screen.getByPlaceholderText("Имэйл"), {
        target: { value: "unconfirmed@test.mn" },
      });
      fireEvent.change(screen.getByPlaceholderText("Нууц үг"), {
        target: { value: "password" },
      });
      fireEvent.click(SUBMIT_BUTTON());

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          "Имэйл баталгаажаагүй байна",
        );
      });
    });

    it('maps "Rate limit exceeded" to Mongolian', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        error: { message: "Rate limit exceeded" },
      });

      render(<LoginPage />);
      fireEvent.change(screen.getByPlaceholderText("Имэйл"), {
        target: { value: "spammer@test.mn" },
      });
      fireEvent.change(screen.getByPlaceholderText("Нууц үг"), {
        target: { value: "hunter2" },
      });
      fireEvent.click(SUBMIT_BUTTON());

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          "Хэт олон удаа оролдсон. Түр хүлээгээд дахин оролдоно уу",
        );
      });
    });

    it('maps "Invalid email" to Mongolian', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        error: { message: "Invalid email" },
      });

      render(<LoginPage />);
      fireEvent.change(screen.getByPlaceholderText("Имэйл"), {
        target: { value: "bad@test.mn" },
      });
      fireEvent.change(screen.getByPlaceholderText("Нууц үг"), {
        target: { value: "password" },
      });
      fireEvent.click(SUBMIT_BUTTON());

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          "Имэйл хаяг буруу байна",
        );
      });
    });

    it('falls back to "Алдаа: {message}" for unknown errors', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        error: { message: "Some unexpected server error" },
      });

      render(<LoginPage />);
      fireEvent.change(screen.getByPlaceholderText("Имэйл"), {
        target: { value: "test@test.mn" },
      });
      fireEvent.change(screen.getByPlaceholderText("Нууц үг"), {
        target: { value: "password" },
      });
      fireEvent.click(SUBMIT_BUTTON());

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          "Алдаа: Some unexpected server error",
        );
      });
    });
  });

  describe("successful login", () => {
    it("navigates to /admin on success", async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        error: null,
      });

      render(<LoginPage />);
      fireEvent.change(screen.getByPlaceholderText("Имэйл"), {
        target: { value: "admin@test.mn" },
      });
      fireEvent.change(screen.getByPlaceholderText("Нууц үг"), {
        target: { value: "correct-password" },
      });
      fireEvent.click(SUBMIT_BUTTON());

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/admin");
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it("does not show error toast on success", async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        error: null,
      });

      render(<LoginPage />);
      fireEvent.change(screen.getByPlaceholderText("Имэйл"), {
        target: { value: "admin@test.mn" },
      });
      fireEvent.change(screen.getByPlaceholderText("Нууц үг"), {
        target: { value: "correct-password" },
      });
      fireEvent.click(SUBMIT_BUTTON());

      await waitFor(() => {
        expect(mockToast.error).not.toHaveBeenCalled();
      });
    });

    it("disables submit button while loading", async () => {
      // Keep the promise pending to test loading state
      const { promise } = Promise.withResolvers<void>();
      mockSignInWithPassword.mockReturnValueOnce(promise);

      render(<LoginPage />);
      fireEvent.change(screen.getByPlaceholderText("Имэйл"), {
        target: { value: "admin@test.mn" },
      });
      fireEvent.change(screen.getByPlaceholderText("Нууц үг"), {
        target: { value: "password" },
      });
      await act(async () => {
        fireEvent.click(SUBMIT_BUTTON());
      });

      await waitFor(() => {
        expect(
          screen.getByText("Түр хүлээнэ үү..."),
        ).toBeInTheDocument();
      });
    });
  });
});
