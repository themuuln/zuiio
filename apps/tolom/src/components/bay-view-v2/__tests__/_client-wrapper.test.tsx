import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { BayViewClientWrapper } from "../_client-wrapper";

vi.mock("next/dynamic", () => ({
  default: (
    _importFn: () => Promise<unknown>,
    options: { loading?: React.ComponentType },
  ) => {
    const Loading = options.loading;
    return function DynamicComponent() {
      return Loading ? <Loading /> : null;
    };
  },
}));

describe("BayViewClientWrapper", () => {
  it("renders the page skeleton while the dynamic client is loading", () => {
    render(<BayViewClientWrapper />);
    // The dynamic() loading fallback is the BayViewPageSkeleton — it renders
    // skeleton blocks (six bay cards + toolbar + KPI cards).
    expect(
      document.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(10);
  });
});
