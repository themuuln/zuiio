import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PushNotificationSettings } from "@/components/push-notification-settings";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const pushState = vi.hoisted(() => ({
  isSupported: true,
  permission: "default" as NotificationPermission,
  isSubscribed: false,
  isLoading: false,
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}));
vi.mock("@/hooks/use-push-subscription", () => ({
  usePushSubscription: () => ({
    isSupported: pushState.isSupported,
    permission: pushState.permission,
    isSubscribed: pushState.isSubscribed,
    isLoading: pushState.isLoading,
    subscribe: pushState.subscribe,
    unsubscribe: pushState.unsubscribe,
  }),
}));

import { toast } from "sonner";

function renderSettings() {
  render(<PushNotificationSettings />);
}

describe("PushNotificationSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pushState.isSupported = true;
    pushState.permission = "default";
    pushState.isSubscribed = false;
    pushState.isLoading = false;
    pushState.subscribe.mockReset();
    pushState.subscribe.mockResolvedValue(true);
    pushState.unsubscribe.mockReset();
    pushState.unsubscribe.mockResolvedValue(true);
  });

  it("shows the unsupported browser card when push is not supported", () => {
    pushState.isSupported = false;
    renderSettings();
    expect(
      screen.getByText("Танай хөтөч push мэдэгдэлийг дэмждэггүй"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("subscribes when the switch is turned on", async () => {
    renderSettings();
    fireEvent.click(screen.getByRole("switch"));

    expect(pushState.subscribe).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Мэдэгдэл идэвхэслээ");
    });
  });

  it("shows the permission-denied error when subscribe fails", async () => {
    pushState.subscribe.mockResolvedValue(false);
    pushState.permission = "denied";
    renderSettings();

    fireEvent.click(screen.getByRole("switch"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Хөтөч мэдэгдэл унтраасан байна. Хөтөчийн тохиргооноо шалгана уу.",
      );
    });
    expect(
      screen.getByText(
        'Хөтөч мэдэгдэлийг унтраасан байна. Идэвхэжүүлэхийн тулд хөтөчийн тохиргооноос "Зөвшөөрөх" сонголтыг сонгоно уу.',
      ),
    ).toBeInTheDocument();
  });

  it("unsubscribes when the switch is turned off while subscribed", async () => {
    pushState.isSubscribed = true;
    renderSettings();
    fireEvent.click(screen.getByRole("switch"));

    expect(pushState.unsubscribe).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Мэдэгдэл унтраалаа");
    });
  });

  it("disables the switch while loading", () => {
    pushState.isLoading = true;
    renderSettings();
    expect(screen.getByRole("switch")).toHaveAttribute("data-disabled");
    expect(screen.getByText("Ачаалж байна...")).toBeInTheDocument();
  });
});
