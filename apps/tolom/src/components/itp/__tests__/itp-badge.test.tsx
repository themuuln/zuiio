import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { ItpBadge } from "../itp-badge";

describe("ItpBadge", () => {
  it("shows the day count for a valid ITP with an expiry date", () => {
    render(<ItpBadge itpStatus="valid" daysUntilExpiry={12} />);
    const badge = screen.getByText("12d");
    expect(badge).toHaveAttribute("title", "12 days until expiry");
  });

  it("shows the day count for an expiring-soon ITP", () => {
    render(<ItpBadge itpStatus="expiring_soon" daysUntilExpiry={5} />);
    expect(screen.getByText("5d")).toBeInTheDocument();
  });

  it("shows Expired for an expired ITP regardless of day count", () => {
    render(<ItpBadge itpStatus="expired" daysUntilExpiry={null} />);
    expect(screen.getByText("Expired")).toBeInTheDocument();
  });

  it("shows a dash for an unknown status", () => {
    render(<ItpBadge itpStatus="unknown" daysUntilExpiry={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("omits the day count for a valid ITP without an expiry date", () => {
    render(<ItpBadge itpStatus="valid" daysUntilExpiry={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("d")).not.toBeInTheDocument();
  });

  it("fires onDetailsClick when clicked", () => {
    const onDetailsClick = vi.fn();
    render(
      <ItpBadge
        itpStatus="expired"
        daysUntilExpiry={null}
        onDetailsClick={onDetailsClick}
      />,
    );
    fireEvent.click(screen.getByText("Expired"));
    expect(onDetailsClick).toHaveBeenCalledTimes(1);
  });

  it("falls back to a dash title when no expiry date is set", () => {
    render(<ItpBadge itpStatus="expired" daysUntilExpiry={null} />);
    expect(screen.getByText("Expired")).toHaveAttribute(
      "title",
      "No expiry date set",
    );
  });
});
