import { act, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DisplayWorkOrder } from "@/app/api/organizations/[id]/display/work-orders/route";
import { render } from "@/test/test-utils";
import { WorkOrderCard } from "../work-order-card";

const WO: DisplayWorkOrder = {
  id: "wo-1",
  status: "Ready for Pickup",
  created_at: "2026-08-09T08:00:00Z",
  started_at: "2026-08-09T08:30:00Z",
  status_changed_at: "2026-08-09T10:30:00Z",
  customer_name: "John Doe",
  plate_number: "1234ABC",
  vehicle_make: "Toyota",
  vehicle_model: "Camry",
  mechanic_name: "Jane Smith",
  services: [
    { name: "Oil change" },
    { name: "Brake pads" },
    { name: "Wheel alignment" },
    { name: "Battery" },
  ],
  complaint: "Engine noise",
};

describe("WorkOrderCard", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the status badge, vehicle, customer, mechanic and services", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-09T12:00:00Z"));
    render(<WorkOrderCard workOrder={WO} />);

    // STATUS_DISPLAY_NAMES maps "Ready for Pickup" → "Ready"
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("1234ABC")).toBeInTheDocument();
    expect(screen.getByText("Toyota Camry")).toBeInTheDocument();
    expect(screen.getByText(/Engine noise/)).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    // First 3 service chips + overflow count
    expect(screen.getByText("Oil change")).toBeInTheDocument();
    expect(screen.getByText("Brake pads")).toBeInTheDocument();
    expect(screen.getByText("Wheel alignment")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("falls back to dashes for missing plate, customer and vehicle info", () => {
    render(
      <WorkOrderCard
        workOrder={{
          ...WO,
          plate_number: null,
          customer_name: null,
          vehicle_make: null,
          vehicle_model: null,
          mechanic_name: null,
          complaint: null,
        }}
      />,
    );

    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText(/Engine noise/)).not.toBeInTheDocument();
    expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
  });

  it("shows the raw status when it is not in the display map", () => {
    render(<WorkOrderCard workOrder={{ ...WO, status: "Unknown Status" }} />);
    expect(screen.getByText("Unknown Status")).toBeInTheDocument();
  });

  it("updates the elapsed timer as time passes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-09T12:00:00Z"));
    render(<WorkOrderCard workOrder={WO} />);

    // status_changed_at 10:30 → 90 minutes elapsed
    expect(screen.getByText("1h 30m")).toBeInTheDocument();

    // Advance 31 minutes from 12:00; the last 30s tick lands on 12:31:00
    // → 121 minutes elapsed.
    act(() => {
      vi.advanceTimersByTime(31 * 60_000);
    });

    expect(screen.getByText("2h 1m")).toBeInTheDocument();
  });
});
