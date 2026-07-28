import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useNoMemo } from "./use-no-memo";

describe("useNoMemo", () => {
  it("returns the value from factory", () => {
    const factory = vi.fn(() => 42);
    const { result } = renderHook(() => useNoMemo(factory));

    expect(factory).toHaveBeenCalledOnce();
    expect(result.current).toBe(42);
  });

  it("works with strings", () => {
    const { result } = renderHook(() => useNoMemo(() => "hello world"));

    expect(result.current).toBe("hello world");
  });

  it("works with objects", () => {
    const obj = { a: 1, b: "two" };
    const { result } = renderHook(() => useNoMemo(() => obj));

    expect(result.current).toBe(obj);
    expect(result.current).toEqual({ a: 1, b: "two" });
  });

  it("works with numbers", () => {
    const { result } = renderHook(() => useNoMemo(() => 3.14));

    expect(result.current).toBe(3.14);
  });
});
