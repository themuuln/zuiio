import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockCustomer, createMockVehicle } from "@/test/factories";
import { createTestQueryClient } from "@/test/test-utils";
import { useWizardContext, WizardProvider } from "./wizard-context";

// ── Mock next/navigation ─────────────────────────────────────────────
const mockPush = vi.fn();
const mockSearchParamsGet = vi.fn(() => null);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: mockSearchParamsGet }),
}));

// ── Mock next-intl ────────────────────────────────────────────────────
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// ── Mock query hooks ──────────────────────────────────────────────────
const mockUseProfile = vi.fn();
const mockUseServiceCatalog = vi.fn();
const mockUsePartsCatalog = vi.fn();
const mockUseGlobalServiceCatalog = vi.fn();
const mockUseGlobalPartsCatalog = vi.fn();
const mockUseMechanicsWithJobCount = vi.fn();
const mockUsePriceHistory = vi.fn();
const mockUseCustomerSearch = vi.fn();
const mockUseCustomersByPlate = vi.fn();
const mockUseVehicleSearch = vi.fn();
const mockUseVehicleLastVisit = vi.fn();
const mockUseCreateWorkOrder = vi.fn();

vi.mock("@/lib/queries/use-profile", () => ({
  useProfile: (...args: unknown[]) => mockUseProfile(...args),
}));

vi.mock("@/lib/queries/use-global-catalog", () => ({
  useGlobalServiceCatalog: (...args: unknown[]) =>
    mockUseGlobalServiceCatalog(...args),
  useGlobalPartsCatalog: (...args: unknown[]) =>
    mockUseGlobalPartsCatalog(...args),
}));

vi.mock("@/lib/queries/use-inventory", () => ({
  usePartsCatalog: (...args: unknown[]) => mockUsePartsCatalog(...args),
}));

vi.mock("@/lib/queries/use-wizard-data", () => ({
  useServiceCatalog: (...args: unknown[]) => mockUseServiceCatalog(...args),
  useMechanicsWithJobCount: (...args: unknown[]) =>
    mockUseMechanicsWithJobCount(...args),
  usePriceHistory: (...args: unknown[]) => mockUsePriceHistory(...args),
  useCustomerSearch: (...args: unknown[]) => mockUseCustomerSearch(...args),
  useCustomersByPlate: (...args: unknown[]) => mockUseCustomersByPlate(...args),
  useVehicleSearch: (...args: unknown[]) => mockUseVehicleSearch(...args),
  useVehicleLastVisit: (...args: unknown[]) => mockUseVehicleLastVisit(...args),
  useCreateWorkOrder: (...args: unknown[]) => mockUseCreateWorkOrder(...args),
}));

// ── Mock sentry ───────────────────────────────────────────────────────
vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

// ── Mock sonner toast ─────────────────────────────────────────────────
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock("sonner", () => ({
  toast: Object.assign((message: string) => ({ message }), {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
    dismiss: vi.fn(),
  }),
}));

// ── Helpers ───────────────────────────────────────────────────────────

function setDefaultMocks() {
  mockUseProfile.mockReturnValue({
    data: { organizationId: "org-1" },
    isLoading: false,
  });
  mockUseServiceCatalog.mockReturnValue({ data: [], isInitialLoading: false });
  mockUsePartsCatalog.mockReturnValue({ data: [], isInitialLoading: false });
  mockUseGlobalServiceCatalog.mockReturnValue({ data: [] });
  mockUseGlobalPartsCatalog.mockReturnValue({ data: [] });
  mockUseMechanicsWithJobCount.mockReturnValue({
    data: [],
    isInitialLoading: false,
  });
  mockUsePriceHistory.mockReturnValue({
    data: { services: {}, parts: {} },
    isInitialLoading: false,
  });
  mockUseCustomerSearch.mockReturnValue({ data: [], isFetching: false });
  mockUseCustomersByPlate.mockReturnValue({ data: [], isFetching: false });
  mockUseVehicleSearch.mockReturnValue({ data: [], isFetching: false });
  mockUseVehicleLastVisit.mockReturnValue({ data: null });
}

function createMockMutation() {
  const mutation = { mutate: vi.fn(), isPending: false };
  mockUseCreateWorkOrder.mockReturnValue(mutation);
  return mutation;
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  return {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <WizardProvider>{children}</WizardProvider>
      </QueryClientProvider>
    ),
    queryClient,
  };
}

function renderWizard() {
  setDefaultMocks();
  const mutation = createMockMutation();
  const { wrapper } = createWrapper();
  const rendered = renderHook(() => useWizardContext(), { wrapper });
  return { ...rendered, mutation };
}

// ── Tests ─────────────────────────────────────────────────────────────

describe("WizardProvider — form data persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("state initialization", () => {
    it("starts with empty default state", () => {
      const { result } = renderWizard();

      expect(result.current.selectedCustomer).toBeNull();
      expect(result.current.selectedVehicle).toBeNull();
      expect(result.current.complaint).toBe("");
      expect(result.current.description).toBe("");
      expect(result.current.selectedMechanic).toBe("");
      expect(result.current.serviceLines).toEqual([]);
      expect(result.current.partLines).toEqual([]);
    });

    it("loads orgId from profile", () => {
      const { result } = renderWizard();
      expect(result.current.orgId).toBe("org-1");
    });

    it("reads customerId from URL search params", () => {
      renderWizard();
      expect(mockSearchParamsGet).toHaveBeenCalledWith("customerId");
    });
  });

  describe("total calculations — services, parts, grand total", () => {
    it("servicesTotal is sum of service line final_prices", () => {
      const { result } = renderWizard();

      act(() => {
        result.current.addService({
          id: "svc-1",
          name: "Oil Change",
          default_price: 30000,
        } satisfies Record<string, unknown> as never);
        result.current.addService({
          id: "svc-2",
          name: "Tire Rotation",
          default_price: 20000,
        } satisfies Record<string, unknown> as never);
      });

      expect(result.current.servicesTotal).toBe(50000);
      expect(result.current.grandTotal).toBe(50000);
    });

    it("partsTotal is sum of part line final_prices", () => {
      const { result } = renderWizard();

      act(() => {
        result.current.addPart();
        result.current.updatePart(0, "unit_price", 15000);
        result.current.updatePart(0, "quantity", 2);
      });

      expect(result.current.partsTotal).toBe(30000);
      expect(result.current.grandTotal).toBe(30000);
    });

    it("grandTotal combines services and parts", () => {
      const { result } = renderWizard();

      act(() => {
        result.current.addService({
          id: "svc-1",
          name: "Oil Change",
          default_price: 30000,
        } satisfies Record<string, unknown> as never);
        result.current.addPart();
        result.current.updatePart(0, "unit_price", 20000);
      });

      expect(result.current.servicesTotal).toBe(30000);
      expect(result.current.partsTotal).toBe(20000);
      expect(result.current.grandTotal).toBe(50000);
    });
  });

  describe("isFormValid — guards work order creation", () => {
    it("is false when no customer or vehicle selected", () => {
      const { result } = renderWizard();
      expect(result.current.isFormValid).toBe(false);
    });

    it("is true when both customer and vehicle are selected", () => {
      const { result } = renderWizard();

      act(() => {
        result.current.setSelectedCustomer(createMockCustomer());
        result.current.setSelectedVehicle(createMockVehicle());
      });

      expect(result.current.isFormValid).toBe(true);
    });
  });

  describe("beforeunload — prevents accidental data loss", () => {
    it("registers and removes beforeunload listener", () => {
      const addSpy = vi.spyOn(window, "addEventListener");
      const removeSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = renderWizard();
      expect(addSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));

      unmount();
      expect(removeSpy).toHaveBeenCalledWith(
        "beforeunload",
        expect.any(Function),
      );
    });

    it("prevents default on beforeunload when data has been entered", () => {
      const { result } = renderWizard();
      const event = new Event("beforeunload");
      const preventSpy = vi.spyOn(event, "preventDefault");

      window.dispatchEvent(event);
      expect(preventSpy).not.toHaveBeenCalled();

      act(() => {
        result.current.setComplaint("Engine noise");
      });

      const event2 = new Event("beforeunload");
      const preventSpy2 = vi.spyOn(event2, "preventDefault");
      window.dispatchEvent(event2);
      expect(preventSpy2).toHaveBeenCalled();
    });
  });

  describe("localStorage draft save", () => {
    it("reads existing draft on mount", () => {
      const getItemSpy = vi.fn();
      const _origGetItem = globalThis.localStorage.getItem.bind(
        globalThis.localStorage,
      );
      globalThis.localStorage.getItem = getItemSpy;

      renderWizard();

      expect(getItemSpy).toHaveBeenCalledWith(
        expect.stringContaining("wizard-draft-"),
      );
    });

    it("clears draft from localStorage after successful work order creation", () => {
      const removeItemSpy = vi.fn();
      const _origRemoveItem = globalThis.localStorage.removeItem.bind(
        globalThis.localStorage,
      );
      globalThis.localStorage.removeItem = removeItemSpy;

      const { result, mutation } = renderWizard();

      act(() => {
        result.current.setSelectedCustomer(createMockCustomer());
        result.current.setSelectedVehicle(createMockVehicle());
      });

      act(() => {
        result.current.handleCreate();
      });

      expect(mutation.mutate).toHaveBeenCalled();

      const args = mutation.mutate.mock.calls[0][1] as Record<string, unknown>;
      const onSuccess = args.onSuccess as (data: { id: string }) => void;
      onSuccess({ id: "wo-1" });

      expect(removeItemSpy).toHaveBeenCalledWith(
        expect.stringContaining("wizard-draft-"),
      );
    });
  });

  describe("service line CRUD", () => {
    it("addService creates a service line with correct defaults", () => {
      const { result } = renderWizard();

      act(() => {
        result.current.addService({
          id: "svc-1",
          name: "Oil Change",
          default_price: 30000,
        } satisfies Record<string, unknown> as never);
      });

      expect(result.current.serviceLines).toHaveLength(1);
      expect(result.current.serviceLines[0].name).toBe("Oil Change");
      expect(result.current.serviceLines[0].final_price).toBe(30000);
    });

    it("addService prevents duplicate service_catalog_id", () => {
      const { result } = renderWizard();

      act(() => {
        result.current.addService({
          id: "svc-1",
          name: "Oil Change",
          default_price: 30000,
        } satisfies Record<string, unknown> as never);
      });

      act(() => {
        result.current.addService({
          id: "svc-1",
          name: "Oil Change",
          default_price: 30000,
        } satisfies Record<string, unknown> as never);
      });

      expect(result.current.serviceLines).toHaveLength(1);
    });

    it("updateService changes quantity and recalculates final_price", () => {
      const { result } = renderWizard();

      act(() => {
        result.current.addService({
          id: "svc-1",
          name: "Oil Change",
          default_price: 30000,
        } satisfies Record<string, unknown> as never);
      });

      act(() => {
        result.current.updateService(0, "quantity", 3);
      });

      expect(result.current.serviceLines[0].final_price).toBe(90000);
    });

    it("updateService applies discount_amount_mnt", () => {
      const { result } = renderWizard();

      act(() => {
        result.current.addService({
          id: "svc-1",
          name: "Oil Change",
          default_price: 30000,
        } satisfies Record<string, unknown> as never);
      });

      act(() => {
        result.current.updateService(0, "discount_amount_mnt", 5000);
      });

      expect(result.current.serviceLines[0].final_price).toBe(25000);
    });

    it("updateService applies discount_percent", () => {
      const { result } = renderWizard();

      act(() => {
        result.current.addService({
          id: "svc-1",
          name: "Oil Change",
          default_price: 30000,
        } satisfies Record<string, unknown> as never);
      });

      act(() => {
        result.current.updateService(0, "discount_percent", 10);
      });

      expect(result.current.serviceLines[0].final_price).toBe(27000);
    });

    it("removeService removes by index and shifts remaining", () => {
      const { result } = renderWizard();

      act(() => {
        result.current.addService({
          id: "svc-1",
          name: "Oil Change",
          default_price: 30000,
        } satisfies Record<string, unknown> as never);
        result.current.addService({
          id: "svc-2",
          name: "Tire Rotation",
          default_price: 20000,
        } satisfies Record<string, unknown> as never);
      });

      expect(result.current.serviceLines).toHaveLength(2);

      act(() => {
        result.current.removeService(0);
      });

      expect(result.current.serviceLines).toHaveLength(1);
      expect(result.current.serviceLines[0].name).toBe("Tire Rotation");
    });
  });

  describe("part line CRUD", () => {
    it("addPart creates an empty part line with quantity 1", () => {
      const { result } = renderWizard();

      act(() => {
        result.current.addPart();
      });

      expect(result.current.partLines).toHaveLength(1);
      expect(result.current.partLines[0].part_name).toBe("");
      expect(result.current.partLines[0].quantity).toBe(1);
    });

    it("updatePart changes unit_price and quantity, recalculates final_price", () => {
      const { result } = renderWizard();

      act(() => {
        result.current.addPart();
      });

      act(() => {
        result.current.updatePart(0, "part_name", "Oil Filter");
        result.current.updatePart(0, "unit_price", 15000);
      });

      act(() => {
        result.current.updatePart(0, "quantity", 2);
      });

      expect(result.current.partLines[0].final_price).toBe(30000);
    });

    it("removePart removes by index", () => {
      const { result } = renderWizard();

      act(() => {
        result.current.addPart();
        result.current.addPart();
      });

      expect(result.current.partLines).toHaveLength(2);

      act(() => {
        result.current.removePart(0);
      });

      expect(result.current.partLines).toHaveLength(1);
    });
  });

  describe("handleCreate — mutation integration", () => {
    it("shows error toast when customer is missing", () => {
      const { result } = renderWizard();

      act(() => {
        result.current.handleCreate();
      });

      expect(mockToastError).toHaveBeenCalled();
    });

    it("sends correct payload to createWorkOrder mutation", () => {
      const { result, mutation } = renderWizard();
      const customer = createMockCustomer();
      const vehicle = createMockVehicle();

      act(() => {
        result.current.setSelectedCustomer(customer);
        result.current.setSelectedVehicle(vehicle);
        result.current.setComplaint("Engine noise");
        result.current.setDescription("Check engine light");
        result.current.setSelectedMechanic("mech-1");
        result.current.addService({
          id: "svc-1",
          name: "Oil Change",
          default_price: 30000,
        } satisfies Record<string, unknown> as never);
      });

      act(() => {
        result.current.handleCreate();
      });

      expect(mutation.mutate).toHaveBeenCalledWith(
        {
          customer_id: customer.id,
          vehicle_id: vehicle.id,
          mechanic_id: "mech-1",
          notes: "Check engine light",
          complaint: "Engine noise",
          diagnosis_label_id: null,
          services: [
            {
              service_catalog_id: "svc-1",
              service_name: "Oil Change",
              quantity: 1,
              unit_price: 30000,
              discount_amount: 0,
              discount_percentage: 0,
            },
          ],
          parts: [],
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }),
      );
    });

    it("navigates to work order detail and shows success toast on completion", () => {
      const { result, mutation } = renderWizard();

      act(() => {
        result.current.setSelectedCustomer(createMockCustomer());
        result.current.setSelectedVehicle(createMockVehicle());
      });

      act(() => {
        result.current.handleCreate();
      });

      const args = mutation.mutate.mock.calls[0][1] as Record<string, unknown>;
      const onSuccess = args.onSuccess as (data: { id: string }) => void;
      onSuccess({ id: "wo-42" });

      expect(mockPush).toHaveBeenCalledWith("/dashboard/work-orders/wo-42");
      expect(mockToastSuccess).toHaveBeenCalled();
    });
  });
});
