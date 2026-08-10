import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { reportServerError } from "@/lib/sentry-report-server";
import { useQrScanner } from "../use-qr-scanner";

const { mockHtml5QrcodeClass, mockStart, mockStop } = vi.hoisted(() => {
  const mockStart = vi.fn().mockResolvedValue(undefined);
  const mockStop = vi.fn().mockResolvedValue(undefined);
  // `new Html5Qrcode(...)` requires a real constructor — arrow functions
  // cannot be used with `new`.
  const mockHtml5QrcodeClass = vi.fn().mockImplementation(function (
    this: { elementId: string },
    elementId: string,
  ) {
    this.elementId = elementId;
    this.start = mockStart;
    this.stop = mockStop;
  });
  return { mockHtml5QrcodeClass, mockStart, mockStop };
});

vi.mock("html5-qrcode", () => ({
  Html5Qrcode: mockHtml5QrcodeClass,
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

describe("useQrScanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts scanning and reports decoded results through the callback", async () => {
    const { result } = renderHook(() => useQrScanner());
    const onResult = vi.fn();

    await act(async () => {
      await result.current.startScanning("qr-region", onResult);
    });

    expect(mockHtml5QrcodeClass).toHaveBeenCalledWith("qr-region");
    expect(mockStart).toHaveBeenCalledWith(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      expect.any(Function),
      expect.any(Function),
    );
    expect(result.current.isScanning).toBe(true);
    expect(result.current.error).toBeNull();

    const onSuccess = mockStart.mock.calls[0][2] as (text: string) => void;
    act(() => {
      onSuccess("SCAN-42");
    });

    expect(onResult).toHaveBeenCalledWith("SCAN-42");
  });

  it("sets the error and reports it when starting the camera fails", async () => {
    mockStart.mockRejectedValueOnce(new Error("Camera busy"));
    const { result } = renderHook(() => useQrScanner());

    await act(async () => {
      await result.current.startScanning("qr-region", vi.fn());
    });

    expect(result.current.isScanning).toBe(false);
    expect(result.current.error).toBe("Camera busy");
    expect(reportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      expect.any(Error),
    );
  });

  it("stopScanning stops the active scanner and clears state", async () => {
    const { result } = renderHook(() => useQrScanner());

    await act(async () => {
      await result.current.startScanning("qr-region", vi.fn());
    });
    expect(result.current.isScanning).toBe(true);

    act(() => {
      result.current.stopScanning();
    });

    expect(mockStop).toHaveBeenCalledTimes(1);
    expect(result.current.isScanning).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("stops the previous scanner before starting a new one", async () => {
    const { result } = renderHook(() => useQrScanner());

    await act(async () => {
      await result.current.startScanning("qr-a", vi.fn());
    });
    await act(async () => {
      await result.current.startScanning("qr-b", vi.fn());
    });

    expect(mockStop).toHaveBeenCalledTimes(1);
    expect(mockHtml5QrcodeClass).toHaveBeenCalledTimes(2);
    expect(mockHtml5QrcodeClass).toHaveBeenLastCalledWith("qr-b");
  });

  it("releases the camera when the hook unmounts", async () => {
    const { result, unmount } = renderHook(() => useQrScanner());

    await act(async () => {
      await result.current.startScanning("qr-region", vi.fn());
    });

    unmount();

    expect(mockStop).toHaveBeenCalledTimes(1);
  });
});
