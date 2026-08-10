import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRealtimeMulti } from "../use-realtime-multi";

const { createClientMock, removeChannel, getChannels, clearChannels } =
  vi.hoisted(() => {
    type MockChannel = {
      name: string;
      on: ReturnType<typeof vi.fn>;
      subscribe: ReturnType<typeof vi.fn>;
    };
    const channels: MockChannel[] = [];
    const removeChannel = vi.fn();
    const createClientMock = vi.fn(() => ({
      channel: (name: string) => {
        const channel: MockChannel = {
          name,
          on: vi.fn(),
          subscribe: vi.fn(),
        };
        // Real Supabase channels are chainable and subscribe() returns the channel
        channel.on.mockReturnValue(channel);
        channel.subscribe.mockReturnValue(channel);
        channels.push(channel);
        return channel;
      },
      removeChannel,
    }));
    return {
      createClientMock,
      removeChannel,
      getChannels: () => channels,
      clearChannels: () => {
        channels.length = 0;
      },
    };
  });

vi.mock("@/lib/supabase/client", () => ({
  createClient: createClientMock,
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useRealtimeMulti", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    clearChannels();
  });

  it("subscribes to every table on one channel and maps queryKeys", () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    renderHook(
      () =>
        useRealtimeMulti({
          tables: [
            {
              table: "work_orders",
              queryKey: ["wo", "list"],
              filter: "organization_id=eq.org-1",
            },
            { table: "invoices", queryKey: ["inv", "list"] },
          ],
        }),
      { wrapper: createWrapper() },
    );

    expect(createClientMock).toHaveBeenCalledTimes(1);
    const channels = getChannels();
    expect(channels).toHaveLength(1);
    expect(channels[0].name).toBe("realtime:multi");
    expect(channels[0].subscribe).toHaveBeenCalledTimes(1);
    expect(channels[0].on).toHaveBeenCalledTimes(2);
    expect(channels[0].on).toHaveBeenNthCalledWith(
      1,
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "work_orders",
        filter: "organization_id=eq.org-1",
      },
      expect.any(Function),
    );
    expect(channels[0].on).toHaveBeenNthCalledWith(
      2,
      "postgres_changes",
      { event: "*", schema: "public", table: "invoices" },
      expect.any(Function),
    );

    const callbacks = channels[0].on.mock.calls.map(
      (call) => call[2],
    ) as (() => void)[];
    act(() => {
      callbacks[0]();
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["wo", "list"] });

    act(() => {
      callbacks[1]();
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["inv", "list"] });
  });

  it("removes the channel on unmount", () => {
    const { unmount } = renderHook(
      () =>
        useRealtimeMulti({
          tables: [{ table: "work_orders", queryKey: ["wo", "list"] }],
        }),
      { wrapper: createWrapper() },
    );
    const channel = getChannels()[0];

    unmount();

    expect(removeChannel).toHaveBeenCalledWith(channel);
  });

  it("does not subscribe when disabled", () => {
    renderHook(
      () =>
        useRealtimeMulti({
          tables: [{ table: "work_orders", queryKey: ["wo", "list"] }],
          enabled: false,
        }),
      { wrapper: createWrapper() },
    );

    expect(getChannels()).toHaveLength(0);
    expect(removeChannel).not.toHaveBeenCalled();
  });

  it("does not subscribe when the table list is empty", () => {
    renderHook(() => useRealtimeMulti({ tables: [] }), {
      wrapper: createWrapper(),
    });

    expect(getChannels()).toHaveLength(0);
    expect(removeChannel).not.toHaveBeenCalled();
  });
});
