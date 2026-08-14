import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useBreadcrumbs } from "./use-breadcrumbs";

const mockUsePathname = vi.hoisted(() => vi.fn());

vi.mock("@/lib/i18n/navigation", () => ({
  usePathname: mockUsePathname,
}));

describe("useBreadcrumbs", () => {
  it("returns empty crumbs when pathname is empty", () => {
    mockUsePathname.mockReturnValue("");
    const { result } = renderHook(() => useBreadcrumbs());
    expect(result.current).toEqual([]);
  });

  it("returns just dashboard for /dashboard", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    const { result } = renderHook(() => useBreadcrumbs());
    expect(result.current).toEqual([
      { label: "nav.dashboard", href: "/dashboard" },
    ]);
  });

  it("maps locale + dashboard + customers correctly", () => {
    mockUsePathname.mockReturnValue("/en/dashboard/customers");
    const { result } = renderHook(() => useBreadcrumbs());
    // First crumb is always dashboard + locale-prefixed "dashboard" segment
    // then the mapped segment for "customers"
    expect(result.current).toEqual([
      { label: "nav.dashboard", href: "/dashboard" },
      { label: "nav.dashboard", href: "/en/dashboard" },
      { label: "nav.customers", href: "/en/dashboard/customers" },
    ]);
  });

  it("handles createNew for new segment", () => {
    mockUsePathname.mockReturnValue("/en/dashboard/customers/new");
    const { result } = renderHook(() => useBreadcrumbs());
    expect(result.current).toEqual([
      { label: "nav.dashboard", href: "/dashboard" },
      { label: "nav.dashboard", href: "/en/dashboard" },
      { label: "nav.customers", href: "/en/dashboard/customers" },
      { label: "common.createNew", href: "/en/dashboard/customers/new" },
    ]);
  });

  it("shows # prefix for UUID segments", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    mockUsePathname.mockReturnValue(`/en/dashboard/inventory/${uuid}`);
    const { result } = renderHook(() => useBreadcrumbs());
    const items = result.current;
    expect(items[items.length - 1].label).toBe(`#${uuid.slice(0, 8)}`);
  });

  it("humanizes unknown segments", () => {
    mockUsePathname.mockReturnValue("/en/dashboard/some-random-page");
    const { result } = renderHook(() => useBreadcrumbs());
    const items = result.current;
    expect(items[items.length - 1].label).toBe("Some Random Page");
  });
});
