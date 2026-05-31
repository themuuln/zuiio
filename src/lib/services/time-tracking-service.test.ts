import { formatInTimeZone } from "date-fns-tz";
import { revalidateTag } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { TOLOM_TZ } from "@/lib/utils/timezone";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import {
  clockIn,
  clockOut,
  getClockStatus,
  getTodayHours,
  getTodayLog,
} from "./time-tracking-service";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

function makeBuilder<T = unknown>(data?: T) {
  const resolved = { data: data ?? null, error: null };
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolved),
    maybeSingle: vi.fn().mockResolvedValue(resolved),
    // biome-ignore lint/suspicious/noThenProperty: necessary to mock thenable Supabase query builder
    then: vi.fn((resolve: (v: typeof resolved) => void) => resolve(resolved)),
  };
}

const mockClient = createMockSupabaseClient();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockResolvedValue(
    mockClient as unknown as Awaited<ReturnType<typeof createClient>>,
  );
});

describe("clockIn", () => {
  it("inserts time log with current local time and Asia/Ulaanbaatar timezone date", async () => {
    const mockLog = {
      id: "log-1",
      organization_id: "org-1",
      mechanic_id: "mech-1",
      clock_in: new Date().toISOString(),
      clock_out: null,
      date: formatInTimeZone(new Date(), TOLOM_TZ, "yyyy-MM-dd"),
      notes: null,
    };

    const builder = makeBuilder(mockLog);
    mockClient.from = vi.fn().mockReturnValue(builder);

    const result = await clockIn("org-1", "mech-1");

    expect(result.id).toBe("log-1");
    expect(result.date).toBe(
      formatInTimeZone(new Date(), TOLOM_TZ, "yyyy-MM-dd"),
    );
    expect(mockClient.from).toHaveBeenCalledWith("mechanic_time_logs");
    expect(builder.insert).toHaveBeenCalledWith({
      organization_id: "org-1",
      mechanic_id: "mech-1",
      clock_in: expect.any(String),
      date: formatInTimeZone(new Date(), TOLOM_TZ, "yyyy-MM-dd"),
    });
    expect(revalidateTag).toHaveBeenCalled();
  });
});

describe("clockOut", () => {
  it("closes latest open log regardless of date and updates daily hours", async () => {
    const mockOpenLog = {
      id: "log-active-1",
      organization_id: "org-1",
      mechanic_id: "mech-1",
      clock_in: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      clock_out: null,
      date: "2026-05-30", // Yesterday
    };

    const mockClosedLog = {
      ...mockOpenLog,
      clock_out: new Date().toISOString(),
    };

    const activeLogs = [
      { clock_in: mockOpenLog.clock_in, clock_out: mockClosedLog.clock_out },
    ];

    const builder = makeBuilder();
    // 1st call to find active log
    builder.single = vi
      .fn()
      .mockResolvedValueOnce({ data: mockOpenLog, error: null })
      // 2nd call to update log
      .mockResolvedValueOnce({ data: mockClosedLog, error: null });

    // biome-ignore lint/suspicious/noThenProperty: necessary to mock thenable Supabase query builder
    builder.then = vi.fn((resolve) =>
      resolve({ data: activeLogs, error: null }),
    );

    mockClient.from = vi.fn().mockReturnValue(builder);

    const result = await clockOut("org-1", "mech-1");

    expect(result.clock_out).not.toBeNull();
    expect(builder.update).toHaveBeenCalledWith({
      clock_out: expect.any(String),
    });
    expect(builder.eq).toHaveBeenCalledWith("id", mockOpenLog.id);
    expect(revalidateTag).toHaveBeenCalled();
  });

  it("throws error if no open log exists", async () => {
    const builder = makeBuilder();
    builder.single = vi
      .fn()
      .mockResolvedValue({ data: null, error: new Error("Not found") });
    mockClient.from = vi.fn().mockReturnValue(builder);

    await expect(clockOut("org-1", "mech-1")).rejects.toThrow(
      "No open time log found",
    );
  });
});

describe("getTodayLog", () => {
  it("fetches the latest open log (null clock_out)", async () => {
    const mockOpenLog = {
      id: "log-active-2",
      clock_in: new Date().toISOString(),
      clock_out: null,
    };

    const builder = makeBuilder();
    builder.maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: mockOpenLog, error: null });
    mockClient.from = vi.fn().mockReturnValue(builder);

    const result = await getTodayLog("org-1", "mech-1");
    expect(result).toEqual(mockOpenLog);
    expect(builder.is).toHaveBeenCalledWith("clock_out", null);
  });
});

describe("getTodayHours", () => {
  it("fetches hours worked for local current date", async () => {
    const mockReport = {
      hours_worked: 6.5,
    };

    const builder = makeBuilder();
    builder.maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: mockReport, error: null });
    mockClient.from = vi.fn().mockReturnValue(builder);

    const result = await getTodayHours("org-1", "mech-1");
    expect(result).toBe(6.5);
    expect(builder.eq).toHaveBeenCalledWith(
      "report_date",
      formatInTimeZone(new Date(), TOLOM_TZ, "yyyy-MM-dd"),
    );
  });

  it("returns 0 if no report exists for today", async () => {
    const builder = makeBuilder();
    builder.maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: null, error: null });
    mockClient.from = vi.fn().mockReturnValue(builder);

    const result = await getTodayHours("org-1", "mech-1");
    expect(result).toBe(0);
  });
});

describe("getClockStatus", () => {
  it("returns clockedIn true and startTime when log is active", async () => {
    const mockOpenLog = {
      id: "log-active-3",
      clock_in: "2026-05-31T01:00:00.000Z",
      clock_out: null,
      date: "2026-05-31",
    };

    const builder = makeBuilder();
    // 1st query: getActiveLog (uses maybeSingle)
    builder.maybeSingle = vi
      .fn()
      .mockResolvedValueOnce({ data: mockOpenLog, error: null })
      // 2nd query: getTodayHours (uses maybeSingle)
      .mockResolvedValueOnce({ data: { hours_worked: 2.0 }, error: null });

    mockClient.from = vi.fn().mockReturnValue(builder);

    const status = await getClockStatus("org-1", "mech-1");
    expect(status).toEqual({
      clockedIn: true,
      since: "2026-05-31T01:00:00.000Z",
      todayHours: 2.0,
    });
  });

  it("returns clockedIn false when no active log is found", async () => {
    const builder = makeBuilder();
    builder.maybeSingle = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    mockClient.from = vi.fn().mockReturnValue(builder);

    const status = await getClockStatus("org-1", "mech-1");
    expect(status).toEqual({
      clockedIn: false,
      since: null,
      todayHours: 0,
    });
  });
});
