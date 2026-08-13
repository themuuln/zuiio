import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Deterministic transport tests: node:net is mocked with a controllable
 * fake socket, so connect/error/timeout/write-failure paths are exercised
 * without binding real ports (which flake in parallel runs).
 */

type FakeSocket = EventEmitter & {
  destroy: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
  write: ReturnType<typeof vi.fn>;
  setTimeout: ReturnType<typeof vi.fn>;
};

function makeFakeSocket(): FakeSocket {
  const socket = new EventEmitter() as FakeSocket;
  socket.destroy = vi.fn();
  socket.end = vi.fn();
  socket.setTimeout = vi.fn();
  socket.write = vi.fn((_data: Uint8Array, cb?: (err?: Error) => void) => {
    cb?.();
    return true;
  });
  return socket;
}

const mockCreateConnection = vi.hoisted(() => vi.fn());

vi.mock("node:net", () => ({
  __esModule: true,
  default: { createConnection: mockCreateConnection },
  createConnection: mockCreateConnection,
}));

import { sendEscPosCommand } from "./network";

let socket: FakeSocket;

beforeEach(() => {
  socket = makeFakeSocket();
  mockCreateConnection.mockReturnValue(socket);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("sendEscPosCommand", () => {
  it("connects to the target, writes the bytes, and resolves", async () => {
    const bytes = new Uint8Array([0x1b, 0x40, 0x0a]);
    const promise = sendEscPosCommand({ host: "10.0.0.5", port: 9100 }, bytes);

    expect(mockCreateConnection).toHaveBeenCalledWith({
      host: "10.0.0.5",
      port: 9100,
    });
    socket.emit("connect");
    await promise;

    expect(socket.write).toHaveBeenCalledWith(
      Uint8Array.from(bytes),
      expect.any(Function),
    );
    expect(socket.end).toHaveBeenCalled();
    expect(socket.destroy).not.toHaveBeenCalled();
  });

  it("rejects and destroys the socket on connection error", async () => {
    const promise = sendEscPosCommand(
      { host: "10.0.0.5", port: 9100 },
      new Uint8Array(),
    );
    const err = new Error("ECONNREFUSED");
    socket.emit("error", err);

    await expect(promise).rejects.toBe(err);
    expect(socket.destroy).toHaveBeenCalled();
  });

  it("rejects with the socket timeout message", async () => {
    const promise = sendEscPosCommand(
      { host: "10.0.0.5", port: 9100 },
      new Uint8Array(),
      2000,
    );
    expect(socket.setTimeout).toHaveBeenCalledWith(2000, expect.any(Function));
    const timeoutCb = socket.setTimeout.mock.calls[0][1] as () => void;
    timeoutCb();

    await expect(promise).rejects.toThrow(
      "connection timed out (10.0.0.5:9100)",
    );
    expect(socket.destroy).toHaveBeenCalled();
  });

  it("rejects after the deadline when neither error nor connect fires", async () => {
    vi.useFakeTimers();
    try {
      const promise = sendEscPosCommand(
        { host: "10.0.0.5", port: 9100 },
        new Uint8Array(),
        4000,
      );
      const expectation = expect(promise).rejects.toThrow(
        "ESC/POS timeout after 4000ms",
      );
      await vi.advanceTimersByTimeAsync(4000);
      await expectation;
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects when the socket write callback reports an error", async () => {
    socket.write = vi.fn((_data: Uint8Array, cb?: (err?: Error) => void) => {
      cb?.(new Error("EPIPE"));
      return true;
    });
    const promise = sendEscPosCommand(
      { host: "10.0.0.5", port: 9100 },
      new Uint8Array(),
    );
    socket.emit("connect");

    await expect(promise).rejects.toThrow("EPIPE");
    expect(socket.destroy).toHaveBeenCalled();
  });
});
