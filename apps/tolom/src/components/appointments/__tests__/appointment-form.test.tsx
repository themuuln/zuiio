import { screen, waitFor } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { AppointmentForm } from "../appointment-form";

// ── Mock state ─────────────────────────────────────────────────────────
const hooks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  customerId: "cust-1",
  vehicleId: "veh-1",
}));

vi.mock("next-intl", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@zuiio/query", () => ({
  useOrgMutation: () => ({
    mutateAsync: hooks.mutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/components/work-orders/customer-select", () => ({
  CustomerSelect: ({ onSelect }: { onSelect: (c: { id: string }) => void }) => (
    <button type="button" onClick={() => onSelect({ id: hooks.customerId })}>
      Select Customer
    </button>
  ),
}));

vi.mock("@/components/work-orders/vehicle-select", () => ({
  VehicleSelect: ({ onSelect }: { onSelect: (v: { id: string }) => void }) => (
    <button type="button" onClick={() => onSelect({ id: hooks.vehicleId })}>
      Select Vehicle
    </button>
  ),
}));

// Deterministic datetime controls so the payload is assertable.
const FIXED_DATE = new Date("2026-08-10T09:00:00.000Z");
const FIXED_TIME = new Date("2026-08-10T10:30:00.000Z");
vi.mock("@/components/ui/appointment-date-picker", () => ({
  AppointmentDatePicker: ({
    onChange,
  }: {
    onChange?: (date: Date | undefined) => void;
  }) => (
    <button type="button" onClick={() => onChange?.(FIXED_DATE)}>
      Pick Date
    </button>
  ),
}));

vi.mock("@/components/ui/time-picker", () => ({
  TimePicker: ({
    onChange,
  }: {
    onChange?: (date: Date | undefined) => void;
  }) => (
    <button type="button" onClick={() => onChange?.(FIXED_TIME)}>
      Pick Time
    </button>
  ),
}));

function renderForm(
  props: {
    onSuccess?: (appointment: Record<string, unknown>) => void;
    onCancel?: () => void;
  } = {},
) {
  return render(<AppointmentForm orgId="org-1" {...props} />);
}

async function selectCustomerAndVehicle(user: UserEvent) {
  await user.click(screen.getByRole("button", { name: "Select Customer" }));
  await user.click(screen.getByRole("button", { name: "Select Vehicle" }));
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("AppointmentForm", () => {
  beforeEach(() => {
    hooks.mutateAsync.mockReset();
    hooks.mutateAsync.mockResolvedValue({ id: "appt-1" });
  });

  it("renders customer, vehicle, title and datetime controls", () => {
    renderForm();
    expect(
      screen.getByRole("button", { name: "Select Customer" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Select Vehicle" }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("titlePlaceholder")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Pick Date" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Pick Time" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "createAppointment" }),
    ).toBeDisabled();
  });

  it("keeps the submit disabled until a customer and vehicle are selected", async () => {
    const user = userEvent.setup();
    renderForm();

    const submit = screen.getByRole("button", { name: "createAppointment" });
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Select Customer" }));
    expect(
      screen.getByRole("button", { name: "createAppointment" }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Select Vehicle" }));
    expect(
      screen.getByRole("button", { name: "createAppointment" }),
    ).toBeEnabled();
  });

  it("validates the title on submit and does not create an appointment", async () => {
    const user = userEvent.setup();
    renderForm();
    await selectCustomerAndVehicle(user);

    await user.click(screen.getByRole("button", { name: "createAppointment" }));

    expect(await screen.findByText("Title is required")).toBeInTheDocument();
    expect(hooks.mutateAsync).not.toHaveBeenCalled();
  });

  it("submits the datetime, customer and vehicle payload and calls onSuccess", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    renderForm({ onSuccess });

    await selectCustomerAndVehicle(user);
    await user.type(
      screen.getByPlaceholderText("titlePlaceholder"),
      "Brake inspection",
    );
    // Set a deterministic date + time
    await user.click(screen.getByRole("button", { name: "Pick Date" }));
    await user.click(screen.getByRole("button", { name: "Pick Time" }));

    await user.click(screen.getByRole("button", { name: "createAppointment" }));

    await waitFor(() =>
      expect(hooks.mutateAsync).toHaveBeenCalledWith({
        title: "Brake inspection",
        description: "",
        notes: "",
        customer_id: "cust-1",
        vehicle_id: "veh-1",
        scheduled_at: "2026-08-10T10:30:00.000Z",
      }),
    );
    expect(onSuccess).toHaveBeenCalledWith({ id: "appt-1" });
  });

  it("calls onCancel from the cancel button", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderForm({ onCancel });
    await user.click(screen.getByRole("button", { name: "cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
