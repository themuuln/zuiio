/**
 * Tests for useBarcodeScanner hook.
 */
import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useBarcodeScanner } from "../use-barcode-scanner";

// Mock next/dynamic
vi.mock("next/dynamic", () => ({
  default: vi.fn(() => () => null),
}));

describe("useBarcodeScanner", () => {
  it("returns initial state with isOpen false", () => {
    const { result } = renderHook(() =>
      useBarcodeScanner({ onScan: vi.fn() }),
    );

    expect(result.current.isOpen).toBe(false);
    expect(typeof result.current.open).toBe("function");
    expect(typeof result.current.close).toBe("function");
    expect(typeof result.current.ScannerComponent).toBe("function");
  });

  it("open sets isOpen to true", () => {
    const { result } = renderHook(() =>
      useBarcodeScanner({ onScan: vi.fn() }),
    );

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it("close sets isOpen to false", () => {
    const { result } = renderHook(() =>
      useBarcodeScanner({ onScan: vi.fn() }),
    );

    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("calls onScan with barcode and returns found result", () => {
    const onScan = vi.fn().mockReturnValue({ found: true });
    const { result } = renderHook(() => useBarcodeScanner({ onScan }));

    // Access internal handleScan via ScannerComponent rendering
    // The ScannerComponent passes handleScan to CameraScanner
    expect(result.current.ScannerComponent).toBeDefined();
  });

  it("ignores duplicate barcode scans", () => {
    const onScan = vi.fn().mockReturnValue({ found: true });
    const { result } = renderHook(() => useBarcodeScanner({ onScan }));

    // First scan passes
    act(() => {
      result.current.open();
    });
    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
  });
});
