import { describe, expect, it } from "vitest";
import { render } from "@/test/test-utils";
import {
  BayCardEmptySkeleton,
  BayCardOccupiedSkeleton,
  FooterButtonSkeleton,
  MechanicBadgeSkeleton,
  PlateSkeleton,
  StatChipSkeleton,
  TimerSkeleton,
  VehicleNameSkeleton,
} from "../_skeleton-atoms";

describe("skeleton atoms", () => {
  it("renders a StatChipSkeleton with two skeleton blocks", () => {
    const { container } = render(<StatChipSkeleton />);
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
      2,
    );
  });

  it("renders PlateSkeleton, TimerSkeleton and VehicleNameSkeleton as skeleton blocks", () => {
    const { container } = render(
      <>
        <PlateSkeleton />
        <TimerSkeleton />
        <VehicleNameSkeleton />
      </>,
    );
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
      3,
    );
  });

  it("renders MechanicBadgeSkeleton with avatar and name blocks", () => {
    const { container } = render(<MechanicBadgeSkeleton />);
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
      2,
    );
  });

  it("renders FooterButtonSkeleton", () => {
    const { container } = render(<FooterButtonSkeleton />);
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
      1,
    );
  });

  it("renders BayCardOccupiedSkeleton with header, content and footer blocks", () => {
    const { container } = render(<BayCardOccupiedSkeleton />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBe(9);
  });

  it("renders BayCardEmptySkeleton with a circle and label block", () => {
    const { container } = render(<BayCardEmptySkeleton />);
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
      2,
    );
  });
});
