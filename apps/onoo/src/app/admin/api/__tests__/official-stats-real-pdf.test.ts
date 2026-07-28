import { readFile } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { POST } from "../games/[id]/official-stats/route";

function makeRequest(file: File): NextRequest {
  const request = new Request("http://localhost/admin/api/games/game-1/official-stats", {
    method: "POST",
  }) as NextRequest;
  request.formData = vi.fn().mockResolvedValue({
    get: (key: string) => (key === "file" ? file : "true"),
  } as FormData);
  return request;
}

describe("official-statistics API with a real Mongolian scoresheet", () => {
  const upload = vi.fn();
  const remove = vi.fn();
  const rpc = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    upload.mockResolvedValue({ error: null });
    remove.mockResolvedValue({ error: null });
    rpc.mockResolvedValue({
      data: {
        submission_id: "submission-1",
        revision_id: "revision-1",
        revision_number: 1,
      },
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "scorer-1" } } },
        }),
      },
      storage: {
        from: vi.fn().mockReturnValue({ upload, remove }),
      },
      from: vi.fn((table: string) => {
        if (table === "games") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    home_team_season_id: "season-home-1",
                    away_team_season_id: "season-away-1",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }),
      rpc,
    } as never);
  });

  it("parses B20.pdf and sends its bytes and synchronized score to Supabase", async () => {
    const pdfBytes = await readFile(
      path.join(process.cwd(), "test/fixtures/fiba-official-stats/B20.pdf"),
    );
    const file = new File([pdfBytes], "B20.pdf", { type: "application/pdf" });

    const response = await POST(makeRequest(file), {
      params: Promise.resolve({ id: "game-1" }),
    });

    expect(response.status).toBe(201);
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^game-1\/.+\.pdf$/),
      expect.objectContaining({ name: "B20.pdf", size: pdfBytes.byteLength }),
      expect.objectContaining({ contentType: "application/pdf", upsert: false }),
    );
    expect(rpc).toHaveBeenCalledWith(
      "cmd_submit_official_stats",
      expect.objectContaining({
        p_game_id: "game-1",
        p_home_score: 104,
        p_away_score: 70,
        p_normalized_payload: expect.objectContaining({
          score: { home: 104, away: 70 },
          warnings: [],
        }),
        p_projection: expect.objectContaining({
          players: expect.any(Array),
          teams: expect.any(Array),
        }),
      }),
    );
    await expect(response.json()).resolves.toMatchObject({
      synced: true,
      submissionId: "submission-1",
      revisionId: "revision-1",
    });
  });
});
