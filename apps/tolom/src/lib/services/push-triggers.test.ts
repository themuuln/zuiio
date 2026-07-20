import { describe, expect, it, vi } from "vitest";
import {
  notifyWorkOrderAssigned,
  notifyInvoiceSent,
  notifyPaymentReceived,
} from "./push-triggers";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("./push-service", () => ({
  sendPushToUser: vi.fn().mockResolvedValue(undefined),
}));

import { sendPushToUser } from "./push-service";

describe("push-triggers", () => {
  const mockSupabase = createMockSupabaseClient() as any;

  it("notifyWorkOrderAssigned sends push with work order number", async () => {
    await notifyWorkOrderAssigned(mockSupabase, {
      mechanicId: "mech-1",
      workOrderNumber: "WO-001",
      bayNumber: null,
    });

    expect(sendPushToUser).toHaveBeenCalledWith(
      mockSupabase,
      "mech-1",
      expect.objectContaining({
        title: "Шинэ ажлын захиалга",
        body: expect.stringContaining("WO-001"),
      }),
    );
  });

  it("notifyWorkOrderAssigned includes bay number when provided", async () => {
    await notifyWorkOrderAssigned(mockSupabase, {
      mechanicId: "mech-2",
      workOrderNumber: "WO-002",
      bayNumber: 3,
    });

    expect(sendPushToUser).toHaveBeenCalledWith(
      mockSupabase,
      "mech-2",
      expect.objectContaining({
        body: expect.stringContaining("3"),
      }),
    );
  });

  it("notifyWorkOrderAssigned sets correct tag", async () => {
    await notifyWorkOrderAssigned(mockSupabase, {
      mechanicId: "mech-1",
      workOrderNumber: "WO-001",
      bayNumber: null,
    });

    expect(sendPushToUser).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ tag: "work-order-WO-001" }),
    );
  });

  it("notifyInvoiceSent sends push with invoice details", async () => {
    await notifyInvoiceSent(mockSupabase, {
      userId: "user-1",
      invoiceNumber: "INV-001",
      total: 50000,
    });

    expect(sendPushToUser).toHaveBeenCalledWith(
      mockSupabase,
      "user-1",
      expect.objectContaining({
        title: "Нэхэмжлэл илгээсэн",
        body: expect.stringContaining("INV-001"),
        tag: "invoice-INV-001",
      }),
    );
  });

  it("notifyPaymentReceived sends push with payment info", async () => {
    await notifyPaymentReceived(mockSupabase, {
      userId: "user-2",
      amount: 100000,
      workOrderNumber: "WO-003",
    });

    expect(sendPushToUser).toHaveBeenCalledWith(
      mockSupabase,
      "user-2",
      expect.objectContaining({
        title: "Төлбөр хүлээн авлаа",
        body: expect.stringContaining("WO-003"),
        tag: "payment-WO-003",
      }),
    );
  });

  it("notifyPaymentReceived formats the amount", async () => {
    await notifyPaymentReceived(mockSupabase, {
      userId: "user-3",
      amount: 1500000,
      workOrderNumber: "WO-004",
    });

    expect(sendPushToUser).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        body: expect.stringContaining("1,500,000"),
      }),
    );
  });
});
