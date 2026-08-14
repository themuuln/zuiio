import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockCapture = vi.hoisted(() => vi.fn());
vi.mock("@zuiio/capture", () => ({
  capture: mockCapture,
}));

import { sendEscPosCommand } from "./client";

const mockFetch = vi.fn();

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
  mockCapture.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("client sendEscPosCommand", () => {
  it("posts the sale id for print commands", async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { ok: true }));

    await sendEscPosCommand("print", "sale-1");

    expect(mockFetch).toHaveBeenCalledWith("/api/hardware/escpos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: "print", sale_id: "sale-1" }),
    });
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("posts only the command for drawer kicks", async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { ok: true }));

    await sendEscPosCommand("drawer");

    expect(mockFetch).toHaveBeenCalledWith("/api/hardware/escpos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: "drawer" }),
    });
  });

  it("captures the server error and resolves (printer not configured)", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(400, { ok: false, error: "ESC/POS printer not configured" }),
    );

    await expect(sendEscPosCommand("print", "sale-1")).resolves.toBeUndefined();
    expect(mockCapture).toHaveBeenCalledWith(
      new Error("ESC/POS printer not configured"),
      { context: "hardware: escpos bridge" },
    );
  });

  it("captures a 502 unreachable printer without throwing", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(502, { ok: false, error: "Принтерт хүрэх боломжгүй байна" }),
    );

    await expect(sendEscPosCommand("drawer")).resolves.toBeUndefined();
    expect(mockCapture).toHaveBeenCalledTimes(1);
  });

  it("captures a fetch failure (network error) without throwing", async () => {
    mockFetch.mockRejectedValue(new Error("Failed to fetch"));

    await expect(sendEscPosCommand("print", "sale-1")).resolves.toBeUndefined();
    expect(mockCapture).toHaveBeenCalledWith(new Error("Failed to fetch"), {
      context: "hardware: escpos fetch",
    });
  });
});
