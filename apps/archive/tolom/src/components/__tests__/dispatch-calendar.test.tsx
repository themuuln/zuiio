import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DispatchCalendar } from "@/components/dispatch-calendar";
import type { AppointmentDetail } from "@/lib/types";
import { render } from "@/test/test-utils";

// ── Mock Data ──────────────────────────────────────────────────────────

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

function createMockAppointment(
  overrides: Partial<AppointmentDetail> = {},
): AppointmentDetail {
  return {
    id: "apt-1",
    scheduled_at: `${todayStr}T09:00:00`,
    status: "scheduled",
    description: "Oil change and tire rotation",
    created_at: todayStr,
    customer: {
      id: "cust-1",
      first_name: "John",
      last_name: "Doe",
      email: null,
      phone: "555-0100",
      notes: null,
      created_at: todayStr,
    },
    vehicle: {
      id: "veh-1",
      plate_number: "ABC-1234",
      vin: null,
      make: "Toyota",
      model: "Camry",
      year: 2020,
      customer_id: "cust-1",
      color: null,
      notes: null,
      created_at: todayStr,
    },
    estimate: null,
    mechanic: {
      id: "mech-1",
      full_name: "Jane Smith",
    },
    ...overrides,
  } as AppointmentDetail;
}

const todayAppointments = [
  createMockAppointment({
    id: "apt-1",
    scheduled_at: `${todayStr}T09:00:00`,
    status: "scheduled",
  }),
  createMockAppointment({
    id: "apt-2",
    scheduled_at: `${todayStr}T10:30:00`,
    status: "in_progress",
    description: "Brake pad replacement",
    customer: { id: "cust-2", first_name: "Alice", last_name: "Johnson" },
    vehicle: {
      id: "veh-2",
      plate_number: "XYZ-5678",
      make: "Honda",
      model: "Civic",
      year: 2021,
      customer_id: "cust-2",
    },
    mechanic: { id: "mech-1", full_name: "Jane Smith" },
  }),
  createMockAppointment({
    id: "apt-3",
    scheduled_at: `${todayStr}T13:00:00`,
    status: "completed",
    description: "AC repair",
    customer: { id: "cust-3", first_name: "Charlie", last_name: "Brown" },
    vehicle: {
      id: "veh-3",
      plate_number: "DEF-9012",
      make: "Ford",
      model: "Focus",
      year: 2019,
      customer_id: "cust-3",
    },
    mechanic: { id: "mech-2", full_name: "Bob Johnson" },
  }),
  createMockAppointment({
    id: "apt-4",
    scheduled_at: `${todayStr}T15:00:00`,
    status: "scheduled",
    description: "Wheel alignment",
    customer: { id: "cust-4", first_name: "Diana", last_name: "Prince" },
    vehicle: {
      id: "veh-4",
      plate_number: "GHI-3456",
      make: "BMW",
      model: "X5",
      year: 2023,
      customer_id: "cust-4",
    },
  }),
];

const _tomorrowAppointments = [
  createMockAppointment({
    id: "apt-5",
    scheduled_at: `${tomorrowStr}T09:00:00`,
    status: "scheduled",
    description: "Engine diagnostic",
  }),
];

// ── Tests ───────────────────────────────────────────────────────────────

describe("DispatchCalendar", () => {
  it("renders the calendar header with navigation and today button", () => {
    render(<DispatchCalendar appointments={todayAppointments} />);
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(document.querySelector(".lucide-chevron-left")).toBeInTheDocument();
    expect(document.querySelector(".lucide-chevron-right")).toBeInTheDocument();
  });

  it("displays formatted date in the header", () => {
    render(<DispatchCalendar appointments={todayAppointments} />);
    const formattedDate = today.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
  });

  it("shows appointment count badge", () => {
    render(<DispatchCalendar appointments={todayAppointments} />);
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("renders appointment blocks with vehicle plate numbers", () => {
    render(<DispatchCalendar appointments={todayAppointments} />);
    expect(screen.getByText("ABC-1234")).toBeInTheDocument();
    expect(screen.getByText("XYZ-5678")).toBeInTheDocument();
    expect(screen.getByText("DEF-9012")).toBeInTheDocument();
  });

  it("renders customer names on appointment blocks", () => {
    render(<DispatchCalendar appointments={todayAppointments} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    expect(screen.getByText("Charlie Brown")).toBeInTheDocument();
  });

  it("shows appointment descriptions", () => {
    render(<DispatchCalendar appointments={todayAppointments} />);
    expect(
      screen.getByText("Oil change and tire rotation"),
    ).toBeInTheDocument();
    expect(screen.getByText("Brake pad replacement")).toBeInTheDocument();
    expect(screen.getByText("AC repair")).toBeInTheDocument();
  });

  it("shows status legend labels", () => {
    render(<DispatchCalendar appointments={todayAppointments} />);
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("renders the time column with hour labels", () => {
    render(<DispatchCalendar appointments={[]} />);
    // Hours 7-18 formatted by formatHour():
    //   hour < 12 → `${hour} AM`
    //   hour === 12 → `12 PM`
    //   hour > 12 → `${hour-12} PM`
    for (let hour = 7; hour <= 18; hour++) {
      const display =
        hour < 12 ? `${hour} AM` : hour === 12 ? `12 PM` : `${hour - 12} PM`;
      expect(screen.getByText(display)).toBeInTheDocument();
    }
  });

  it("shows loading skeleton when isLoading is true", () => {
    const { container } = render(
      <DispatchCalendar appointments={[]} isLoading />,
    );
    expect(
      container.querySelector('[data-slot="skeleton"]'),
    ).toBeInTheDocument();
  });

  it("shows empty state when no appointments", () => {
    render(<DispatchCalendar appointments={[]} />);
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("calls onAppointmentClick when an appointment block is clicked", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(
      <DispatchCalendar
        appointments={todayAppointments}
        onAppointmentClick={handleClick}
      />,
    );
    await user.click(screen.getByText("ABC-1234"));
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "apt-1" }),
    );
  });

  it("navigates to next day", async () => {
    const _user = userEvent.setup();
    render(<DispatchCalendar appointments={todayAppointments} />);
    const nextBtn = document.querySelector(".lucide-chevron-right");
    expect(nextBtn).toBeInTheDocument();
  });

  it("navigates to previous day", async () => {
    render(<DispatchCalendar appointments={todayAppointments} />);
    const prevBtn = document.querySelector(".lucide-chevron-left");
    expect(prevBtn).toBeInTheDocument();
  });

  it("shows the Today button", () => {
    render(<DispatchCalendar appointments={todayAppointments} />);
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { container } = render(
      <DispatchCalendar
        appointments={todayAppointments}
        className="custom-class"
      />,
    );
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });
});
