import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewPartsCarDrawer } from "@/components/inventory/new-parts-car-drawer";
import { reportServerError } from "@/lib/sentry-report-server";
import { createTestQueryClient } from "@/test/test-utils";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockOrgQuery = vi.fn();
const mockCreatePartsCar = vi.fn();

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: (...args: unknown[]) => mockOrgQuery(...args),
}));

vi.mock("@/lib/queries/use-inventory", () => ({
  useCreatePartsCar: (...args: unknown[]) => mockCreatePartsCar(...args),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

function renderDrawer(onOpenChange = vi.fn()) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <NewPartsCarDrawer open={true} onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  );
}

function required<T>(value: T | null | undefined, name: string): T {
  if (!value) throw new Error(`Expected ${name} element in DOM`);
  return value;
}

describe("NewPartsCarDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgQuery.mockReturnValue({
      data: { orgId: "org-1" },
      isPending: false,
    });
    mockCreatePartsCar.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: "car-1" }),
      isPending: false,
    });
  });

  it("renders the title and description when open", () => {
    renderDrawer();
    expect(screen.getByText("Шинэ задаргааны машин")).toBeInTheDocument();
    expect(
      screen.getByText("Хятадаас ирсэн машины мэдээллийг бүртгэх"),
    ).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <NewPartsCarDrawer open={false} onOpenChange={vi.fn()} />
      </QueryClientProvider>,
    );
    expect(screen.queryByText("Шинэ задаргааны машин")).not.toBeInTheDocument();
  });

  it("shows skeleton while org is loading", () => {
    mockOrgQuery.mockReturnValue({ data: null, isPending: true });
    renderDrawer();
    // Drawer content renders in a portal (document.body)
    expect(
      document.querySelector('[data-slot="skeleton"]'),
    ).toBeInTheDocument();
  });

  it("shows validation errors when submitting an empty form", async () => {
    const user = userEvent.setup();
    const createMutate = vi.fn().mockResolvedValue({ id: "car-1" });
    mockCreatePartsCar.mockReturnValue({
      mutateAsync: createMutate,
      isPending: false,
    });
    renderDrawer();

    await user.click(screen.getByRole("button", { name: "Бүртгэх" }));

    await waitFor(() => {
      expect(screen.getByText("Make is required")).toBeInTheDocument();
      expect(screen.getByText("Model is required")).toBeInTheDocument();
    });
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("submits the car with the correct payload", async () => {
    const user = userEvent.setup();
    const createMutate = vi.fn().mockResolvedValue({ id: "car-1" });
    mockCreatePartsCar.mockReturnValue({
      mutateAsync: createMutate,
      isPending: false,
    });
    const onOpenChange = vi.fn();
    renderDrawer(onOpenChange);

    await user.type(
      required(screen.getByPlaceholderText("Toyota, Honda"), "make input"),
      "Toyota",
    );
    await user.type(
      required(screen.getByPlaceholderText("Camry, Civic"), "model input"),
      "Camry",
    );
    const yearInput = required(screen.getByLabelText("Numeric"), "year input");
    await user.clear(yearInput);
    await user.type(yearInput, "2018");
    await user.tab();
    await user.type(
      required(screen.getByPlaceholderText("1HGCM82633A004352"), "vin input"),
      "1hgcm82633a004352",
    );
    await user.click(screen.getByRole("button", { name: "Бүртгэх" }));

    await waitFor(() => {
      expect(createMutate).toHaveBeenCalledTimes(1);
    });
    const payload = createMutate.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).toMatchObject({
      make: "Toyota",
      model: "Camry",
      year: 2018,
      purchase_cost: 0,
    });
    expect(payload.arrival_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(payload.vin).toBe("1HGCM82633A004352");
    expect(payload.license_plate).toBeUndefined();
    expect(payload.notes).toBeUndefined();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows success toast after creating the car", async () => {
    const user = userEvent.setup();
    const createMutate = vi.fn().mockResolvedValue({ id: "car-1" });
    mockCreatePartsCar.mockReturnValue({
      mutateAsync: createMutate,
      isPending: false,
    });
    renderDrawer();

    await user.type(
      required(screen.getByPlaceholderText("Toyota, Honda"), "make input"),
      "Toyota",
    );
    await user.type(
      required(screen.getByPlaceholderText("Camry, Civic"), "model input"),
      "Camry",
    );
    await user.click(screen.getByRole("button", { name: "Бүртгэх" }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Машин бүртгэгдлээ");
    });
  });

  it("shows error toast and reports the failure when creation fails", async () => {
    const user = userEvent.setup();
    const createMutate = vi
      .fn()
      .mockRejectedValue(new Error("Car creation failed"));
    mockCreatePartsCar.mockReturnValue({
      mutateAsync: createMutate,
      isPending: false,
    });
    renderDrawer();

    await user.type(
      required(screen.getByPlaceholderText("Toyota, Honda"), "make input"),
      "Toyota",
    );
    await user.type(
      required(screen.getByPlaceholderText("Camry, Civic"), "model input"),
      "Camry",
    );
    await user.click(screen.getByRole("button", { name: "Бүртгэх" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Car creation failed");
    });
    expect(reportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      expect.any(Error),
    );
  });

  it("closes the drawer when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDrawer(onOpenChange);

    await user.click(screen.getByRole("button", { name: "cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
