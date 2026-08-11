/**
 * sales.status_history helpers (migration 20260811100000_storefront_gaps.sql).
 */

import { describe, expect, it, vi } from "vitest";

vi.mock("@zuiio/capture", () => ({
  withDbCapture: vi.fn(async (_name: string, query: unknown) => query),
  capture: vi.fn(),
}));

import {
  appendSaleStatusHistory,
  type SaleStatusHistoryEntry,
  saleHistoryEntry,
} from "../sale-status-history";

describe("saleHistoryEntry", () => {
  it("builds the DB shape {status, at, by}", () => {
    const entry = saleHistoryEntry(
      "cancelled",
      "buyer",
      "2026-08-11T08:00:00.000Z",
    );
    expect(entry).toEqual({
      status: "cancelled",
      at: "2026-08-11T08:00:00.000Z",
      by: "buyer",
    });
  });

  it("defaults to the current ISO time", () => {
    const entry = saleHistoryEntry("completed", "staff");
    expect(entry.status).toBe("completed");
    expect(entry.by).toBe("staff");
    expect(new Date(entry.at).toISOString()).toBe(entry.at);
  });
});

describe("appendSaleStatusHistory", () => {
  function makeSupabase(initialHistory: unknown) {
    const updateMock = vi.fn(async () => ({ error: null }));
    return {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data: { status_history: initialHistory },
              error: null,
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => updateMock()),
        })),
      })),
      _updateMock: updateMock,
    };
  }

  it("appends to an existing history array", async () => {
    const existing: SaleStatusHistoryEntry[] = [
      { status: "pending", at: "2026-08-11T08:00:00.000Z", by: "buyer" },
    ];
    const supabase = makeSupabase(existing) as never;

    const result = await appendSaleStatusHistory(
      supabase,
      "sale-1",
      "cancelled",
      "staff",
    );
    expect(result.error).toBeNull();

    const updateCall = (
      supabase as unknown as {
        from: ReturnType<typeof vi.fn>;
      }
    ).from.mock.results[1].value.update.mock.calls[0][0] as {
      status_history: SaleStatusHistoryEntry[];
    };
    expect(updateCall.status_history).toHaveLength(2);
    expect(updateCall.status_history[1].status).toBe("cancelled");
    expect(updateCall.status_history[1].by).toBe("staff");
    expect(updateCall.status_history[1].at).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    );
  });

  it("starts fresh when status_history is missing or malformed", async () => {
    for (const initial of [null, undefined, "not-an-array", 42]) {
      const supabase = makeSupabase(initial) as never;
      const result = await appendSaleStatusHistory(
        supabase,
        "sale-1",
        "confirmed",
        "staff",
      );
      expect(result.error).toBeNull();
      const updateCall = (
        supabase as unknown as {
          from: ReturnType<typeof vi.fn>;
        }
      ).from.mock.results[1].value.update.mock.calls[0][0] as {
        status_history: SaleStatusHistoryEntry[];
      };
      expect(updateCall.status_history).toHaveLength(1);
      expect(updateCall.status_history[0].status).toBe("confirmed");
    }
  });

  it("returns an error when the sale row is missing", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data: null,
              error: { message: "not found" },
            })),
          })),
        })),
        update: vi.fn(),
      })),
    } as never;

    const result = await appendSaleStatusHistory(
      supabase,
      "missing-sale",
      "cancelled",
      "buyer",
    );
    expect(result.error).toBe("not found");
  });

  it("surfaces the update error", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data: { status_history: [] },
              error: null,
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(async () => ({ error: { message: "RLS blocked" } })),
        })),
      })),
    } as never;

    const result = await appendSaleStatusHistory(
      supabase,
      "sale-1",
      "confirmed",
      "staff",
    );
    expect(result.error).toBe("RLS blocked");
  });
});
