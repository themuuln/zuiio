import { describe, expect, it, beforeEach } from "vitest";
import { useWorkOrderStore, type WorkOrderStep } from "./work-order-store";

const STEPS: WorkOrderStep[] = [
  "vehicle",
  "services",
  "parts",
  "labor",
  "review",
];

describe("WorkOrderStore", () => {
  beforeEach(() => {
    useWorkOrderStore.getState().reset();
  });

  describe("navigation", () => {
    it("starts at vehicle step", () => {
      expect(useWorkOrderStore.getState().currentStep).toBe("vehicle");
    });

    it("advances through all steps", () => {
      const { nextStep } = useWorkOrderStore.getState();

      for (let i = 0; i < STEPS.length - 1; i++) {
        nextStep();
        expect(useWorkOrderStore.getState().currentStep).toBe(STEPS[i + 1]);
      }
    });

    it("does not advance past last step", () => {
      useWorkOrderStore.setState({ currentStep: "review" });
      useWorkOrderStore.getState().nextStep();
      expect(useWorkOrderStore.getState().currentStep).toBe("review");
    });

    it("does not go before first step", () => {
      useWorkOrderStore.getState().prevStep();
      expect(useWorkOrderStore.getState().currentStep).toBe("vehicle");
    });

    it("setStep jumps directly", () => {
      useWorkOrderStore.getState().setStep("labor");
      expect(useWorkOrderStore.getState().currentStep).toBe("labor");
    });
  });

  describe("vehicle selection", () => {
    it("sets vehicle and customer", () => {
      useWorkOrderStore.getState().setVehicle("v1", "c1");
      const s = useWorkOrderStore.getState();
      expect(s.vehicleId).toBe("v1");
      expect(s.customerId).toBe("c1");
    });
  });

  describe("line items", () => {
    it("adds an item with computed total", () => {
      useWorkOrderStore.getState().addItem({
        id: "1",
        type: "part",
        name: "Oil Filter",
        quantity: 2,
        unitPrice: 15000,
      });

      const items = useWorkOrderStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].total).toBe(30000);
    });

    it("updates an item and recomputes total", () => {
      useWorkOrderStore.getState().addItem({
        id: "1",
        type: "part",
        name: "Oil Filter",
        quantity: 2,
        unitPrice: 15000,
      });

      useWorkOrderStore.getState().updateItem("1", { quantity: 3 });

      expect(useWorkOrderStore.getState().items[0].total).toBe(45000);
    });

    it("removes an item", () => {
      useWorkOrderStore.getState().addItem({
        id: "1",
        type: "part",
        name: "Oil Filter",
        quantity: 1,
        unitPrice: 10000,
      });
      useWorkOrderStore.getState().addItem({
        id: "2",
        type: "labor",
        name: "Oil Change",
        quantity: 1,
        unitPrice: 50000,
      });

      useWorkOrderStore.getState().removeItem("1");

      const items = useWorkOrderStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe("2");
    });

    it("clears all items", () => {
      useWorkOrderStore.getState().addItem({
        id: "1",
        type: "part",
        name: "Part",
        quantity: 1,
        unitPrice: 10000,
      });
      useWorkOrderStore.getState().clearItems();
      expect(useWorkOrderStore.getState().items).toHaveLength(0);
    });
  });

  describe("reset", () => {
    it("resets to initial state", () => {
      useWorkOrderStore.getState().setVehicle("v1", "c1");
      useWorkOrderStore.getState().addItem({
        id: "1",
        type: "service",
        name: "Service",
        quantity: 1,
        unitPrice: 10000,
      });
      useWorkOrderStore.getState().setNotes("test notes");
      useWorkOrderStore.getState().nextStep();

      useWorkOrderStore.getState().reset();

      const s = useWorkOrderStore.getState();
      expect(s.currentStep).toBe("vehicle");
      expect(s.vehicleId).toBeNull();
      expect(s.customerId).toBeNull();
      expect(s.items).toHaveLength(0);
      expect(s.notes).toBe("");
    });
  });

  describe("notes", () => {
    it("updates notes", () => {
      useWorkOrderStore.getState().setNotes("Customer requested synthetic oil");
      expect(useWorkOrderStore.getState().notes).toBe(
        "Customer requested synthetic oil",
      );
    });
  });
});
