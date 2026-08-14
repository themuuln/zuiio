import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { NewUserSetup } from "../new-user-setup";

vi.mock("next-intl", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

import { reportServerError } from "@/lib/sentry-report-server";

const COPY = {
  title: "Setting up your account",
  subtitle: "Preparing your workspace…",
  error: "Something went wrong",
  retry: "Try again",
};

describe("NewUserSetup", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the loading state and calls the finalize endpoint on mount", async () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { reload: reloadMock },
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<NewUserSetup copy={COPY} />);

    expect(screen.getByText(COPY.title)).toBeInTheDocument();
    expect(screen.getByText(COPY.subtitle)).toBeInTheDocument();

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/finalize-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
    await waitFor(() => expect(reloadMock).toHaveBeenCalledTimes(1));
  });

  it("shows the error state and retries when the endpoint fails", async () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { reload: reloadMock },
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: "Setup failed" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<NewUserSetup copy={COPY} />);

    expect(await screen.findByText(COPY.error)).toBeInTheDocument();
    expect(reportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      expect.any(Error),
    );

    const retry = screen.getByRole("button", { name: COPY.retry });
    await userEvent.setup().click(retry);

    await waitFor(() => expect(reloadMock).toHaveBeenCalledTimes(1));
  });

  it("surfaces a generic error when the response body is unparseable", async () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { reload: reloadMock },
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error("bad json");
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<NewUserSetup copy={COPY} />);

    expect(await screen.findByText(COPY.error)).toBeInTheDocument();
    expect(reloadMock).not.toHaveBeenCalled();
  });
});
