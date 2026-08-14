import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkLowStockAndNotify,
  notifyDeliveryStatus,
  sendTelegramNotification,
} from "../notification";

const mocks = vi.hoisted(() => ({
  capture: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock("@zuiio/capture", () => ({ capture: mocks.capture }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

interface NotificationConfig {
  config_data?: { chat_id?: string; event_types?: unknown } | null;
  enabled?: boolean | null;
}

function makeChain(result: unknown, inserts: unknown[]) {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(async () => result),
    insert: vi.fn(async (payload: unknown) => {
      inserts.push(payload);
      return { data: null, error: null };
    }),
  };

  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  return chain;
}

function makeClient({
  botToken = "bot-token",
  config = {
    config_data: { chat_id: "chat-1", event_types: null },
    enabled: true,
  },
}: {
  botToken?: string | null;
  config?: NotificationConfig | null;
} = {}) {
  const inserts: unknown[] = [];
  const from = vi.fn((table: string) => {
    if (table === "app_config") {
      return makeChain(
        botToken
          ? { data: { value: { token: botToken } }, error: null }
          : { data: null, error: null },
        inserts,
      );
    }

    if (table === "notification_configs") {
      return makeChain(
        config ? { data: config, error: null } : { data: null, error: null },
        inserts,
      );
    }

    return makeChain({ data: null, error: null }, inserts);
  });

  const client = { from };
  mocks.createClient.mockResolvedValue(client);
  return { client, inserts };
}

function mockTelegramResponse(ok: boolean, status = ok ? 200 : 500, body = "") {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    text: vi.fn().mockResolvedValue(body),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("sendTelegramNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns a configuration error when the bot token is missing", async () => {
    makeClient({ botToken: null });

    const result = await sendTelegramNotification(
      "org-1",
      "new_sale",
      "Title",
      "Message",
    );

    expect(result).toEqual({
      success: false,
      error: "Бот токен тохируулаагүй байна.",
    });
    expect(mocks.createClient).toHaveBeenCalledOnce();
  });

  it("returns an error when the organization has no Telegram configuration", async () => {
    makeClient({ config: null });
    const fetchMock = mockTelegramResponse(true);

    const result = await sendTelegramNotification(
      "org-1",
      "new_sale",
      "Title",
      "Message",
    );

    expect(result).toEqual({
      success: false,
      error: "Telegram тохиргоо олдсонгүй.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("honors disabled and event-specific notification settings", async () => {
    makeClient({
      config: {
        enabled: false,
        config_data: { event_types: ["new_sale"], chat_id: "chat-1" },
      },
    });
    const fetchMock = mockTelegramResponse(true);

    const disabled = await sendTelegramNotification(
      "org-1",
      "new_sale",
      "Title",
      "Message",
    );
    expect(disabled.error).toBe("Энэ төрлийн мэдэгдэл идэвхгүй байна.");

    makeClient({
      config: {
        enabled: true,
        config_data: { event_types: ["daily_summary"], chat_id: "chat-1" },
      },
    });
    const filtered = await sendTelegramNotification(
      "org-1",
      "new_sale",
      "Title",
      "Message",
    );
    expect(filtered.error).toBe("Энэ төрлийн мэдэгдэл идэвхгүй байна.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falls back to config_data for chat ID and reports missing chat IDs", async () => {
    makeClient({
      config: {
        enabled: true,
        config_data: null,
      },
    });
    mockTelegramResponse(true);

    const missing = await sendTelegramNotification(
      "org-1",
      "new_sale",
      "Title",
      "Message",
    );
    expect(missing.error).toBe("Chat ID тохируулаагүй байна.");

    makeClient({
      config: {
        enabled: true,
        config_data: { chat_id: "fallback-chat" },
      },
    });
    const fetchMock = mockTelegramResponse(true);
    const result = await sendTelegramNotification(
      "org-1",
      "new_sale",
      "Title",
      "Message",
    );

    expect(result).toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.telegram.org/botbot-token/sendMessage",
      expect.objectContaining({
        body: JSON.stringify({
          chat_id: "fallback-chat",
          text: "*Title*\n\nMessage",
          parse_mode: "Markdown",
        }),
      }),
    );
  });

  it("logs successful notifications", async () => {
    const { inserts } = makeClient();
    mockTelegramResponse(true);

    const result = await sendTelegramNotification(
      "org-1",
      "new_sale",
      "Title",
      "Message",
    );

    expect(result).toEqual({ success: true });
    expect(inserts).toHaveLength(1);
    expect(inserts[0]).toEqual(
      expect.objectContaining({
        organization_id: "org-1",
        channel: "telegram",
        event_type: "new_sale",
        status: "sent",
      }),
    );
  });

  it("captures Telegram failures and logs a failed notification", async () => {
    const { inserts } = makeClient();
    const fetchMock = mockTelegramResponse(false, 500, "Telegram unavailable");

    const result = await sendTelegramNotification(
      "org-1",
      "new_sale",
      "Title",
      "Message",
    );

    expect(result).toEqual({
      success: false,
      error: "Telegram API error: 500 - Telegram unavailable",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(mocks.capture).toHaveBeenCalledOnce();
    expect(inserts[0]).toEqual(
      expect.objectContaining({
        organization_id: "org-1",
        status: "failed",
        error_message: "Telegram API error: 500 - Telegram unavailable",
      }),
    );
  });
});

describe("notification helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("only notifies for a positive low-stock quantity", async () => {
    makeClient();
    const fetchMock = mockTelegramResponse(true);

    await checkLowStockAndNotify("org-1", "Widget", 0, 5);
    await checkLowStockAndNotify("org-1", "Widget", 8, 5);
    expect(fetchMock).not.toHaveBeenCalled();

    await checkLowStockAndNotify("org-1", "Widget", 3, 5);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("ignores unknown delivery statuses and notifies known statuses", async () => {
    makeClient();
    const fetchMock = mockTelegramResponse(true);

    await notifyDeliveryStatus("org-1", "Customer", "unknown");
    expect(fetchMock).not.toHaveBeenCalled();

    await notifyDeliveryStatus("org-1", "Customer", "delivered");
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
