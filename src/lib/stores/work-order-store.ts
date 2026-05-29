import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// ── Types ──────────────────────────────────────────────────────────

export type WorkOrderStep =
  | "vehicle"
  | "services"
  | "parts"
  | "labor"
  | "review";

const STEPS: WorkOrderStep[] = [
  "vehicle",
  "services",
  "parts",
  "labor",
  "review",
];

export interface WorkOrderItem {
  id: string;
  type: "service" | "part" | "labor";
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface WorkOrderState {
  currentStep: WorkOrderStep;
  vehicleId: string | null;
  customerId: string | null;
  items: WorkOrderItem[];
  notes: string;
}

interface WorkOrderActions {
  setStep: (step: WorkOrderStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setVehicle: (vehicleId: string, customerId: string) => void;
  addItem: (item: Omit<WorkOrderItem, "total">) => void;
  updateItem: (
    id: string,
    updates: Partial<Omit<WorkOrderItem, "id" | "total">>,
  ) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;
  setNotes: (notes: string) => void;
  reset: () => void;
}

type WorkOrderStore = WorkOrderState & WorkOrderActions;

const initialState: WorkOrderState = {
  currentStep: "vehicle",
  vehicleId: null,
  customerId: null,
  items: [],
  notes: "",
};

// ── Store ──────────────────────────────────────────────────────────

export const useWorkOrderStore = create<WorkOrderStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        setStep: (step) =>
          set((s) => {
            s.currentStep = step;
          }),

        nextStep: () =>
          set((s) => {
            const idx = STEPS.indexOf(s.currentStep);
            if (idx < STEPS.length - 1) s.currentStep = STEPS[idx + 1];
          }),

        prevStep: () =>
          set((s) => {
            const idx = STEPS.indexOf(s.currentStep);
            if (idx > 0) s.currentStep = STEPS[idx - 1];
          }),

        setVehicle: (vehicleId, customerId) =>
          set((s) => {
            s.vehicleId = vehicleId;
            s.customerId = customerId;
          }),

        addItem: (item) =>
          set((s) => {
            s.items.push({ ...item, total: item.quantity * item.unitPrice });
          }),

        updateItem: (id, updates) =>
          set((s) => {
            const item = s.items.find((i) => i.id === id);
            if (!item) return;
            Object.assign(item, updates);
            item.total = item.quantity * item.unitPrice;
          }),

        removeItem: (id) =>
          set((s) => {
            s.items = s.items.filter((i) => i.id !== id);
          }),

        clearItems: () =>
          set((s) => {
            s.items = [];
          }),

        notes: "",
        setNotes: (notes) =>
          set((s) => {
            s.notes = notes;
          }),

        reset: () =>
          set(() => ({
            ...initialState,
          })),
      })),
      {
        name: "tolom-work-order",
        partialize: (state) => ({
          currentStep: state.currentStep,
          vehicleId: state.vehicleId,
          customerId: state.customerId,
          items: state.items,
          notes: state.notes,
        }),
      },
    ),
    { name: "WorkOrderStore" },
  ),
);

// ── Selector hooks ─────────────────────────────────────────────────
export const useWorkOrderStep = () => useWorkOrderStore((s) => s.currentStep);
export const useWorkOrderItems = () => useWorkOrderStore((s) => s.items);
export const useWorkOrderVehicle = () =>
  useWorkOrderStore((s) => ({
    vehicleId: s.vehicleId,
    customerId: s.customerId,
  }));
export const useWorkOrderTotals = () =>
  useWorkOrderStore((s) => ({
    itemCount: s.items.length,
    totalAmount: s.items.reduce((sum, i) => sum + i.total, 0),
  }));
