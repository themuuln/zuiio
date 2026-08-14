import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRealtime } from "../use-realtime";

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

describe("useRealtime", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    clearChannels();
  });

  it("auto-injects the client and subscribes to the table channel", () => {
    renderHook(
      () =>
        useRealtime({
          table: "work_orders",
          queryKey: ["portal", "work-order", "wo-1"],
          filter: "id=eq.wo-1",
        }),
      { wrapper: createWrapper() },
    );

    expect(createClientMock).toHaveBeenCalledTimes(1);
    const channels = getChannels();
    expect(channels).toHaveLength(1);
    expect(channels[0].name).toBe("realtime:work_orders");
    expect(channels[0].subscribe).toHaveBeenCalledTimes(1);
    expect(channels[0].on).toHaveBeenCalledWith(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "work_orders",
        filter: "id=eq.wo-1",
      },
      expect.any(Function),
    );
  });

  it("invalidates the query key when the channel emits a change", () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    renderHook(
      () =>
        useRealtime({
          table: "work_orders",
          queryKey: ["portal", "work-order", "wo-1"],
          filter: "id=eq.wo-1",
        }),
      { wrapper: createWrapper() },
    );

    const onChange = getChannels()[0].on.mock.calls[0][2] as () => void;
    act(() => {
      onChange();
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["portal", "work-order", "wo-1"],
    });
  });

  it("removes the channel on unmount", () => {
    const { unmount } = renderHook(
      () => useRealtime({ table: "work_orders", queryKey: ["wo", "1"] }),
      { wrapper: createWrapper() },
    );
    const channel = getChannels()[0];

    unmount();

    expect(removeChannel).toHaveBeenCalledWith(channel);
  });

  it("does not subscribe when disabled", () => {
    renderHook(
      () =>
        useRealtime({
          table: "work_orders",
          queryKey: ["wo", "1"],
          enabled: false,
        }),
      { wrapper: createWrapper() },
    );

    expect(getChannels()).toHaveLength(0);
    expect(removeChannel).not.toHaveBeenCalled();
  });
});
