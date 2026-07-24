import { beforeEach, describe, expect, it, vi } from "vitest";
import { searchAll } from "@/app/lib/data-search";
import {
  createMockSupabase,
  type MockFrom,
  setQueryResult,
} from "@/test/supabase-mock";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

const mockCreateClient = vi.mocked(createClient);

describe("searchAll", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns empty results for empty query", async () => {
    setQueryResult(mock, "v_public_players", []);
    setQueryResult(mock, "v_public_standings", []);
    setQueryResult(mock, "v_public_games", []);

    // searchAll queries multiple views with ilike
    // Our mock only returns the v_public_players result since we just need empty
    const results = await searchAll("");
    expect(results.players).toEqual([]);
    expect(results.teams).toEqual([]);
    expect(results.games).toEqual([]);
  });
});
