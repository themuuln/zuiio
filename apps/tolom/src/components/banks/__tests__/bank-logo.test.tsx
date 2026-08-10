import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MongolianBank } from "@/lib/payments/mongolian-banks";
import { BankLogo } from "../bank-logo";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // biome-ignore lint/a11y/useAltText: mock keeps the same contract as next/image
    // biome-ignore lint/performance/noImgElement: test double for next/image
    <img {...props} />
  ),
}));

const BANK = {
  logo: "/banks/khan.svg",
  nameEn: "Khan Bank",
  brandColor: "#0f8b8d",
} as Pick<MongolianBank, "logo" | "nameEn" | "brandColor">;

describe("BankLogo", () => {
  function img(): HTMLImageElement {
    const image = document.querySelector("img");
    if (!image) throw new Error("img not found");
    return image;
  }

  it("renders the bank logo image with the sm size by default", () => {
    render(<BankLogo bank={BANK} />);
    expect(img()).toHaveAttribute("src", "/banks/khan.svg");
    expect(img()).toHaveAttribute("width", "20");
    expect(img()).toHaveAttribute("height", "20");
  });

  it("renders the md size variant", () => {
    render(<BankLogo bank={BANK} size="md" />);
    expect(img()).toHaveAttribute("width", "28");
    expect(img()).toHaveAttribute("height", "28");
  });

  it("falls back to brand-colored initials when the image fails to load", () => {
    render(<BankLogo bank={BANK} />);
    fireEvent.error(img());

    const fallback = screen.getByText("KH");
    expect(fallback).toHaveStyle({ backgroundColor: "#0f8b8d" });
    expect(document.querySelector("img")).not.toBeInTheDocument();
  });
});
