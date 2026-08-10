import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import type * as NextIntl from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AiChatDrawer } from "@/components/ai/ai-chat-drawer";
import { render } from "@/test/test-utils";

const t = vi.hoisted(() => (key: string) => key);
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof NextIntl>("next-intl");
  return { ...actual, useTranslations: () => t };
});

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({ data: { orgId: "org-1" } }),
}));

const mockFetch = vi.fn();

function renderDrawer(
  props: Partial<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    showFloatingButton: boolean;
  }> = {},
) {
  const onOpenChange = props.onOpenChange ?? vi.fn();
  render(
    <AiChatDrawer
      open={props.open ?? true}
      onOpenChange={onOpenChange}
      showFloatingButton={props.showFloatingButton}
    />,
  );
  return onOpenChange;
}

async function sendMessage(text: string) {
  const textarea = screen.getByPlaceholderText("ai.chatPlaceholder");
  fireEvent.change(textarea, { target: { value: text } });
  await act(async () => {
    fireEvent.keyDown(textarea, { key: "Enter" });
  });
}

describe("AiChatDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ reply: "Default reply" }),
    });
  });

  it("shows the welcome message when there are no messages", () => {
    renderDrawer();
    expect(screen.getByText("ai.chatWelcome")).toBeInTheDocument();
  });

  it("pins the chat input in the drawer footer, outside the scrollable area", () => {
    renderDrawer();
    const textarea = screen.getByPlaceholderText("ai.chatPlaceholder");
    // The input bar must live in the footer slot so it stays pinned to the
    // bottom of the drawer instead of scrolling with the message thread.
    expect(textarea.closest('[data-slot="drawer-footer"]')).not.toBeNull();
    expect(textarea.closest('[data-slot="scroll-area"]')).toBeNull();
  });

  it("sends the message and renders the assistant reply", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ reply: "Танд туслах боломжтой." }),
    });
    renderDrawer();

    await sendMessage("Өнөөдрийн захиалгууд");

    expect(await screen.findByText("Өнөөдрийн захиалгууд")).toBeInTheDocument();
    expect(
      await screen.findByText("Танд туслах боломжтой."),
    ).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/organizations/org-1/ai/chat",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"message":"Өнөөдрийн захиалгууд"'),
      }),
    );
  });

  it("renders the fallback error message when the chat API fails", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));
    renderDrawer();

    await sendMessage("Засвар хийх");

    expect(
      await screen.findByText(
        "Уучлаарай, хариулт авахад алдаа гарлаа. Дахин оролдоно уу.",
      ),
    ).toBeInTheDocument();
  });

  it("does not send when the input is empty", async () => {
    renderDrawer();
    const textarea = screen.getByPlaceholderText("ai.chatPlaceholder");
    await act(async () => {
      fireEvent.keyDown(textarea, { key: "Enter" });
    });
    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.getByText("ai.chatWelcome")).toBeInTheDocument();
  });

  it("renders the floating button and opens the drawer on click", () => {
    const onOpenChange = renderDrawer({
      open: false,
      showFloatingButton: true,
    });
    const floating = screen.getByRole("button", { name: "ai.openChat" });
    fireEvent.click(floating);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("hides the floating button while the drawer is open", () => {
    renderDrawer({ open: true, showFloatingButton: true });
    expect(
      screen.queryByRole("button", { name: "ai.openChat" }),
    ).not.toBeInTheDocument();
  });

  it("closes via the header close button", async () => {
    const onOpenChange = renderDrawer();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
    });
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
