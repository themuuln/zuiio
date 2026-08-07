import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockParams,
  createMockRequest,
  parseResponse,
} from "@/test/mocks";
import {
  createMockSupabase,
  type MockFrom,
  setQueryResult,
} from "@/test/supabase-mock";
import { DELETE, GET as GET_ONE, PUT } from "../leagues/[id]/route";
import { GET, POST } from "../leagues/route";

const mockCreateClient = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

const LEAGUE_ID = "league-001";
const SPORT_ID = "sport-001";

const mockLeague = {
  id: LEAGUE_ID,
  name: "Mongolian Basketball League",
  slug: "mbl",
  sport_id: SPORT_ID,
  organization_id: "b0000000-0000-0000-0000-000000000001",
  created_at: "2025-01-01T00:00:00Z",
  sports: { name_en: "Basketball", name_mn: "Сагсан бөмбөг" },
};

const mockLeagues = [
  mockLeague,
  {
    id: "league-002",
    name: "Amateur League",
    slug: "amateur",
    sport_id: SPORT_ID,
    organization_id: "b0000000-0000-0000-0000-000000000001",
    created_at: "2025-02-01T00:00:00Z",
    sports: { name_en: "Basketball", name_mn: "Сагсан бөмбөг" },
  },
];

function setupAuthenticated(
  supabase?: MockFrom & { _queryResults: Map<string, unknown> },
) {
  const mock = supabase ?? createMockSupabase();
  mockCreateClient.mockResolvedValue(mock);
  return mock;
}

function setupUnauthenticated() {
  mockCreateClient.mockResolvedValue({
    from: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
    },
  });
}

function setupDbError() {
  const mock = createMockSupabase();
  setQueryResult(mock, "leagues", null, new Error("leagues table not found"));
  mockCreateClient.mockResolvedValue(mock);
}

describe("GET /admin/api/leagues", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns list of leagues with sports relation", async () => {
    const mock = setupAuthenticated();
    setQueryResult(mock, "leagues", mockLeagues);

    const response = await GET(createMockRequest() as unknown as NextRequest);
    const data = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(data).toEqual(mockLeagues);
    expect(data).toHaveLength(2);
    expect(data[0].sports).toEqual({
      name_en: "Basketball",
      name_mn: "Сагсан бөмбөг",
    });
  });

  it("returns 401 if not authenticated", async () => {
    setupUnauthenticated();

    const response = await GET(createMockRequest() as unknown as NextRequest);
    const data = await parseResponse(response);

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("returns 500 on database error", async () => {
    setupDbError();

    const response = await GET(createMockRequest() as unknown as NextRequest);
    const data = await parseResponse(response);

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "leagues table not found" });
  });
});

describe("POST /admin/api/leagues", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validBody = {
    name: "New League",
    slug: "new-league",
    sport_id: SPORT_ID,
  };

  it("creates a league with valid body and returns 201", async () => {
    const mock = setupAuthenticated();
    setQueryResult(mock, "leagues", mockLeague);

    const response = await POST(
      createMockRequest(
        validBody,
        "http://localhost:3000/admin/api/leagues",
        "POST",
      ) as unknown as NextRequest,
    );
    const data = await parseResponse(response);

    expect(response.status).toBe(201);
    expect(data).toEqual(mockLeague);
  });

  it("defaults organization_id when not provided", async () => {
    const mock = setupAuthenticated();
    setQueryResult(mock, "leagues", mockLeague);

    const response = await POST(
      createMockRequest(
        validBody,
        "http://localhost:3000/admin/api/leagues",
        "POST",
      ) as unknown as NextRequest,
    );

    expect(response.status).toBe(201);
  });

  it("uses provided organization_id when given", async () => {
    const mock = setupAuthenticated();
    const customOrgId = "org-custom-123";
    const leagueWithCustomOrg = { ...mockLeague, organization_id: customOrgId };
    setQueryResult(mock, "leagues", leagueWithCustomOrg);

    const response = await POST(
      createMockRequest(
        { ...validBody, organization_id: customOrgId },
        "http://localhost:3000/admin/api/leagues",
        "POST",
      ) as unknown as NextRequest,
    );
    const data = await parseResponse(response);

    expect(response.status).toBe(201);
    expect(data.organization_id).toBe(customOrgId);
  });

  it("returns 400 when name is missing", async () => {
    setupAuthenticated();

    const response = await POST(
      createMockRequest(
        { slug: "new-league", sport_id: SPORT_ID },
        "http://localhost:3000/admin/api/leagues",
        "POST",
      ) as unknown as NextRequest,
    );
    const data = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: "name, slug, and sport_id are required",
    });
  });

  it("returns 400 when slug is missing", async () => {
    setupAuthenticated();

    const response = await POST(
      createMockRequest(
        { name: "New League", sport_id: SPORT_ID },
        "http://localhost:3000/admin/api/leagues",
        "POST",
      ) as unknown as NextRequest,
    );
    const data = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: "name, slug, and sport_id are required",
    });
  });

  it("returns 400 when sport_id is missing", async () => {
    setupAuthenticated();

    const response = await POST(
      createMockRequest(
        { name: "New League", slug: "new-league" },
        "http://localhost:3000/admin/api/leagues",
        "POST",
      ) as unknown as NextRequest,
    );
    const data = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: "name, slug, and sport_id are required",
    });
  });

  it("returns 400 when all required fields are missing", async () => {
    setupAuthenticated();

    const response = await POST(
      createMockRequest(
        {},
        "http://localhost:3000/admin/api/leagues",
        "POST",
      ) as unknown as NextRequest,
    );
    const data = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: "name, slug, and sport_id are required",
    });
  });

  it("returns 401 if not authenticated", async () => {
    setupUnauthenticated();

    const response = await POST(
      createMockRequest(
        validBody,
        "http://localhost:3000/admin/api/leagues",
        "POST",
      ) as unknown as NextRequest,
    );
    const data = await parseResponse(response);

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("returns 500 on database error", async () => {
    setupDbError();

    const response = await POST(
      createMockRequest(
        validBody,
        "http://localhost:3000/admin/api/leagues",
        "POST",
      ) as unknown as NextRequest,
    );
    const data = await parseResponse(response);

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "leagues table not found" });
  });
});

describe("GET /admin/api/leagues/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a single league by id with sports relation", async () => {
    const mock = setupAuthenticated();
    setQueryResult(mock, "leagues", mockLeague);

    const response = await GET_ONE(
      createMockRequest() as unknown as NextRequest,
      {
        params: createMockParams(LEAGUE_ID),
      },
    );
    const data = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(data).toEqual(mockLeague);
    expect(data.id).toBe(LEAGUE_ID);
    expect(data.sports).toEqual({
      name_en: "Basketball",
      name_mn: "Сагсан бөмбөг",
    });
  });

  it("returns 401 if not authenticated", async () => {
    setupUnauthenticated();

    const response = await GET_ONE(
      createMockRequest() as unknown as NextRequest,
      {
        params: createMockParams(LEAGUE_ID),
      },
    );
    const data = await parseResponse(response);

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("returns 500 on database error", async () => {
    setupDbError();

    const response = await GET_ONE(
      createMockRequest() as unknown as NextRequest,
      {
        params: createMockParams(LEAGUE_ID),
      },
    );
    const data = await parseResponse(response);

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "leagues table not found" });
  });
});

describe("PUT /admin/api/leagues/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates a league and returns the updated record", async () => {
    const mock = setupAuthenticated();
    const updatedLeague = { ...mockLeague, name: "Updated League" };
    setQueryResult(mock, "leagues", updatedLeague);

    const response = await PUT(
      createMockRequest(
        { name: "Updated League" },
        "http://localhost:3000/admin/api/leagues/league-001",
        "PUT",
      ) as unknown as NextRequest,
      { params: createMockParams(LEAGUE_ID) },
    );
    const data = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(data).toEqual(updatedLeague);
    expect(data.name).toBe("Updated League");
  });

  it("returns 401 if not authenticated", async () => {
    setupUnauthenticated();

    const response = await PUT(
      createMockRequest(
        { name: "Updated" },
        "http://localhost:3000/admin/api/leagues/league-001",
        "PUT",
      ) as unknown as NextRequest,
      { params: createMockParams(LEAGUE_ID) },
    );
    const data = await parseResponse(response);

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("returns 500 on database error", async () => {
    setupDbError();

    const response = await PUT(
      createMockRequest(
        { name: "Updated" },
        "http://localhost:3000/admin/api/leagues/league-001",
        "PUT",
      ) as unknown as NextRequest,
      { params: createMockParams(LEAGUE_ID) },
    );
    const data = await parseResponse(response);

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "leagues table not found" });
  });
});

describe("DELETE /admin/api/leagues/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes a league and returns 204", async () => {
    const mock = setupAuthenticated();
    setQueryResult(mock, "leagues", null);

    const response = await DELETE(
      createMockRequest() as unknown as NextRequest,
      {
        params: createMockParams(LEAGUE_ID),
      },
    );

    expect(response.status).toBe(204);
  });

  it("returns 401 if not authenticated", async () => {
    setupUnauthenticated();

    const response = await DELETE(
      createMockRequest() as unknown as NextRequest,
      {
        params: createMockParams(LEAGUE_ID),
      },
    );
    const data = await parseResponse(response);

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("returns 500 on database error", async () => {
    setupDbError();

    const response = await DELETE(
      createMockRequest() as unknown as NextRequest,
      {
        params: createMockParams(LEAGUE_ID),
      },
    );
    const data = await parseResponse(response);

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "leagues table not found" });
  });
});
