import { screen } from "@testing-library/react";
import type * as NextIntl from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { PartnersSlider } from "@/components/partners-slider";
import { render as renderWithUtils } from "@/test/test-utils";

const t = vi.hoisted(() => (key: string) => key);
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof NextIntl>("next-intl");
  return { ...actual, useTranslations: () => t };
});

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
    className,
  }: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
  }) => (
    // biome-ignore lint/performance/noImgElement: test double for next/image
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  ),
}));

describe("PartnersSlider", () => {
  it("renders the section title and founding partner card", () => {
    renderWithUtils(<PartnersSlider />);
    expect(screen.getByText("partnersTitle")).toBeInTheDocument();
    expect(screen.getByText("Хантайшир Моторс ХХК")).toBeInTheDocument();
    expect(screen.getByText("partnersOrgDesc")).toBeInTheDocument();
  });

  it("renders the partner logo with the correct source", () => {
    renderWithUtils(<PartnersSlider />);
    const logo = screen.getByAltText("Хантайшир Моторс ХХК");
    expect(logo).toHaveAttribute("src", "/khantaishir-motors-logo.jpg");
  });

  it("links to the partner Facebook page in a new tab", () => {
    renderWithUtils(<PartnersSlider />);
    // The Button wrapper renders an anchor with role="button"
    const link = screen.getByRole("button", { name: "Facebook" });
    expect(link).toHaveAttribute(
      "href",
      "https://www.facebook.com/khantaishiravtoservice",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
