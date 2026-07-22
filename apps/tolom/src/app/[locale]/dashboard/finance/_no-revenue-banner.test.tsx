import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { render as renderWithMessages } from "@/test/test-utils";
import { NoRevenueBanner } from "./_no-revenue-banner";

const financeMessages = {
  finance: {
    noRevenueBannerHeadline: "{count} active work orders",
    noRevenueBannerBodyPrefix:
      "Complete these work orders to start tracking revenue. Mark a work order as",
    completedLabel: "Completed",
    noRevenueBannerBodySuffix:
      "to see it reflected in your financial dashboard.",
  },
};

describe("NoRevenueBanner", () => {
  it("renders headline with active work order count", () => {
    renderWithMessages(<NoRevenueBanner activeWorkOrders={5} />, {
      messages: financeMessages,
    });
    expect(screen.getByText("5 active work orders")).toBeDefined();
  });

  it("renders body text with completed label", () => {
    renderWithMessages(<NoRevenueBanner activeWorkOrders={0} />, {
      messages: financeMessages,
    });
    expect(
      screen.getByText(/Complete these work orders/),
    ).toBeDefined();
    expect(screen.getByText("Completed")).toBeDefined();
  });

  it("renders with zero active work orders", () => {
    renderWithMessages(<NoRevenueBanner activeWorkOrders={0} />, {
      messages: financeMessages,
    });
    expect(screen.getByText("0 active work orders")).toBeDefined();
  });

  it("renders trending up icon", () => {
    const { container } = renderWithMessages(
      <NoRevenueBanner activeWorkOrders={3} />,
      { messages: financeMessages },
    );
    const icon = container.querySelector(".text-amber-500");
    expect(icon).toBeDefined();
  });
});
