import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BrandSettings } from "@/components/org-theme-settings";

vi.mock("@zuiio/branding", () => ({
  BRAND_THEMES: [
    {
      name: "zuiio",
      label: "Zuiio",
      light: {
        "--primary": "oklch(0.70 0.16 195)",
        "--accent": "oklch(0.96 0.02 195)",
        "--background": "oklch(0.98 0.005 80)",
      },
      dark: {},
      config: {
        primaryColor: "#334155",
        accentColor: "#6366f1",
        backgroundColor: "#ffffff",
        borderRadius: 0.375,
      },
    },
    {
      name: "ocean",
      label: "Ocean",
      light: { "--primary": "oklch(0.55 0.15 190)" },
      dark: {},
      config: {
        primaryColor: "#0f766e",
        accentColor: "#06b6d4",
        backgroundColor: "#f0fdfa",
        borderRadius: 0.5,
      },
    },
  ],
  DEFAULT_BRAND_CONFIG: {
    primaryColor: "#334155",
    accentColor: "#6366f1",
    backgroundColor: "#ffffff",
    borderRadius: 0.375,
  },
  FONT_OPTIONS: [],
  generateBrandCSS: () => "",
  resolveBrandConfig: (c: unknown) => c,
}));

vi.mock("@/lib/queries/use-org-theme", () => ({
  useBrandThemeQuery: () => ({ data: null, isLoading: false }),
  useUpdateBrandTheme: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("lucide-react", () => ({
  Check: () => null,
  RotateCcw: () => null,
}));

describe("BrandSettings", () => {
  it("renders theme preset labels", () => {
    const { container } = render(<BrandSettings orgId="org-1" />);
    expect(container.textContent).toContain("Zuiio");
    expect(container.textContent).toContain("Ocean");
  });
});
