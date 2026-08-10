import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { BayCardVehicleInfo } from "../_bay-card-vehicle-info";

vi.mock("@dnd-kit/core", () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
}));

vi.mock("../_tick-context", () => ({
  useBayViewTick: () => 1_752_000_000_000,
}));

const vehicle = {
  id: "v-1",
  plate_number: "1234УБА",
  make: "Toyota",
  model: "Prius",
  year: 2020,
} as const;

describe("BayCardVehicleInfo", () => {
  it("renders the plate, make, model and year inline", () => {
    render(
      <BayCardVehicleInfo vehicle={vehicle} startedAt="2026-08-09T09:00:00Z" />,
    );
    expect(screen.getByText("1234")).toBeTruthy();
    expect(screen.getByText("УБА")).toBeTruthy();
    expect(screen.getByText("Toyota Prius · 2020")).toBeTruthy();
  });

  it("omits the year separator when the vehicle has no year", () => {
    render(
      <BayCardVehicleInfo
        vehicle={{ ...vehicle, year: null }}
        startedAt={null}
      />,
    );
    expect(screen.getByText("Toyota Prius")).toBeTruthy();
  });

  it("renders the stacked layout with a Year label", () => {
    render(
      <BayCardVehicleInfo
        vehicle={vehicle}
        startedAt={null}
        yearLayout="stacked"
      />,
    );
    expect(screen.getByText("Toyota Prius")).toBeTruthy();
    expect(screen.getByText("Year: 2020")).toBeTruthy();
  });

  it("renders the no-vehicle-data fallback", () => {
    render(<BayCardVehicleInfo vehicle={null} startedAt={null} />);
    expect(screen.getByText("No vehicle data")).toBeTruthy();
  });

  it("wraps content in a draggable container when draggable", () => {
    render(
      <BayCardVehicleInfo
        vehicle={vehicle}
        startedAt={null}
        draggable
        workOrderId="wo-1"
      />,
    );
    const group = screen.getByRole("group");
    expect(group.getAttribute("aria-roledescription")).toBe(
      "draggable vehicle",
    );
  });

  it("still wraps when draggable but disabled (drag is inert)", () => {
    render(
      <BayCardVehicleInfo
        vehicle={vehicle}
        startedAt={null}
        draggable
        draggableDisabled
        workOrderId="wo-1"
      />,
    );
    expect(screen.getByRole("group")).toBeTruthy();
  });

  it("does not wrap without a work order id", () => {
    render(<BayCardVehicleInfo vehicle={vehicle} startedAt={null} draggable />);
    expect(screen.queryByRole("group")).toBeNull();
  });
});
