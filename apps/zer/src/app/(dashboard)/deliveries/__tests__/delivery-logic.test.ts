import { describe, expect, it } from "vitest";

// Pure logic tests for status transitions
// These tests don't need server action mocks

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["assigned", "cancelled"],
  assigned: ["picked_up", "cancelled"],
  picked_up: ["in_transit"],
  in_transit: ["delivered", "failed"],
  failed: ["pending"],
};

function isValidTransition(from: string, to: string): boolean {
  const allowed = STATUS_TRANSITIONS[from];
  return !!allowed?.includes(to);
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  assigned: "Даалгасан",
  picked_up: "Авсан",
  in_transit: "Замдаа",
  delivered: "Хүргэгдсэн",
  cancelled: "Цуцалсан",
  failed: "Амжилтгүй",
};

describe("Delivery status transitions", () => {
  it("allows pending -> assigned", () => {
    expect(isValidTransition("pending", "assigned")).toBe(true);
  });

  it("allows pending -> cancelled", () => {
    expect(isValidTransition("pending", "cancelled")).toBe(true);
  });

  it("allows assigned -> picked_up", () => {
    expect(isValidTransition("assigned", "picked_up")).toBe(true);
  });

  it("allows in_transit -> delivered", () => {
    expect(isValidTransition("in_transit", "delivered")).toBe(true);
  });

  it("rejects delivered -> pending", () => {
    expect(isValidTransition("delivered", "pending")).toBe(false);
  });

  it("rejects pending -> delivered (skip states)", () => {
    expect(isValidTransition("pending", "delivered")).toBe(false);
  });

  it("rejects unknown status transitions", () => {
    expect(isValidTransition("delivered", "cancelled")).toBe(false);
  });

  it("allows failed -> pending (retry)", () => {
    expect(isValidTransition("failed", "pending")).toBe(true);
  });
});

describe("Delivery status labels", () => {
  it("has labels for all statuses", () => {
    const statuses = [
      "pending",
      "assigned",
      "picked_up",
      "in_transit",
      "delivered",
      "cancelled",
      "failed",
    ];
    for (const status of statuses) {
      expect(STATUS_LABELS[status]).toBeDefined();
      expect(STATUS_LABELS[status].length).toBeGreaterThan(0);
    }
  });
});

describe("Status badge variants", () => {
  function statusBadgeVariant(status: string): string {
    switch (status) {
      case "delivered":
        return "default";
      case "pending":
      case "picked_up":
        return "secondary";
      case "cancelled":
      case "failed":
        return "destructive";
      case "assigned":
      case "in_transit":
        return "outline";
      default:
        return "secondary";
    }
  }

  it("returns default for delivered", () => {
    expect(statusBadgeVariant("delivered")).toBe("default");
  });

  it("returns destructive for cancelled", () => {
    expect(statusBadgeVariant("cancelled")).toBe("destructive");
  });

  it("returns outline for in_transit", () => {
    expect(statusBadgeVariant("in_transit")).toBe("outline");
  });
});
