import { beforeEach, describe, expect, it, vi } from "vitest";
import webPush from "web-push";
import { env } from "@/lib/supabase/env";
import {
  getVapidPublicKey,
  type PushSubscription,
  sendPush,
} from "../web-push";

vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  },
}));
vi.mock("@/lib/supabase/env", () => ({
  env: vi.fn(),
}));

const mockSetVapidDetails = vi.mocked(webPush.setVapidDetails);
const mockSendNotification = vi.mocked(webPush.sendNotification);
const mockEnv = vi.mocked(env);

const EMAIL = "admin@example.com";
const PUBLIC_KEY = "vapid-public-key";
const PRIVATE_KEY = "vapid-private-key";

const SUBSCRIPTION: PushSubscription = {
  endpoint: "https://push.example.com/sub-1",
  keys: { p256dh: "p256", auth: "auth-secret" },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockEnv.mockImplementation((key: string) => {
    if (key === "VAPID_EMAIL") return EMAIL;
    if (key === "NEXT_PUBLIC_VAPID_PUBLIC_KEY") return PUBLIC_KEY;
    if (key === "VAPID_PRIVATE_KEY") return PRIVATE_KEY;
    return "";
  });
  mockSendNotification.mockResolvedValue(undefined);
});

describe("getVapidPublicKey", () => {
  it("returns the public VAPID key from env", () => {
    expect(getVapidPublicKey()).toBe(PUBLIC_KEY);
    expect(mockEnv).toHaveBeenCalledWith("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
  });
});

describe("sendPush", () => {
  it("configures VAPID details once and returns success", async () => {
    const first = await sendPush(SUBSCRIPTION, { title: "Hello" });
    const second = await sendPush(SUBSCRIPTION, { title: "Again" });

    expect(first).toEqual({ success: true });
    expect(second).toEqual({ success: true });
    // Module-level `configured` flag — setVapidDetails must run exactly once.
    expect(mockSetVapidDetails).toHaveBeenCalledTimes(1);
    expect(mockSetVapidDetails).toHaveBeenCalledWith(
      `mailto:${EMAIL}`,
      PUBLIC_KEY,
      PRIVATE_KEY,
    );
    expect(mockSendNotification).toHaveBeenCalledTimes(2);
    expect(mockSendNotification).toHaveBeenNthCalledWith(
      1,
      SUBSCRIPTION,
      JSON.stringify({ title: "Hello" }),
    );
    expect(mockSendNotification).toHaveBeenNthCalledWith(
      2,
      SUBSCRIPTION,
      JSON.stringify({ title: "Again" }),
    );
  });

  it("returns success:false with status and body for a statusCode error", async () => {
    mockSendNotification.mockRejectedValue({
      statusCode: 404,
      body: "push subscription no longer exists",
    });

    const result = await sendPush(SUBSCRIPTION, {});

    expect(result).toEqual({
      success: false,
      status: 404,
      reason: "push subscription no longer exists",
    });
  });

  it("returns success:false with status but no reason when the body is missing", async () => {
    mockSendNotification.mockRejectedValue({ statusCode: 410 });

    const result = await sendPush(SUBSCRIPTION, {});

    expect(result).toEqual({
      success: false,
      status: 410,
      reason: undefined,
    });
  });

  it("returns success:false with a string reason when statusCode is not a number", async () => {
    const error = { statusCode: "gone" };
    mockSendNotification.mockRejectedValue(error);

    const result = await sendPush(SUBSCRIPTION, {});

    expect(result).toEqual({ success: false, reason: String(error) });
  });

  it("returns success:false with the stringified error for non-statusCode errors", async () => {
    mockSendNotification.mockRejectedValue(new Error("network down"));

    const result = await sendPush(SUBSCRIPTION, {});

    expect(result).toEqual({ success: false, reason: "Error: network down" });
  });
});
