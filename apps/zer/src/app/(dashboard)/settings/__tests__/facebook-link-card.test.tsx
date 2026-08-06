/**
 * FacebookLinkCard — settings card for connecting Messenger/Instagram pages.
 * Behavior: loads connections via server action, shows them with channel
 * badges, empty state offers "Холбох", and a successful OAuth start sends
 * the user to the Facebook dialog (full-page navigation).
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getFacebookConnections,
  startFacebookOAuth,
} from "../facebook-actions";
import { FacebookLinkCard } from "../facebook-link-card";

vi.mock("../facebook-actions", () => ({
  getFacebookConnections: vi.fn(),
  startFacebookOAuth: vi.fn(),
}));

const mockedGet = vi.mocked(getFacebookConnections);
const mockedStart = vi.mocked(startFacebookOAuth);

const ORIGINAL_LOCATION = window.location;

/** jsdom can't navigate — replace location with a plain recordable object. */
function stubLocation() {
  Object.defineProperty(window, "location", {
    value: { href: "" },
    configurable: true,
  });
}

function restoreLocation() {
  Object.defineProperty(window, "location", {
    value: ORIGINAL_LOCATION,
    configurable: true,
  });
}

describe("FacebookLinkCard", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedStart.mockReset();
    stubLocation();
  });

  afterEach(() => {
    restoreLocation();
  });

  it("renders connected pages with channel badges", async () => {
    mockedGet.mockResolvedValue([
      {
        channel: "messenger",
        pageId: "page-1",
        pageName: "Авто Сервис",
        connectedAt: "2026-08-01T00:00:00Z",
        webhookSubscribedAt: "2026-08-01T01:00:00Z",
        tokenExpiresAt: null,
      },
      {
        channel: "instagram",
        pageId: "page-1",
        pageName: "Авто Сервис (Instagram)",
        connectedAt: "2026-08-01T00:00:00Z",
        webhookSubscribedAt: null,
        tokenExpiresAt: null,
      },
    ]);

    render(<FacebookLinkCard />);

    expect(await screen.findByText("Авто Сервис")).toBeDefined();
    expect(screen.getByText("Авто Сервис (Instagram)")).toBeDefined();
    expect(screen.getByText("Messenger")).toBeDefined();
    expect(screen.getByText("Instagram")).toBeDefined();
    expect(screen.getAllByText("✅ Холбогдсон")).toHaveLength(2);
    // No connect CTA when pages are already connected — only "add another".
    expect(
      screen.getByRole("button", { name: "Өөр хуудас холбох" }),
    ).toBeDefined();
  });

  it("shows the empty state with a connect button when nothing is linked", async () => {
    mockedGet.mockResolvedValue([]);

    render(<FacebookLinkCard />);

    expect(await screen.findByText(/Холбогдсон хуудас байхгүй/)).toBeDefined();
    expect(screen.getByRole("button", { name: "Холбох" })).toBeDefined();
  });

  it("navigates to the gateway OAuth dialog on connect", async () => {
    mockedGet.mockResolvedValue([]);
    mockedStart.mockResolvedValue({
      redirectUrl: "https://www.facebook.com/dialog/oauth?client_id=1",
    });

    render(<FacebookLinkCard />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Холбох" }));

    await waitFor(() => {
      expect(window.location.href).toBe(
        "https://www.facebook.com/dialog/oauth?client_id=1",
      );
    });
  });

  it("shows the gateway error message instead of navigating", async () => {
    mockedGet.mockResolvedValue([]);
    mockedStart.mockResolvedValue({ error: "Facebook app not configured" });

    render(<FacebookLinkCard />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Холбох" }));

    expect(
      await screen.findByText("Facebook app not configured"),
    ).toBeDefined();
    expect(window.location.href).toBe("");
  });
});
