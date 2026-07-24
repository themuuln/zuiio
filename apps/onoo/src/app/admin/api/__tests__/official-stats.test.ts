import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));
vi.mock("unpdf", () => ({
  getDocumentProxy: vi.fn(),
  extractTextItems: vi.fn(),
}));

import { extractTextItems, getDocumentProxy } from "unpdf";
import { createClient } from "@/lib/supabase/server";
import { POST } from "../games/[id]/official-stats/route";

const PDF_LINES = [
  "OFFICIAL STATISTICS",
  "31 - 56",
  "PG YELLOW BROTHERS (PGY)",
  "1 . TSENDBILEG 20:42 4/17 23.5 4/15 26.7 0/2 0.0 2/4 50.0 1 0 1 2 4 0 0 1 2 0 -14 10",
  "ALDAR TG (ALD)",
  "2 . BILGEERDEM 17:42 6/13 46.2 5/6 83.3 1/7 14.3 7/13 53.8 1 4 5 0 0 4 2 1 0 0 +14 20",
];

function createRequest(file: File | null, rightsConfirmed = true): NextRequest {
  const request = new Request("http://localhost/", {
    method: "POST",
  }) as NextRequest;
  const map = new Map<string, FormDataEntryValue>();
  if (file) map.set("file", file);
  if (rightsConfirmed) map.set("rightsConfirmed", "true");
  request.formData = vi.fn().mockResolvedValue(
    Promise.resolve({
      append: vi.fn(),
      delete: vi.fn(),
      entries: vi.fn(),
      forEach: vi.fn(),
      get: (key: string) => map.get(key) ?? null,
      getAll: vi.fn(),
      has: (key: string) => map.has(key),
      keys: vi.fn(),
      set: vi.fn(),
      values: vi.fn(),
    } as unknown as FormData),
  );
  return request;
}

function makeFile(name = "official.pdf"): File {
  return new File(["pdf"], name, { type: "application/pdf" });
}

describe("official statistics import API", () => {
  const mockCreateClient = vi.mocked(createClient);
  const mockExtractTextItems = vi.mocked(extractTextItems);
  const mockGetDocumentProxy = vi.mocked(getDocumentProxy);
  const upload = vi.fn();
  const remove = vi.fn();
  const rpc = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    upload.mockResolvedValue({ error: null });
    remove.mockResolvedValue({ error: null });
    rpc.mockResolvedValue({
      data: { submission_id: "submission-1" },
      error: null,
    });
    mockGetDocumentProxy.mockResolvedValue({} as never);
    mockExtractTextItems.mockResolvedValue({
      items: [
        PDF_LINES.map((str, index) => ({ str, x: 0, y: 900 - index * 10 })),
      ],
      totalPages: 1,
    } as never);
    // Chainable supabase.from() mock for games and rosters queries
    const singleFn = vi.fn().mockResolvedValue({
      data: {
        home_team_season_id: "season-home-1",
        away_team_season_id: "season-away-1",
      },
      error: null,
    });
    const chainableSelect = vi
      .fn()
      .mockReturnValue({ eq: vi.fn().mockReturnValue({ single: singleFn }) });
    const chainableEq = vi.fn().mockReturnValue({ select: chainableSelect });
    const fromFn = vi.fn((table: string) => {
      if (table === "games") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ single: singleFn }),
          }),
        };
      }
      // game_rosters
      return { select: vi.fn().mockReturnValue({ eq: chainableEq }) };
    });
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "scorer-1" } },
        }),
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "scorer-1" } } },
        }),
      },
      storage: {
        from: vi.fn().mockReturnValue({ upload, remove }),
      },
      from: fromFn,
      rpc,
    } as never);
  });

  it("stores a FIBA PDF as evidence and submits parsed values through cmd_submit_source", async () => {
    const response = await POST(createRequest(makeFile()), {
      params: Promise.resolve({ id: "game-1" }),
    });
    expect(response.status).toBe(201);
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^game-1\/.+\.pdf$/),
      expect.any(File),
      expect.objectContaining({ contentType: "application/pdf" }),
    );
    expect(rpc).toHaveBeenCalledWith(
      "cmd_submit_official_stats",
      expect.objectContaining({
        p_game_id: "game-1",
        p_home_score: 31,
        p_away_score: 56,
      }),
    );
    await expect(response.json()).resolves.toMatchObject({
      synced: true,
      submissionId: "submission-1",
      boxScore: { score: { home: 31, away: 56 } },
    });
  });

  it("rejects unauthenticated requests before reading the PDF", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      },
    } as never);

    const response = await POST(createRequest(makeFile()), {
      params: Promise.resolve({ id: "game-1" }),
    });

    expect(response.status).toBe(401);
    expect(mockGetDocumentProxy).not.toHaveBeenCalled();
  });

  it("requires a PDF and a rights confirmation", async () => {
    const noFile = await POST(createRequest(null), {
      params: Promise.resolve({ id: "game-1" }),
    });
    const noRights = await POST(createRequest(makeFile(), false), {
      params: Promise.resolve({ id: "game-1" }),
    });

    expect(noFile.status).toBe(400);
    expect(noRights.status).toBe(400);
  });
});
