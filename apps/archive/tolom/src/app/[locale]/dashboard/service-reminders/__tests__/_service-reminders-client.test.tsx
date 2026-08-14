import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceScheduleItem } from "@/lib/queries/use-service-reminders";
import { reportServerError } from "@/lib/sentry-report-server";
import { render } from "@/test/test-utils";
import ServiceRemindersPageClient from "../_service-reminders-client";

// ── Mock state (hoisted so mock factories can reference it) ──────────
const mocks = vi.hoisted(() => ({
  useServiceSchedules: vi.fn(),
  useCreateServiceSchedule: vi.fn(),
  useDeleteServiceSchedule: vi.fn(),
  useUpdateServiceSchedule: vi.fn(),
  useUpdateContactStatus: vi.fn(),
  useVehicles: vi.fn(),
  refetch: vi.fn(),
  createAsync: vi.fn(),
  deleteAsync: vi.fn(),
  updateAsync: vi.fn(),
  contactAsync: vi.fn(),
  addPayload: {
    vehicle_id: "veh-1",
    service_catalog_id: undefined,
    service_name: "Oil Filter",
    interval_months: 12,
    interval_km: null,
    last_service_date: undefined,
    last_service_odometer: undefined,
    next_due_date: undefined,
    next_due_km: null,
    notes: undefined,
  },
}));

// ── Module mocks ─────────────────────────────────────────────────────
vi.mock(import("next-intl"), async (importOriginal) => {
  const mod = await importOriginal<typeof import("next-intl")>();
  return {
    ...mod,
    useTranslations: () => (key: string) => key,
    useLocale: () => "en",
  };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({ data: { orgId: "org-1" } }),
}));

vi.mock("@/lib/queries/use-service-reminders", () => ({
  useServiceSchedules: (...args: unknown[]) =>
    mocks.useServiceSchedules(...args),
  useCreateServiceSchedule: (...args: unknown[]) =>
    mocks.useCreateServiceSchedule(...args),
  useDeleteServiceSchedule: (...args: unknown[]) =>
    mocks.useDeleteServiceSchedule(...args),
  useUpdateServiceSchedule: (...args: unknown[]) =>
    mocks.useUpdateServiceSchedule(...args),
  useUpdateContactStatus: (...args: unknown[]) =>
    mocks.useUpdateContactStatus(...args),
}));

vi.mock("@/lib/queries/use-vehicles", () => ({
  useVehicles: (...args: unknown[]) => mocks.useVehicles(...args),
}));

vi.mock("@/lib/stores", () => ({
  useSelectedBranchId: () => "all",
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

// ── Local children not under test ────────────────────────────────────
vi.mock("../_action-buttons", () => ({
  ActionButtons: () => <div data-testid="action-buttons" />,
}));

vi.mock("../_config-drawer", () => ({
  ConfigDrawer: () => <div data-testid="config-drawer" />,
}));

vi.mock("../_reminder-logs-tab", () => ({
  ReminderLogsTab: () => <div data-testid="reminder-logs-tab" />,
}));

vi.mock("../_add-schedule-dialog", () => ({
  AddScheduleDialog: ({
    onAdd,
    isPending,
  }: {
    onAdd: (data: Record<string, unknown>) => Promise<void>;
    isPending: boolean;
  }) => (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        void onAdd(mocks.addPayload);
      }}
    >
      serviceReminders.addSchedule
    </button>
  ),
}));

// ── Fixtures ─────────────────────────────────────────────────────────

function makeSchedule(
  overrides: Partial<ServiceScheduleItem> = {},
): ServiceScheduleItem {
  return {
    id: "sched-1",
    organization_id: "org-1",
    branch_id: null,
    vehicle_id: "veh-1",
    service_catalog_id: null,
    service_name: "Oil Change",
    interval_months: 6,
    interval_km: null,
    last_service_date: "2025-11-15",
    last_service_odometer: null,
    next_due_date: null,
    next_due_km: null,
    reminder_enabled: true,
    notes: null,
    contact_status: "pending",
    contacted_at: null,
    created_at: "2025-01-01T00:00:00.000Z",
    vehicle: {
      plate_number: "1234ABC",
      make: "Toyota",
      model: "Prius",
      year: 2020,
      customer: {
        id: "cust-1",
        first_name: "Bold",
        last_name: "Bat",
        phone: "+97699110011",
      },
    },
    service: { name: "Oil Change" },
    ...overrides,
  };
}

function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function setSchedules(schedules: ServiceScheduleItem[]) {
  mocks.useServiceSchedules.mockReturnValue({
    data: schedules,
    isPending: false,
    error: null,
    refetch: mocks.refetch,
  });
}

function baseSchedules(): ServiceScheduleItem[] {
  return [makeSchedule({ id: "sched-1", next_due_date: isoDaysFromNow(30) })];
}

// ── Tests ────────────────────────────────────────────────────────────

describe("ServiceRemindersPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.refetch.mockResolvedValue(undefined);
    setSchedules([]);
    mocks.useCreateServiceSchedule.mockReturnValue({
      mutateAsync: mocks.createAsync,
      isPending: false,
    });
    mocks.useDeleteServiceSchedule.mockReturnValue({
      mutateAsync: mocks.deleteAsync,
      isPending: false,
    });
    mocks.useUpdateServiceSchedule.mockReturnValue({
      mutateAsync: mocks.updateAsync,
      isPending: false,
    });
    mocks.useUpdateContactStatus.mockReturnValue({
      mutateAsync: mocks.contactAsync,
      isPending: false,
    });
    mocks.useVehicles.mockReturnValue({ data: [] });
    mocks.createAsync.mockResolvedValue({ id: "new-1" });
    mocks.deleteAsync.mockResolvedValue({ id: "sched-1" });
    mocks.updateAsync.mockResolvedValue({ id: "sched-1" });
    mocks.contactAsync.mockResolvedValue({ id: "sched-1" });
  });

  it("shows skeletons while schedules are loading", () => {
    mocks.useServiceSchedules.mockReturnValue({
      data: undefined,
      isPending: true,
      error: null,
      refetch: mocks.refetch,
    });
    render(<ServiceRemindersPageClient />);
    expect(document.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(4);
    // Summary cards hidden while loading
    expect(
      screen.queryByText("serviceReminders.totalSchedules"),
    ).not.toBeInTheDocument();
  });

  it("shows the error message and refetches on retry", async () => {
    const user = userEvent.setup();
    mocks.useServiceSchedules.mockReturnValue({
      data: undefined,
      isPending: false,
      error: new Error("Failed to load schedules"),
      refetch: mocks.refetch,
    });
    render(<ServiceRemindersPageClient />);
    expect(screen.getByText("Failed to load schedules")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "common.retry" }));
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });

  it("renders the empty state with an add-schedule action when there are no schedules", () => {
    render(<ServiceRemindersPageClient />);
    expect(
      screen.getByText("serviceReminders.noSchedules"),
    ).toBeInTheDocument();
    // Header + empty-state action both render the dialog trigger
    expect(
      screen.getAllByRole("button", { name: "serviceReminders.addSchedule" }),
    ).toHaveLength(2);
    // No summary cards, no toolbar when empty
    expect(
      screen.queryByText("serviceReminders.totalSchedules"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("serviceReminders.searchSchedules"),
    ).not.toBeInTheDocument();
  });

  it("renders schedule rows with vehicle, service, customer, statuses and summary counts", () => {
    const overdue = makeSchedule({
      id: "sched-1",
      next_due_date: isoDaysFromNow(-1),
      contact_status: "pending",
    });
    const dueSoon = makeSchedule({
      id: "sched-2",
      vehicle_id: "veh-2",
      service_name: "Brake Pads",
      next_due_date: isoDaysFromNow(2),
      contact_status: "sent",
      vehicle: {
        plate_number: "5678XYZ",
        make: "Honda",
        model: "Civic",
        year: 2021,
        customer: {
          id: "cust-2",
          first_name: "Saraa",
          last_name: "Dorj",
          phone: "+97699001122",
        },
      },
    });
    const scheduled = makeSchedule({
      id: "sched-3",
      service_name: "Tire Rotation",
      next_due_date: isoDaysFromNow(30),
      next_due_km: 50000,
      contact_status: "failed",
      vehicle: {
        plate_number: "TOY100",
        make: "Lexus",
        model: "RX",
        year: 2022,
        customer: null,
      },
    });
    const noDate = makeSchedule({
      id: "sched-4",
      service_name: "Wiper Blades",
      next_due_date: null,
      reminder_enabled: false,
      contact_status: "cancelled",
      vehicle: {
        plate_number: "WIPER9",
        make: "Kia",
        model: "Rio",
        year: 2019,
        customer: null,
      },
    });
    setSchedules([overdue, dueSoon, scheduled, noDate]);
    render(<ServiceRemindersPageClient />);

    // Summary counts: 4 total, 1 overdue, 1 due soon, 1 reminders off
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(3);

    // Rows: vehicle labels + service names
    expect(screen.getByText("Toyota Prius 1234ABC")).toBeInTheDocument();
    expect(screen.getByText("Honda Civic 5678XYZ")).toBeInTheDocument();
    expect(screen.getByText("Oil Change")).toBeInTheDocument();
    expect(screen.getByText("Brake Pads")).toBeInTheDocument();
    expect(screen.getByText("Tire Rotation")).toBeInTheDocument();
    expect(screen.getByText("Wiper Blades")).toBeInTheDocument();

    // Customer names + tel links
    expect(screen.getByText("Bold Bat")).toBeInTheDocument();
    expect(screen.getByText("Saraa Dorj")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+97699110011" })).toHaveAttribute(
      "href",
      "tel:+97699110011",
    );
    expect(screen.getByRole("link", { name: "+97699001122" })).toHaveAttribute(
      "href",
      "tel:+97699001122",
    );

    // Contact status + due status badges
    expect(
      screen.getByText("serviceReminders.statusPending"),
    ).toBeInTheDocument();
    expect(screen.getByText("serviceReminders.statusSent")).toBeInTheDocument();
    expect(
      screen.getByText("serviceReminders.statusFailed"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("serviceReminders.statusCancelled"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("serviceReminders.statusOverdue"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("serviceReminders.statusDueSoon"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("serviceReminders.statusScheduled"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("serviceReminders.statusNoDate"),
    ).toBeInTheDocument();

    // No-date row renders dashes for missing date and customer
    expect(screen.getAllByText("—")).toHaveLength(3);
  });

  it("filters rows by search query across service name and plate", async () => {
    const user = userEvent.setup();
    setSchedules([
      makeSchedule({ id: "sched-1", next_due_date: isoDaysFromNow(30) }),
      makeSchedule({
        id: "sched-2",
        service_name: "Brake Pads",
        next_due_date: isoDaysFromNow(30),
        vehicle: {
          plate_number: "5678XYZ",
          make: "Honda",
          model: "Civic",
          year: 2021,
          customer: null,
        },
      }),
    ]);
    render(<ServiceRemindersPageClient />);
    const search = screen.getByPlaceholderText(
      "serviceReminders.searchSchedules",
    );

    await user.type(search, "brake");
    expect(screen.getByText("Brake Pads")).toBeInTheDocument();
    expect(screen.queryByText("Oil Change")).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "5678xyz");
    expect(screen.getByText("Brake Pads")).toBeInTheDocument();
    expect(screen.queryByText("Oil Change")).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "zzz");
    expect(
      screen.getByText("serviceReminders.noMatchingSchedules"),
    ).toBeInTheDocument();
  });

  it("filters rows by due status via the status select", async () => {
    const user = userEvent.setup();
    setSchedules([
      makeSchedule({
        id: "sched-1",
        next_due_date: isoDaysFromNow(-1),
      }),
      makeSchedule({
        id: "sched-2",
        service_name: "Brake Pads",
        next_due_date: isoDaysFromNow(30),
        vehicle: {
          plate_number: "5678XYZ",
          make: "Honda",
          model: "Civic",
          year: 2021,
          customer: null,
        },
      }),
    ]);
    render(<ServiceRemindersPageClient />);

    await user.click(screen.getAllByRole("combobox")[0]);
    await user.click(await screen.findByText("serviceReminders.filterOverdue"));

    expect(screen.getByText("Oil Change")).toBeInTheDocument();
    expect(screen.queryByText("Brake Pads")).not.toBeInTheDocument();
  });

  it("filters rows by reminder state via the reminder select", async () => {
    // The preceding status-select test leaves its Base UI popup mounted in the
    // DOM (jsdom never fires the close transition), so its pointer-events:none
    // overlay intercepts clicks. Disable the jsdom pointer-events check for
    // this interaction; the real pointer flow still runs.
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setSchedules([
      makeSchedule({
        id: "sched-1",
        next_due_date: isoDaysFromNow(30),
        reminder_enabled: true,
      }),
      makeSchedule({
        id: "sched-2",
        service_name: "Brake Pads",
        next_due_date: isoDaysFromNow(30),
        reminder_enabled: false,
        vehicle: {
          plate_number: "5678XYZ",
          make: "Honda",
          model: "Civic",
          year: 2021,
          customer: null,
        },
      }),
    ]);
    render(<ServiceRemindersPageClient />);

    await user.click(screen.getAllByRole("combobox")[1]);
    await user.click(
      await screen.findByText("serviceReminders.filterWithoutReminders"),
    );

    expect(screen.getByText("Brake Pads")).toBeInTheDocument();
    expect(screen.queryByText("Oil Change")).not.toBeInTheDocument();
  });

  it("clears all filters and restores the full list", async () => {
    const user = userEvent.setup();
    setSchedules([
      makeSchedule({ id: "sched-1", next_due_date: isoDaysFromNow(-1) }),
      makeSchedule({
        id: "sched-2",
        service_name: "Brake Pads",
        next_due_date: isoDaysFromNow(30),
        vehicle: {
          plate_number: "5678XYZ",
          make: "Honda",
          model: "Civic",
          year: 2021,
          customer: null,
        },
      }),
    ]);
    render(<ServiceRemindersPageClient />);
    const search = screen.getByPlaceholderText(
      "serviceReminders.searchSchedules",
    );

    await user.type(search, "oil");
    expect(screen.queryByText("Brake Pads")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "serviceReminders.clearFilters" }),
    );

    expect(screen.getByText("Oil Change")).toBeInTheDocument();
    expect(screen.getByText("Brake Pads")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "serviceReminders.clearFilters" }),
    ).not.toBeInTheDocument();
  });

  it("switches between the schedule and logs tabs", async () => {
    const user = userEvent.setup();
    setSchedules(baseSchedules());
    render(<ServiceRemindersPageClient />);
    expect(screen.queryByTestId("reminder-logs-tab")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("tab", { name: "serviceReminders.reminderLogs" }),
    );
    expect(screen.getByTestId("reminder-logs-tab")).toBeInTheDocument();

    await user.click(
      screen.getByRole("tab", { name: "serviceReminders.scheduleList" }),
    );
    expect(screen.getByText("Oil Change")).toBeInTheDocument();
  });

  it("submits the create-schedule payload through the mutation", async () => {
    const user = userEvent.setup();
    setSchedules(baseSchedules());
    render(<ServiceRemindersPageClient />);

    await user.click(
      screen.getByRole("button", { name: "serviceReminders.addSchedule" }),
    );

    expect(mocks.createAsync).toHaveBeenCalledTimes(1);
    expect(mocks.createAsync).toHaveBeenCalledWith(mocks.addPayload);
    expect(mocks.createAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        vehicle_id: "veh-1",
        service_name: "Oil Filter",
        interval_months: 12,
      }),
    );
  });

  it("updates the contact status from the row dropdown", async () => {
    const user = userEvent.setup();
    setSchedules(baseSchedules());
    render(<ServiceRemindersPageClient />);

    await user.click(
      screen.getByRole("button", {
        name: "serviceReminders.updateContactStatus",
      }),
    );
    await user.click(await screen.findByText("serviceReminders.markScheduled"));

    await waitFor(() =>
      expect(mocks.contactAsync).toHaveBeenCalledWith({
        id: "sched-1",
        status: "called-scheduled",
      }),
    );
  });

  it("deletes a schedule after confirmation with a success toast", async () => {
    const user = userEvent.setup();
    setSchedules(baseSchedules());
    render(<ServiceRemindersPageClient />);

    await user.click(screen.getByRole("button", { name: "common.delete" }));

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText("serviceReminders.deleteConfirmTitle"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("serviceReminders.deleteConfirmVehicle"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("serviceReminders.deleteDescription"),
    ).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", { name: "common.delete" }),
    );

    await waitFor(() =>
      expect(mocks.deleteAsync).toHaveBeenCalledWith("sched-1"),
    );
    expect(toast.dismiss).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("common.deleted");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("shows an error toast when deletion fails", async () => {
    const user = userEvent.setup();
    mocks.deleteAsync.mockRejectedValueOnce(new Error("delete failed"));
    setSchedules(baseSchedules());
    render(<ServiceRemindersPageClient />);

    await user.click(screen.getByRole("button", { name: "common.delete" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "common.delete",
      }),
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("delete failed"),
    );
    expect(reportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      expect.any(Error),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("opens the edit drawer seeded with the schedule and saves updates", async () => {
    const user = userEvent.setup();
    setSchedules([
      makeSchedule({
        next_due_date: isoDaysFromNow(30),
        notes: "Check torque",
      }),
    ]);
    render(<ServiceRemindersPageClient />);

    await user.click(screen.getByRole("button", { name: "common.edit" }));

    const nameInput = await screen.findByRole("textbox", {
      name: "serviceReminders.serviceName",
    });
    expect(nameInput).toHaveValue("Oil Change");
    expect(screen.getByRole("textbox", { name: "common.notes" })).toHaveValue(
      "Check torque",
    );

    await user.clear(nameInput);
    await user.type(nameInput, "Oil Change Plus");
    await user.click(screen.getByRole("button", { name: "common.save" }));

    await waitFor(() =>
      expect(mocks.updateAsync).toHaveBeenCalledWith({
        id: "sched-1",
        service_name: "Oil Change Plus",
        interval_months: 6,
        interval_km: null,
        notes: "Check torque",
        reminder_enabled: true,
      }),
    );
    expect(mocks.refetch).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("common.saved");
  });
});
