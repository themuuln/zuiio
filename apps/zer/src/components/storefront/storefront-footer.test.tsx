import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  StorefrontFooter,
  type StorefrontFooterData,
} from "./storefront-footer";

const FULL_DATA: StorefrontFooterData = {
  name: "Test Shop",
  description: "Шилдэг барааны дэлгүүр",
  contactEmail: "hi@test-shop.mn",
  contactPhone: "99112233",
  address: "УБ, СБД, 1-р хороо",
  websiteUrl: "https://test-shop.mn",
  socialLinks: {
    facebook: "https://facebook.com/testshop",
    instagram: "https://instagram.com/testshop",
  },
  businessHours: {
    Monday: "09:00-18:00",
    Saturday: "10:00-15:00",
  },
};

const EMPTY_DATA: StorefrontFooterData = {
  name: null,
  description: null,
  contactEmail: null,
  contactPhone: null,
  address: null,
  websiteUrl: null,
  socialLinks: null,
  businessHours: null,
};

describe("StorefrontFooter", () => {
  it("renders org info, contact, hours, and socials", () => {
    render(<StorefrontFooter data={FULL_DATA} />);

    expect(screen.getByText("Test Shop")).toBeInTheDocument();
    expect(screen.getByText("Шилдэг барааны дэлгүүр")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "99112233" })).toHaveAttribute(
      "href",
      "tel:99112233",
    );
    expect(
      screen.getByRole("link", { name: "hi@test-shop.mn" }),
    ).toHaveAttribute("href", "mailto:hi@test-shop.mn");
    expect(screen.getByText("УБ, СБД, 1-р хороо")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "test-shop.mn" })).toHaveAttribute(
      "href",
      "https://test-shop.mn",
    );

    // Hours rows use Mongolian day labels
    expect(screen.getByText("Даваа")).toBeInTheDocument();
    expect(screen.getByText("09:00-18:00")).toBeInTheDocument();
    expect(screen.getByText("Бямба")).toBeInTheDocument();

    // Social icons link out
    expect(screen.getByRole("link", { name: "facebook" })).toHaveAttribute(
      "href",
      "https://facebook.com/testshop",
    );
    expect(screen.getByRole("link", { name: "instagram" })).toHaveAttribute(
      "href",
      "https://instagram.com/testshop",
    );

    // Platform credit
    expect(screen.getByText("Zer ERP дэмждэг")).toBeInTheDocument();
  });

  it("renders without crashing when the profile is empty", () => {
    render(<StorefrontFooter data={EMPTY_DATA} />);
    expect(screen.getByText("Zer ERP дэмждэг")).toBeInTheDocument();
  });
});
