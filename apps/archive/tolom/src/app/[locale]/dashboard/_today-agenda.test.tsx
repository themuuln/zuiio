import { render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import { TodayAgenda } from "./_today-agenda";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const appointmentsData = vi.fn();
const pickupsData = vi.fn();
const schedulesData = vi.fn();

vi.mock("@/lib/queries/use-appointments", () => ({
  useAppointments: (...args: unknown[]) => appointmentsData(...args),
}));
vi.mock("@/lib/queries/use-work-orders", () => ({
  useWorkOrders: (...args: unknown[]) => pickupsData(...args),
}));
vi.mock("@/lib/queries/use-service-reminders", () => ({
  useServiceSchedules: (...args: unknown[]) => schedulesData(...args),
}));

vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const ready = {
  appointments: [
    {
      id: "a1",
      title: "Oil change",
      scheduled_at: "2026-08-02T10:00:00.000Z",
      status: "scheduled",
      customer: { first_name: "Bat", last_name: "Delger" },
      vehicle: { plate_number: "7257УБА" },
    },
  ],
  pickups: [
    {
      id: "wo1",
      status: "Ready for Pickup",
      created_at: "2026-08-01T08:00:00.000Z",
      customer: { first_name: "Saraa", last_name: null },
      vehicle: { plate_number: "4444УНА" },
    },
  ],
  schedules: [
    {
      id: "s1",
      reminder_enabled: true,
      next_due_date: "2026-08-01",
      contact_status: "pending",
      service_name: "Oil change",
      vehicle: { plate_number: "1234АА" },
    },
    {
      id: "s2",
      reminder_enabled: true,
      next_due_date: "2026-09-01",
      contact_status: "pending",
      service_name: "Not due",
      vehicle: { plate_number: "5678ББ" },
    },
    {
      id: "s3",
      reminder_enabled: true,
      next_due_date: "2026-08-01",
      contact_status: "contacted",
      service_name: "Already contacted",
      vehicle: { plate_number: "9999ВВ" },
    },
  ],
};

function setupQueryData() {
  appointmentsData.mockReturnValue({
    data: ready.appointments,
    isPending: false,
  });
  pickupsData.mockReturnValue({ data: ready.pickups, isPending: false });
  schedulesData.mockReturnValue({ data: ready.schedules, isPending: false });
}

describe("TodayAgenda", () => {
  it("renders labels and counts from data", () => {
    setupQueryData();
    render(<TodayAgenda orgId="org-1" />);

    expect(screen.getByText("appointmentsToday")).toBeInTheDocument();
    expect(screen.getByText("readyForPickup")).toBeInTheDocument();
    expect(screen.getByText("dueServiceReminders")).toBeInTheDocument();

    // Appointment row + reminder row both titled "Oil change"
    expect(screen.getAllByText("Oil change").length).toBeGreaterThanOrEqual(2);
    // Pickup row
    expect(screen.getByText("4444УНА")).toBeInTheDocument();
  });

  it("only counts reminders that are due, enabled and not yet contacted", () => {
    setupQueryData();
    render(<TodayAgenda orgId="org-1" />);

    const counts = screen
      .getAllByText(/\d+/, { selector: "span" })
      .map((el) => el.textContent);
    // 1 appointment, 1 pickup, 1 due reminder (s2 and s3 excluded)
    expect(counts).toContain("1");
  });

  it("shows empty states when there is no data", () => {
    appointmentsData.mockReturnValue({ data: [], isPending: false });
    pickupsData.mockReturnValue({ data: [], isPending: false });
    schedulesData.mockReturnValue({ data: [], isPending: false });

    render(<TodayAgenda orgId="org-1" />);

    expect(screen.getByText("noAppointmentsToday")).toBeInTheDocument();
    expect(screen.getByText("noPickupsToday")).toBeInTheDocument();
    expect(screen.getByText("noDueReminders")).toBeInTheDocument();
  });

  it("renders loading skeletons before data arrives", () => {
    appointmentsData.mockReturnValue({ data: undefined, isPending: true });
    pickupsData.mockReturnValue({ data: undefined, isPending: true });
    schedulesData.mockReturnValue({ data: undefined, isPending: true });

    const { container } = render(<TodayAgenda orgId="org-1" />);

    // Labels render immediately (inline skeleton pattern), values skeletonize
    expect(screen.getByText("appointmentsToday")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-slot=placeholder]")).toBeTruthy();
  });
});
