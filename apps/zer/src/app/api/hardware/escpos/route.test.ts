import { beforeEach, describe, expect, it, vi } from "vitest";
import { openCashDrawerCommand } from "@/lib/hardware/escpos";

const mockCapture = vi.hoisted(() => vi.fn());
const mockSend = vi.hoisted(() => vi.fn());
const mockRequireAppContext = vi.hoisted(() => vi.fn());

vi.mock("@zuiio/capture", () => ({
  capture: mockCapture,
  withDbCapture: async (_label: unknown, query: unknown) => query,
}));
vi.mock("@/lib/hardware/network", () => ({
  sendEscPosCommand: mockSend,
}));
vi.mock("@/lib/erp", () => ({
  requireAppContext: mockRequireAppContext,
}));

import { POST } from "./route";

type OrgData = {
  escpos_host: string | null;
  escpos_port: number | null;
  name: string | null;
};

function chainSingle(data: OrgData) {
  return {
    select: () => ({
      eq: () => ({
        single: async () => ({ data, error: null }),
      }),
    }),
  };
}

function chainMaybeSingle(data: unknown) {
  return {
    select: () => ({
      eq: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data, error: null }),
        }),
      }),
    }),
  };
}

function chainOrder(data: unknown) {
  return {
    select: () => ({
      eq: () => ({
        order: async () => ({ data, error: null }),
      }),
    }),
  };
}

function makeSupabase(opts: {
  org: OrgData;
  sale?: unknown;
  items?: unknown[];
}) {
  return {
    from: vi.fn((table: string) => {
      if (table === "organizations") return chainSingle(opts.org);
      if (table === "sales") return chainMaybeSingle(opts.sale);
      if (table === "sale_items") return chainOrder(opts.items ?? []);
      throw new Error(`unexpected table: ${table}`);
    }),
  };
}

const ORG: OrgData = {
  escpos_host: "192.168.1.50",
  escpos_port: 9100,
  name: "Тест Дэлгүүр",
};

const SALE = {
  id: "11111111-2222-4333-8444-555555555555",
  total_amount: 22500,
  original_amount: 22500,
  discount_amount: 0,
  paid_amount: 22500,
  payment_method: "cash",
  sale_date: "2026-08-13T10:00:00Z",
  invoice: { invoice_number: "INV-001" },
  branches: { name: "Төв салбар" },
  profiles: { full_name: "Бат" },
};

const ITEMS = [
  {
    quantity: 2,
    unit_price: 7500,
    total_price: 15000,
    products: { name: "Сүү" },
    product_variants: null,
  },
  {
    quantity: 1,
    unit_price: 7500,
    total_price: 7500,
    products: { name: "Талх" },
    product_variants: null,
  },
];

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/hardware/escpos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/hardware/escpos", () => {
  beforeEach(() => {
    mockCapture.mockClear();
    mockSend.mockReset();
    mockRequireAppContext.mockReset();
    mockRequireAppContext.mockResolvedValue({
      supabase: makeSupabase({ org: ORG, sale: SALE, items: ITEMS }),
      organizationId: "22222222-3333-4444-8555-666666666666",
    });
  });

  it("rejects an unknown command", async () => {
    const res = await post({ command: "explode" });
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejects a print without a sale_id", async () => {
    const res = await post({ command: "print" });
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns 400 when no ESC/POS printer is configured", async () => {
    mockRequireAppContext.mockResolvedValue({
      supabase: makeSupabase({
        org: { ...ORG, escpos_host: null },
        sale: SALE,
        items: ITEMS,
      }),
      organizationId: "22222222-3333-4444-8555-666666666666",
    });
    const res = await post({ command: "drawer" });
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("sends the cash drawer kick pulse", async () => {
    mockSend.mockResolvedValue(undefined);
    const res = await post({ command: "drawer" });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledTimes(1);
    const [target, bytes] = mockSend.mock.calls[0] as [
      { host: string; port: number },
      Uint8Array,
    ];
    expect(target).toEqual({ host: "192.168.1.50", port: 9100 });
    expect(Array.from(bytes)).toEqual(Array.from(openCashDrawerCommand()));
  });

  it("loads the sale and prints a receipt through the driver", async () => {
    mockSend.mockResolvedValue(undefined);
    const res = await post({
      command: "print",
      sale_id: "11111111-2222-4333-8444-555555555555",
    });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledTimes(1);
    const [, bytes] = mockSend.mock.calls[0] as [unknown, Uint8Array];
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain("Тест Дэлгүүр");
    expect(text).toContain("Төв салбар");
    expect(text).toContain("INV-001");
    expect(text).toContain("Сүү");
    expect(text).toContain("Талх");
    expect(text).toContain("ТӨЛСӨН");
  });

  it("404s when the sale does not exist", async () => {
    mockRequireAppContext.mockResolvedValue({
      supabase: makeSupabase({ org: ORG, sale: null, items: [] }),
      organizationId: "22222222-3333-4444-8555-666666666666",
    });
    const res = await post({
      command: "print",
      sale_id: "99999999-9999-4999-8999-999999999999",
    });
    expect(res.status).toBe(404);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("502s when the printer is unreachable", async () => {
    mockSend.mockRejectedValue(new Error("ECONNREFUSED"));
    const res = await post({ command: "drawer" });
    expect(res.status).toBe(502);
    expect(mockCapture).toHaveBeenCalled();
  });
});
